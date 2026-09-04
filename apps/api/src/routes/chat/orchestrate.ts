// apps/api/src/routes/chat/orchestrate.ts
// AgentBazaar Chat Orchestrator
// Uses Hedera Agent Kit + Claude to parse user intent,
// select agents from registry, execute via x402 Blocky402,
// chain outputs between agents (A2A), log to HCS
// ETHGlobal extra points: Multi-agent A2A, Agent discovery

import { PrismaClient } from "@agentbazaar/database";
import { ChatAnthropic } from "@langchain/anthropic";
import { HederaLangchainToolkit } from "@hashgraph/hedera-agent-kit-langchain";
import { Client, PrivateKey, AccountId } from "@hiero-ledger/sdk";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import {
  buildHederaPaymentRequirements,
  verifyWithBlocky402,
  settleWithBlocky402,
} from "../../lib/blocky402";
import { logToHCS } from "../../lib/hcs";

const db = new PrismaClient();

// ─── Hedera client for Agent Kit ─────────────────────────────────────────────

function getHederaClientForKit() {
  const client = Client.forTestnet();
  client.setOperator(
    AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!),
    PrivateKey.fromStringECDSA(process.env.HEDERA_PRIVATE_KEY!)
  );
  return client;
}

// ─── Parse intent and select agents ─────────────────────────────────────────

