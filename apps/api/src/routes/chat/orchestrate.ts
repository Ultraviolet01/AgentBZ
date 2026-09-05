// apps/api/src/routes/chat/orchestrate.ts
// AgentBazaar Chat Orchestrator
// Single x402 payment via Blocky402 for total agent cost
// Agents run in sequence after payment settles (A2A chaining)
// ETHGlobal extra points: A2A multi-agent + agent discovery

import { ChatAnthropic } from "@langchain/anthropic";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { PrismaClient } from "@agentbazaar/database";
import {
  buildHederaPaymentRequirements,
  verifyWithBlocky402,
  settleWithBlocky402,
} from "../../lib/blocky402";
import { logToHCS } from "../../lib/hcs";
import type { AuditEntry } from "../../lib/hcs";

const db = new PrismaClient();
const PLATFORM_FEE_HBAR = 0.5;

// ─── Parse user intent and select agents ─────────────────────────────────────
// ETHGlobal extra point: Agent discovery — reads live registry

async function parseIntentAndSelectAgents(
  userMessage: string,
  availableAgents: {
    id: string;
    name: string;
    description: string | null;
    priceHbar: number;
  }[]
): Promise<{
  plan: string;
  agentsToCall: {
    agentId: string;
    agentName: string;
    inputs: Record<string, string>;
  }[];
  estimatedCostHbar: number;
}> {
  const llm = new ChatAnthropic({
    model: "claude-sonnet-4-6",
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  });

  const agentList = availableAgents
    .map(
      (a) =>
        `- ${a.name} (id: ${a.id}): ${a.description} — ${
          a.priceHbar + PLATFORM_FEE_HBAR
        } HBAR per run`
    )
    .join("\n");

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are the AgentBazaar orchestrator. Select which agents to call.
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

  const chain = prompt.pipe(llm);
  const response = await chain.invoke({});
  const text = response.content as string;
  return JSON.parse(text);
}

// ─── Run agent AI logic ───────────────────────────────────────────────────────

async function runAgentLogic(
  logic: string,
  inputs: Record<string, unknown>
): Promise<string> {
  const llm = new ChatAnthropic({
    model: "claude-sonnet-4-6",
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  });

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", logic],
    ["human", JSON.stringify(inputs)],
  ]);

  const chain = prompt.pipe(llm);
  const response = await chain.invoke({});
  return response.content as string;
}

// ─── Synthesise outputs into one reply ───────────────────────────────────────

