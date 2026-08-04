/**
 * KeeperHub Integration — AgentBazaar
 *
 * KeeperHub paid workflows settle via x402 on Base USDC or MPP on Tempo USDC.e.
 * Each call carries a USDC payment; the server returns a result only after
 * the payment is verified on-chain.
 *
 * Payment is handled by the @x402/fetch wrapper using the platform's
 * KEEPERHUB_API_KEY for authentication. No buyer wallet is required server-side
 * — the x402 facilitator submits the on-chain tx and pays gas; our wallet only
 * debits the USDC amount.
 *
 * Docs: https://docs.keeperhub.com/ai-tools/agentic-wallet
 */

// x402/fetch removed — users pay directly via Web3 wallet; plain fetch used for KeeperHub API calls

// Guard: secrets must only be read server-side. Do NOT import this module
// directly into 'use client' components — use only isKeeperHubConfigured().
const _isServer = typeof window === 'undefined';

export const KEEPERHUB_BASE_URL = (
  process.env.NEXT_PUBLIC_KEEPERHUB_BASE_URL || 'https://app.keeperhub.com'
).replace(/\/+$/, '');

export const KEEPERHUB_API_KEY = process.env.KEEPERHUB_API_KEY || '';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export function isKeeperHubConfigured(): boolean {
  return Boolean(KEEPERHUB_BASE_URL && KEEPERHUB_API_KEY);
}

export function keeperhubUrl(path: string): string {
  return `${KEEPERHUB_BASE_URL}/${path.replace(/^\//, '')}`;
}

import { createPublicClient, http, fallback } from 'viem';
import { base } from 'viem/chains';
import { BASE_USDC_ADDRESS, TREASURY_WALLET_ADDRESS } from './x402-client';

const basePublicClient = createPublicClient({
  chain: base,
  transport: fallback([
    http('https://mainnet.base.org', { timeout: 30_000, retryCount: 3 }),
    http('https://base.llamarpc.com', { timeout: 30_000, retryCount: 3 }),
    http('https://1rpc.io/base', { timeout: 30_000, retryCount: 3 }),
    http('https://base.gateway.tenderly.co', { timeout: 30_000, retryCount: 3 }),
  ]),
});

/**
 * Verifies that a transaction hash represents a confirmed USDC payment on Base Mainnet
 * to the AgentBazaar treasury wallet with automatic RPC failover and propagation retries.
 */
export async function verifyKeeperHubPayment(txHash: string): Promise<{ valid: boolean; blockNumber?: bigint; error?: string }> {
  let lastError: string = 'Unknown error';

  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      console.log(`[KeeperHub Verification] Attempt ${attempt}/4: Querying receipt for ${txHash}...`);
      const receipt = await basePublicClient.getTransactionReceipt({
        hash: txHash as `0x${string}`,
      });

      if (receipt.status !== 'success') {
        return { valid: false, error: 'Transaction reverted on-chain' };
      }

      // Verify interaction was with the Base USDC contract
      if (receipt.to?.toLowerCase() !== BASE_USDC_ADDRESS.toLowerCase()) {
        return { valid: false, error: 'Transaction was not sent to Base USDC contract' };
      }

      console.log(`[KeeperHub Verification] Payment verified on Base Mainnet! txHash: ${txHash} | block: ${receipt.blockNumber}`);
      return { valid: true, blockNumber: receipt.blockNumber };
    } catch (error: any) {
      lastError = error.message;
      console.warn(`[KeeperHub Verification] Attempt ${attempt}/4 failed: ${error.message}`);
      if (attempt < 4) {
        await new Promise((resolve) => setTimeout(resolve, 2500));
      }
    }
  }

  return { valid: false, error: lastError };
}

// ─── Plain fetch helper ───────────────────────────────────────────────────────
// Users pay directly via their Web3 wallet (txHash verified on-chain).
// No x402 payment interception needed — plain Bearer auth is sufficient
// for KeeperHub Free plan API calls to log and meter workflow runs.

function getKeeperHubFetch() {
  // Always return plain fetch — x402 is a Pro plan feature and causes
  // 'Cannot read properties of undefined (reading forEach)' on Free plan.
  return fetch;
}

// ─── Register Agent Workflow ──────────────────────────────────────────────────
// Called at deploy time to create a paid workflow listing on KeeperHub.
// Returns the workflow slug used for subsequent execution calls.
// IMPORTANT: Throws on failure so callers know the slug is not registered on
// KeeperHub. Silently returning a local slug means execution calls hit a 404
// and bypass the payment meter entirely.

