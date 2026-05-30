import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key");

async function getAuthUser(req: Request) {
  const cookieStore = cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { id: string; email: string };
  } catch (error) {
    return null;
  }
}

export async function GET(req: Request) {
  const authUser = await getAuthUser(req);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        credits: true,
        walletAddress: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const transactions = await prisma.transaction.findMany({
      where: { userId: authUser.id },
      orderBy: { createdAt: "desc" }
    });

    const mappedTransactions = transactions.map(tx => {
      // Map credit-like types to "deposit" for UI to show as green (+)
      const uiType = (tx.type === "CREDIT" || tx.type === "SIGNUP_BONUS" || tx.type === "DEPOSIT") 
        ? "deposit" 
        : tx.type.toLowerCase();
      
      return {
        id: tx.id,
        type: uiType,
        description: tx.description,
        amount: tx.amount,
        status: tx.status.toLowerCase(),
        date: tx.createdAt.toISOString()
      };
    });

    // Calculate totals
    const protocolUsage = transactions
      .filter(tx => tx.type === "AGENT_RUN")
      .reduce((acc, tx) => acc + tx.amount, 0);

    return NextResponse.json({
      balance: user.credits,
      protocolUsage,
      totalTransactions: transactions.length,
      transactions: mappedTransactions,
      walletAddress: user.walletAddress
    });
  } catch (error: any) {
    console.error("Wallet stats error:", error);
    return NextResponse.json({ error: "Failed to fetch wallet stats" }, { status: 500 });
  }
}
