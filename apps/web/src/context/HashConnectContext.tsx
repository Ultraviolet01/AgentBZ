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
}

const HashConnectContext = createContext<HashConnectContextType>({
  accountId: null,
  isConnected: false,
  connect: () => {},
  disconnect: () => {},
  isInitialized: false,
});

export function HashConnectProvider({ children }: { children: ReactNode }) {
  const [accountId, setAccountId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    import("@/lib/hashconnect").then(({ initHashConnect, getConnectedAccount }) => {
      initHashConnect()
        .then(() => {
          setAccountId(getConnectedAccount());
          setIsInitialized(true);
        })
        .catch(console.error);
    });
  }, []);

  async function connect() {
    const { connectHashPack, getConnectedAccount } = await import("@/lib/hashconnect");
    connectHashPack();
    // Poll for connection
    const interval = setInterval(() => {
      const account = getConnectedAccount();
      if (account) {
        setAccountId(account);
        clearInterval(interval);
      }
    }, 500);
  }

  async function disconnect() {
    const { disconnectHashPack } = await import("@/lib/hashconnect");
    disconnectHashPack();
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
      }}
    >
      {children}
    </HashConnectContext.Provider>
  );
}

export const useHashConnect = () => useContext(HashConnectContext);
