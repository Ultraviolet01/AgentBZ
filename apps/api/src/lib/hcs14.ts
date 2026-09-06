// HCS-14: On-chain agent identity via Hedera Consensus Service
// Each agent registered on AgentBazaar gets a unique HCS topic
// as its verifiable on-chain identity.
// ETHGlobal extra point: On-chain agent identity using ERC-8004 or HCS-14
//
// Based on: hedera-code-snippets/hcs-topic-permissioned-write
// Reference: https://github.com/hedera-dev/hedera-code-snippets

import {
  Client,
  AccountId,
  PrivateKey,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
} from "@hiero-ledger/sdk";

function getHederaClient(): Client {
  const client = Client.forTestnet();
  client.setOperator(
    AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!),
    PrivateKey.fromStringECDSA(process.env.HEDERA_PRIVATE_KEY!)
  );
  return client;
}

export interface AgentIdentity {
  name: string;
  description: string;
  builderAccountId: string;
  priceHbar: number;
  useHtsToken?: boolean;
  htsTokenId?: string;
  registeredAt?: string;
  agentBazaarUrl?: string;
}

/**
 * Register an agent's on-chain identity via HCS-14.
 * Creates a dedicated HCS topic for the agent and publishes
 * its metadata as the first message.
 * Returns the topic ID — store this as the agent's identity address.
 */
export async function registerAgentIdentityHCS14(
  agentId: string,
  identity: AgentIdentity
): Promise<{ topicId: string; hashscanUrl: string }> {
  try {
    const client = getHederaClient();

    const adminKey = PrivateKey.fromStringECDSA(
      process.env.HEDERA_PRIVATE_KEY!
    );

    // Create a permissioned HCS topic for this agent
    // Admin key = AgentBazaar platform (controls updates)
    // Based on hcs-topic-permissioned-write pattern from hedera-code-snippets
    const createTx = await new TopicCreateTransaction()
      .setTopicMemo(`AgentBazaar Agent Identity — ${identity.name}`)
      .setAdminKey(adminKey.publicKey)
      .setSubmitKey(adminKey.publicKey)
      .execute(client);

    const createReceipt = await createTx.getReceipt(client);
    const topicId = createReceipt.topicId!.toString();

    // Publish agent identity as first message on the topic
    const identityMessage = {
      standard: "HCS-14",
      version: "1.0",
      agentId,
      ...identity,
      registeredAt: new Date().toISOString(),
    };

    await new TopicMessageSubmitTransaction()
      .setTopicId(topicId)
      .setMessage(JSON.stringify(identityMessage))
      .execute(client);

    const hashscanUrl = `https://hashscan.io/testnet/topic/${topicId}`;

    console.log(`[HCS-14] Agent identity registered for "${identity.name}"`);
    console.log(`[HCS-14] Topic ID: ${topicId}`);
    console.log(`[HCS-14] HashScan: ${hashscanUrl}`);

    return { topicId, hashscanUrl };
  } catch (err: any) {
    console.error(`[HCS-14] Registration error for ${identity.name}:`, err.message);
    throw new Error(`Failed to register HCS-14 agent identity: ${err.message}`);
  }
}

/**
 * Update an agent's on-chain identity (e.g. price change, description update).
 * Publishes an update message to the existing identity topic.
 */
export async function updateAgentIdentityHCS14(
  topicId: string,
  update: Partial<AgentIdentity>
): Promise<void> {
  try {
    const client = getHederaClient();

    const updateMessage = {
      standard: "HCS-14",
      version: "1.0",
      type: "update",
      ...update,
      updatedAt: new Date().toISOString(),
    };

    await new TopicMessageSubmitTransaction()
      .setTopicId(topicId)
      .setMessage(JSON.stringify(updateMessage))
      .execute(client);

    console.log(`[HCS-14] Identity updated for topic: ${topicId}`);
  } catch (err: any) {
    console.warn(`[HCS-14] Update note for topic ${topicId}:`, err.message);
  }
}
