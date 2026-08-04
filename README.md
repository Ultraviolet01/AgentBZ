# AgentBazaar: The Decentralized Marketplace for Autonomous AI

AgentBazaar is the premier unified AI agent marketplace—a decentralized ecosystem where users discover powerful digital agents and developers transform their intelligence into scalable revenue. Powered by **KeeperHub** for payments and **Story Protocol CDR** for secure API key storage at listing time, it provides a trustless environment for deploying, monetizing, and scaling AI agents with auditable execution and encrypted credential management.

## 🤖 Built Agents

| Agent | Status | Description |
|---|---|---|
| **Threadsmith** | ✅ Live | An AI-powered content generation agent that crafts high-quality Twitter/X threads, LinkedIn posts, and social copy from a simple topic or URL — supporting multiple tones, quality tiers, and project memory for consistent brand voice. |
| **LaunchWatch** | ✅ Live | A continuous token and project monitoring agent that tracks FDV milestones, on-chain activity, sentiment shifts, and crypto news — firing automated email alerts the moment a configured threshold or spike is detected. |
| **ScamSniff** | 🚧 In Development | A Web3 security analysis agent that audits smart contracts, wallet histories, and token metadata to surface rug-pull indicators, honeypot patterns, and suspicious deployer behaviour before a user commits funds. |

## 🏗️ System Architecture

```mermaid
graph TD
    subgraph Client["Client & Frontend"]
        User[User Browser]
    end

    subgraph Backend["Core Backend"]
        NextJS[Next.js Server]
        DB[(Database)]
    end

    subgraph PaymentLayer["Payment Layer"]
        KH[KeeperHub / x402]
        Base[Base Blockchain]
    end

    subgraph Vault["API Key Vault"]
        CDR[Story Protocol CDR]
    end

    LLM[OpenAI / Anthropic]

    %% Deploy flow — vault keys at listing time
    NextJS -- "1. Vault API keys at listing" --> CDR
    CDR -- "2. Return keysVaultUuid" --> DB

    %% Run flow — payment MUST be confirmed before anything else
    User -- "3. Run Request" --> NextJS
    NextJS -- "4. Verify & settle payment" --> KH
    KH -- "5. Settle on-chain" --> Base
    KH -- "6. txHash confirmed" --> NextJS
    NextJS -- "7. Retrieve keys (post-payment only)" --> CDR
    CDR -- "8. Decrypted API keys (in-memory)" --> NextJS
    NextJS -- "9. Execute agent" --> LLM
    LLM -- "10. Output" --> NextJS
    NextJS -- "11. Result + txHash" --> User
```

### Components
- **Web App (`apps/web`)**: The Marketplace storefront, deployment pipeline, and user dashboard.
- **API (`apps/api`)**: Core marketplace orchestration engine.
- **Execution Worker (`packages/tee-worker`)**: Secure execution service that uses CDR-retrieved API keys in memory.
- **KeeperHub Payments**: `@x402/fetch` wraps every workflow execution call. HTTP 402 challenges are intercepted and auto-paid via x402 (Base USDC) or MPP (Tempo USDC.e). The platform's Turnkey-backed wallet handles signing — no raw private key lands on disk.
- **Story Protocol CDR Integration**: Utilizes `@piplabs/cdr-sdk` server-side in two moments: (1) **at deploy time** to vault the developer's API keys onto decentralized IPFS storage, and (2) **at run time** to retrieve those keys using the platform wallet after the buyer's x402 payment is confirmed. Keys are never stored in the database.

## 💸 Payment & Treasury Model

| Component | Detail | Description |
|---|---|---|
| **Flat Pricing** | **$0.10 USDC per run** | Standardized pricing across all marketplace agents and deployment forms. |
| **Treasury Wallet** | `TREASURY_WALLET_ADDRESS` | Platform treasury address that automatically receives 100% of execution fees. |
| **Payer Wallet** | `KEEPERHUB_PAYER_WALLET` | Platform agentic wallet managed via Turnkey proxy to auto-sign x402 payment challenges. |
| **Direct Buyer Payments** | Web3 Connected Wallets | Connected buyers sign $0.10 USDC transfers directly on Base via RainbowKit/wagmi to the treasury. |
| **x402 Protocol** | EIP-3009 on Base Mainnet | Standardized micropayments settled on-chain with auditable transaction hashes (`x-payment-tx-hash`). |

