// apps/api/src/routes/vault/deposit.ts
// POST /api/vault/deposit
// Buyer provides their Hedera account ID + transaction ID of their deposit.
// Server verifies via Mirror Node then credits their vault (both on-chain HederaVault contract and DB).

import { verifyDeposit } from "../../lib/mirror-node";
import { logToHCS } from "../../lib/hcs";
import { depositForBuyerOnChain } from "../../lib/hedera-vault";
import { PrismaClient } from "@agentbazaar/database";

const db = new PrismaClient();

export async function POST(req: Request) {
  try {
    const {
      hederaAccountId, // buyer's Hedera account e.g. "0.0.12345"
      hederaTransactionId, // transaction ID of their HBAR transfer
      amountHbar, // expected amount (used for UX only — actual verified on-chain)
    } = await req.json();

    if (!hederaAccountId || !hederaTransactionId) {
      return Response.json(
        { error: "hederaAccountId and hederaTransactionId are required" },
        { status: 400 }
      );
    }

    // Check if this transaction was already processed
    const existing = await db.deposit.findUnique({
      where: { hederaTransaction: hederaTransactionId },
    });

    if (existing) {
      return Response.json(
        { error: "This transaction has already been processed" },
        { status: 409 }
      );
    }

    // Verify deposit on Hedera testnet via Mirror Node
    const platformAccountId = process.env.HEDERA_ACCOUNT_ID || "0.0.10360854";
    const { confirmed, amountHbar: confirmedAmount, error: verifyError } =
      await verifyDeposit(
        hederaTransactionId,
        hederaAccountId,
        platformAccountId,
        amountHbar
      );

    if (!confirmed) {
      return Response.json(
        { error: `Deposit verification failed: ${verifyError || "Invalid transaction"}` },
        { status: 400 }
      );
    }

    // Sync on-chain HederaVault smart contract balance
    let contractTxHash = "";
    try {
      const contractRes = await depositForBuyerOnChain(
        hederaAccountId,
        confirmedAmount
      );
      if (contractRes.txHash) {
        contractTxHash = contractRes.txHash;
      }
    } catch (contractErr: any) {
      console.warn("[HederaVault Contract] depositFor sync notice:", contractErr.message);
    }

    // Get or create vault for this buyer in DB
    let vault = await db.vault.findUnique({
      where: { hederaAccountId },
    });

    if (!vault) {
      vault = await db.vault.create({
        data: { hederaAccountId, balanceHbar: 0 },
      });
    }

    // Log deposit to HCS audit trail
    const hcsTxId = await logToHCS({
      type: "payment_settled",
      buyerAccountId: hederaAccountId,
      hederaTransaction: hederaTransactionId,
      priceHbar: confirmedAmount,
      executedAt: new Date().toISOString(),
      success: true,
      extra: {
        action: "vault_deposit",
        newBalance: vault.balanceHbar + confirmedAmount,
        contractTxHash,
        contractAddress: process.env.HEDERA_VAULT_CONTRACT_ADDRESS || "0xe798d59561B17AdF72fEa555d5113bB248a084A4",
      },
    });

    // Save deposit + update vault balance
    const [, updatedVault] = await db.$transaction([
      db.deposit.create({
        data: {
          vaultId: vault.id,
          amountHbar: confirmedAmount,
          hederaTransaction: hederaTransactionId,
          fromAccountId: hederaAccountId,
          hcsTxId,
          verifiedAt: new Date(),
        },
      }),
      db.vault.update({
        where: { id: vault.id },
        data: { balanceHbar: { increment: confirmedAmount } },
      }),
    ]);

    return Response.json({
      success: true,
      amountDeposited: confirmedAmount,
      newBalance: updatedVault.balanceHbar,
      hederaTransaction: hederaTransactionId,
      contractTxHash,
      contractAddress: process.env.HEDERA_VAULT_CONTRACT_ADDRESS || "0xe798d59561B17AdF72fEa555d5113bB248a084A4",
      hashscanUrl: `https://hashscan.io/testnet/transaction/${hederaTransactionId}`,
      hcsTxId,
    });
  } catch (err: any) {
    return Response.json(
      { error: err.message || "Failed to process deposit" },
      { status: 500 }
    );
  }
}
