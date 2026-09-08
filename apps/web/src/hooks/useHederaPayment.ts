"use client";

import { useCallback } from "react";
import { useWallet, useAccountId } from "@buidlerlabs/hashgraph-react-wallets";
import {
  HashpackConnector,
  KabilaConnector,
  BladeConnector,
  HWCConnector,
} from "@buidlerlabs/hashgraph-react-wallets/connectors";
import {
  buildPaymentTransaction,
  serializeSignedTransaction,
  type PaymentRequirements,
} from "@/lib/hedera-payment";

function withTimeout<T>(promise: Promise<T>, ms = 6000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Wallet relay timed out after ${Math.round(ms / 1000)}s`)), ms)
    ),
  ]);
}

export function useHederaPayment() {
  const hashpackSession = useWallet(HashpackConnector);
  const kabilaSession = useWallet(KabilaConnector);
  const bladeSession = useWallet(BladeConnector);
  const hwcSession = useWallet(HWCConnector);
  const activeSession = useWallet();

  const { data: accountIdFromHook } = useAccountId();

  const isConnected =
    hashpackSession.isConnected ||
    kabilaSession.isConnected ||
    bladeSession.isConnected ||
    hwcSession.isConnected ||
    activeSession.isConnected;

  const activeConnectedSession = hashpackSession.isConnected
    ? hashpackSession
    : kabilaSession.isConnected
    ? kabilaSession
    : bladeSession.isConnected
    ? bladeSession
    : hwcSession.isConnected
    ? hwcSession
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
      if (connector === "blade" || connector === BladeConnector) {
        return bladeSession.connect();
      }
      if (connector === "hwc" || connector === HWCConnector) {
        return hwcSession.connect();
      }
      try {
        return await hashpackSession.connect();
      } catch (err) {
        console.warn("[Hedera] HashPack extension connect failed, falling back to WalletConnect modal:", err);
        return await hwcSession.connect();
      }
    },
    [hashpackSession, kabilaSession, bladeSession, hwcSession]
  );

  const disconnect = useCallback(async () => {
    if (hashpackSession.isConnected) await hashpackSession.disconnect();
    if (kabilaSession.isConnected) await kabilaSession.disconnect();
    if (bladeSession.isConnected) await bladeSession.disconnect();
    if (hwcSession.isConnected) await hwcSession.disconnect();
    if (activeSession.isConnected) await activeSession.disconnect();
  }, [hashpackSession, kabilaSession, bladeSession, hwcSession, activeSession]);

  const sendDeposit = useCallback(
    async (
      paymentRequirements: PaymentRequirements
    ): Promise<{ paymentPayloadTransaction: string; transactionId?: string; signature?: string }> => {
      if (!isConnected || !accountId) {
        throw new Error("Hedera wallet not connected. Please connect HashPack or Kabila.");
      }

      const signer = activeConnectedSession?.signer;
      console.log("[Hedera] Preparing transaction for signer with account:", accountId);

      const tx = buildPaymentTransaction(accountId, paymentRequirements);


      if (!signer) {
        throw new Error("No wallet signer available. Please reconnect your wallet.");
      }

      console.log('[Hedera] Requesting wallet signature (sign-only, no submit)...');

      let signedTx: any = tx;
      if (typeof (tx as any).freezeWithSigner === 'function') {
        signedTx = await withTimeout<any>((tx as any).freezeWithSigner(signer), 6000);
      }

      if (typeof (signer as any).signTransaction !== 'function') {
        throw new Error("Connected wallet does not support sign-only transactions (signTransaction method missing).");
      }

      const signedTransaction = await withTimeout<any>((signer as any).signTransaction(signedTx), 6000);

      const paymentPayloadTransaction = serializeSignedTransaction(signedTransaction);

      console.log('[Hedera] Transaction signed successfully, ready for Blocky402 settlement.');

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
