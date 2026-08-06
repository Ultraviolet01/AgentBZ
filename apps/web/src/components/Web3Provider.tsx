"use client";

import React from 'react';
import {
  RainbowKitProvider,
  getDefaultConfig,
  darkTheme,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider, http } from 'wagmi';
import { mainnet, base } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@rainbow-me/rainbowkit/styles.css';

const config = getDefaultConfig({
  appName: 'AgentBazaar',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'ba563c1e05865a8e3ed72b898791260f',
  // Base is the primary payment chain — must be listed first so RainbowKit
  // prompts users to switch to Base by default when connecting.
  chains: [base, mainnet],
  transports: {
    // Pin explicit public RPC URLs — never fall back to WalletConnect's
    // RPC gateway (rpc.walletconnect.com) which 403s with a placeholder projectId.
    [base.id]: http('https://mainnet.base.org'),
    [mainnet.id]: http('https://ethereum-rpc.publicnode.com'),
  },
  ssr: true,
});

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          initialChain={base}
          theme={darkTheme({
            accentColor: '#f5a623',
            accentColorForeground: 'black',
            borderRadius: 'medium',
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
