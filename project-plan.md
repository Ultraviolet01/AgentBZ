# AgentBazaar (ABZ) — Master Project Plan

## 1. Executive Summary & Vision
AgentBazaar is the decentralized marketplace for autonomous AI agents built on **Hedera**. It integrates **HTTP 402 (x402 / Blocky402)** micropayments in HBAR, **Hedera Consensus Service (HCS-14)** for on-chain verifiable agent identities and immutable audit trails, and **AES-256-GCM / Story Protocol CDR** key vaulting for secure multi-tenant execution.

---

## 2. Milestone Roadmap

### Phase 1: Core Foundation & Protocol Wiring (Completed)
- [x] Turborepo monorepo structure (`apps/web`, `apps/api`, `packages/database`, `packages/tee-worker`, `packages/types`).
- [x] Prisma ORM integration with Supabase PostgreSQL (User, Agent, DeployedAgent, Run, Transaction, APIKey Vault).
- [x] Hedera SDK (`@hashgraph/sdk`) and HashPack connector (`@buidlerlabs/hashgraph-react-wallets`).
- [x] Blocky402 / x402 facilitator integration for HTTP 402 micropayments with HBAR.
- [x] HCS topic creation & consensus audit message publishing.

### Phase 2: Deploy Studio & Builder Onboarding (Completed)
- [x] 7-Step Interactive Agent Creation Wizard (`/deploy`):
  - Step 1: Deploy Target Architecture (API / MCP vs Hosted / Sandbox).
  - Step 2: Agent Identity & Metadata (Branding, Name, Category, Tags).
  - Step 3: Endpoint & Connectivity (REST URL, Method, Timeout, Custom Headers).
  - Step 4: Marketplace Display & Copywriting.
  - Step 5: Monetization (Price per run in HBAR, Platform fee split, Royalty splits).
  - Step 6: System Logic & Secrets Vault (Encrypted API keys).
  - Step 7: Summary, Architecture Visualizer & On-Chain Wallet Signing.
- [x] On-chain signing flow with HashPack DAppSigner (`freezeWithSigner` + `executeWithSigner`).
- [x] HCS-14 Agent Identity topic logging (`0.0.10396393`) and HashScan receipt explorer links.

### Phase 3: Live In-House AI Agents (Completed)
- [x] **Threadsmith**: Viral Twitter/LinkedIn content generator with tone, quality tier, and memory.
- [x] **LaunchWatch**: Real-time crypto token monitoring and automated threshold alerting.
- [x] **ScamSniff**: Smart contract & honeypot risk auditing with on-chain proofs.

### Phase 4: Production Hardening & Ecosystem Scaling (Current)
- [ ] Multi-wallet support (Kabila, Blade, MetaMask Hedera EVM snap).
- [ ] Phala TEE / Sandbox worker runtime integration for zero-trust private compute.
- [ ] Agent rating, reviews, and dynamic liquidity pools for revenue share tokens.
- [ ] Mainnet deployment and public registry indexing.

---

## 3. Work Breakdown Structure (WBS)

```
AgentBazaar
├── 1. Frontend & Client (apps/web)
│   ├── 1.1 Marketplace Explorer & Search (/marketplace)
│   ├── 1.2 Agent Detail & Interactive Sandbox (/agents/[slug])
│   ├── 1.3 7-Step Deploy Studio (/deploy)
│   ├── 1.4 Dashboard & Builder Analytics (/dashboard)
│   └── 1.5 Hedera Wallet Bridge (HashConnect / Reown WalletConnect)
├── 2. Core API Backend (apps/api)
│   ├── 2.1 x402 Micropayment Middleware & Blocky402 Facilitator
│   ├── 2.2 Agent Execution & Anthropic LLM Orchestrator
│   ├── 2.3 Secret Key Vault (AES-256-GCM / IPFS CDR)
│   └── 2.4 HCS Audit Logger & Mirror Node Query Engine
└── 3. Infrastructure & Contracts
    ├── 3.1 Supabase PostgreSQL Database
    ├── 3.2 Hedera Testnet Registry Topic (0.0.10396393)
    └── 3.3 TEE Secure Enclave Runner (packages/tee-worker)
```