## 🎨 IP Protection — Story Protocol CDR

| Action | Timing | What it does |
|---|---|---|
| **Deploy** | Listing time | Platform vaults developer API keys encrypted in CDR |
| **Run** | After x402 payment | Platform wallet retrieves keys from CDR (in-memory only) |

### How KeeperHub Works in AgentBazaar

KeeperHub is the **payment enforcement layer** — every agent execution is gated behind a confirmed on-chain payment. No payment confirmation from KeeperHub means no keys retrieved, no LLM call made, no response returned. It is the single source of truth for whether a run is authorised.

#### Role Summary

| Responsibility | Detail |
|---|---|
| **Payment verification** | Intercepts every `/api/agents/run` call via the x402 protocol before any execution logic runs |
| **x402 challenge-response** | Issues HTTP 402 challenges; the platform's Turnkey-backed payer wallet auto-signs and resolves them |
| **On-chain settlement** | Settles $0.10 USDC on **Base Mainnet** to `TREASURY_WALLET_ADDRESS` using EIP-3009 transfer authorisation |
| **txHash delivery** | Returns a public, auditable `x-payment-tx-hash` on confirmation — this is the gate that unlocks CDR and LLM access |
| **Agentic wallet management** | The `KEEPERHUB_PAYER_WALLET` is a Turnkey-proxied wallet; no raw private key is stored on disk or in env |

#### x402 Payment Cycle — Detailed Flow

```mermaid
sequenceDiagram
    autonumber
    actor Buyer as Buyer
    participant App as Web Frontend
    participant Server as "Next.js Server<br/>(/api/agents/run)"
    participant KH as KeeperHub
    participant Turnkey as Turnkey Enclave<br/>(Payer Wallet)
    participant Base as Base Blockchain
    participant CDR as Story Protocol CDR
    participant LLM as OpenAI / Anthropic

    Buyer->>App: Click "Run Agent" — submits input
    App->>Server: POST /api/agents/run {agentSlug, input}

    Note over Server: executeAgentViaKeeperHub() called
    Server->>KH: HTTP request with x402 fetch wrapper

    KH-->>Server: HTTP 402 Payment Required<br/>+ payment details (amount, currency, network, recipient)
    Note over Server: x402 challenge received —<br/>resolve with payer wallet

    Server->>Turnkey: Sign EIP-3009 transfer authorisation<br/>($0.10 USDC → TREASURY_WALLET_ADDRESS)
    Turnkey-->>Server: Signed authorisation (no key leaves enclave)

    Server->>KH: Retry request with x-payment header<br/>(signed EIP-3009 authorisation)
    KH->>Base: Broadcast USDC transfer on Base Mainnet
    Base-->>KH: Transaction mined — txHash
    KH-->>Server: HTTP 200 + x-payment-tx-hash confirmed

    Note over Server: ✅ Payment gate passed —<br/>execution authorised

    Server->>CDR: retrieveAgentKeys(keysVaultUuid)
    CDR-->>Server: Decrypted API keys (in-memory only)

    Server->>LLM: Execute agent prompt with retrieved keys
    LLM-->>Server: Agent output

    Note over Server: Keys discarded from memory immediately
    Server-->>App: Result + txHash (auditable on Base explorer)
    App-->>Buyer: Agent response displayed
```

#### 1. Developer Agent Listing (Deploy Flow)

> KeeperHub is **not involved** at deploy time. This step only vaults the developer's API keys into Story Protocol CDR for later retrieval.

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Developer
    participant App as Web Frontend
    participant Server as Next.js Server
    participant CDR as Story Protocol CDR
    participant DB as Postgres Database

    Dev->>App: Input API Credentials (deploy form)
    App->>Server: POST /api/agents/deploy
    Note over Server: Platform wallet initialised<br/>(AGENTBAZAAR_PLATFORM_KEY)
    Server->>CDR: uploadFile() — encrypt & store API keys
    CDR-->>Server: Return keysVaultUuid
    Server->>DB: Save metadata + keysVaultUuid (NOT the keys)
    Server-->>App: Success
