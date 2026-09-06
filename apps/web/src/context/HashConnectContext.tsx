"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { ConnectWalletModal } from "@/components/ConnectWalletModal";
import {
  connectMetaMask,
  getConnectedMetaMaskAccount,
  getMetaMaskHbarBalance,
  isMetaMaskInstalled,
} from "@/lib/metamask";

interface HashConnectContextType {
  accountId: string | null;
  isConnected: boolean;
  balance: string | null;
  connect: () => void;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
  isInitialized: boolean;
  setManualAccount: (id: string) => void;
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
  isInitialized: false,
  setManualAccount: () => {},
  isModalOpen: false,
  setIsModalOpen: () => {},
});

export function HashConnectProvider({ children }: { children: ReactNode }) {
  const [accountId, setAccountId] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  async function refreshBalance() {
    const acc = accountId || (await getConnectedMetaMaskAccount());
    if (acc) {
      const bal = await getMetaMaskHbarBalance(acc);
      if (bal !== null) setBalance(bal);
    }
  }

  // Check saved connection or MetaMask on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    async function initWallet() {
      try {
        const metaAccount = await getConnectedMetaMaskAccount();
        if (metaAccount) {
          setAccountId(metaAccount);
          const bal = await getMetaMaskHbarBalance(metaAccount);
          if (bal) setBalance(bal);
        }
      } catch (err) {
        console.warn("Wallet initialization warning:", err);
      } finally {
        setIsInitialized(true);
      }
    }

    initWallet();

    // Listen to MetaMask account / chain changes
    if (isMetaMaskInstalled()) {
      const ethereum = (window as any).ethereum;

      const handleAccountsChanged = async (accounts: string[]) => {
        if (accounts.length === 0) {
          setAccountId(null);
          setBalance(null);
          localStorage.removeItem("agentbazaar-connected-account");
        } else {
          const acc = accounts[0].toLowerCase();
          setAccountId(acc);
          localStorage.setItem("agentbazaar-connected-account", acc);
          const bal = await getMetaMaskHbarBalance(acc);
          if (bal) setBalance(bal);
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      ethereum.on?.("accountsChanged", handleAccountsChanged);
      ethereum.on?.("chainChanged", handleChainChanged);

      return () => {
        ethereum.removeListener?.("accountsChanged", handleAccountsChanged);
        ethereum.removeListener?.("chainChanged", handleChainChanged);
      };
    }
  }, []);

  function connect() {
    setIsModalOpen(true);
  }

  async function setManualAccount(id: string) {
    const trimmed = id.trim().toLowerCase();
    setAccountId(trimmed);
    if (typeof window !== "undefined") {
      localStorage.setItem("agentbazaar-connected-account", trimmed);
      localStorage.setItem("agentbazaar-wallet-type", "metamask");
    }
    const bal = await getMetaMaskHbarBalance(trimmed);
    if (bal) setBalance(bal);
  }

  async function disconnect() {
    setAccountId(null);
    setBalance(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("agentbazaar-connected-account");
      localStorage.removeItem("agentbazaar-wallet-type");
    }
  }

  return (
    <HashConnectContext.Provider
      value={{
        accountId,
        isConnected: !!accountId,
        balance,
        connect,
        disconnect,
        refreshBalance,
        isInitialized,
        setManualAccount,
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

