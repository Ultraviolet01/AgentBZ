"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTransactions = exports.verifySignature = exports.getStatus = exports.connectWallet = void 0;
const database_1 = require("@agentbazaar/database");
const ethers_1 = require("ethers");
const prisma = new database_1.PrismaClient();
const connectWallet = async (req, res) => {
    try {
        const userId = req.userId;
        const { walletAddress } = req.body;
        if (!walletAddress || typeof walletAddress !== "string" || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
            return res.status(400).json({ error: "Invalid EVM wallet address format" });
        }
        const user = await prisma.user.update({
            where: { id: userId },
            data: { walletAddress }
        });
        res.json({ message: "Wallet connected", walletAddress: user.walletAddress });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to connect wallet" });
    }
};
exports.connectWallet = connectWallet;
const getStatus = async (req, res) => {
    try {
        const userId = req.userId;
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
    }
    catch (error) {
        res.status(500).json({ error: "Failed to get status" });
    }
};
exports.getStatus = getStatus;
const verifySignature = async (req, res) => {
    try {
        const { address, message, signature } = req.body;
        if (!address || !message || !signature) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        // Normalize line endings to prevent mismatches between Windows/Unix
        const normalizedMessage = message.replace(/\r\n/g, "\n");
        const recoveredAddress = (0, ethers_1.verifyMessage)(normalizedMessage, signature);
        const verified = recoveredAddress.toLowerCase() === address.toLowerCase();
        console.log(`Signature verification for ${address}: ${verified} (Recovered: ${recoveredAddress})`);
        res.json({ verified });
    }
    catch (error) {
        console.error("Signature verification error:", error);
        res.status(500).json({ error: "Failed to verify signature", verified: false });
    }
};
exports.verifySignature = verifySignature;
const getTransactions = async (req, res) => {
    try {
        const userId = req.userId;
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
    }
    catch (error) {
        console.error("Get transactions error:", error);
        res.status(500).json({ error: "Failed to get transactions" });
    }
};
exports.getTransactions = getTransactions;
