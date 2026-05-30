/**
 * CDR Client Module — AgentBazaar × Story Protocol
 *
 * Browser-side ONLY. Uses the buyer's connected wagmi WalletClient to
 * unlock CDR vaults. CDR checks the buyer's on-chain license automatically.
 *
 * Flow (Option 1 — Buyer Signature Relay):
 *  1. Buyer clicks "Run Agent"
 *  2. Browser calls accessAgentCDR() with their wagmi wallet
 *  3. CDR verifies buyer's on-chain license and decrypts the vault
 *  4. Decrypted { logic, apiKeys } is returned to the caller
 *  5. Caller posts it to /api/agents/run for server-side execution
 */

import { CDRClient, initWasm, HeliaProvider } from '@piplabs/cdr-sdk';
import { createPublicClient, http, type WalletClient } from 'viem';
import { createHelia } from 'helia';
import { unixfs } from '@helia/unixfs';
import { CID } from 'multiformats/cid';

// ─── Types (re-exported for consumer convenience) ─────────────────────────────

export interface ApiKey {
  name: string;
  value: string;
}

export interface AccessedAgentContent {
  logic: string;
  apiKeys: ApiKey[];  // always an array — empty if agent has none
}

export interface AgentCDRRef {
  vaultUuid: number;
  keysVaultUuid?: number;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const STORY_RPC = 'https://aeneid.storyrpc.io';
const STORY_API_URL = process.env.NEXT_PUBLIC_STORY_API_URL || 'http://172.192.41.96:1317';

// ─── Storage (browser-compatible via Helia) ───────────────────────────────────

async function getStorage(): Promise<HeliaProvider> {
  const node = await createHelia({
    start: false
  });
  return new HeliaProvider({
    helia: node,
    unixfs: unixfs(node),
    CID: (s: string) => CID.parse(s),
  });
}

// ─── Access Agent ─────────────────────────────────────────────────────────────
// Called client-side with the buyer's wagmi WalletClient.
// CDR will verify the buyer's on-chain license before unlocking.

export async function accessAgentCDR(
  connectedWallet: WalletClient,
  agent: AgentCDRRef
): Promise<AccessedAgentContent> {
  await initWasm();

  const publicClient = createPublicClient({ transport: http(STORY_RPC) });
  const storage      = await getStorage();
  const decoder      = new TextDecoder();

  const client = new CDRClient({
    network: 'testnet',
    publicClient,
    walletClient: connectedWallet,
    apiUrl: STORY_API_URL,
  });

  // 1. Unlock agent logic vault
  console.log(`[CDR] Unlocking logic vault (uuid: ${agent.vaultUuid})…`);

  const { content: logicBytes } = await client.consumer.downloadFile({
    uuid: agent.vaultUuid,
    accessAuxData: '0x',
    storageProvider: storage,
    timeoutMs: 120_000,
  });

  const { logic } = JSON.parse(decoder.decode(logicBytes));
  console.log(`[CDR] Logic unlocked ✓`);

  // 2. Unlock API keys vault only if one exists
  let apiKeys: ApiKey[] = [];

  if (agent.keysVaultUuid !== undefined) {
    console.log(`[CDR] Unlocking keys vault (uuid: ${agent.keysVaultUuid})…`);

    const { content: keysBytes } = await client.consumer.downloadFile({
      uuid: agent.keysVaultUuid,
      accessAuxData: '0x',
      storageProvider: storage,
      timeoutMs: 120_000,
    });

    apiKeys = JSON.parse(decoder.decode(keysBytes)).apiKeys ?? [];
    console.log(`[CDR] ${apiKeys.length} key(s) unlocked ✓`);
  } else {
    console.log(`[CDR] No keys vault — agent runs without API keys`);
  }

  return { logic, apiKeys };
}
