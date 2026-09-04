// apps/api/src/lib/mirror-node.ts
// Hedera Mirror Node API utility
// Verifies HBAR deposits from buyers to AgentBazaar platform account
// Mirror Node testnet: https://testnet.mirrornode.hedera.com

const MIRROR_NODE_URL = "https://testnet.mirrornode.hedera.com";

export interface HederaTransaction {
  transactionId: string;
  result: string; // "SUCCESS" if confirmed
  consensusTimestamp: string;
  transfers: {
    account: string;
    amount: number; // in tinybars (positive = received, negative = sent)
  }[];
}

/**
 * Fetch recent transactions for a Hedera account from Mirror Node.
 * Used to verify buyer deposits to the platform account.
 */
export async function getAccountTransactions(
  accountId: string,
  limit = 10
): Promise<HederaTransaction[]> {
  const url = `${MIRROR_NODE_URL}/api/v1/transactions?account.id=${accountId}&limit=${limit}&order=desc`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Mirror Node error: ${res.status}`);
  }

  const data = await res.json();
  return data.transactions ?? [];
}

/**
 * Verify a specific deposit transaction on Hedera testnet.
 * Checks:
 * 1. Transaction exists and is SUCCESS
 * 2. Transfer is FROM the buyer TO the platform account
 * 3. Amount matches expected deposit
 *
 * Returns the confirmed amount in HBAR, or null if not found/invalid.
 */
export async function verifyDeposit(
  hederaTransactionId: string,
  fromAccountId: string,
  toAccountId: string,
  expectedAmountHbar: number
): Promise<{ confirmed: boolean; amountHbar: number; error?: string }> {
  // Format transaction ID for Mirror Node query
  // Hedera tx IDs look like: 0.0.12345@1234567890.123456789
  // Mirror Node uses: 0.0.12345-1234567890-123456789
  const txIdForQuery = hederaTransactionId
    .replace("@", "-")
    .replace(".", "-")
    .replace(".", "-");

  const url = `${MIRROR_NODE_URL}/api/v1/transactions/${encodeURIComponent(hederaTransactionId)}`;

  const res = await fetch(url);
  if (!res.ok) {
    return {
      confirmed: false,
      amountHbar: 0,
      error: `Transaction not found: ${res.status}`,
    };
  }

  const data = await res.json();
  const tx: HederaTransaction = data.transactions?.[0];

  if (!tx) {
    return { confirmed: false, amountHbar: 0, error: "Transaction not found" };
  }

  if (tx.result !== "SUCCESS") {
    return {
      confirmed: false,
      amountHbar: 0,
      error: `Transaction status: ${tx.result}`,
    };
  }

  // Find the transfer from buyer to platform
  const platformTransfer = tx.transfers.find(
    (t) =>
      t.account === toAccountId &&
      t.amount > 0 // positive = received HBAR
  );

  if (!platformTransfer) {
    return {
      confirmed: false,
      amountHbar: 0,
      error: "No transfer to platform account found",
    };
  }

  // Verify sender
  const senderTransfer = tx.transfers.find(
    (t) => t.account === fromAccountId && t.amount < 0
  );

  if (!senderTransfer) {
    return {
      confirmed: false,
      amountHbar: 0,
      error: "Sender account does not match",
    };
  }

  const confirmedAmountHbar = platformTransfer.amount / 100_000_000;

  return { confirmed: true, amountHbar: confirmedAmountHbar };
}

/**
 * Get current vault balance by checking recent deposits.
 * Used as a cross-check against DB balance.
 */
export async function getTotalReceivedHbar(
  platformAccountId: string,
  fromAccountId: string
): Promise<number> {
  const txs = await getAccountTransactions(platformAccountId, 50);

  const total = txs
    .filter((tx) => tx.result === "SUCCESS")
    .reduce((sum, tx) => {
      const received = tx.transfers
        .filter((t) => t.account === platformAccountId && t.amount > 0)
        .reduce((s, t) => s + t.amount, 0);
      return sum + received;
    }, 0);

  return total / 100_000_000; // convert tinybars to HBAR
}
