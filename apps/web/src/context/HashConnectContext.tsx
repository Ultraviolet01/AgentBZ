"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  initHashConnect,
  connectHashPack,
  disconnectHashPack,
  getConnectedAccount,
} from "@/lib/hashconnect";

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
    initHashConnect()
      .then(() => {
        setAccountId(getConnectedAccount());
        setIsInitialized(true);
      })
      .catch(console.error);
  }, []);

  function connect() {
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

  function disconnect() {
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
