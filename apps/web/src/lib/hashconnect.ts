// HashConnect — connects AgentBazaar to HashPack wallet
// HashPack is Hedera's native wallet
// No private key ever exposed to the app — HashPack signs internally

import { HashConnect } from "hashconnect";
import { AccountId, TransferTransaction, Hbar, LedgerId } from "@hashgraph/sdk";

const APP_METADATA = {
  name: "AgentBazaar",
  description: "Open marketplace for AI agents on Hedera",
  icons: [`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/logo.png`],
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
};

let hashconnect: HashConnect | null = null;
let pairedAccountId: string | null = null;

// Initialize HashConnect — call once on app load
export async function initHashConnect(): Promise<void> {
  if (typeof window === "undefined") return;

  const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "agentbazaar-testnet";
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
    }
  });

  // Listen for disconnection
  hashconnect.disconnectionEvent.on(() => {
    pairedAccountId = null;
    localStorage.removeItem("agentbazaar-connected-account");
  });

  await hashconnect.init();
}

// Connect to HashPack — opens the HashPack pairing modal
export function connectHashPack(): void {
  if (!hashconnect) throw new Error("HashConnect not initialized");
  hashconnect.openPairingModal("dark");
}

// Get connected account ID
export function getConnectedAccount(): string | null {
  if (pairedAccountId) return pairedAccountId;
  if (hashconnect && hashconnect.connectedAccountIds.length > 0) {
    return hashconnect.connectedAccountIds[0].toString();
  }
  return null;
}

// Disconnect HashPack
export async function disconnectHashPack(): Promise<void> {
  pairedAccountId = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem("agentbazaar-connected-account");
  }
  if (hashconnect) {
    await hashconnect.disconnect();
  }
}

// Sign and send a payment transaction via HashPack
// Builds a TransferTransaction and has HashPack sign it
// Returns base64-encoded signed transaction as payment payload
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

  // Build TransferTransaction
  // Buyer pays: amount in tinybars to AgentBazaar payTo account
  const tinybars = parseInt(paymentRequirements.amount);

  const transaction = new TransferTransaction()
    .addHbarTransfer(
      accountId,
      new Hbar(-tinybars / 100_000_000) // negative = sending
    )
    .addHbarTransfer(
      AccountId.fromString(paymentRequirements.payTo),
      new Hbar(tinybars / 100_000_000) // positive = receiving
    );

  // HashPack signs the transaction — opens HashPack popup for user approval
  const signedTransaction = await hashconnect.signAndReturnTransaction(
    accountId as any,
    transaction as any
  );

  // Serialize the signed transaction to bytes then base64
  const txBytes = signedTransaction.toBytes();
  const txBase64 = Buffer.from(txBytes).toString("base64");

  // Build the x402 payment payload (from Blocky402 quickstart format)
  const paymentPayload = {
    x402Version: 2,
    scheme: "exact",
    network: "hedera:testnet",
    accepted: paymentRequirements,
    payload: { transaction: txBase64 },
  };

  // Base64-encode entire payload for PAYMENT-SIGNATURE header
  return Buffer.from(JSON.stringify(paymentPayload)).toString("base64");
}