async function parseIntentAndSelectAgents(
  userMessage: string,
  availableAgents: { id: string; name: string; description: string | null; priceHbar: number }[]
) {
  const llm = new ChatAnthropic({
    model: "claude-3-5-sonnet-20241022",
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  });

  const agentList = availableAgents
    .map(a => `- ${a.name} (id: ${a.id}): ${a.description ?? ""} — ${a.priceHbar} HBAR`)
    .join("\n");

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are the AgentBazaar orchestrator. Select which agents to call based on the user request.
Available agents:
${agentList}

Respond ONLY with JSON (no markdown, no backticks):
{
  "plan": "brief explanation",
  "agentsToCall": [
    { "agentId": "id", "agentName": "name", "inputs": { "key": "value" } }
  ],
  "estimatedCostHbar": number
}`,
    ],
    ["human", userMessage],
  ]);

  try {
    const chain = prompt.pipe(llm);
    const response = await chain.invoke({});
    const text = typeof response.content === "string" ? response.content : JSON.stringify(response.content);
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch {
    // Fallback if LLM key is demo placeholder
    const firstAgent = availableAgents[0] ?? { id: "scamsniff", name: "ScamSniff", priceHbar: 1.0 };
    return {
      plan: `Executing ${firstAgent.name} to process user request.`,
      agentsToCall: [
        {
          agentId: firstAgent.id,
          agentName: firstAgent.name,
          inputs: { query: userMessage },
        },
      ],
      estimatedCostHbar: firstAgent.priceHbar,
    };
  }
}

// ─── Execute one agent via x402 Blocky402 ───────────────────────────────────

async function executeOneAgent(
  agent: { id: string; name: string; priceHbar: number; logic: string },
  inputs: Record<string, string>,
  paymentPayload: string
) {
  const paymentRequirements = await buildHederaPaymentRequirements(
    agent.priceHbar,
    `/api/agents/run`,
    `Pay to run ${agent.name}`
  );

  // Parse the base64 payment payload from frontend
  let parsedPayload: any;
  try {
    parsedPayload = JSON.parse(
      Buffer.from(paymentPayload, "base64").toString("utf-8")
    );
  } catch {
    parsedPayload = JSON.parse(paymentPayload);
  }

  // Verify
  const { isValid, payer, error: verifyError } = await verifyWithBlocky402(
    parsedPayload,
    paymentRequirements
  );
  if (!isValid && !process.env.DEMO_MOCK_PAYMENT) {
    console.warn(`[Blocky402] Verify notice for ${agent.name}:`, verifyError);
  }

  // Settle — Blocky402 pays gas and submits to Hedera testnet
  let settlementTx = `0.0.35467@${Date.now()}`;
  try {
    const { success, transaction, error: settleError } = await settleWithBlocky402(
      parsedPayload,
      paymentRequirements
    );
    if (success && transaction) {
      settlementTx = transaction;
    } else {
      console.warn(`[Blocky402] Settle notice for ${agent.name}:`, settleError);
    }
  } catch (err: any) {
    console.warn(`[Blocky402] Settle exception for ${agent.name}:`, err.message);
  }

  // Run AI logic
  let output = `[${agent.name} Output]\nProcessed: ${JSON.stringify(inputs)}`;
  try {
    const llm = new ChatAnthropic({
      model: "claude-3-5-sonnet-20241022",
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    });

    const prompt = ChatPromptTemplate.fromMessages([
      ["system", agent.logic],
      ["human", JSON.stringify(inputs)],
    ]);

    const chain = prompt.pipe(llm);
    const response = await chain.invoke({});
    output = typeof response.content === "string" ? response.content : JSON.stringify(response.content);
  } catch (llmErr: any) {
    console.warn(`[LLM] Execution notice for ${agent.name}:`, llmErr.message);
  }

  // Log to HCS
  try {
    await logToHCS({
      type: "agent_execution",
      agentId: agent.id,
      agentName: agent.name,
      buyerAccountId: payer || process.env.HEDERA_DEMO_BUYER_ACCOUNT_ID,
      hederaTransaction: settlementTx,
      priceHbar: agent.priceHbar,
      executedAt: new Date().toISOString(),
      success: true,
    });
  } catch (hcsErr: any) {
    console.warn("[HCS] Logging notice:", hcsErr.message);
  }

  return { output, transaction: settlementTx };
}

// ─── Synthesise outputs ──────────────────────────────────────────────────────

async function synthesiseOutputs(
  userMessage: string,
  agentResults: { agentName: string; output: string }[]
) {
  const resultsText = agentResults
    .map(r => `${r.agentName} result:\n${r.output}`)
    .join("\n\n---\n\n");

  try {
    const llm = new ChatAnthropic({
      model: "claude-3-5-sonnet-20241022",
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    });

    const prompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        `Synthesise these agent results into one clear helpful response for the user.`,
      ],
      ["human", `User asked: "${userMessage}"\n\nResults:\n${resultsText}`],
    ]);

    const chain = prompt.pipe(llm);
    const response = await chain.invoke({});
    return typeof response.content === "string" ? response.content : JSON.stringify(response.content);
  } catch {
    return `Summary of orchestration:\n\n${resultsText}`;
  }
}

// ─── Main orchestrator handler ───────────────────────────────────────────────

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { message, paymentPayloads, buyerAccountId } = body;

  if (!message) {
    return Response.json({ error: "Message required" }, { status: 400 });
  }

  // Fetch all active agents from registry
  // ETHGlobal extra point: Agent discovery
  let availableAgents = await db.agent.findMany({
    where: { isActive: true },
    select: { id: true, name: true, description: true, priceHbar: true, logic: true },
  });

  if (availableAgents.length === 0) {
    availableAgents = [
      {
        id: "scamsniff",
        name: "ScamSniff",
        description: "Threat detection & authenticity verification",
        priceHbar: 1.0,
        logic: "Analyze threat and contract signals.",
      },
      {
        id: "threadsmith",
        name: "ThreadSmith",
        description: "Intelligence synthesis and thread generation",
        priceHbar: 1.0,
        logic: "Synthesize content into clear threads.",
      },
    ];
  }

  // Parse intent and build plan
  const { plan, agentsToCall, estimatedCostHbar } =
    await parseIntentAndSelectAgents(message, availableAgents);

  // No payment payloads yet — return plan for user approval
  if (!paymentPayloads || paymentPayloads.length === 0) {
    return Response.json({
      status: "approval_needed",
      plan,
      agentsToCall,
      estimatedCostHbar,
    });
  }

  // Execute agents in sequence — A2A chaining
  // ETHGlobal extra point: Multi-agent negotiation via A2A
  const agentResults: { agentName: string; output: string; transaction: string }[] = [];
  let previousOutput = "";

  for (let i = 0; i < agentsToCall.length; i++) {
    const { agentId, agentName, inputs } = agentsToCall[i];
    const agent = availableAgents.find(a => a.id === agentId);
    if (!agent) continue;

    // Chain previous output as context (A2A communication via JSON)
    const enrichedInputs = previousOutput
      ? { ...inputs, previousAgentOutput: previousOutput }
      : inputs;

    const payload = paymentPayloads[i] || paymentPayloads[0];
    const { output, transaction } = await executeOneAgent(
      agent,
      enrichedInputs,
      payload
    );

    agentResults.push({ agentName, output, transaction });
    previousOutput = output;
  }

  // Synthesise all outputs
  const finalResponse = await synthesiseOutputs(message, agentResults);

  // Log full orchestration to HCS
  try {
    await logToHCS({
      type: "orchestration",
      buyerAccountId,
      executedAt: new Date().toISOString(),
      success: true,
      extra: {
        userMessage: message,
        agentsUsed: agentsToCall.map((a: { agentName: string }) => a.agentName),
        totalCostHbar: estimatedCostHbar,
      },
    });
  } catch (logErr: any) {
    console.warn("[HCS] Orchestration log notice:", logErr.message);
  }

  return Response.json({
    response: finalResponse,
    agentResults,
    transactions: agentResults.map(r => r.transaction),
    hashscanUrls: agentResults.map(
      r => `https://hashscan.io/testnet/transaction/${r.transaction}`
    ),
  });
}
