// apps/api/src/routes/agents/deploy.ts
// Accept builder-owned HCS-14 topic + encrypt API keys in AgentBazaar vault

import { PrismaClient } from "@agentbazaar/database";
import { encryptApiKeys } from "../../lib/key-vault";
import { logToHCS } from "../../lib/hcs";
import type { AuditEntry } from "../../lib/hcs";
import type { ApiKey } from "../../lib/key-vault";

const db = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      description,
      longDescription,
      category,
      tags,
      apiEndpoint,
      webhookUrl,
      icon,
      color,
      priceHbar,
      pricePerRun,
      setupFee,
      logic,
      apiKeys,          // ApiKey[] from builder
      builderAccountId, // builder's Hedera account — builder signed HCS-14 client-side
      hcs14TopicId,     // builder-owned HCS-14 topic ID
      hcs14HashscanUrl,
      mode,
    } = body;

    if (!name) {
      return Response.json({ error: "Agent name is required" }, { status: 400 });
    }

    if (!logic) {
      return Response.json({ error: "Agent logic is required" }, { status: 400 });
    }

    // Encrypt API keys with AgentBazaar vault (NOT CDR)
    const normalizedKeys: ApiKey[] = Array.isArray(apiKeys)
      ? apiKeys.filter(k => k.name && k.value)
      : [];

    const encryptedApiKeysBlob = normalizedKeys.length > 0
      ? encryptApiKeys(normalizedKeys)
      : null;

    const price = priceHbar || pricePerRun || 1.0;

    // Create agent in DB
    const agent = await db.agent.create({
      data: {
        name,
        description: description || "",
        logic,
        priceHbar: price,
        isActive: false, // pending review
        builderAccountId: builderAccountId || null,
        hcs14TopicId: hcs14TopicId || null,
        hcs14HashscanUrl: hcs14HashscanUrl || null,
        encryptedApiKeys: encryptedApiKeysBlob,
        hasApiKeys: normalizedKeys.length > 0,
      },
    });

    // Log listing to HCS audit trail
    try {
      const entry: AuditEntry = {
        type: "agent_execution",
        agentId: agent.id,
        agentName: agent.name,
        buyerAccountId: builderAccountId || "unknown",
        hederaTransaction: hcs14TopicId || "pending",
        priceHbar: price,
        executedAt: new Date().toISOString(),
        success: true,
        extra: {
          action: "agent_listed",
          hcs14TopicId,
          mode: mode || "api",
          hasApiKeys: normalizedKeys.length > 0,
        },
      };
      await logToHCS(entry);
    } catch (hcsErr: any) {
      console.warn("[HCS] Listing log notice:", hcsErr.message);
    }

    return Response.json({
      success: true,
      agentId: agent.id,
      agent: {
        id: agent.id,
        name: agent.name,
        status: "pending",
        hasApiKeys: normalizedKeys.length > 0,
        hcs14TopicId: agent.hcs14TopicId,
      },
      hcs14TopicId: agent.hcs14TopicId,
      hcs14HashscanUrl: agent.hcs14HashscanUrl,
    });
  } catch (err: any) {
    console.error("[Deploy] Error:", err);
    return Response.json(
      { error: err.message || "Failed to deploy agent" },
      { status: 500 }
    );
  }
}
