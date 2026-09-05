// apps/api/src/routes/agents/run.ts
// Per-request x402 payment — buyer signs via HashPack, Blocky402 settles

import { PrismaClient } from "@agentbazaar/database";
import {
  buildHederaPaymentRequirements,
  verifyWithBlocky402,
  settleWithBlocky402,
} from "../../lib/blocky402";
import { logToHCS } from "../../lib/hcs";
import type { AuditEntry } from "../../lib/hcs";

const db = new PrismaClient();

async function runAgentLogic(
  logic: string,
  inputs: Record<string, unknown>
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return "Agent executed (no API key configured)";

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: `${logic}\n\nInputs: ${JSON.stringify(inputs)}`,
          },
        ],
      }),
    });
    const data = await res.json();
    return data.content?.[0]?.text ?? "No output";
  } catch {
    return "Agent execution error";
  }
}

export async function POST(req: Request) {
  try {
    const { agentId, inputs } = await req.json();

    // Fetch agent
    const agent = agentId
      ? await db.agent.findFirst({
          where: {
            OR: [
              { id: agentId },
              { name: { equals: agentId, mode: "insensitive" } },
            ],
          },
        })
      : null;

    if (!agent) {
      return Response.json({ error: "Agent not found" }, { status: 404 });
    }

    // Build payment requirements
    const paymentRequirements = await buildHederaPaymentRequirements(
      agent.priceHbar,
      `/api/agents/run`,
      `Pay to run ${agent.name} on AgentBazaar`
    );

    // ── Path 1: No payment header — return 402 challenge ─────────────────────
    // Buyer's frontend receives this and signs via HashPack
    const xPaymentHeader = req.headers.get("X-Payment");

    if (!xPaymentHeader) {
      const paymentRequired = Buffer.from(
        JSON.stringify(paymentRequirements)
      ).toString("base64");

      return new Response(
        JSON.stringify({
          error: "Payment required",
          paymentRequirements,
          breakdown: {
            agentFee: `${agent.priceHbar} HBAR`,
            platformFee: `0.5 HBAR`,
            total: `${agent.priceHbar + 0.5} HBAR`,
          },
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

    // ── Path 2: Payment header present — verify + settle + run ───────────────
    let paymentPayload: object;
    try {
      paymentPayload = JSON.parse(
        Buffer.from(xPaymentHeader, "base64").toString("utf-8")
      );
    } catch {
      return Response.json(
        { error: "Invalid X-Payment header — could not parse" },
        { status: 402 }
      );
    }

    // Verify with Blocky402
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

    // Settle with Blocky402 on Hedera testnet
    const { success, transaction, error: settleError } =
      await settleWithBlocky402(paymentPayload, paymentRequirements);

    if (!success || !transaction) {
      return Response.json(
        { error: `Payment settlement failed: ${settleError}` },
        { status: 402 }
      );
    }

    // Run agent AI logic (built-in agents use platform Anthropic key — no per-agent keys)
    const output = await runAgentLogic(agent.logic, inputs ?? {});

    // Log to HCS audit trail
    let hcsTxId = "";
    try {
      const entry: AuditEntry = {
        type: "agent_execution",
        agentId: agent.id,
        agentName: agent.name,
        buyerAccountId: payer,
        hederaTransaction: transaction,
        priceHbar: agent.priceHbar + 0.5,
        executedAt: new Date().toISOString(),
        success: true,
      };
      hcsTxId = await logToHCS(entry);
    } catch (hcsErr: any) {
      console.warn("[HCS] Log notice:", hcsErr.message);
    }

    // Return result with Hedera proof
    const xPaymentResponse = Buffer.from(
      JSON.stringify({ transaction, network: "hedera:testnet" })
    ).toString("base64");

    return new Response(
      JSON.stringify({
        output,
        hederaTransaction: transaction,
        hcsTxId,
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
      { error: err.message || "Failed to execute agent" },
      { status: 500 }
    );
  }
}
