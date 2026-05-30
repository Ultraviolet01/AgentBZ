/**
 * CDR Server Module — AgentBazaar × Story Protocol
 *
 * Server-side ONLY. Uses AgentBazaar's platform private key to vault
 * agent logic and API keys on Story Protocol's CDR network.
 *
 * Builders never interact with CDR — AgentBazaar handles all of this
 * transparently when a listing form is submitted.
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
  logic: string;        // system prompt / agent strategy
  apiKeys?: ApiKey[];   // optional — omit if agent needs none
}

export interface DeployedAgentCDR {
  vaultUuid: number;
  keysVaultUuid?: number;
  hasApiKeys: boolean;
  deployedAt: number;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const STORY_RPC = process.env.STORY_RPC || 'https://aeneid.storyrpc.io';
const STORY_API_URL = process.env.STORY_API_URL || 'http://172.192.41.96:1317';

const CONDITIONS = {
  OWNER_WRITE: process.env.CDR_WRITE_CONDITION || '0x4C9bFC96d7092b590D497A191826C3dA2277c34B',
  LICENSE_READ: process.env.CDR_READ_CONDITION  || '0xC0640AD4CF2CaA9914C8e5C44234359a9102f7a3',
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

// ─── Deploy Agent ─────────────────────────────────────────────────────────────
// Called by the /api/agents/deploy route.
// The builder never sees or touches CDR — this is fully transparent to them.

export async function deployAgentCDR(listing: AgentListing): Promise<DeployedAgentCDR> {
  const client   = await getPlatformClient();
  const storage  = await getStorage();
  const globalPubKey = await client.observer.getGlobalPubKey();
  const encoder  = new TextEncoder();

  const platformKey = process.env.AGENTBAZAAR_PLATFORM_KEY;
  if (!platformKey) {
    throw new Error('AGENTBAZAAR_PLATFORM_KEY is not set in environment variables');
  }
  const account = privateKeyToAccount(platformKey as `0x${string}`);
  const writeCondition = conditions.ownerOnly({
    address: CONDITIONS.OWNER_WRITE,
    owner: account.address,
  });

  // 1. Vault the agent logic (system prompt / strategy)
  console.log(`[CDR] Vaulting logic for "${listing.name}"…`);

  const { uuid: vaultUuid } = await client.uploader.uploadFile({
    content: encoder.encode(
      JSON.stringify({
        logic: listing.logic,
        name: listing.name,
        description: listing.description,
      })
    ),
    storageProvider: storage,
    globalPubKey,
    updatable: true,
    writeConditionAddr: writeCondition.address,
    readConditionAddr:  CONDITIONS.LICENSE_READ,
    writeConditionData: writeCondition.conditionData,
    readConditionData:  '0x',
    accessAuxData: '0x',
  });

  console.log(`[CDR] Logic vaulted → uuid: ${vaultUuid}`);

  // 2. Vault API keys only if the builder provided any
  let keysVaultUuid: number | undefined;

  if (listing.apiKeys && listing.apiKeys.length > 0) {
    console.log(`[CDR] Vaulting ${listing.apiKeys.length} API key(s)…`);

    const { uuid: keysUuid } = await client.uploader.uploadFile({
      content: encoder.encode(JSON.stringify({ apiKeys: listing.apiKeys })),
      storageProvider: storage,
      globalPubKey,
      updatable: true,
      writeConditionAddr: writeCondition.address,
      readConditionAddr:  CONDITIONS.LICENSE_READ,
      writeConditionData: writeCondition.conditionData,
      readConditionData:  '0x',
      accessAuxData: '0x',
    });

    keysVaultUuid = keysUuid;
    console.log(`[CDR] Keys vaulted → uuid: ${keysVaultUuid}`);
  } else {
    console.log(`[CDR] No API keys — skipping keys vault`);
  }

  return {
    vaultUuid,
    keysVaultUuid,
    hasApiKeys: !!keysVaultUuid,
    deployedAt: Date.now(),
  };
}
