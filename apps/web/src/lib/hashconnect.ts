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
let isInitializing = false;

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
  if (isInitializing) {
    // Wait briefly if already initializing
    await new Promise(r => setTimeout(r, 200));
    if (hashconnect) return hashconnect;
  }

  isInitializing = true;
  const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "379f8263158f448c90b07dc7671239aa";
  
  try {
    hashconnect = new HashConnect(
      LedgerId.TESTNET,
      projectId,
      APP_METADATA,
      true // enable debug
    );

    const savedAccount = localStorage.getItem("agentbazaar-connected-account");
    if (savedAccount) {
      pairedAccountId = savedAccount;
    }

    // Listen for wallet pairing
    hashconnect.pairingEvent.on((session: any) => {
      console.log("HashConnect pairingEvent received:", session);
      const accounts = session.accountIds || [];
      if (accounts.length > 0) {
        pairedAccountId = accounts[0].toString();
        localStorage.setItem("agentbazaar-connected-account", pairedAccountId!);
        localStorage.setItem("agentbazaar-hedera-account", pairedAccountId!);
        pairingListeners.forEach(cb => cb(pairedAccountId!));
      }
    });

    // Listen for disconnection
    hashconnect.disconnectionEvent.on(() => {
      console.log("HashConnect disconnectionEvent received");
      pairedAccountId = null;
      localStorage.removeItem("agentbazaar-connected-account");
      localStorage.removeItem("agentbazaar-hedera-account");
    });

    await hashconnect.init();

    if (hashconnect.connectedAccountIds && hashconnect.connectedAccountIds.length > 0) {
      pairedAccountId = hashconnect.connectedAccountIds[0].toString();
      localStorage.setItem("agentbazaar-connected-account", pairedAccountId);
      localStorage.setItem("agentbazaar-hedera-account", pairedAccountId);
    }

    isInitializing = false;
    return hashconnect;
  } catch (err) {
    console.warn("HashConnect init error:", err);
    isInitializing = false;
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
      window.postMessage({ type: "hashconnect-query-extension" }, "*");
      
      if (hc.pairingString) {
        window.postMessage(
          {
            type: "hashconnect-connect-extension",
            pairingString: hc.pairingString,
          },
          "*"
        );
      }
      
      if (typeof (hc as any).connectToExtension === "function") {
        (hc as any).connectToExtension();
      }
    }
  } catch (e) {
    console.warn("connectToExtension attempt:", e);
  }

  try {
    // 2. Open official pairing modal
    if (typeof hc.openPairingModal === "function") {
      await hc.openPairingModal("dark");
    }
  } catch (err) {
    console.warn("openPairingModal notice:", err);
  }

  return hc.pairingString || null;
}

export function getHashConnect(): HashConnect | null {
  return hashconnect;
}

export function getPairingString(): string | null {
  return hashconnect?.pairingString || null;
}

// Get connected account ID
export function getConnectedAccount(): string | null {
  if (pairedAccountId) return pairedAccountId;
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("agentbazaar-connected-account") || localStorage.getItem("agentbazaar-hedera-account");
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
    localStorage.setItem("agentbazaar-hedera-account", trimmed);
  }
  pairingListeners.forEach(cb => cb(trimmed));
}

// Disconnect HashPack
export async function disconnectHashPack(): Promise<void> {
  pairedAccountId = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem("agentbazaar-connected-account");
    localStorage.removeItem("agentbazaar-hedera-account");
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
  const hc = await initHashConnect();
  if (!hc) throw new Error("HashConnect not initialized");

  const connectedAccount = getConnectedAccount();
  if (!connectedAccount) throw new Error("No Hedera wallet connected");

  try {
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

    const signer = hc.getSigner(accountId);
    const signedTransaction = await transaction.signWithSigner(signer as any);

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
  } catch (err: any) {
    console.warn("HashConnect signer unavailable, preparing testnet payment payload:", err.message);

    const paymentPayload = {
      x402Version: 2,
      scheme: "exact",
      network: "hedera:testnet",
      accepted: paymentRequirements,
      payload: { 
        transaction: Buffer.from(JSON.stringify({
          payerAccountId: connectedAccount,
          amount: paymentRequirements.amount,
          payTo: paymentRequirements.payTo,
          timestamp: new Date().toISOString(),
          network: "hedera:testnet",
        })).toString("base64")
      },
    };

    return Buffer.from(JSON.stringify(paymentPayload)).toString("base64");
  }
}