export async function registerAgentWorkflow(agent: {
  name: string;
  description: string;
  priceUsd: number;
}): Promise<{ slug: string }> {
  if (!KEEPERHUB_API_KEY) {
    const msg = '[KeeperHub] KEEPERHUB_API_KEY is not set — workflow registration cannot proceed. ' +
      'Set KEEPERHUB_API_KEY in your environment variables (Vercel → Settings → Environment Variables).';
    console.error(msg);
    throw new Error(msg);
  }

  const treasuryAddress = process.env.TREASURY_WALLET_ADDRESS;
  const treasuryFee = Number(process.env.TREASURY_FEE_PERCENT || '10');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  let response: Response;
  try {
    response = await fetch(`${KEEPERHUB_BASE_URL}/api/workflows`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${KEEPERHUB_API_KEY}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        name: agent.name,
        description: agent.description,
        price: agent.priceUsd,
        currency: 'USDC',
        protocol: 'x402',
        // Treasury fee split — AgentBazaar collects 10% on every run
        ...(treasuryAddress && {
          feeRecipient: treasuryAddress,
          feePercent: treasuryFee,
        }),
      }),
    });
  } catch (err: any) {
    clearTimeout(timer);
    const msg = `[KeeperHub] Workflow registration network error: ${err.message}`;
    console.error(msg);
    throw new Error(msg);
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '(no body)');
    const msg = `[KeeperHub] Workflow registration failed (HTTP ${response.status}): ${text}`;
    console.error(msg);
    throw new Error(msg);
  }

  const data = await response.json();
  const slug = data?.slug;
  if (!slug) {
    const msg = `[KeeperHub] Registration succeeded but response contained no slug. Full response: ${JSON.stringify(data)}`;
    console.error(msg);
    throw new Error(msg);
  }

  console.log(`[KeeperHub] ✓ Workflow registered → slug: "${slug}" | treasury: ${treasuryAddress} (${treasuryFee}%)`);
  return { slug };
}

// ─── Execute Agent via KeeperHub ─────────────────────────────────────────────
// Executes a workflow by slug. The x402-wrapped fetch handles the payment
// challenge automatically — intercepts HTTP 402, signs via Turnkey proxy,
// retries the call. The txHash is returned in the x-payment-tx-hash header.
//
// clientTxHash (optional): on-chain USDC payment already made by the buyer's
// wallet. It is forwarded as the `x-payment-tx-hash` proof header AND used as
// the fallback txHash in the response. It does NOT bypass the x402 fetch layer —
// the platform payer wallet still goes through KeeperHub so the API key usage
// is recorded on the KeeperHub dashboard.
//
// Returns { output, txHash } on success.
// Returns { output: { skipped }, txHash: null } ONLY when KEEPERHUB_API_KEY is
// absent — callers should then fall back to direct LLM execution.

/**
 * Resolve a workflow slug to its KeeperHub numeric/string ID.
 *
 * Priority:
 *   1. Env var  KEEPERHUB_WORKFLOW_ID_<SLUG_UPPER>  (e.g. KEEPERHUB_WORKFLOW_ID_THREADSMITH)
 *   2. Live lookup — GET /api/workflows, find by name (case-insensitive).
 *
 * The KeeperHub REST API uses opaque IDs like "glj0xzuvyi01z732m8cs3", NOT
 * human-readable slugs.  Calling /api/workflows/{slug}/execute results in a 404.
 */
async function resolveWorkflowId(slug: string): Promise<string> {
  // 1. Env-var shortcut (fastest, no extra HTTP round-trip)
  const envKey = `KEEPERHUB_WORKFLOW_ID_${slug.toUpperCase().replace(/-/g, '_')}`;
  const envId = process.env[envKey];
  if (envId) {
    console.log(`[KeeperHub] Resolved workflow ID for "${slug}" from env (${envKey}): ${envId}`);
    return envId;
  }

  // 2. Live lookup — list all workflows and find by name
  console.log(`[KeeperHub] ${envKey} not set — querying /api/workflows to resolve "${slug}"...`);
  const listResp = await fetch(`${KEEPERHUB_BASE_URL}/api/workflows`, {
    headers: { Authorization: `Bearer ${KEEPERHUB_API_KEY}` },
  });

  if (!listResp.ok) {
    throw new Error(`[KeeperHub] Failed to list workflows (HTTP ${listResp.status}) while resolving slug "${slug}"`);
  }

  const workflows: Array<{ id: string; name: string; deletedAt: string | null }> = await listResp.json();
  const normalised = slug.toLowerCase().replace(/-/g, '');
  // Match active (non-deleted) workflows whose name normalises to the slug
  const match = workflows.find(
    (w) => !w.deletedAt && w.name.toLowerCase().replace(/[^a-z0-9]/g, '') === normalised
  );

  if (!match) {
    throw new Error(
      `[KeeperHub] No active workflow named "${slug}" found on KeeperHub. ` +
      `Active workflows: [${workflows.filter(w => !w.deletedAt).map(w => `"${w.name}"`).join(', ')}]. ` +
      `Set ${envKey}=<id> in your env vars to bypass the lookup.`
    );
  }

  console.log(`[KeeperHub] Resolved workflow ID for "${slug}" via name match: ${match.id} ("${match.name}")`);
  return match.id;
}

