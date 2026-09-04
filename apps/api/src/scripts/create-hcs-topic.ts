// Run ONCE to create the HCS audit topic
// Hedera Consensus Service — verifiable audit trail for every agent execution
// ETHGlobal extra point: Verifiable payment audit trails on HCS

import {
  Client,
  AccountId,
  PrivateKey,
  TopicCreateTransaction,
} from "@hiero-ledger/sdk";

async function main() {
  const client = Client.forTestnet();
  client.setOperator(
    AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!),
    PrivateKey.fromStringECDSA(process.env.HEDERA_PRIVATE_KEY!)
  );

  const tx = await new TopicCreateTransaction()
    .setTopicMemo("AgentBazaar — execution audit trail")
    .execute(client);

  const receipt = await tx.getReceipt(client);

  console.log("✓ HCS Topic created:", receipt.topicId?.toString());
  console.log("Add to .env: HEDERA_HCS_TOPIC_ID=" + receipt.topicId?.toString());
  console.log("View on HashScan: https://hashscan.io/testnet/topic/" + receipt.topicId?.toString());
}

main().catch(console.error);
