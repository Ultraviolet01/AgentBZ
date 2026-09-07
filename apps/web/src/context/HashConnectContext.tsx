"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { ConnectWalletModal } from "@/components/ConnectWalletModal";
import { useHederaPayment } from "@/hooks/useHederaPayment";
import type { PaymentRequirements } from "@/lib/hedera-payment";

interface HashConnectContextType {
  accountId: string | null;
  isConnected: boolean;
  balance: string | null;
  connect: (connector?: any) => void;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
  sendDeposit: (paymentRequirements: PaymentRequirements) => Promise<{ paymentPayloadTransaction: string }>;
  isInitialized: boolean;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
}

const HashConnectContext = createContext<HashConnectContextType>({
  accountId: null,
  isConnected: false,
  balance: null,
  connect: () => {},
  disconnect: () => {},
  refreshBalance: async () => {},
  sendDeposit: async () => ({ paymentPayloadTransaction: "" }),
  isInitialized: false,
  isModalOpen: false,
  setIsModalOpen: () => {},
});

export function HashConnectProvider({ children }: { children: ReactNode }) {
  const {
    accountId,
    isConnected,
    isInitialized,
    connect: connectWallet,
    disconnect: disconnectWallet,
    sendDeposit,
  } = useHederaPayment();

  const [balance, setBalance] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchMirrorNodeBalance = useCallback(async (account: string) => {
    try {
      const res = await fetch(
        `https://testnet.mirrornode.hedera.com/api/v1/accounts/${account}`
      );
      if (!res.ok) return;
      const data = await res.json();
      const tinybars = data?.balance?.balance;
      if (typeof tinybars === "number") {
        const hbar = (tinybars / 100_000_000).toFixed(2);
        setBalance(`${hbar} ℏ`);
      }
    } catch (err) {
      console.warn("[MirrorNode] Balance fetch error:", err);
    }
  }, []);

  const refreshBalance = useCallback(async () => {
    if (accountId) {
      await fetchMirrorNodeBalance(accountId);
    }
  }, [accountId, fetchMirrorNodeBalance]);

  useEffect(() => {
    if (accountId) {
      fetchMirrorNodeBalance(accountId);
      const interval = setInterval(() => {
        fetchMirrorNodeBalance(accountId);
      }, 15000);
      return () => clearInterval(interval);
    } else {
      setBalance(null);
    }
  }, [accountId, fetchMirrorNodeBalance]);

  const connect = useCallback((connector?: any) => {
    if (connector) {
      connectWallet(connector);
    } else {
      setIsModalOpen(true);
    }
  }, [connectWallet]);

  const disconnect = useCallback(async () => {
    await disconnectWallet();
    setBalance(null);
  }, [disconnectWallet]);

  return (
    <HashConnectContext.Provider
      value={{
        accountId,
        isConnected,
        balance,
        connect,
        disconnect,
        refreshBalance,
        sendDeposit,
        isInitialized,
        isModalOpen,
        setIsModalOpen,
      }}
    >
      {children}
      <ConnectWalletModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </HashConnectContext.Provider>
  );
}

export const useHashConnect = () => useContext(HashConnectContext);