```

#### Key Guarantees

* **Hard payment gate**: `executeAgentViaKeeperHub()` is called before any CDR retrieval or LLM invocation. A failed or absent payment means the function throws — no execution path bypasses it.
* **No buyer wallet required**: The platform's Turnkey-backed `KEEPERHUB_PAYER_WALLET` handles all signing. Buyers trigger runs via the UI; they do not need a Web3 wallet (unless opting into direct on-chain payment).
* **Auditable by design**: Every successful run produces a public Base Mainnet `txHash` returned in `x-payment-tx-hash`, verifiable on [x402scan](https://x402scan.com) and the Base block explorer.
* **Turnkey enclave security**: The payer wallet's private key never leaves the Turnkey secure enclave — it is never written to disk, logged, or exposed in environment variables.
* **Zero Database Exposure**: Only `cdrKeysVaultUuid` is stored in the DB — no plaintext API keys ever touch persistent storage.
* **In-memory only**: Retrieved CDR keys exist solely for the duration of a single execution and are garbage-collected immediately after the LLM call completes.


## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- pnpm 9+
- Docker (for PostgreSQL)

### Setup & Local Deployment
1. **Clone the repository** and install dependencies:
   ```bash
   pnpm install
   ```
2. **Environment Configuration**:
   ```bash
   cp .env.example .env
   ```
   Key variables:
   | Variable | Purpose |
   |---|---|
   | `TREASURY_WALLET_ADDRESS` | Platform treasury address receiving 100% of run fees |
   | `KEEPERHUB_PAYER_WALLET` | Platform agentic wallet used to sign x402 challenges |
   | `TREASURY_FEE_PERCENT` | Percentage split allocated to treasury (`100`) |
   | `AGENTBAZAAR_PLATFORM_KEY` | Platform wallet private key — used to vault/retrieve CDR keys |
   | `KEEPERHUB_API_KEY` | KeeperHub Bearer token — authenticates x402 payment calls |
   | `NEXT_PUBLIC_KEEPERHUB_BASE_URL` | KeeperHub base URL (`https://app.keeperhub.com`) |
   | `STORY_RPC` | Story Protocol RPC endpoint for CDR |
   | `CDR_WRITE_CONDITION` | CDR owner-write condition contract address |
   | `CDR_READ_CONDITION` | CDR license-read condition contract address |

3. **Start Infrastructure**:
   ```bash
   docker-compose up -d
   ```
4. **Initialize Database**:
   ```bash
   pnpm db:push
   ```
5. **Launch Development Suite**:
   ```bash
   pnpm dev
   ```
   - Web App: `http://localhost:3010`
   - API: `http://localhost:3001`

## 🌐 Mainnet Operations

AgentBazaar runs on **Base Mainnet** for payments via the x402 protocol.

- **Payment**: Settled in **USDC on Base** ($0.10 flat rate). Connected Web3 buyers sign direct transactions to Treasury; Web2 users are backed by the platform's KeeperHub agentic wallet.
- **Treasury Routing**: 100% of execution revenue is routed automatically to the designated platform treasury address (`TREASURY_WALLET_ADDRESS`).
- **Audit**: Every agent run produces a public, on-chain tx hash returned in `x-payment-tx-hash` and viewable on [x402scan](https://x402scan.com) and the Base block explorer.

## 🔐 Security & Privacy
- **API Keys**: Developer API keys are vaulted at listing time in **Story Protocol CDR** (decentralized, IPFS-backed storage) — never stored in plaintext in the DB. Retrieved server-side at run time using the platform wallet and discarded from memory after each execution.
- **Payments**: x402 payments use EIP-3009 pre-signed authorizations. The platform signing key lives in a **Turnkey secure enclave** — no private key ever lands on disk.
- **No buyer wallet required for CDR**: The x402 payment proof is the authorization. Buyers do not sign CDR vault access.
