// apps/api/src/routes/agents/deploy.ts
// Deploy agent and register on-chain HCS-14 identity topic
// ETHGlobal extra point: On-chain agent identity using ERC-8004 or HCS-14

import { PrismaClient } from "@agentbazaar/database";
import { registerAgentIdentityHCS14 } from "../../lib/hcs14";

const db = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, description, logic, priceHbar, useHtsToken } = body;

    if (!name) {
      return Response.json({ error: "Agent name is required" }, { status: 400 });
    }

    const agent = await db.agent.create({
      data: {
        name,
        description: description || "",
        logic: logic || `You are ${name}, an autonomous agent on AgentBazaar.`,
        priceHbar: priceHbar || 1.0,
        isActive: true,
      },
    });

    // Register HCS-14 identity topic
    const { topicId, hashscanUrl } = await registerAgentIdentityHCS14(
      agent.id,
      {
        name: agent.name,
        description: agent.description || "",
        builderAccountId: process.env.HEDERA_ACCOUNT_ID!,
        priceHbar: agent.priceHbar,
        useHtsToken: !!useHtsToken,
        htsTokenId: useHtsToken
          ? process.env.AGENTBAZAAR_HTS_TOKEN_ID
          : undefined,
        registeredAt: new Date().toISOString(),
        agentBazaarUrl: `${process.env.NEXT_PUBLIC_APP_URL}/agents/${agent.id}`,
      }
    );

    // Save HCS-14 topic ID to DB
    const updatedAgent = await db.agent.update({
      where: { id: agent.id },
      data: {
        hcs14TopicId: topicId,
        hcs14HashscanUrl: hashscanUrl,
      },
    });

    return Response.json({
      success: true,
      agent: updatedAgent,
      hcs14TopicId: topicId,
      hcs14HashscanUrl: hashscanUrl,
    });
  } catch (err: any) {
    return Response.json(
      { error: err.message || "Failed to deploy agent" },
      { status: 500 }
    );
  }
}
