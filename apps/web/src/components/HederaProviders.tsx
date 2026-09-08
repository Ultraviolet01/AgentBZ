"use client";

import { ReactNode } from "react";
import { HWBridgeProvider } from "@buidlerlabs/hashgraph-react-wallets";
import { HederaTestnet, HederaMainnet } from "@buidlerlabs/hashgraph-react-wallets/chains";
import {
  HashpackConnector,
  KabilaConnector,
  BladeConnector,
  HWCConnector,
} from "@buidlerlabs/hashgraph-react-wallets/connectors";
import { HashConnectProvider } from "@/context/HashConnectContext";

const WALLETCONNECT_PROJECT_ID = "430247b6f8ddd120bf8c01995510965a";

export default function HederaProviders({ children }: { children: ReactNode }) {
  const currentOrigin = typeof window !== "undefined" && window.location.origin
    ? window.location.origin
    : "https://agent-bz-web.vercel.app";

  return (
    <HWBridgeProvider
      metadata={{
        name: "AgentBazaar",
        description: "The decentralized AI agent marketplace with x402 payments",
        icons: [`${currentOrigin}/icon.png`],
        url: currentOrigin,
      }}
      projectId={WALLETCONNECT_PROJECT_ID}
      connectors={[HWCConnector, HashpackConnector, KabilaConnector, BladeConnector]}
      chains={[HederaTestnet, HederaMainnet]}
    >
      <HashConnectProvider>{children}</HashConnectProvider>
    </HWBridgeProvider>
  );
}
