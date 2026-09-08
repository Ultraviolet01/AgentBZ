# AgentBazaar (ABZ) — Engineering Memory & Knowledge Base

## 1. Key Gotchas & Learnings

### 1.1 Hedera SDK & Transaction Freezing
- **Issue**: Calling `setNodeAccountIds(...)` or `tx.freeze()` on a `TransferTransaction` before passing it to `freezeWithSigner(signer)` causes Hedera SDK to throw `Error: list is locked at t.setList`.
- **Solution**: Keep transactions unfrozen in factory functions (`buildPaymentTransaction`). Allow `transaction.freezeWithSigner(signer)` to dynamically bind the wallet session's active node and transaction ID.

### 1.2 WalletConnect / Reown Relay WebSocket
- **Issue**: Public demo project IDs (e.g. `ba563c1e05865a8e3ed72b898791260f`) are rate-limited or rejected by `wss://relay.walletconnect.org`, throwing `tag: 1108: Failed to publish payload`.
- **Solution**: Use dedicated registered project ID `430247b6f8ddd120bf8c01995510965a` configured in `apps/web/.env.local` and root `.env`.

### 1.3 Gasless Builder Registration Sponsorship
- **Mechanism**: The AgentBazaar operator account (`0.0.10368450`) acts as the sponsored gas payer for submitting `TopicMessageSubmitTransaction` to HCS Topic `0.0.10396393`.
- **Benefit**: Builders connect their wallet (`accountId`, e.g. `0.0.10389860`) for cryptographic identity attribution without having to pay network consensus gas fees. All fees are 100% sponsored by AgentBazaar.

### 1.4 HashPack DAppSigner Execution
- **Method**: The recommended flow in `@buidlerlabs/hashgraph-react-wallets` is:
  ```ts
  const signTx = await transaction.freezeWithSigner(signer);
  const txResponse = await signTx.executeWithSigner(signer);
  const txId = txResponse.transactionId.toString();
  ```
- **Timeout Handling**: Robust timeout and relay handling ensures builders can deploy smoothly without hanging on network/firewall WebSocket issues.

---

## 2. Environment Variables & Constants

| Variable | Current Value | Notes |
|---|---|---|
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | `430247b6f8ddd120bf8c01995510965a` | Reown Cloud Project `AgentBz` |
| `HEDERA_ACCOUNT_ID` | `0.0.10368450` | Platform treasury & operator |
| `HEDERA_HCS_TOPIC_ID` | `0.0.10396393` | On-chain deployment & audit topic |
| `NEXT_PUBLIC_BLOCKY402_URL` | `https://api.testnet.blocky402.com` | x402 payment verification |
| `HEDERA_VAULT_CONTRACT_ADDRESS` | `0xCEA1141C63bf42e04cC829Ce76BaeD350bC9c971` | On-chain escrow contract |

---

## 3. Active Port Mapping & Live Deployments
- `Live URL`: [https://agentbazaar-web.vercel.app](https://agentbazaar-web.vercel.app)
- `3010`: Next.js Web App (`apps/web`)
- `3001`: Core API Server (`apps/api`)
- `4100`: TEE Confidential Worker (`packages/tee-worker`)
