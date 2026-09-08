"use client";

import { useCallback } from "react";
import { useWallet, useAccountId, useBalance } from "@buidlerlabs/hashgraph-react-wallets";
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
      if (!signer) {
        throw new Error("Connected wallet signer does not support transactions");
      }

      console.log("[Hedera] Preparing transaction for signer with account:", accountId);

      const tx = buildPaymentTransaction(accountId, paymentRequirements);

      let transactionId = '';
      let paymentPayloadTransaction = '';
      let signature = '';

      // 1. First attempt native execute / call via signer (triggers HashPack popup)
      if (typeof (signer as any).call === 'function') {
        try {
          const res = await (signer as any).call(tx);
          transactionId = res?.transactionId?.toString?.() || '';
          paymentPayloadTransaction = transactionId || serializeSignedTransaction(tx);
          console.log('[Hedera] signer.call succeeded, tx ID:', transactionId);
          return { paymentPayloadTransaction, transactionId };
        } catch (callErr: any) {
          console.warn('[Hedera] signer.call notice:', callErr);
          if (callErr?.message?.includes('reject') || callErr?.message?.includes('cancel') || callErr?.message?.includes('User rejected')) {
            throw callErr;
          }
        }
      }

      // 2. Try executeWithSigner
      if (typeof (tx as any).executeWithSigner === 'function') {
        try {
          const response = await (tx as any).executeWithSigner(signer);
          transactionId = response?.transactionId?.toString() || '';
          paymentPayloadTransaction = transactionId || serializeSignedTransaction(tx);
          console.log('[Hedera] executeWithSigner succeeded, tx ID:', transactionId);
          return { paymentPayloadTransaction, transactionId };
        } catch (execErr: any) {
          console.warn('[Hedera] executeWithSigner notice:', execErr);
          if (execErr?.message?.includes('reject') || execErr?.message?.includes('cancel') || execErr?.message?.includes('User rejected')) {
            throw execErr;
          }
        }
      }

      // 3. Try signTransaction
      if (typeof (signer as any).signTransaction === 'function') {
        try {
          const signedTx = await (signer as any).signTransaction(tx);
          if (signedTx) {
            paymentPayloadTransaction = serializeSignedTransaction(signedTx);
            return { paymentPayloadTransaction };
          }
        } catch (signTxErr: any) {
          console.warn('[Hedera] signer.signTransaction notice:', signTxErr);
          if (signTxErr?.message?.includes('reject') || signTxErr?.message?.includes('cancel') || signTxErr?.message?.includes('User rejected')) {
            throw signTxErr;
          }
        }
      }

      // 4. Try cryptographic message signature (hedera_signMessage)
      if (typeof (signer as any).sign === 'function') {
        try {
          const slug = paymentRequirements.extra?.agentIdentity?.slug || 'agent';
          const messageText = `AgentBazaar Agent Deployment\nAgent: ${paymentRequirements.extra?.agentIdentity?.name || slug}\nRegistry: 0.0.10396393\nDeposit: 0.5 HBAR\nBuilder: ${accountId}`;
          const msgBytes = new TextEncoder().encode(messageText);
          const sigResults = await (signer as any).sign([msgBytes]);
          if (sigResults && sigResults.length > 0) {
            const sig = sigResults[0];
            signature = typeof sig === 'string' ? sig : JSON.stringify(sig);
            paymentPayloadTransaction = serializeSignedTransaction(tx);
            console.log('[Hedera] signer.sign succeeded:', signature);
            return { paymentPayloadTransaction, signature };
          }
        } catch (signMsgErr: any) {
          console.warn('[Hedera] signer.sign notice:', signMsgErr);
          if (signMsgErr?.message?.includes('reject') || signMsgErr?.message?.includes('cancel') || signMsgErr?.message?.includes('User rejected')) {
            throw signMsgErr;
          }
        }
      }

      paymentPayloadTransaction = serializeSignedTransaction(tx);
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
