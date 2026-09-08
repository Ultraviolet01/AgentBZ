# AgentBazaar (ABZ) — Product Requirements Document (PRD)

## 1. Product Overview
**AgentBazaar** is the premier decentralized marketplace where autonomous AI agents are cataloged, executed, and monetized using native Hedera primitives (HBAR micropayments, HCS consensus logs, and HCS-14 agent identity standards).

---

## 2. Target Personas
1. **AI Agent Builders & Developers**:
   - Want to monetize their REST APIs, MCP servers, and LLM agent prompts with zero payment gateway fees, instant settlement in HBAR, and cryptographic ownership on-chain.
2. **End Users & DApp Integrators**:
   - Want to discover and execute specialized AI tools (e.g. security audits, social content generators, crypto scanners) paying per-run via their connected Hedera wallet without recurring subscriptions.
3. **Enterprise & Protocol Operators**:
   - Require provable audit logs and verifiable execution receipts on Hedera Consensus Service.

---

## 3. Core Functional Requirements

### 3.1 Wallet & Authentication
- Connect via HashPack, Kabila, Blade, or standard WalletConnect / Reown modal.
- Support auto-reconnection and balance polling via Hedera Mirror Nodes.
- Dual-auth support: Hedera account signature authentication + JWT session cookies.

### 3.2 Deploy Studio (`/deploy`)
- **Step 1: Deployment Mode Selection** (API/MCP wrapper, Agent Prompt Logic, TEE Confidential Compute).
- **Step 2: Agent Identity & Meta** (Name, slug, category, tags, avatar/icon).
- **Step 3: Endpoint Connectivity** (Target endpoint, headers, rate limits, user-provided inputs).
- **Step 4: Marketplace Display** (Short pitch, rich markdown documentation).
- **Step 5: Pricing & Revenue** (Price per run in HBAR, 95/5 developer/platform split).
- **Step 6: Secrets & Credentials** (AES-256-GCM vaulting of developer Anthropic/OpenAI keys).
- **Step 7: Summary & On-Chain Publishing** (Interactive multi-card summary, verified builder account attribution, platform-sponsored HCS topic message publishing to `0.0.10396393` with zero gas cost to the builder).

### 3.3 Execution & Micropayments (Blocky402 / x402)
- Server returns HTTP 402 with `WWW-Authenticate: x402 ...` payload for unpaid runs.
- Client signs exact HBAR transfer to platform / developer payout address.
- Facilitator verifies cryptographic signature and consensus timestamp.
- Decrypted vault keys injected ephemerally into LLM execution container.
- Response returned to user with real-time HashScan HCS consensus audit receipt.

---

## 4. Non-Functional Requirements
- **Latency**: Agent execution orchestration < 3.5s (excluding external LLM processing time).
- **Security**: AES-256-GCM encrypted API keys, never stored in plain text or logged to telemetry.
- **Reliability**: Fault-tolerant fallback to Hedera mirror nodes if primary RPC node experiences latency.
- **Compliance**: Full immutable HCS-14 on-chain audit trail for all deployments and executions.
