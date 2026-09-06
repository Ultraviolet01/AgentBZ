// HashPack wallet connection — signs x402 payment transactions per agent request
// Buyer signs TransferTransaction; Blocky402 co-signs as feePayer and submits

"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  initHashConnect, 
  connectHashPack, 
  disconnectHashPack, 
  getConnectedAccount, 
  onWalletPaired,
  getPairingString,
  signPaymentWithHashPack
} from "@/lib/hashconnect";
import { TransferTransaction, AccountId, Hbar } from "@hashgraph/sdk";

export function useHashPack() {
  const [accountId, setAccountId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [pairingString, setPairingString] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Restore cached account
    const existing = getConnectedAccount();
    if (existing) {
      setAccountId(existing);
      setIsConnected(true);
    }

    // Subscribe to pairing events
    const unsub = onWalletPaired((newAccount) => {
      setAccountId(newAccount);
      setIsConnected(true);
    });

    initHashConnect().then((hc) => {
      if (hc) {
        const acc = getConnectedAccount();
        if (acc) {
          setAccountId(acc);
          setIsConnected(true);
        }
        if (hc.pairingString) {
          setPairingString(hc.pairingString);
        }
      }
      setIsInitialized(true);
    });

    return () => {
      unsub();
    };
  }, []);

  const connect = useCallback(async () => {
    const code = await connectHashPack();
    if (code) setPairingString(code);
    const acc = getConnectedAccount();
    if (acc) {
      setAccountId(acc);
      setIsConnected(true);
    }
  }, []);

  const disconnect = useCallback(async () => {
    await disconnectHashPack();
    setAccountId(null);
    setIsConnected(false);
  }, []);

  const sendDeposit = useCallback(
    async (toAccountId: string, amountHbar: number): Promise<string> => {
      const activeAccount = accountId || getConnectedAccount();
      if (!activeAccount) {
        throw new Error("HashPack not connected");
      }

      const hc = await initHashConnect();
      if (!hc) throw new Error("HashConnect not ready");

      const fromAccount = AccountId.fromString(activeAccount);
      const toAccount = AccountId.fromString(toAccountId);
      const signer = hc.getSigner(fromAccount as any);

      const transaction = await new TransferTransaction()
        .addHbarTransfer(fromAccount, new Hbar(-amountHbar))
        .addHbarTransfer(toAccount, new Hbar(amountHbar))
        .freezeWithSigner(signer as any);

      const signedTx = await transaction.signWithSigner(signer as any);
      const signedBytes = signedTx.toBytes();
      return Buffer.from(signedBytes).toString("base64");
    },
    [accountId]
  );

  return {
    accountId,
    isConnected,
    isInitialized,
    pairingString,
    connect,
    disconnect,
    sendDeposit,
    signPaymentWithHashPack,
  };
}

