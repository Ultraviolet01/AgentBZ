/**
 * CDR Server Module — AgentBazaar × Story Protocol
 *
 * Server-side ONLY. Uses AgentBazaar's platform private key to vault
 * the developer's API keys on Story Protocol's CDR network at listing time.
 *
 * CDR is used ONLY for storing API keys when an agent is deployed to the
 * marketplace. It is NOT involved in the agent run/execution flow.
 *
 * Developers never interact with CDR directly — AgentBazaar handles all
 * vaulting transparently when a listing form is submitted.
 */

import { CDRClient, initWasm, HeliaProvider, conditions } from '@piplabs/cdr-sdk';
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { createHelia } from 'helia';
import { unixfs } from '@helia/unixfs';
import { CID } from 'multiformats/cid';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiKey {
  name: string;   // e.g. "OPENAI_API_KEY"
  value: string;
}

export interface AgentListing {
  name: string;
  description: string;
  apiKeys?: ApiKey[];   // the API keys to vault — omit if the agent needs none
}

export interface DeployedAgentCDR {
  keysVaultUuid?: number;
  hasApiKeys: boolean;
  deployedAt: number;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const STORY_RPC = process.env.STORY_RPC || 'https://aeneid.storyrpc.io';
const STORY_API_URL = process.env.STORY_API_URL || 'http://172.192.41.96:1317';

const CONDITIONS = {
  OWNER_WRITE: (process.env.CDR_WRITE_CONDITION || '0x4C9bFC96d7092b590D497A191826C3dA2277c34B') as `0x${string}`,
  LICENSE_READ: (process.env.CDR_READ_CONDITION  || '0xC0640AD4CF2CaA9914C8e5C44234359a9102f7a3') as `0x${string}`,
};

// ─── Storage ──────────────────────────────────────────────────────────────────

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

// ─── Singleton Platform Client ────────────────────────────────────────────────

let _platformClient: CDRClient | null = null;

async function getPlatformClient(): Promise<CDRClient> {
  if (_platformClient) return _platformClient;

  const platformKey = process.env.AGENTBAZAAR_PLATFORM_KEY;
  if (!platformKey) {
    throw new Error('AGENTBAZAAR_PLATFORM_KEY is not set in environment variables');
  }

  await initWasm();

  const account = privateKeyToAccount(platformKey as `0x${string}`);

  const publicClient  = createPublicClient({ transport: http(STORY_RPC) });
  const walletClient  = createWalletClient({ account, transport: http(STORY_RPC) });

  _platformClient = new CDRClient({
    network: 'testnet',
    publicClient,
    walletClient,
    apiUrl: STORY_API_URL,
  });

  return _platformClient;
}

// ─── Retrieve Agent Keys (Run-time, Server-side) ──────────────────────────────
// Called by /api/agents/run AFTER the buyer's x402 payment is confirmed.
// Uses the platform wallet (which owns the vault) to download the API keys.
// Keys are returned in-memory only and NEVER written to logs or the database.

export async function retrieveAgentKeys(cdrKeysVaultUuid: number): Promise<ApiKey[]> {
  const client  = await getPlatformClient();
  const storage = await getStorage();
  const decoder = new TextDecoder();

  console.log(`[CDR] Retrieving API keys from vault ${cdrKeysVaultUuid}…`);

  try {
    const { content } = await client.consumer.downloadFile({
      uuid: cdrKeysVaultUuid,
      accessAuxData: '0x',
      storageProvider: storage,
      timeoutMs: 30_000,
    });

    const { apiKeys } = JSON.parse(decoder.decode(content)) as { apiKeys: ApiKey[] };
    console.log(`[CDR] Retrieved ${apiKeys.length} API key(s) for execution ✓`);
    return apiKeys;
  } catch (err: any) {
    console.error(`[CDR] Failed to retrieve keys from vault ${cdrKeysVaultUuid}:`, err.message);
    throw new Error(`Could not retrieve agent API keys from CDR: ${err.message}`);
  }
}

// ─── Deploy Agent (API Key Vaulting Only) ─────────────────────────────────────
// Called by /api/agents/deploy when a developer lists a new agent.
// Vaults ONLY the API keys — agent logic/system prompts are NOT stored in CDR.
// The developer never sees or touches CDR — this is fully transparent to them.

export async function deployAgentCDR(listing: AgentListing): Promise<DeployedAgentCDR> {
  // If no API keys are provided, skip CDR entirely
  if (!listing.apiKeys || listing.apiKeys.length === 0) {
    console.log(`[CDR] No API keys for "${listing.name}" — skipping CDR vault`);
    return {
      hasApiKeys: false,
      deployedAt: Date.now(),
    };
  }

  const platformKey = process.env.AGENTBAZAAR_PLATFORM_KEY;
  if (!platformKey) {
    console.warn(`[CDR] AGENTBAZAAR_PLATFORM_KEY missing — skipping Story Protocol vaulting`);
    return { hasApiKeys: false, deployedAt: Date.now() };
  }

  // Wrap vaulting with a 10s timeout fallback
  const vaultPromise = (async () => {
    const client = await getPlatformClient();
    const storage = await getStorage();
    const globalPubKey = await client.observer.getGlobalPubKey();
    const encoder = new TextEncoder();
    const account = privateKeyToAccount(platformKey as `0x${string}`);
    const writeCondition = conditions.ownerOnly({
      address: CONDITIONS.OWNER_WRITE,
      owner: account.address,
    });

    const keys = listing.apiKeys || [];
    console.log(`[CDR] Vaulting ${keys.length} API key(s) for "${listing.name}"…`);

    const { uuid: keysVaultUuid } = await client.uploader.uploadFile({
      content: encoder.encode(JSON.stringify({ apiKeys: keys })),
      storageProvider: storage,
      globalPubKey,
      updatable: true,
      writeConditionAddr: writeCondition.address,
      readConditionAddr: CONDITIONS.LICENSE_READ,
      writeConditionData: writeCondition.conditionData,
      readConditionData: '0x',
      accessAuxData: '0x',
    });

    console.log(`[CDR] API keys vaulted → uuid: ${keysVaultUuid}`);
    return { keysVaultUuid, hasApiKeys: true, deployedAt: Date.now() };
  })();

  const timeoutPromise = new Promise<DeployedAgentCDR>((_, reject) =>
    setTimeout(() => reject(new Error('Story Protocol CDR network response timed out after 10s')), 10000)
  );

  try {
    return await Promise.race([vaultPromise, timeoutPromise]);
  } catch (err: any) {
    console.warn(`[CDR Fallback] Vaulting skipped due to network timeout/error: ${err.message}`);
    return { hasApiKeys: false, deployedAt: Date.now() };
  }
}
