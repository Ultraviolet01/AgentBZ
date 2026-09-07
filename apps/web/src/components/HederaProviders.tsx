"use client";

import { ReactNode } from "react";
import { HWBridgeProvider } from "@buidlerlabs/hashgraph-react-wallets";
import { HederaTestnet } from "@buidlerlabs/hashgraph-react-wallets/chains";
import { HashpackConnector, KabilaConnector } from "@buidlerlabs/hashgraph-react-wallets/connectors";
import { HashConnectProvider } from "@/context/HashConnectContext";

const WALLETCONNECT_PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "3a8170812b534d0ff9d794f19a901d64";

export default function HederaProviders({ children }: { children: ReactNode }) {
  return (
    <HWBridgeProvider
      metadata={{
        name: "AgentBazaar",
        description: "The decentralized AI agent marketplace with x402 payments",
        icons: ["https://agentbazaar.io/icon.png"],
        url: typeof window !== "undefined" ? window.location.origin : "https://agentbazaar.io",
      }}
      projectId={WALLETCONNECT_PROJECT_ID}
      connectors={[HashpackConnector, KabilaConnector]}
      chains={[HederaTestnet]}
    >
      <HashConnectProvider>{children}</HashConnectProvider>
    </HWBridgeProvider>
  );
}
