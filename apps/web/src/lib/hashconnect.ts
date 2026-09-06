// HashConnect — connects AgentBazaar to HashPack wallet
// HashPack is Hedera's native wallet
// No private key ever exposed to the app — HashPack signs internally

import { HashConnect } from "hashconnect";
import { AccountId, TransferTransaction, Hbar, LedgerId } from "@hashgraph/sdk";

const APP_METADATA = {
  name: "AgentBazaar",
  description: "Open marketplace for AI agents on Hedera",
  icons: [`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3010"}/logo.png`],
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3010",
};

let hashconnect: HashConnect | null = null;
let pairedAccountId: string | null = null;
let pairingListeners: Array<(accountId: string) => void> = [];

export function onWalletPaired(callback: (accountId: string) => void) {
  pairingListeners.push(callback);
  return () => {
    pairingListeners = pairingListeners.filter(cb => cb !== callback);
  };
}

// Initialize HashConnect — call once on app load
export async function initHashConnect(): Promise<HashConnect | null> {
  if (typeof window === "undefined") return null;
  if (hashconnect) return hashconnect;

  const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "379f8263158f448c90b07dc7671239aa";
  
  try {
    hashconnect = new HashConnect(
      LedgerId.TESTNET,
      projectId,
      APP_METADATA,
      false
    );

    const savedAccount = localStorage.getItem("agentbazaar-connected-account");
    if (savedAccount) {
      pairedAccountId = savedAccount;
    }

    // Listen for wallet pairing
    hashconnect.pairingEvent.on((session) => {
      if (session.accountIds && session.accountIds.length > 0) {
        pairedAccountId = session.accountIds[0];
        localStorage.setItem("agentbazaar-connected-account", pairedAccountId);
        pairingListeners.forEach(cb => cb(pairedAccountId!));
      }
    });

    // Listen for disconnection
    hashconnect.disconnectionEvent.on(() => {
      pairedAccountId = null;
      localStorage.removeItem("agentbazaar-connected-account");
    });

    await hashconnect.init();
    return hashconnect;
  } catch (err) {
    console.warn("HashConnect init error:", err);
    return hashconnect;
  }
}

// Connect to HashPack — triggers extension prompt and pairing modal
export async function connectHashPack(): Promise<string | null> {
  const hc = await initHashConnect();
  if (!hc) return null;

  try {
    // 1. Post message directly to HashPack extension
    if (typeof window !== "undefined") {
      hc.connectToExtension();
    }
  } catch (e) {
    console.warn("connectToExtension attempt:", e);
  }

  try {
    // 2. Open pairing modal / WalletConnect
    if (typeof hc.openPairingModal === "function") {
      await hc.openPairingModal("dark");
    }
  } catch (err) {
    console.warn("openPairingModal notice:", err);
  }

  return hc.pairingString || null;
}

export function getPairingString(): string | null {
  return hashconnect?.pairingString || null;
}

// Get connected account ID
export function getConnectedAccount(): string | null {
  if (pairedAccountId) return pairedAccountId;
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("agentbazaar-connected-account");
    if (saved) return saved;
  }
  if (hashconnect && hashconnect.connectedAccountIds && hashconnect.connectedAccountIds.length > 0) {
    return hashconnect.connectedAccountIds[0].toString();
  }
  return null;
}

// Set manual account ID (for testnet quick connect or pairing)
export function setManualConnectedAccount(accountId: string): void {
  const trimmed = accountId.trim();
  pairedAccountId = trimmed;
  if (typeof window !== "undefined") {
    localStorage.setItem("agentbazaar-connected-account", trimmed);
  }
  pairingListeners.forEach(cb => cb(trimmed));
}

// Disconnect HashPack
export async function disconnectHashPack(): Promise<void> {
  pairedAccountId = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem("agentbazaar-connected-account");
  }
  if (hashconnect) {
    try {
      await hashconnect.disconnect();
    } catch (e) {
      console.warn("HashConnect disconnect error:", e);
    }
  }
}

// Sign and send a payment transaction via HashPack
export async function signPaymentWithHashPack(
  paymentRequirements: {
    amount: string;
    payTo: string;
    extra: { feePayer: string };
  }
): Promise<string> {
  if (!hashconnect) throw new Error("HashConnect not initialized");

  const connectedAccount = getConnectedAccount();
  if (!connectedAccount) throw new Error("No HashPack account connected");

  const accountId = AccountId.fromString(connectedAccount);
  const tinybars = parseInt(paymentRequirements.amount);

  const transaction = new TransferTransaction()
    .addHbarTransfer(
      accountId,
      new Hbar(-tinybars / 100_000_000)
    )
    .addHbarTransfer(
      AccountId.fromString(paymentRequirements.payTo),
      new Hbar(tinybars / 100_000_000)
    );

  const signedTransaction = await hashconnect.signAndReturnTransaction(
    accountId as any,
    transaction as any
  );

  const txBytes = signedTransaction.toBytes();
  const txBase64 = Buffer.from(txBytes).toString("base64");

  const paymentPayload = {
    x402Version: 2,
    scheme: "exact",
    network: "hedera:testnet",
    accepted: paymentRequirements,
    payload: { transaction: txBase64 },
  };

  return Buffer.from(JSON.stringify(paymentPayload)).toString("base64");
}