async function synthesiseOutputs(
  userMessage: string,
  agentResults: { agentName: string; output: string }[]
): Promise<string> {
  const llm = new ChatAnthropic({
    model: "claude-sonnet-4-6",
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  });

  const resultsText = agentResults
    .map((r) => `${r.agentName} result:\n${r.output}`)
    .join("\n\n---\n\n");

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      "Synthesise these agent results into one clear helpful response.",
    ],
    [
      "human",
      `User asked: "${userMessage}"\n\nAgent results:\n${resultsText}`,
    ],
  ]);

  const chain = prompt.pipe(llm);
  const response = await chain.invoke({});
  return response.content as string;
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message) {
      return Response.json({ error: "Message required" }, { status: 400 });
    }

    // ── Fetch active agents from registry ──────────────────────────────────────
    // ETHGlobal extra point: Agent discovery
    const availableAgents = await db.agent.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        priceHbar: true,
        logic: true,
      },
    });

    // ── Parse intent and build plan ────────────────────────────────────────────
    const { plan, agentsToCall, estimatedCostHbar } =
      await parseIntentAndSelectAgents(message, availableAgents);

    // ── No X-Payment header — return plan + 402 ────────────────────────────────
    // Frontend shows plan to user, then HashPack signs ONE payment for total
    const xPaymentHeader = req.headers.get("X-Payment");

    if (!xPaymentHeader) {
      const paymentRequirements = await buildHederaPaymentRequirements(
        estimatedCostHbar,
        `/api/chat/orchestrate`,
        `Pay to run ${agentsToCall.length} agent(s) on AgentBazaar`
      );

      const paymentRequired = Buffer.from(
        JSON.stringify(paymentRequirements)
      ).toString("base64");

      return new Response(
        JSON.stringify({
          status: "payment_required",
          plan,
          agentsToCall,
          estimatedCostHbar,
          paymentRequirements,
        }),
        {
          status: 402,
          headers: {
            "Content-Type": "application/json",
            "PAYMENT-REQUIRED": paymentRequired,
          },
        }
      );
    }

    // ── X-Payment header present — verify + settle ONCE for total ──────────────
    let paymentPayload: object;
    try {
      paymentPayload = JSON.parse(
        Buffer.from(xPaymentHeader, "base64").toString("utf-8")
      );
    } catch {
      return Response.json(
        { error: "Invalid X-Payment header" },
        { status: 402 }
      );
    }

    // Re-build requirements for verification
    const paymentRequirements = await buildHederaPaymentRequirements(
      estimatedCostHbar,
      `/api/chat/orchestrate`,
      `Pay to run ${agentsToCall.length} agent(s) on AgentBazaar`
    );

    const { isValid, payer, error: verifyError } = await verifyWithBlocky402(
      paymentPayload,
      paymentRequirements
    );

    if (!isValid) {
      return Response.json(
        { error: `Payment verification failed: ${verifyError}` },
        { status: 402 }
      );
    }

    const { success, transaction, error: settleError } =
      await settleWithBlocky402(paymentPayload, paymentRequirements);

    if (!success || !transaction) {
      return Response.json(
        { error: `Payment settlement failed: ${settleError}` },
        { status: 402 }
      );
    }

    // ── Run agents in sequence — A2A chaining ──────────────────────────────────
    // ETHGlobal extra point: Multi-agent negotiation via A2A
    const agentResults: {
      agentName: string;
      output: string;
    }[] = [];
    let previousOutput = "";

    for (const { agentId, agentName, inputs } of agentsToCall) {
      const agent = availableAgents.find((a) => a.id === agentId);
      if (!agent) continue;

      // Chain previous agent output as context — A2A communication
      const enrichedInputs = previousOutput
        ? { ...inputs, previousAgentOutput: previousOutput }
        : inputs;

      const output = await runAgentLogic(agent.logic, enrichedInputs);

      // Log each agent execution to HCS individually
      try {
        const entry: AuditEntry = {
          type: "agent_execution",
          agentId: agent.id,
          agentName,
          buyerAccountId: payer,
          hederaTransaction: transaction,
          priceHbar: agent.priceHbar + PLATFORM_FEE_HBAR,
          executedAt: new Date().toISOString(),
          success: true,
          extra: { orchestrated: true },
        };
        await logToHCS(entry);
      } catch (hcsErr: any) {
        console.warn("[HCS] Log notice:", hcsErr.message);
      }

      agentResults.push({ agentName, output });
      previousOutput = output;
    }

    // ── Synthesise all outputs ─────────────────────────────────────────────────
    const finalResponse = await synthesiseOutputs(message, agentResults);

    // ── Log full orchestration to HCS ──────────────────────────────────────────
    let orchestrationHcsTxId = "";
    try {
      const entry: AuditEntry = {
        type: "orchestration",
        buyerAccountId: payer,
        hederaTransaction: transaction,
        priceHbar: estimatedCostHbar,
        executedAt: new Date().toISOString(),
        success: true,
        extra: {
          userMessage: message,
          agentsUsed: agentsToCall.map((a) => a.agentName),
          totalCostHbar: estimatedCostHbar,
        },
      };
      orchestrationHcsTxId = await logToHCS(entry);
    } catch (hcsErr: any) {
      console.warn("[HCS] Orchestration log notice:", hcsErr.message);
    }

    // ── Return result ──────────────────────────────────────────────────────────
    const xPaymentResponse = Buffer.from(
      JSON.stringify({ transaction, network: "hedera:testnet" })
    ).toString("base64");

    return new Response(
      JSON.stringify({
        response: finalResponse,
        agentResults,
        hederaTransaction: transaction,
        hcsTxId: orchestrationHcsTxId,
        hashscanUrl: `https://hashscan.io/testnet/transaction/${transaction}`,
        hcsUrl: `https://hashscan.io/testnet/topic/${
          process.env.AGENTBAZAAR_HCS_TOPIC_ID || "0.0.10363117"
        }`,
        network: "hedera:testnet",
        payer,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "X-Payment": xPaymentResponse,
        },
      }
    );
  } catch (err: any) {
    return Response.json(
      { error: err.message || "Orchestration failed" },
      { status: 500 }
    );
  }
}
