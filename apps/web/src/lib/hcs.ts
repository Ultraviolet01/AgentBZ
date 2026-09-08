import {
  Client,
  AccountId,
  PrivateKey,
  TopicMessageSubmitTransaction,
} from '@hashgraph/sdk';

let _client: Client | null = null;

function getHederaClient(): Client {
  if (_client) return _client;

  _client = Client.forTestnet();
  const accountId = process.env.HEDERA_ACCOUNT_ID || '0.0.10368450';
  const privateKey = process.env.HEDERA_PRIVATE_KEY;

  if (privateKey) {
    _client.setOperator(
      AccountId.fromString(accountId),
      PrivateKey.fromStringECDSA(privateKey)
    );
  }

  return _client;
}

export interface AuditEntry {
  type: 'agent_deployment' | 'agent_execution' | 'payment_settled' | 'orchestration';
  agentId?: string;
  agentName?: string;
  agentSlug?: string;
  category?: string;
  deployMode?: string;
  builderAccountId?: string;
  buyerAccountId?: string;
  hederaTransaction?: string;
  priceHbar?: number;
  executedAt: string;
  success: boolean;
  extra?: Record<string, unknown>;
}

export async function logToHCS(
  entry: AuditEntry,
  customTopicId?: string
): Promise<string> {
  const topicId = customTopicId || process.env.NEXT_PUBLIC_HCS_TOPIC_ID || process.env.HEDERA_HCS_TOPIC_ID || '0.0.10396393';
  if (!topicId) {
    console.warn('[HCS] No topic ID available — skipping audit log');
    return '';
  }

  try {
    const client = getHederaClient();
    const tx = await new TopicMessageSubmitTransaction()
      .setTopicId(topicId)
      .setMessage(JSON.stringify(entry))
      .execute(client);

    const txId = tx.transactionId.toString();
    console.log(
      `[HCS] Logged deployment/audit to topic ${topicId} — tx: ${txId}`,
      `\nhttps://hashscan.io/testnet/transaction/${txId}`
    );
    return txId;
  } catch (err: any) {
    console.error('[HCS] Message submission notice:', err.message);
    return '';
  }
}
