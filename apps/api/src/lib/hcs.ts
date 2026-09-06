// HCS (Hedera Consensus Service) audit trail logger
// Every agent execution is logged here — verifiable on HashScan
// ETHGlobal extra point: Verifiable payment audit trails on HCS

import {
  Client,
  AccountId,
  PrivateKey,
  TopicMessageSubmitTransaction,
} from "@hiero-ledger/sdk";

let _client: Client | null = null;

function getHederaClient(): Client {
  if (_client) return _client;

  _client = Client.forTestnet();
  _client.setOperator(
    AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!),
    PrivateKey.fromStringECDSA(process.env.HEDERA_PRIVATE_KEY!)
  );

  return _client;
}

export interface AuditEntry {
  type: "agent_execution" | "payment_settled" | "orchestration";
  agentId?: string;
  agentName?: string;
  buyerAccountId?: string;
  hederaTransaction?: string;  // Blocky402 settlement.transaction
  priceHbar?: number;
  executedAt: string;
  success: boolean;
  extra?: Record<string, unknown>;
}

export async function logToHCS(
  entry: AuditEntry,
  customTopicId?: string
): Promise<string> {
  const topicId = customTopicId || process.env.HEDERA_HCS_TOPIC_ID || "0.0.10396393";
  if (!topicId) {
    console.warn("[HCS] No topic ID available — skipping audit log");
    return "";
  }

  try {
    const client = getHederaClient();
    const tx = await new TopicMessageSubmitTransaction()
      .setTopicId(topicId)
      .setMessage(JSON.stringify(entry))
      .execute(client);

    const txId = tx.transactionId.toString();
    console.log(
      `[HCS] Logged to topic ${topicId} — tx: ${txId}`,
      `\nhttps://hashscan.io/testnet/transaction/${txId}`
    );
    return txId;
  } catch (err: any) {
    console.error("[HCS] Message submission error:", err.message);
    throw new Error(`Failed to log to HCS topic ${topicId}: ${err.message}`);
  }
}
