// Wallet connection — signs x402 payment transactions per agent request
// Buyer signs transaction; Blocky402 co-signs as feePayer and submits to Hedera

"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  connectMetaMask, 
  getConnectedMetaMaskAccount, 
  signPaymentWithMetaMask,
  isMetaMaskInstalled
} from "@/lib/metamask";

export function useHashPack() {
  const [accountId, setAccountId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Restore cached account
    getConnectedMetaMaskAccount().then((existing) => {
      if (existing) {
        setAccountId(existing);
        setIsConnected(true);
      }
      setIsInitialized(true);
    });

    if (isMetaMaskInstalled()) {
      const ethereum = (window as any).ethereum;
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          setAccountId(null);
          setIsConnected(false);
        } else {
          setAccountId(accounts[0].toLowerCase());
          setIsConnected(true);
        }
      };
      ethereum.on?.("accountsChanged", handleAccountsChanged);
      return () => {
        ethereum.removeListener?.("accountsChanged", handleAccountsChanged);
      };
    }
  }, []);

  const connect = useCallback(async () => {
    try {
      const acc = await connectMetaMask();
      if (acc) {
        setAccountId(acc);
        setIsConnected(true);
      }
    } catch (err) {
      console.error("[MetaMask] connect error:", err);
    }
  }, []);

  const disconnect = useCallback(async () => {
    setAccountId(null);
    setIsConnected(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem("agentbazaar-connected-account");
    }
  }, []);

  const sendDeposit = useCallback(
    async (toAccountId: string, amountHbar: number): Promise<string> => {
      const activeAccount = accountId || (await getConnectedMetaMaskAccount());
      if (!activeAccount) {
        throw new Error("MetaMask wallet not connected. Please click Connect Wallet first.");
      }

      // Trigger MetaMask signature popup
      const { requestMetaMaskPaymentSignature } = await import("@/lib/metamask");
      const { payload } = await requestMetaMaskPaymentSignature(
        activeAccount,
        amountHbar,
        "Agent Execution & Orchestration Micropayment"
      );

      return payload;
    },
    [accountId]
  );

  return {
    accountId,
    isConnected,
    isInitialized,
    connect,
    disconnect,
    sendDeposit,
    signPaymentWithMetaMask,
  };
}


