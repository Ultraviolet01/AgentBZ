import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config();

import { registerAgentIdentityHCS14 } from "../lib/hcs14.js";
import { PrismaClient } from "@agentbazaar/database";

const db = new PrismaClient();

async function backfillHCS14() {
  // Fetch all agents that don't have an HCS-14 topic yet
  const agents = await db.agent.findMany({
    where: {
      hcs14TopicId: null,
    },
  });

  if (agents.length === 0) {
    console.log("No agents need backfilling — all have HCS-14 identities.");
    return;
  }

  console.log(`Found ${agents.length} agent(s) to backfill:\n`);

  for (const agent of agents) {
    console.log(`Registering HCS-14 for: ${agent.name}...`);

    try {
      const { topicId, hashscanUrl } = await registerAgentIdentityHCS14(
        agent.id,
        {
          name: agent.name,
          description: agent.description || "",
          builderAccountId: process.env.HEDERA_ACCOUNT_ID || "0.0.6033959",
          priceHbar: agent.priceHbar,
          useHtsToken: false,
          htsTokenId: undefined,
          registeredAt: new Date().toISOString(),
          agentBazaarUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://agentbazaar.io"}/agents/${agent.id}`,
        }
      );

      // Save topic ID back to DB
      await db.agent.update({
        where: { id: agent.id },
        data: {
          hcs14TopicId: topicId,
          hcs14HashscanUrl: hashscanUrl,
        },
      });

      console.log(`✓ ${agent.name} — Topic: ${topicId}`);
      console.log(`  HashScan: ${hashscanUrl}\n`);

      // Small delay between registrations to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (err: any) {
      console.error(`✗ Failed for ${agent.name}: ${err.message}`);
    }
  }

  console.log("Backfill complete.");
  await db.$disconnect();
}

backfillHCS14().catch(async (err) => {
  console.error(err);
  await db.$disconnect();
  process.exit(1);
});
