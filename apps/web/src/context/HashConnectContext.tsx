"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

interface HashConnectContextType {
  accountId: string | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  isInitialized: boolean;
  setManualAccount: (id: string) => void;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
}

const HashConnectContext = createContext<HashConnectContextType>({
  accountId: null,
  isConnected: false,
  connect: () => {},
  disconnect: () => {},
  isInitialized: false,
  setManualAccount: () => {},
  isModalOpen: false,
  setIsModalOpen: () => {},
});

export function HashConnectProvider({ children }: { children: ReactNode }) {
  const [accountId, setAccountId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    import("@/lib/hashconnect").then(({ initHashConnect, getConnectedAccount, onWalletPaired }) => {
      // 1. Restore cached account
      const current = getConnectedAccount();
      if (current) {
        setAccountId(current);
      }

      // 2. Listen for pairings
      onWalletPaired((pairedId) => {
        setAccountId(pairedId);
      });

      // 3. Init HashConnect
      initHashConnect()
        .then(() => {
          const acc = getConnectedAccount();
          if (acc) setAccountId(acc);
          setIsInitialized(true);
        })
        .catch((err) => {
          console.warn("HashConnect context init error:", err);
          setIsInitialized(true);
        });
    });
  }, []);

  async function connect() {
    try {
      const { connectHashPack, getConnectedAccount } = await import("@/lib/hashconnect");
      await connectHashPack();
      const acc = getConnectedAccount();
      if (acc) {
        setAccountId(acc);
      }
    } catch (err) {
      console.warn("connectHashPack warning:", err);
    }
  }

  function setManualAccount(id: string) {
    import("@/lib/hashconnect").then(({ setManualConnectedAccount }) => {
      setManualConnectedAccount(id);
      setAccountId(id);
    });
  }

  async function disconnect() {
    const { disconnectHashPack } = await import("@/lib/hashconnect");
    await disconnectHashPack();
    setAccountId(null);
  }

  return (
    <HashConnectContext.Provider
      value={{
        accountId,
        isConnected: !!accountId,
        connect,
        disconnect,
        isInitialized,
        setManualAccount,
        isModalOpen,
        setIsModalOpen,
      }}
    >
      {children}
    </HashConnectContext.Provider>
  );
}

export const useHashConnect = () => useContext(HashConnectContext);
