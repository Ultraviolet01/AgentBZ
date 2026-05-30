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

export async function POST(req: Request) {
  const authUser = await getAuthUser(req);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { ogAmount, crdAmount, txHash, walletAddress } = await req.json();

    if (!txHash) {
      return NextResponse.json({ error: "Missing transaction hash" }, { status: 400 });
    }

    // Check if transaction already exists
    const existingTx = await prisma.transaction.findUnique({
      where: { txHash }
    });

    if (existingTx) {
      return NextResponse.json({ error: "Transaction already processed" }, { status: 400 });
    }

    // Update user credits and record transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create transaction record
      const newTx = await tx.transaction.create({
        data: {
          userId: authUser.id,
          type: "DEPOSIT",
          amount: crdAmount,
          description: `Deposit of ${ogAmount} OG tokens. Wallet: ${walletAddress}, TX: ${txHash}`,
          txHash,
          status: "COMPLETED"
        }
      });

      // Update user credits
      await tx.user.update({
        where: { id: authUser.id },
        data: {
          credits: {
            increment: crdAmount
          }
        }
      });

      return newTx;
    });

    return NextResponse.json({ success: true, transaction: result });
  } catch (error: any) {
    console.error("Deposit error:", error);
    return NextResponse.json({ error: error.message || "Failed to process deposit" }, { status: 500 });
  }
}
