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
    const rawUserId = (req as any).userId || (req.query.userId as string | undefined);
    const walletAddressQuery = req.query.walletAddress as string | undefined;

    const userIds = new Set<string>();
    if (rawUserId && typeof rawUserId === "string") {
      userIds.add(rawUserId);
    }

    if (walletAddressQuery) {
      const matchedUsers = await prisma.user.findMany({
        where: {
          walletAddress: {
            equals: walletAddressQuery,
            mode: "insensitive",
          },
        },
        select: { id: true },
      });
      matchedUsers.forEach((u) => userIds.add(u.id));
    }

    const txConditions: any[] = [];
    if (userIds.size > 0) {
      txConditions.push({ userId: { in: Array.from(userIds) } });
    }

    let transactions = [];
    if (txConditions.length > 0) {
      transactions = await prisma.transaction.findMany({
        where: { OR: txConditions },
        orderBy: { createdAt: "desc" },
      });
    }

    // Fallback if no specific user filter matched: return recent platform transactions
    if (transactions.length === 0 && !rawUserId) {
      transactions = await prisma.transaction.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      });
    }

    const mappedTransactions = transactions.map((tx) => ({
      id: tx.id,
      type: tx.type,
      subtype: tx.type === "DEPOSIT" ? "ON-CHAIN" : "",
      description: tx.description,
      amount: tx.amount,
      status: tx.status,
      txHash: tx.txHash,
      createdAt: tx.createdAt.toISOString(),
      date: tx.createdAt.toISOString().split("T")[0],
    }));

    res.json({ transactions: mappedTransactions });
  } catch (error: any) {
    console.error("Get transactions error:", error);
    res.status(500).json({ error: "Failed to get transactions" });
  }
};

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const rawUserId = (req as any).userId || (req.query.userId as string | undefined);
    const walletAddressQuery = req.query.walletAddress as string | undefined;

    const userIds = new Set<string>();
    if (rawUserId && typeof rawUserId === "string") {
      userIds.add(rawUserId);
    }

    if (walletAddressQuery) {
      const matchedUsers = await prisma.user.findMany({
        where: {
          walletAddress: {
            equals: walletAddressQuery,
            mode: "insensitive",
          },
        },
        select: { id: true },
      });
      matchedUsers.forEach((u) => userIds.add(u.id));
    }

    if (rawUserId) {
      const authUser = await prisma.user.findUnique({
        where: { id: rawUserId },
        select: { walletAddress: true },
      });
      if (authUser?.walletAddress) {
        const linkedUsers = await prisma.user.findMany({
          where: {
            walletAddress: {
              equals: authUser.walletAddress,
              mode: "insensitive",
            },
          },
          select: { id: true },
        });
        linkedUsers.forEach((u) => userIds.add(u.id));
      }
    }

    // 1. Query agent runs
    const runConditions: any[] = [];
    if (userIds.size > 0) {
      runConditions.push({ userId: { in: Array.from(userIds) } });
    }

    let runs = [];
    if (runConditions.length > 0) {
      runs = await prisma.agentRun.findMany({
        where: { OR: runConditions },
        orderBy: { createdAt: "desc" },
      });
    }

    // Also check if any runs have matching payer in metadata if not caught yet
    if (walletAddressQuery) {
      const payerRuns = await prisma.agentRun.findMany({
        where: {
          outputData: {
            path: ["metadata", "payer"],
            equals: walletAddressQuery,
          },
        },
        orderBy: { createdAt: "desc" },
      });
      for (const pr of payerRuns) {
        if (!runs.some((r) => r.id === pr.id)) {
          runs.push(pr);
        }
      }
    }

    // Fallback if no specific user filter matched: return recent platform runs
    if (runs.length === 0 && !rawUserId) {
      runs = await prisma.agentRun.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      });
    }

    // 2. Query transactions
    const txConditions: any[] = [];
    if (userIds.size > 0) {
      txConditions.push({ userId: { in: Array.from(userIds) } });
    }
    const runTxHashes = runs
      .map((r: any) => r.artifactCid || (r.outputData as any)?.metadata?.txHash)
      .filter((h: any): h is string => typeof h === "string" && h.length > 0);

    if (runTxHashes.length > 0) {
      txConditions.push({ txHash: { in: runTxHashes } });
    }

    let transactions = [];
    if (txConditions.length > 0) {
      transactions = await prisma.transaction.findMany({
        where: { OR: txConditions },
        orderBy: { createdAt: "desc" },
      });
    }

    if (transactions.length === 0 && !rawUserId) {
      transactions = await prisma.transaction.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      });
    }

    const totalRuns = runs.length;
    const spentFromRuns = runs.reduce((sum, r) => {
      const cost = typeof r.creditsUsed === "number"
        ? r.creditsUsed
        : typeof (r.outputData as any)?.metadata?.costHbar === "number"
        ? (r.outputData as any).metadata.costHbar
        : 1.0;
      return sum + cost;
    }, 0);

    const spentFromTxs = transactions
      .filter((t) => t.type === "AGENT_RUN" || t.type === "DEBIT" || t.type === "PAYMENT")
      .reduce((sum, t) => sum + (typeof t.amount === "number" ? t.amount : 0), 0);

    const lifetimeSpentHbar = Math.max(spentFromRuns, spentFromTxs);

    res.json({
      totalRuns,
      lifetimeSpentHbar,
      walletAddress: walletAddressQuery || null,
      runs,
      transactions,
    });
  } catch (error: any) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({ error: "Failed to get dashboard stats" });
  }
};

