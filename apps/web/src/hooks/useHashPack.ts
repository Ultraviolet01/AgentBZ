// HashPack wallet connection — used for vault deposits only
// Agent payments are handled server-side (no wallet needed there)

"use client";

import { useState, useEffect, useCallback } from "react";
import { HashConnect } from "hashconnect";
import { TransferTransaction, AccountId, Hbar, LedgerId } from "@hashgraph/sdk";

const APP_METADATA = {
  name: "AgentBazaar",
  description: "Open marketplace for AI agents on Hedera",
  icons: [`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/logo.png`],
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
};

// Singleton HashConnect instance
let _hashconnect: HashConnect | null = null;

function getHashConnect(): HashConnect {
  if (!_hashconnect) {
    const projectId =
      process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "agentbazaar-testnet";
    _hashconnect = new HashConnect(
      LedgerId.TESTNET,
      projectId,
      APP_METADATA,
      false
    );
  }
  return _hashconnect;
}

export function useHashPack() {
  const [accountId, setAccountId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [pairingString, setPairingString] = useState<string>("");
  const [topic, setTopic] = useState<string>("");
  const [walletMetadata, setWalletMetadata] = useState<any>(null);

  // Initialize HashConnect on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    async function init() {
      const hc = getHashConnect();

      // Try to restore saved session
      const saved =
        localStorage.getItem("agentbazaar-hashconnect") ||
        localStorage.getItem("agentbazaar-hedera-account");
      if (saved) {
        try {
          const data = saved.startsWith("{")
            ? JSON.parse(saved)
            : { accountId: saved };
          if (data.accountId) {
            setAccountId(data.accountId);
            setIsConnected(true);
            if (data.metadata) setWalletMetadata(data.metadata);
          }
        } catch {
          localStorage.removeItem("agentbazaar-hashconnect");
        }
      }

      // Listen for wallet pairing
      hc.pairingEvent.on((data: any) => {
        const connectedAccountId =
          data.accountIds?.[0]?.toString?.() || data.accountIds?.[0] || "";
        if (connectedAccountId) {
          setAccountId(connectedAccountId);
          setWalletMetadata(data.metadata || null);
          setIsConnected(true);

          localStorage.setItem(
            "agentbazaar-hashconnect",
            JSON.stringify({
              metadata: data.metadata,
              accountId: connectedAccountId,
            })
          );
          localStorage.setItem("agentbazaar-hedera-account", connectedAccountId);
          localStorage.setItem("agentbazaar-connected-account", connectedAccountId);
        }
      });

      // Listen for disconnection
      hc.disconnectionEvent.on(() => {
        setAccountId(null);
        setIsConnected(false);
        setWalletMetadata(null);
        localStorage.removeItem("agentbazaar-hashconnect");
        localStorage.removeItem("agentbazaar-hedera-account");
        localStorage.removeItem("agentbazaar-connected-account");
      });

      await hc.init();

      if (hc.connectedAccountIds && hc.connectedAccountIds.length > 0) {
        const connected = hc.connectedAccountIds[0].toString();
        setAccountId(connected);
        setIsConnected(true);
        localStorage.setItem("agentbazaar-hedera-account", connected);
      }

      if (hc.pairingString) {
        setPairingString(hc.pairingString);
      }

      setIsInitialized(true);
    }

    init().catch((err) => {
      console.error("HashConnect initialization error:", err);
      setIsInitialized(true);
    });
  }, []);

  // Open HashPack pairing modal
  const connect = useCallback(async () => {
    const hc = getHashConnect();
    try {
      if (hc.openPairingModal) {
        await hc.openPairingModal("dark");
      }
    } catch (err) {
      console.error("Failed to open pairing modal:", err);
    }
  }, []);

  // Disconnect HashPack
  const disconnect = useCallback(async () => {
    try {
      const hc = getHashConnect();
      await hc.disconnect();
    } catch (err) {
      console.error("Failed to disconnect HashConnect:", err);
    }
    setAccountId(null);
    setIsConnected(false);
    setWalletMetadata(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("agentbazaar-hashconnect");
      localStorage.removeItem("agentbazaar-hedera-account");
      localStorage.removeItem("agentbazaar-connected-account");
    }
  }, []);

  // Send HBAR deposit via HashPack
  // Buyer signs a TransferTransaction — HashPack popup opens for approval
  // Returns the Hedera transaction ID for Mirror Node verification
  const sendDeposit = useCallback(
    async (toAccountId: string, amountHbar: number): Promise<string> => {
      if (!accountId) {
        throw new Error("HashPack not connected");
      }

      const hc = getHashConnect();
      const fromAccount = AccountId.fromString(accountId);
      const toAccount = AccountId.fromString(toAccountId);
      const signer = hc.getSigner(fromAccount as any);

      // Build transfer transaction
      const transaction = await new TransferTransaction()
        .addHbarTransfer(
          fromAccount,
          new Hbar(-amountHbar) // negative = sending
        )
        .addHbarTransfer(
          toAccount,
          new Hbar(amountHbar) // positive = receiving
        )
        .freezeWithSigner(signer as any);

      // HashPack opens popup — buyer approves
      const signedTx = await transaction.signWithSigner(signer as any);
      const txResponse = await signedTx.executeWithSigner(signer as any);

      // Return transaction ID for Mirror Node verification
      return txResponse.transactionId.toString();
    },
    [accountId]
  );

  return {
    accountId,
    isConnected,
    isInitialized,
    pairingString,
    topic,
    walletMetadata,
    connect,
    disconnect,
    sendDeposit,
  };
}