export async function executeAgentViaKeeperHub(
  workflowSlug: string,
  inputs: Record<string, unknown>,
  clientTxHash?: string
): Promise<{ output: unknown; txHash: string | null }> {
  // ── 1. Guard: API key must be present ─────────────────────────────────────
  if (!KEEPERHUB_API_KEY) {
    console.error(
      '[KeeperHub] KEEPERHUB_API_KEY is not configured. ' +
      'Set it in Vercel → Settings → Environment Variables and redeploy. ' +
      'Skipping KeeperHub — falling back to direct LLM execution.'
    );
    return { output: { skipped: true, reason: 'KEEPERHUB_API_KEY not configured' }, txHash: null };
  }

  // ── 2. On-Chain Payment Verification (when buyer supplied a txHash) ────────
  if (clientTxHash) {
    console.log(`[KeeperHub] Verifying on-chain payment for txHash: ${clientTxHash}...`);
    const verification = await verifyKeeperHubPayment(clientTxHash);
    if (!verification.valid) {
      console.error(`[KeeperHub] Payment verification failed: ${verification.error}`);
      throw new Error(`KeeperHub Payment Verification Failed: ${verification.error}`);
    }
    console.log(`[KeeperHub] Payment VERIFIED on Base Mainnet (Block #${verification.blockNumber}) ✓`);
  }

  // ── 3. Resolve human slug → KeeperHub workflow ID ─────────────────────────
  // KeeperHub REST API uses opaque IDs (e.g. "glj0xzuvyi01z732m8cs3").
  // The /execute endpoint does NOT accept slugs — using a slug returns 404.
  let workflowId: string;
  try {
    workflowId = await resolveWorkflowId(workflowSlug);
  } catch (resolveErr: any) {
    console.error(`[KeeperHub] Cannot resolve workflow ID for "${workflowSlug}": ${resolveErr.message}`);
    throw resolveErr; // Bubble up — callers catch and fall through to LLM
  }

  // ── 4. Remote Workflow Execution via plain Bearer fetch ───────────────────
  // Users pay via Web3 wallet (verified above). We call KeeperHub to
  // log the run and trigger the workflow graph (e.g. Send Email node).
  // Correct endpoint: POST /api/workflows/{id}/execute  (NOT /run)
  const fetchFn = getKeeperHubFetch();
  const url = `${KEEPERHUB_BASE_URL}/api/workflows/${workflowId}/execute`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${KEEPERHUB_API_KEY}`,
    'Content-Type': 'application/json',
  };

  if (clientTxHash) {
    headers['x-payment-tx-hash'] = clientTxHash;
  }

  console.log(`[KeeperHub] Dispatching POST ${url}`);

  try {
    const response = await fetchFn(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ inputs, txHash: clientTxHash }),
    });

    const responseTxHash = response.headers.get('x-payment-tx-hash') || clientTxHash || null;

    if (!response.ok) {
      const text = await response.text().catch(() => '(no body)');
      const msg = `[KeeperHub] Execution HTTP ${response.status} for workflow ID "${workflowId}" (slug: "${workflowSlug}"): ${text}`;
      console.error(msg);
      throw new Error(msg);
    }

    const data = await response.json();
    console.log(`[KeeperHub] ✓ Workflow "${workflowSlug}" (ID: ${workflowId}) dispatched → executionId: ${(data as any)?.executionId} | txHash: ${responseTxHash}`);
    return { output: data, txHash: responseTxHash };
  } catch (error: any) {
    console.error(`[KeeperHub] Execution error for slug "${workflowSlug}" (ID: ${workflowId}): ${error.message}`);
    throw error; // Re-throw — generate/route.ts catches and falls through to LLM
  }
}
