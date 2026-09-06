import { Request, Response } from "express";
import { PrismaClient } from "@agentbazaar/database";
import { verifyMessage } from "ethers";

const prisma = new PrismaClient();

export const connectWallet = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { walletAddress } = req.body;

    if (!walletAddress || typeof walletAddress !== "string" || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({ error: "Invalid EVM wallet address format" });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { walletAddress }
    });

    res.json({ message: "Wallet connected", walletAddress: user.walletAddress });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to connect wallet" });
  }
};

export const getStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        walletAddress: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      walletAddress: user.walletAddress
    });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to get status" });
  }
};

export const verifySignature = async (req: Request, res: Response) => {
  try {
    const { address, message, signature } = req.body;

    if (!address || !message || !signature) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Normalize line endings to prevent mismatches between Windows/Unix
    const normalizedMessage = message.replace(/\r\n/g, "\n");

    const recoveredAddress = verifyMessage(normalizedMessage, signature);
    const verified = recoveredAddress.toLowerCase() === address.toLowerCase();

    console.log(`Signature verification for ${address}: ${verified} (Recovered: ${recoveredAddress})`);

    res.json({ verified });
  } catch (error) {
    console.error("Signature verification error:", error);
    res.status(500).json({ error: "Failed to verify signature", verified: false });
  }
};

export const getTransactions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });

    const mappedTransactions = transactions.map(tx => ({
      id: tx.id,
      type: tx.type,
      subtype: tx.type === "DEPOSIT" ? "ON-CHAIN" : "",
      description: tx.description,
      amount: tx.amount,
      status: tx.status,
      date: tx.createdAt.toISOString().split("T")[0]
    }));

    res.json({ transactions: mappedTransactions });
  } catch (error: any) {
    console.error("Get transactions error:", error);
    res.status(500).json({ error: "Failed to get transactions" });
  }
};

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const runs = await prisma.agentRun.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { walletAddress: true }
    });

    const totalRuns = runs.length;
    const spentFromRuns = runs.reduce((sum, r) => sum + (r.creditsUsed || 1.0), 0);
    const spentFromTxs = transactions
      .filter(t => t.type === "AGENT_RUN" || t.type === "DEBIT")
      .reduce((sum, t) => sum + t.amount, 0);

    const lifetimeSpentHbar = Math.max(spentFromRuns, spentFromTxs);

    res.json({
      totalRuns,
      lifetimeSpentHbar,
      walletAddress: user?.walletAddress || null,
      runs,
      transactions
    });
  } catch (error: any) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({ error: "Failed to get dashboard stats" });
  }
};
