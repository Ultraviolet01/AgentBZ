"use client";

import { useCallback } from "react";
import { useWallet, useAccountId, useBalance } from "@buidlerlabs/hashgraph-react-wallets";
import { HashpackConnector, KabilaConnector } from "@buidlerlabs/hashgraph-react-wallets/connectors";
import {
  buildPaymentTransaction,
  serializeSignedTransaction,
  type PaymentRequirements,
} from "@/lib/hedera-payment";

export function useHederaPayment() {
  const hashpackSession = useWallet(HashpackConnector);
  const kabilaSession = useWallet(KabilaConnector);
  const activeSession = useWallet();

  const { data: accountIdFromHook } = useAccountId();

  const isConnected =
    hashpackSession.isConnected ||
    kabilaSession.isConnected ||
    activeSession.isConnected;

  const activeConnectedSession = hashpackSession.isConnected
    ? hashpackSession
    : kabilaSession.isConnected
    ? kabilaSession
    : activeSession;

  const accountId =
    accountIdFromHook ||
    (activeConnectedSession.signer as any)?.getAccountId?.()?.toString() ||
    null;

  const connect = useCallback(
    async (connector?: any) => {
      if (connector === "kabila" || connector === KabilaConnector) {
        return kabilaSession.connect();
      }
      return hashpackSession.connect();
    },
    [hashpackSession, kabilaSession]
  );

  const disconnect = useCallback(async () => {
    if (hashpackSession.isConnected) await hashpackSession.disconnect();
    if (kabilaSession.isConnected) await kabilaSession.disconnect();
    if (activeSession.isConnected) await activeSession.disconnect();
  }, [hashpackSession, kabilaSession, activeSession]);

  const sendDeposit = useCallback(
    async (
      paymentRequirements: PaymentRequirements
    ): Promise<{ paymentPayloadTransaction: string }> => {
      if (!isConnected || !accountId) {
        throw new Error("Hedera wallet not connected. Please connect HashPack or Kabila.");
      }

      const signer = activeConnectedSession?.signer;
      if (!signer || typeof (signer as any).signTransaction !== "function") {
        throw new Error("Connected wallet signer does not support signTransaction");
      }

      // Build native TransferTransaction with Blocky402 feePayer and frozen against Testnet
      const tx = buildPaymentTransaction(accountId, paymentRequirements);

      // Sign without executing (sign-only)
      const signedTx = await (signer as any).signTransaction(tx);

      if (!signedTx) {
        throw new Error("User cancelled or wallet rejected the transaction signature");
      }

      // Base64-encode the signed transaction bytes for Blocky402 x402 payload
      const paymentPayloadTransaction = serializeSignedTransaction(signedTx);

      return { paymentPayloadTransaction };
    },
    [isConnected, accountId, activeConnectedSession]
  );

  return {
    accountId,
    isConnected,
    isInitialized: hashpackSession.isInitialized || kabilaSession.isInitialized,
    connect,
    disconnect,
    sendDeposit,
    hashpackSession,
    kabilaSession,
  };
}
