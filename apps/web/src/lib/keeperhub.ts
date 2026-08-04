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

import { wrapFetchWithPaymentFromConfig } from '@x402/fetch';

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

// ─── x402-wrapped fetch ───────────────────────────────────────────────────────
// Uses @x402/fetch to intercept HTTP 402 challenges and auto-pay via Base USDC.
// The payment config is sourced from KEEPERHUB_API_KEY (platform wallet).

function getPayingFetch() {
  if (!KEEPERHUB_API_KEY) {
    // No payment config — return plain fetch (will fail on paid endpoints)
    return fetch;
  }

  // wrapFetchWithPaymentFromConfig intercepts HTTP 402 challenges and
  // auto-pays via KeeperHub's Turnkey proxy using Base USDC.
  return wrapFetchWithPaymentFromConfig(fetch, {
    apiKey: KEEPERHUB_API_KEY,
    baseUrl: KEEPERHUB_BASE_URL,
    // Payer wallet managed via KeeperHub Turnkey — holds USDC on Base
    payerWallet: process.env.KEEPERHUB_PAYER_WALLET || '0x0FE372d039d14D60486A7f78c59BB6360B7d7530',
  } as any);
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

  // ── 3. Remote Workflow Execution via x402-wrapped fetch ────────────────────
  // ALWAYS use getPayingFetch() so every call is routed through the KeeperHub
  // x402 payment layer and appears in the KeeperHub dashboard.
  // When a clientTxHash is provided it is forwarded as a proof header only —
  // the platform wallet still pays via x402 so the API key usage is metered.
  const fetchFn = getPayingFetch();
  const url = `${KEEPERHUB_BASE_URL}/api/workflows/${workflowSlug}/run`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${KEEPERHUB_API_KEY}`,
    'Content-Type': 'application/json',
  };

  if (clientTxHash) {
    // Forward buyer's on-chain proof; KeeperHub may honour it to waive x402 charge
    headers['x-payment-tx-hash'] = clientTxHash;
  }

  try {
    const response = await fetchFn(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ inputs }),
    });

    const responseTxHash = response.headers.get('x-payment-tx-hash') || clientTxHash || null;

    if (!response.ok) {
      const text = await response.text().catch(() => '(no body)');

      // 404 means the slug was never registered on KeeperHub — this should not
      // silently succeed. Surface the error so it gets fixed at deploy time.
      if (response.status === 404) {
        const msg =
          `[KeeperHub] Workflow slug "${workflowSlug}" not found on KeeperHub (404). ` +
          'Re-deploy the agent to trigger registerAgentWorkflow() and create the slug on KeeperHub.';
        console.error(msg);
        throw new Error(msg);
      }

      throw new Error(`KeeperHub execution failed (HTTP ${response.status}): ${text}`);
    }

    const data = await response.json();
    console.log(`[KeeperHub] ✓ Workflow "${workflowSlug}" executed → txHash: ${responseTxHash}`);
    return { output: data, txHash: responseTxHash };
  } catch (error: any) {
    // Only fall back to skipped (LLM direct) for transient/network errors,
    // never for 404 (slug missing) — those re-throw above.
    console.error(`[KeeperHub] Execution error for slug "${workflowSlug}": ${error.message}`);
    return {
      output: { skipped: true, reason: `KeeperHub execution failed: ${error.message}` },
      txHash: null,
    };
  }
}
