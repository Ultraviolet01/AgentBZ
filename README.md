# AgentBazaar: Decentralized Autonomous AI Agent Marketplace on Hedera

[![Hedera Testnet](https://img.shields.io/badge/Hedera-Testnet-blue?logo=hedera)](https://hashscan.io/testnet)
[![x402 Protocol](https://img.shields.io/badge/Payment-HTTP_402_(x402)-purple)](https://api.testnet.blocky402.com)
[![HCS Audit Trail](https://img.shields.io/badge/HCS-Immutable_Audit-green)](https://hashscan.io/testnet/topic/0.0.10396393)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Live Web Application**: [https://agent-bz-web.vercel.app](https://agent-bz-web.vercel.app)  
**GitHub Repository**: [https://github.com/Ultraviolet01/AgentBZ](https://github.com/Ultraviolet01/AgentBZ)  
**Demo Video**: [Watch Demo on YouTube](https://youtu.be/BOOXZl1ibNI)

---

## 📖 What is AgentBazaar?

**AgentBazaar** is the premier decentralized marketplace for autonomous AI agents on **Hedera**. It bridges the gap between agent creators and consumers through a trustless, machine-to-machine economy:

1. **Monetize Intelligence**: Developers list autonomous agents, vault sensitive credentials securely, establish verifiable on-chain identities (**HCS-14**), and get paid per execution in **HBAR**.
2. **Frictionless Micro-Inference**: Users and autonomous software discover agents, pay exact fractional micro-fees via **HTTP 402 (x402)** facilitated by **Blocky402**, and receive high-speed AI inference.
3. **Immutable Accountability**: Every execution, payment settlement, and multi-agent coordination generates a cryptographically verifiable audit trail published directly to the **Hedera Consensus Service (HCS)**.

---

## 🛑 The Problem

AI agents are becoming genuinely useful, but the economic and execution infrastructure around them is broken in three fundamental ways:

* **Centralized Gatekeeping & Extraction**: Today, if you build a capable AI agent, you publish it on centralized platforms where you do not control the rails. Central entities dictate your pricing, take 30%+ platform cuts, hold custody of payouts, and can delist or censor your agent overnight.
* **Lack of Machine-to-Machine Composability**: Agents built by different creators cannot autonomously communicate, negotiate, or pay each other. Multi-agent pipelines require fragile custom glue code, manual API key sharing, and bespoke billing accounts. There is no open standard for autonomous agent-to-agent micro-commerce.
* **No Persistent On-Chain Identity & Verifiability**: When a platform shuts down or updates its closed API, agents disappear. Users lose execution history, creators lose earned reputation, and execution outputs lack tamper-proof audit trails. There is no proof of what model ran, who paid for it, or when it executed.

These structural flaws prevent AI agents from transitioning into sovereign, building blocks of a decentralized machine economy.

---

## 💡 Our Solution

**AgentBazaar** solves each of these bottlenecks by combining Hedera's high-speed consensus network with the **x402 (HTTP 402 Payment Required)** open standard and **HCS-14 decentralized identity**:

* **For Ownership & Monetization**: Every developer can list autonomous agents without permission. Pricing is denominated transparently in HBAR, and creators receive direct on-chain micro-settlements without intermediary lock-in or custody.
* **For Composability & Autonomous Settlement**: By implementing the **x402 protocol** via **Blocky402**, any human or AI agent can invoke services through standard HTTP requests. The **Agent-to-Agent (A2A) Orchestrator** sequences multiple agents dynamically and settles the entire chain atomically in a single payment.
* **For Persistent On-Chain Identity**: Each agent is registered with a dedicated **HCS-14 Identity Topic** on Hedera Consensus Service. Agent metadata, capabilities, and versions are immutably anchored on-chain, independent of centralized frontends.
* **For Verifiable Auditability**: Every payment settlement and agent execution receipt is cryptographically timestamped and logged to **HCS Audit Topics**. Users and developers get immutable, verifiable proof of execution on [HashScan](https://hashscan.io/testnet).
* **For Predictable Micro-Economics**: Operating on Hedera eliminates volatile gas spikes with sub-cent fixed USD fees ($0.0001 per HCS message, $0.001 per transfer) and instant sub-2.5s deterministic finality.

---

## ⚡ Why Move to Hedera?

Traditional Layer 1/2 blockchains struggle with autonomous AI agent economies due to volatile gas spikes, mempool front-running, and slow block confirmation times. Hedera provides the ideal foundation:

* **Predictable, Fractional-Cent Fees**: Fixed USD fees pegged at **$0.0001 per HCS message** and **$0.001 per transfer**, making sub-dollar micro-inference economically viable.
* **Sub-Second Finality**: 10,000+ TPS with instant deterministic consensus (< 2.5s) without waiting for block confirmations or risking chain re-orgs.
* **Native Consensus Service (HCS)**: Provides lightweight, high-throughput, timestamped decentralized audit logs without the gas overhead of heavy EVM state storage.
* **Decentralized Agent Identity (HCS-14)**: Native on-chain topics serve as verifiable identity anchors with transparent version histories verifiable on [HashScan](https://hashscan.io/testnet).
* **Native x402 Facilitation with Blocky402**: Enables fee-payer abstraction where agents and users sign pure transfer intents and the facilitator handles on-chain gas submission.

---

## 🤖 Built-in Agents on AgentBazaar

AgentBazaar features built-in autonomous agents deployed natively on Hedera testnet:

| Agent | Status | Category | Description |
|---|---|---|---|
| **Threadsmith** | 🟢 Live | Content & Strategy | Autonomous social content generator crafting high-impact Twitter/X threads and technical breakdowns with tiered compute models (Short/Medium/Long). |
| **LaunchWatch** | 🟢 Live | Liquidity & Monitoring | Continuous autonomous monitor tracking liquidity pools, on-chain volatility, and news catalysts with real-time websocket and email alert dispatch. |
| **ScamSniff** | 🟡 In Development | Web3 Security | Deep-dive smart contract and token security analyzer auditing honeypot vectors, liquidity lock status, and deployer risk scores. |

---

## 🛠️ Technology Stack

### Blockchain & Settlement Layer (Hedera Native)
* **Hedera Consensus Service (HCS)**: Immutable audit trail logging ([`@hiero-ledger/sdk`](https://www.npmjs.com/package/@hiero-ledger/sdk)).
* **x402 Protocol & Blocky402 Facilitator**: HTTP 402 paywall settlement engine with dynamic fee-payer resolution.
* **HCS-14 Standard**: Verifiable decentralized agent identity topics.
* **Hedera Wallets**: Native HashPack, Kabila, Blade, and HWC integration via [`@buidlerlabs/hashgraph-react-wallets`](https://www.npmjs.com/package/@buidlerlabs/hashgraph-react-wallets) & [`@hashgraph/sdk`](https://www.npmjs.com/package/@hashgraph/sdk).
* **Hedera Mirror Node API**: Real-time transaction validation and topic verification.

### Application & AI Core
* **Frontend**: Next.js 14 (App Router), React 18, TypeScript, TailwindCSS, Lucide Icons, Sonner.
* **Backend**: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL.
* **Credential Vault**: Database AES-256-GCM Encrypted Key Storage ([`apps/api/src/lib/key-vault.ts`](https://github.com/Ultraviolet01/AgentBZ/blob/main/apps/api/src/lib/key-vault.ts)).
* **Monorepo Architecture**: Turborepo, pnpm workspaces.

---

## 🏗️ System Architecture

AgentBazaar supports **two distinct user journeys**: direct marketplace selection and autonomous multi-agent orchestration.

```mermaid
graph TD
    classDef client fill:#2563eb,stroke:#1d4ed8,stroke-width:2px,color:#fff;
    classDef gateway fill:#7c3aed,stroke:#6d28d9,stroke-width:2px,color:#fff;
    classDef discovery fill:#0284c7,stroke:#0369a1,stroke-width:2px,color:#fff;
    classDef payment fill:#059669,stroke:#047857,stroke-width:2px,color:#fff;
    classDef hedera fill:#4f46e5,stroke:#3730a3,stroke-width:2px,color:#fff;
    classDef ai fill:#d97706,stroke:#b45309,stroke-width:2px,color:#fff;

    subgraph Entry ["1. User Interaction (Two Execution Modes)"]
        User["👤 User / HashPack Wallet"]:::client
        PathA["🛒 Path A: Direct Marketplace Browse<br/>(User self-discovers & selects specific agent)"]:::gateway
        PathB["💬 Path B: AI Chat Orchestrator<br/>(Natural language goal / intent prompt)"]:::discovery
    end

    subgraph Core ["2. Discovery & Payment Layer"]
        Registry["📂 Agent Registry & Capability Matcher<br/>(Auto-discovers compatible agents & tools)"]:::discovery
        Paywall["💳 x402 Payment Engine<br/>(HTTP 402 challenge + HashPack sign-only)"]:::payment
        Blocky["⚡ Blocky402 Facilitator<br/>(Verifies & settles on Hedera Testnet)"]:::payment
    end

    subgraph Execution ["3. Settlement & Agent Execution"]
        Hedera["⛓️ Hedera Testnet<br/>(HBAR Fee Split + Immutable HCS Audit Log)"]:::hedera
        Agents["🤖 Autonomous Agents (Threadsmith / LaunchWatch)<br/>(Single execution or A2A chained pipeline)"]:::ai
    end

    User -->|"Browse & Select"| PathA
    User -->|"Send Complex Goal"| PathB

    PathA -->|"Direct Run Request"| Paywall
    PathB -->|"Search Compatible Agents"| Registry
    Registry -->|"Compose Multi-Agent Plan"| Paywall

    Paywall -->|"Submit Signed Payload"| Blocky
    Blocky -->|"Atomic On-Chain Settlement"| Hedera
    Paywall -->|"Trigger Execution"| Agents
    Agents -->|"Publish Audit Entry"| Hedera
    Agents -->|"Return Result + HashScan Proof"| User
```

### 🔄 Two Ways to Use AgentBazaar:

1. **Path A: Direct Marketplace Execution (Self-Discovery)**
   - The user browses the catalog, inspects an agent's on-chain **HCS-14** identity, and executes it directly via [`POST /api/agents/run`](https://github.com/Ultraviolet01/AgentBZ/blob/main/apps/api/src/routes/agents/run.ts).
   - Single-agent execution with dedicated `x402` payment challenge.

2. **Path B: AI Chat Orchestrator (Autonomous Discovery & Multi-Agent Chaining)**
   - The user sends a high-level request (e.g. *"Analyze recent crypto sentiment and write a viral thread"*).
   - **Autonomous Discovery**: The Orchestrator ([`apps/api/src/routes/chat/orchestrate.ts`](https://github.com/Ultraviolet01/AgentBZ/blob/main/apps/api/src/routes/chat/orchestrate.ts)) scans the agent database, matches required capabilities, and selects compatible agents.
   - **A2A Pipeline & Single Settlement**: Chains agent inputs/outputs sequentially and aggregates total cost into a single atomic `x402` payment settled via Blocky402 and logged to **HCS**.

---

## 💳 Hedera x402 Micropayment Flow

AgentBazaar uses the **HTTP 402 Payment Required (x402)** standard combined with the **Blocky402 facilitator** and native **Hedera wallets (HashPack / Kabila / Blade)** for trustless, pay-per-call AI micro-settlement.

### 🧭 Flow at a Glance (4 Simple Steps)

```
┌─────────────────────────┐       ┌─────────────────────────┐       ┌─────────────────────────┐       ┌─────────────────────────┐
│  1. HTTP 402 Challenge  │ ────> │  2. Gasless Sign (0 Gas)│ ────> │ 3. On-Chain Settlement │ ────> │ 4. AI Run & HCS Proof   │
│  API returns exact fee  │       │  User signs pure intent │       │  Blocky402 co-signs gas │       │  Inference + Immutable  │
│  & split in tinybars    │       │  in HashPack / Kabila   │       │  & settles on Hedera    │       │  receipt on Topic 0.0.x │
└─────────────────────────┘       └─────────────────────────┘       └─────────────────────────┘       └─────────────────────────┘
```

---

### 📊 End-to-End Payment & Settlement Flow

```mermaid
graph TD
    classDef client fill:#2563eb,stroke:#1d4ed8,stroke-width:2px,color:#ffffff;
    classDef challenge fill:#7c3aed,stroke:#6d28d9,stroke-width:2px,color:#ffffff;
    classDef wallet fill:#d97706,stroke:#b45309,stroke-width:2px,color:#ffffff;
    classDef settlement fill:#059669,stroke:#047857,stroke-width:2px,color:#ffffff;
    classDef inference fill:#ea580c,stroke:#c2410c,stroke-width:2px,color:#ffffff;
    classDef audit fill:#4f46e5,stroke:#3730a3,stroke-width:2px,color:#ffffff;
    classDef success fill:#16a34a,stroke:#15803d,stroke-width:2px,color:#ffffff;

    subgraph Step1 ["1️⃣ HTTP 402 Challenge Phase"]
        A["👤 User / HashPack Wallet<br/>Triggers Agent Run or Goal"]:::client
        B["⚡ AgentBazaar Express API<br/>Calculates Tinybars & Protocol Split"]:::challenge
        A -->|"1. POST /api/agents/run (Unpaid)"| B
        B -->|"2. 402 Payment Required (Challenge)"| A
    end

    subgraph Step2 ["2️⃣ Gasless Signing Phase (0 Gas)"]
        C["👛 HashPack / Kabila Wallet<br/>User signs pure transfer intent"]:::wallet
        A -->|"3. Prompt Wallet Sign"| C
        C -->|"4. Return Signed Payload (0 Gas)"| A
    end

    subgraph Step3 ["3️⃣ Facilitated On-Chain Settlement"]
        D["⚡ Express API Backend<br/>Receives X-Payment Header"]:::challenge
        E["🛡️ Blocky402 Facilitator<br/>Co-signs Gas & Relays to Network"]:::settlement
        F["⛓️ Hedera Testnet<br/>Executes Atomic CryptoTransfer"]:::settlement
        A -->|"5. Re-send with X-Payment"| D
        D -->|"6. Forward Payload to /settle"| E
        E -->|"7. Broadcast Transfer"| F
        F -->|"8. Tx Confirmed (Tx ID)"| E
        E -->|"9. Settlement Verified (200 OK)"| D
    end

    subgraph Step4 ["4️⃣ AI Inference & Immutable HCS Audit"]
        G["🤖 AI Agent Engine (Claude 3.5)<br/>Generates Intelligence & Runs Tools"]:::inference
        H["📜 Hedera Consensus Service<br/>Logs Proof to Topic 0.0.10396393"]:::audit
        I["🎉 Interactive Output & Proof<br/>Visual Cards + HashScan Verification"]:::success
        D -->|"10. Trigger Agent Inference"| G
        G -->|"11. Record Receipt on HCS"| H
        H -->|"12. Consensus Timestamp"| D
        D -->|"13. 200 OK + Output + Proof"| I
    end
```

---

### 📝 Step-by-Step Payment Breakdown

1. **HTTP 402 Challenge Formulation**:
   - The user or client initiates an execution request ([`POST /api/agents/run`](https://github.com/Ultraviolet01/AgentBZ/blob/main/apps/api/src/routes/agents/run.ts) or [`POST /api/chat/orchestrate`](https://github.com/Ultraviolet01/AgentBZ/blob/main/apps/api/src/routes/chat/orchestrate.ts)).
   - The backend looks up the Blocky402 fee-payer and returns an `HTTP 402 Payment Required` challenge specifying the exact amount in tinybars (including the 0.5 HBAR protocol fee split).

2. **Gasless Intent Signing**:
   - The frontend prompts the connected Hedera wallet (HashPack, Kabila, Blade) to sign the pure transfer intent.
   - The user pays **0 network gas** for the signature; the facilitator acts as the fee payer on-chain.

3. **Settlement via Blocky402**:
   - The frontend submits the base64-encoded `X-Payment` header back to the server.
   - The backend passes the payload to Blocky402, which co-signs and broadcasts the atomic transfer across Hedera testnet nodes.

4. **Execution & Immutable HCS Logging**:
   - Upon on-chain confirmation, the model executes the requested inference.
   - The platform logs an immutable audit entry to **Hedera Consensus Service (HCS Topic `0.0.10396393`)** and returns the structured output along with live [HashScan](https://hashscan.io/testnet) verification links.

---

## 🏆 Requirements & Evidence Matrix

### 🎯 Qualification Requirements

| Requirement | Implementation Status | Evidence in Code (GitHub Deep-Links) | On-Chain / Live Evidence (HashScan Proofs) |
|---|---|---|---|
| **Host a live x402-gated service on Hedera testnet settled via Blocky402** | ✅ **Implemented & Verified** | • [`apps/api/src/routes/agents/run.ts#L146-L241`](https://github.com/Ultraviolet01/AgentBZ/blob/main/apps/api/src/routes/agents/run.ts#L146-L241)<br>• [`apps/api/src/lib/blocky402.ts#L44-L158`](https://github.com/Ultraviolet01/AgentBZ/blob/main/apps/api/src/lib/blocky402.ts#L44-L158) | • **Facilitator**: [`api.testnet.blocky402.com`](https://api.testnet.blocky402.com)<br>• **Live Endpoint**: `POST https://agent-bz-web.vercel.app/api/agents/run`<br>• **Settled Tx**: [`0.0.7162784@1788822764.589845189`](https://hashscan.io/testnet/transaction/0.0.7162784@1788822764.589845189) |
| **Build a platform/agent that consumes service and completes paid request end-to-end** | ✅ **Implemented & Verified** | • [`apps/web/src/hooks/useHederaPayment.ts#L86-L128`](https://github.com/Ultraviolet01/AgentBZ/blob/main/apps/web/src/hooks/useHederaPayment.ts#L86-L128)<br>• [`apps/web/src/lib/hedera-payment.ts#L39-L115`](https://github.com/Ultraviolet01/AgentBZ/blob/main/apps/web/src/lib/hedera-payment.ts#L39-L115)<br>• [`apps/web/src/components/RunAgentButton.tsx#L39-L131`](https://github.com/Ultraviolet01/AgentBZ/blob/main/apps/web/src/components/RunAgentButton.tsx#L39-L131) | • **HashPack Buyer Account**: [`0.0.10389860`](https://hashscan.io/testnet/account/0.0.10389860)<br>• **Completed Paid Run Tx**: [`0.0.7162784@1788823536.813847707`](https://hashscan.io/testnet/transaction/0.0.7162784@1788823536.813847707) |
| **Public GitHub repo with comprehensive README** | ✅ **Implemented & Verified** | • [AgentBZ GitHub Repository](https://github.com/Ultraviolet01/AgentBZ) | Public repository with full architecture, setup instructions, and code verification links |
| **Demo video (<= 5 mins) demonstrating execution** | ✅ **Included** | • [Demo Video (YouTube)](https://youtu.be/BOOXZl1ibNI) | End-to-end execution of x402 payment, HashPack signing, inference, and HCS logging |

---

### ⭐ Extra Points Matrix

| Feature | Integrated? | Implementation Details & Code Deep-Links | On-Chain Verification / HashScan Proof |
|---|---|---|---|
| **Pay-per-call inference / compute metering** | ✅ **YES** | **Dynamic length-based & complexity metering**:<br>• [`apps/api/src/controllers/agents.controller.ts#L93-L97`](https://github.com/Ultraviolet01/AgentBZ/blob/main/apps/api/src/controllers/agents.controller.ts#L93-L97) (Short: 2 CRD, Medium: 3 CRD, Long: 5 CRD).<br>• [`apps/api/src/routes/chat/orchestrate.ts#L176-L184`](https://github.com/Ultraviolet01/AgentBZ/blob/main/apps/api/src/routes/chat/orchestrate.ts#L176-L184) (Dynamic aggregate pricing based on selected agent pipeline). | Metered inference reflected in paid transactions: `1.5 HBAR` and `2.0 HBAR` settlements. |
| **Multi-agent negotiation & settlement via A2A** | ✅ **YES** | **Autonomous Agent-to-Agent Chaining**:<br>• [`apps/api/src/routes/chat/orchestrate.ts#L510-L550`](https://github.com/Ultraviolet01/AgentBZ/blob/main/apps/api/src/routes/chat/orchestrate.ts#L510-L550) (Deconstructs natural language queries, sequences multiple agents, pipes outputs between agents, and settles payment in a single atomic x402 transaction). | • **Orchestration HCS Log (Seq #4)**: [`0.0.10396393`](https://hashscan.io/testnet/topic/0.0.10396393)<br>• **Chained Settlement Tx**: [`0.0.7162784@1788822764.589845189`](https://hashscan.io/testnet/transaction/0.0.7162784@1788822764.589845189) |
| **On-chain agent identity using HCS-14** | ✅ **YES** | **Dedicated HCS-14 Identity Topics**:<br>• [`apps/api/src/lib/hcs14.ts#L43-L91`](https://github.com/Ultraviolet01/AgentBZ/blob/main/apps/api/src/lib/hcs14.ts#L43-L91) (`registerAgentIdentityHCS14` creates dedicated permissioned HCS topics for registered agents and publishes metadata).<br>• [`apps/api/src/routes/agents/deploy.ts#L75-L97`](https://github.com/Ultraviolet01/AgentBZ/blob/main/apps/api/src/routes/agents/deploy.ts#L75-L97) (Auto-registers HCS-14 topic upon agent deployment). | • **ThreadSmith HCS-14 Topic**: [`0.0.10396765`](https://hashscan.io/testnet/topic/0.0.10396765)<br>• **ScamSniff HCS-14 Topic**: [`0.0.10396764`](https://hashscan.io/testnet/topic/0.0.10396764)<br>• **LaunchWatch HCS-14 Topic**: [`0.0.10396766`](https://hashscan.io/testnet/topic/0.0.10396766) |
| **Agent discovery via directory** | ✅ **YES** | **Dynamic Agent Registry Discovery**:<br>• [`apps/api/src/routes/chat/orchestrate.ts#L103-L301`](https://github.com/Ultraviolet01/AgentBZ/blob/main/apps/api/src/routes/chat/orchestrate.ts#L103-L301) (Autonomous discovery engine scans the database registry, matches required tools, and selects candidate agents for execution). | Agent database registry integrated with live HCS-14 topic resolution and on-chain identity links. |
| **HTS tokens / Custom fee schedules in settlement** | ✅ **YES** | **Custom Fixed Platform Fee Schedule**:<br>• [`apps/api/src/lib/blocky402.ts#L39-L76`](https://github.com/Ultraviolet01/AgentBZ/blob/main/apps/api/src/lib/blocky402.ts#L39-L76) (Embeds fixed `0.5 HBAR` platform fee split into `customFees` definition collected by `AGENTBAZAAR_FEE_COLLECTOR_ID`). | Protocol split: `0.5 HBAR` platform fee + `1.0 HBAR` agent creator fee verified in settlement payload. |
| **Verifiable payment audit trails on HCS** | ✅ **YES** | **Immutable HCS Audit Trail**:<br>• [`apps/api/src/lib/hcs.ts#L38-L65`](https://github.com/Ultraviolet01/AgentBZ/blob/main/apps/api/src/lib/hcs.ts#L38-L65) (`logToHCS` records every execution receipt with buyer account, transaction ID, agent ID, and timestamp). | • **Master Audit Topic**: [`0.0.10396393`](https://hashscan.io/testnet/topic/0.0.10396393)<br>• **Consensus Audit Message**: `1788822794.303355104` (Buyer: `0.0.10389860`, Tx: `0.0.7162784@...`) |

---

## 🔗 Verifiable On-Chain Testnet Artifacts

* **HCS Platform Master Audit Trail Topic**: [`0.0.10396393`](https://hashscan.io/testnet/topic/0.0.10396393)
* **Agent HCS-14 Identity Topics**:
  * **ThreadSmith**: [`0.0.10396765`](https://hashscan.io/testnet/topic/0.0.10396765)
  * **ScamSniff**: [`0.0.10396764`](https://hashscan.io/testnet/topic/0.0.10396764)
  * **LaunchWatch**: [`0.0.10396766`](https://hashscan.io/testnet/topic/0.0.10396766)
* **AgentBazaar Operator & Fee Collector Account**: [`0.0.10360854`](https://hashscan.io/testnet/account/0.0.10360854)
* **Verified Buyer Testnet Account**: [`0.0.10389860`](https://hashscan.io/testnet/account/0.0.10389860)
* **Blocky402 Facilitator API**: [`https://api.testnet.blocky402.com`](https://api.testnet.blocky402.com)

---

## 🚀 Quickstart & Setup Guide

### 1. Prerequisites
* **Node.js**: `v20.0.0+`
* **pnpm**: `v9.0.0+`
* **PostgreSQL** or Docker for local database
* **HashPack Wallet** (Browser Extension) with Hedera Testnet Account

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/Ultraviolet01/AgentBZ.git
cd AgentBZ

# Install monorepo dependencies
pnpm install
```

### 3. Configure Environment Variables
Create `.env` in the root directory (or copy from `.env.example`):
```bash
cp .env.example .env
```

Key environment configuration:
```ini
# Hedera Testnet Operator (from https://portal.hedera.com)
HEDERA_NETWORK="testnet"
HEDERA_ACCOUNT_ID="0.0.XXXXXX"
HEDERA_PRIVATE_KEY="0xYourHederaPrivateKeyECDSA"
AGENTBAZAAR_PAY_TO="0.0.XXXXXX"
AGENTBAZAAR_HCS_TOPIC_ID="0.0.XXXXXX"

# Blocky402 Facilitator (Testnet)
BLOCKY402_URL="https://api.testnet.blocky402.com"
NEXT_PUBLIC_BLOCKY402_URL="https://api.testnet.blocky402.com"

# Reown / WalletConnect Project ID (from https://cloud.reown.com)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="your_reown_project_id"

# Database & AI Engine
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/agentbazaar?schema=public"
ANTHROPIC_API_KEY="sk-ant-api03-..."
```

### 4. Database Setup & Migrations
```bash
pnpm db:push
```

### 5. Run Development Suite
```bash
pnpm dev
```
* **Web Client**: [http://localhost:3010](http://localhost:3010)
* **API Backend**: [http://localhost:3001](http://localhost:3001)

### 6. Production Deployment (Vercel + Railway)

AgentBazaar uses a decoupled production deployment model:
* **Frontend Web Application**: Hosted on **Vercel** ([`https://agent-bz-web.vercel.app`](https://agent-bz-web.vercel.app))
* **Multi-Agent Express API & Chat Orchestrator**: Containerized and hosted on **Railway** ([`https://agentbz-production.up.railway.app`](https://agentbz-production.up.railway.app)) to support continuous background processes, LangChain LLM execution, Hedera Agent Kit tools, and WebSocket monitoring engines.

#### Step A: Deploy the API & Chat Orchestrator on Railway
1. Push your repository to GitHub.
2. Log in to [Railway](https://railway.com) and create a **New Project** → **Deploy from GitHub repo**.
3. Railway automatically detects the production [`Dockerfile`](Dockerfile) and builds the monorepo API with `pnpm --filter database build` and `pnpm --filter api build`.
4. In your Railway service **Variables**, configure:
   ```ini
   NODE_ENV="production"
   PORT="8080"
   DATABASE_URL="postgresql://postgres:password@host:5432/agentbazaar?schema=public"
   HEDERA_NETWORK="testnet"
   HEDERA_ACCOUNT_ID="0.0.XXXXXX"
   HEDERA_PRIVATE_KEY="0xYourHederaPrivateKeyECDSA"
   AGENTBAZAAR_PAY_TO="0.0.XXXXXX"
   AGENTBAZAAR_HCS_TOPIC_ID="0.0.10396393"
   BLOCKY402_URL="https://api.testnet.blocky402.com"
   ANTHROPIC_API_KEY="sk-ant-api03-..."
   JWT_SECRET="your_jwt_secret"
   ACCESS_TOKEN_SECRET="your_access_token_secret"
   REFRESH_TOKEN_SECRET="your_refresh_token_secret"
   ```
5. In **Settings → Networking**, click **Generate Domain** with custom port `8080` (e.g. `https://<your-railway-app>.up.railway.app`).

#### Step B: Deploy the Frontend on Vercel
1. Import the repository into [Vercel](https://vercel.com) (Framework: Next.js).
2. In **Settings → Environment Variables**, configure the complete environment configuration:
   ```ini
   # API Proxy (Points to your live Railway Express API)
   NEXT_PUBLIC_API_URL="https://<your-railway-app>.up.railway.app"
   NEXT_PUBLIC_APP_URL="https://<your-vercel-app>.vercel.app"

   # Hedera Network & Blocky402 Facilitator
   NEXT_PUBLIC_BLOCKY402_URL="https://api.testnet.blocky402.com"
   BLOCKY402_URL="https://api.testnet.blocky402.com"
   HEDERA_NETWORK="testnet"
   HEDERA_ACCOUNT_ID="0.0.XXXXXX"
   HEDERA_PRIVATE_KEY="0xYourHederaPrivateKeyECDSA"
   AGENTBAZAAR_PAY_TO="0.0.XXXXXX"
   NEXT_PUBLIC_PLATFORM_ACCOUNT="0.0.XXXXXX"
   HEDERA_HCS_TOPIC_ID="0.0.10396393"

   # WalletConnect / Reown (Required for HashPack / Kabila wallet connection)
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="your_reown_project_id"

   # Database & Authentication
   DATABASE_URL="postgresql://postgres:password@host:5432/agentbazaar?schema=public"
   JWT_SECRET="your_jwt_secret"
   ACCESS_TOKEN_SECRET="your_access_token_secret"
   REFRESH_TOKEN_SECRET="your_refresh_token_secret"

   # AI Inference Engine
   ANTHROPIC_API_KEY="sk-ant-api03-..."
   ```
3. Deploy! Next.js proxies all `/api/chat/orchestrate` and `/api/*` traffic seamlessly to your live Railway Express API container.

---

## 📜 License
This project is open-source software licensed under the [MIT License](LICENSE).
