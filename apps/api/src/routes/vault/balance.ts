// apps/api/src/routes/vault/balance.ts
// GET /api/vault/balance?accountId=0.0.XXXXX
// Returns buyer's current vault balance + transaction history

import { PrismaClient } from "@agentbazaar/database";

const db = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get("accountId");

    if (!accountId) {
      return Response.json({ error: "accountId required" }, { status: 400 });
    }

    const vault = await db.vault.findUnique({
      where: { hederaAccountId: accountId },
      include: {
        deposits: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        deductions: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!vault) {
      return Response.json({
        hederaAccountId: accountId,
        balanceHbar: 0,
        deposits: [],
        deductions: [],
      });
    }

    return Response.json({
      hederaAccountId: vault.hederaAccountId,
      balanceHbar: vault.balanceHbar,
      deposits: vault.deposits.map((d) => ({
        amount: d.amountHbar,
        transaction: d.hederaTransaction,
        hashscanUrl: `https://hashscan.io/testnet/transaction/${d.hederaTransaction}`,
        date: d.verifiedAt,
      })),
      deductions: vault.deductions.map((d) => ({
        agentId: d.agentId,
        amount: d.amountHbar,
        agentFeeHbar: d.agentFeeHbar,
        platformFeeHbar: d.platformFeeHbar,
        transaction: d.hederaTransaction,
        date: d.executedAt,
      })),
    });
  } catch (err: any) {
    return Response.json(
      { error: err.message || "Failed to fetch vault balance" },
      { status: 500 }
    );
  }
}
