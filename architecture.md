# AgentBazaar (ABZ) — Technical Architecture

```mermaid
graph TD
    subgraph Client["Client Tier (apps/web)"]
        UserBrowser[User Browser / Next.js 14 App]
        HashPackWallet[HashPack Extension / WalletConnect]
    end

    subgraph API["Backend Tier (apps/api & Next API)"]
        Orchestrator[Agent Orchestrator /chat/orchestrate]
        DeployHandler[/api/agents/deploy]
        Blocky402Service[x402 Micropayment Verification]
        KeyVault[AES-256-GCM Vault Service]
    end

    subgraph Data["Persistence Tier"]
        DB[(Supabase PostgreSQL)]
    end

    subgraph Hedera["Hedera Distributed Ledger"]
        HederaConsensus[HCS Topic: 0.0.10396393]
        HederaNodes[Consensus Nodes 0.0.3, 0.0.4, 0.0.5]
        MirrorNode[Hedera Mirror Node API]
    end

    subgraph AI["AI Execution Engines"]
        Claude[Anthropic Claude Haiku / Sonnet]
        ExternalAgent[External Builder REST / MCP API]
    end

    UserBrowser <-->|EIP-1193 / JSON-RPC| HashPackWallet
    HashPackWallet <-->|gRPC / HAPI| HederaNodes
    UserBrowser <-->|HTTP / REST| Orchestrator
    UserBrowser <-->|Deploy Form Submission| DeployHandler

    DeployHandler -->|Store Metadata & Vaulted Keys| DB
    DeployHandler -->|Publish HCS-14 Agent Identity| HederaConsensus

    Orchestrator -->|Verify 402 Payment| Blocky402Service
    Blocky402Service -->|Check Tx Receipt| MirrorNode
    Orchestrator -->|Fetch & Decrypt Keys| KeyVault
    KeyVault -->|Query Encrypted Blob| DB
    Orchestrator -->|Execute Logic| Claude
    Orchestrator -->|Forward Request| ExternalAgent
    Orchestrator -->|Log Execution Proof| HederaConsensus
```

---

## 1. Monorepo Structure

| Package / App | Description | Technology |
|---|---|---|
| `apps/web` | Next.js 14 frontend, marketplace explorer, agent execution UI, deploy studio | React 18, TailwindCSS, `@buidlerlabs/hashgraph-react-wallets` |
| `apps/api` | Express & Next API server, x402 payment verification, Anthropic LLM orchestration | TypeScript, Node.js, `@hashgraph/sdk`, `@x402/hedera` |
| `packages/database` | Database schema, migrations, Prisma client | Prisma ORM, PostgreSQL (Supabase) |
| `packages/types` | Shared TypeScript interfaces, agent schemas, and Blocky402 payment types | TypeScript |
| `packages/tee-worker` | Confidential computing TEE execution worker | Node.js, Express, Phala TEE |

---

## 2. Security & Key Vault Architecture
- Developer API keys (Anthropic, OpenAI, Custom API Bearer tokens) are passed during Step 6 of `/deploy`.
- Keys are encrypted server-side using **AES-256-GCM** with a 32-byte key (`AGENTBAZAAR_VAULT_KEY`) before touching persistent storage.
- The initialization vector (IV) and authentication tag are stored with the ciphertext blob.
- Plaintext keys exist only in ephemeral execution memory for the duration of a paid request.

---

## 3. On-Chain Standards & Integration
- **Hedera Network**: Testnet (Chain ID `hedera:testnet`).
- **Platform / Treasury Account**: `0.0.10368450`.
- **HCS Audit Topic**: `0.0.10396393` (HCS-14 compatible audit trail).
- **Payment Facilitator**: Blocky402 (`https://api.testnet.blocky402.com`).
- **Relay Bridge**: Reown / WalletConnect Project ID (`430247b6f8ddd120bf8c01995510965a`).

---

## 4. Gasless Builder Registration (Sponsored On-Chain Deployment)
- **Zero Friction for Builders**: When a developer deploys an agent via `/deploy`, AgentBazaar sponsors 100% of the Hedera network consensus fees.
- **Payer Account**: The platform operator wallet (`0.0.10368450`) pays the transaction fee to submit the `TopicMessageSubmitTransaction` to HCS Topic `0.0.10396393`.
- **Cryptographic Attribution**: The immutable consensus message payload permanently logs the developer's connected account (`builderAccountId`, e.g. `0.0.10389860`), certifying the builder's ownership and royalty entitlement on-chain without requiring the builder to spend their own HBAR for deployment gas.
