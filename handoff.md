# AgentBazaar (ABZ) — Developer Handoff Document

## 1. Project Overview & Current State
AgentBazaar is an operational decentralized AI agent marketplace on Hedera. 
- **Live Production URL**: [https://agentbazaar-web.vercel.app](https://agentbazaar-web.vercel.app)
- **Deploy Studio (`/deploy`)**: 7-step builder workflow with on-chain wallet signing and HCS topic registration.
- **x402 Micropayments**: Native Blocky402 facilitator integration for per-run HBAR execution fees.
- **Featured Agents**: ThreadSmith, LaunchWatch, ScamSniff, and Sentinel (`0.0.10389860`).
- **Wallet Connectivity**: Configured with active Reown/WalletConnect Project ID `430247b6f8ddd120bf8c01995510965a` for HashPack, Kabila, and Blade wallets.

---

## 2. Quickstart & Local Setup

### 2.1 Starting Servers
```bash
# In project root:
pnpm install

# Start API Server (Port 3001)
pnpm --filter api dev

# Start TEE Worker (Port 4100)
pnpm --filter @agentbazaar/tee-worker dev

# Start Web Frontend (Port 3010)
pnpm --filter web dev
```

### 2.2 Testing Deployment Flow
1. Open `http://localhost:3010/deploy`.
2. Connect your HashPack wallet (ensure HashPack network is set to **Testnet**).
3. Fill out Steps 1 through 6 or click through defaults.
4. On **Step 7 (Summary & Publish)**, click **"🚀 Sign & Deploy Agent On-Chain"**.
5. The agent deployment is registered to **Hedera Consensus Service Topic `0.0.10396393`** with 100% of the network consensus gas fees sponsored by AgentBazaar, linking your verified builder wallet (`0.0.10389860`).
6. The success screen will display the live HashScan audit link (`https://hashscan.io/testnet/transaction/...`).

---

## 3. Key Files & Reference Architecture

| Purpose | File Path |
|---|---|
| Deploy Page & Wizard | [`apps/web/src/app/deploy/page.tsx`](file:///c:/Users/USER/Downloads/AgentB/ABZ/apps/web/src/app/deploy/page.tsx) |
| Hedera Payment & Signer Hook | [`apps/web/src/hooks/useHederaPayment.ts`](file:///c:/Users/USER/Downloads/AgentB/ABZ/apps/web/src/hooks/useHederaPayment.ts) |
| Transaction Builder | [`apps/web/src/lib/hedera-payment.ts`](file:///c:/Users/USER/Downloads/AgentB/ABZ/apps/web/src/lib/hedera-payment.ts) |
| Deploy API Endpoint | [`apps/web/src/app/api/agents/deploy/route.ts`](file:///c:/Users/USER/Downloads/AgentB/ABZ/apps/web/src/app/api/agents/deploy/route.ts) |
| HCS Logging Utility | [`apps/web/src/lib/hcs.ts`](file:///c:/Users/USER/Downloads/AgentB/ABZ/apps/web/src/lib/hcs.ts) |
| Key Vault Encryption | [`apps/web/src/lib/key-vault.ts`](file:///c:/Users/USER/Downloads/AgentB/ABZ/apps/web/src/lib/key-vault.ts) |
| Hedera Wallet Providers | [`apps/web/src/components/HederaProviders.tsx`](file:///c:/Users/USER/Downloads/AgentB/ABZ/apps/web/src/components/HederaProviders.tsx) |

---

## 4. Documentation Index
- [`project-plan.md`](file:///c:/Users/USER/Downloads/AgentB/ABZ/project-plan.md): High-level vision, milestones, and work breakdown.
- [`prd.md`](file:///c:/Users/USER/Downloads/AgentB/ABZ/prd.md): Target personas, functional specifications, and non-functional requirements.
- [`architecture.md`](file:///c:/Users/USER/Downloads/AgentB/ABZ/architecture.md): System diagrams, data flows, and security vault design.
- [`memory.md`](file:///c:/Users/USER/Downloads/AgentB/ABZ/memory.md): Engineering learnings, Hedera SDK gotchas, and environment variables.
- [`handoff.md`](file:///c:/Users/USER/Downloads/AgentB/ABZ/handoff.md): This file.
