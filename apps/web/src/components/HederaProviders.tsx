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

const WALLETCONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

if (!WALLETCONNECT_PROJECT_ID && typeof window !== "undefined") {
  console.error(
    "[HederaProviders] NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set. " +
    "Get one at https://cloud.reown.com — wallet connections will not work without it."
  );
}

export default function HederaProviders({ children }: { children: ReactNode }) {
  return (
    <HWBridgeProvider
      metadata={{
        name: "AgentBazaar",
        description: "The decentralized AI agent marketplace with x402 payments",
        icons: ["https://agentbazaar.io/icon.png"],
        url: typeof window !== "undefined" ? window.location.origin : "https://agentbazaar.io",
      }}
      projectId={WALLETCONNECT_PROJECT_ID || ""}
      connectors={[HWCConnector, HashpackConnector, KabilaConnector, BladeConnector]}
      chains={[HederaTestnet, HederaMainnet]}
    >
      <HashConnectProvider>{children}</HashConnectProvider>
    </HWBridgeProvider>
  );
}
