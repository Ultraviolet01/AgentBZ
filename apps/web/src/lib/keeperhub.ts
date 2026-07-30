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

export async function registerAgentWorkflow(agent: {
  name: string;
  description: string;
  priceUsd: number;
}): Promise<{ slug: string }> {
  if (!KEEPERHUB_API_KEY) {
    console.warn('[KeeperHub] KEEPERHUB_API_KEY not set — skipping workflow registration');
    return { slug: slugify(agent.name) };
  }

  const treasuryAddress = process.env.TREASURY_WALLET_ADDRESS;
  const treasuryFee = Number(process.env.TREASURY_FEE_PERCENT || '10');

  try {
    const response = await fetch(`${KEEPERHUB_BASE_URL}/api/workflows`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${KEEPERHUB_API_KEY}`,
        'Content-Type': 'application/json',
      },
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

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`KeeperHub registration failed (${response.status}): ${text}`);
    }

    const data = await response.json();
    const slug = data?.slug || slugify(agent.name);
    console.log(`[KeeperHub] Workflow registered → slug: ${slug} | treasury: ${treasuryAddress} (${treasuryFee}%)`);
    return { slug };
  } catch (error: any) {
    console.warn('[KeeperHub] Workflow registration skipped:', error.message);
    return { slug: slugify(agent.name) };
  }
}

// ─── Execute Agent via KeeperHub ─────────────────────────────────────────────
// Executes a workflow by slug. The x402-wrapped fetch handles the payment
// challenge automatically — intercepts HTTP 402, signs via Turnkey proxy,
// retries the call. The txHash is returned in the x-payment-tx-hash header.
//
// Returns { output, txHash } on success, or { output: { skipped }, txHash: null }
// if KeeperHub is not configured or the call fails, so the caller can fall back
// to direct LLM execution.

export async function executeAgentViaKeeperHub(
  workflowSlug: string,
  inputs: Record<string, unknown>,
  clientTxHash?: string
): Promise<{ output: unknown; txHash: string | null }> {
  if (!isKeeperHubConfigured()) {
    return {
      output: { skipped: true, reason: 'KeeperHub is not configured (missing KEEPERHUB_API_KEY)' },
      txHash: null,
    };
  }

  try {
    // If clientTxHash is already present, use standard fetch with payment header.
    // Otherwise use payingFetch (@x402/fetch) to handle x402 challenge-response.
    const fetchFn = clientTxHash ? fetch : getPayingFetch();
    const url = `${KEEPERHUB_BASE_URL}/api/workflows/${workflowSlug}/run`;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${KEEPERHUB_API_KEY}`,
      'Content-Type': 'application/json',
    };

    if (clientTxHash) {
      headers['x-payment-tx-hash'] = clientTxHash;
    }

    const response = await fetchFn(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ inputs }),
    });

    const txHash = response.headers.get('x-payment-tx-hash') || clientTxHash || null;

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`KeeperHub execution failed (${response.status}): ${text}`);
    }

    const data = await response.json();
    console.log(`[KeeperHub] Workflow "${workflowSlug}" executed via KeeperHub → txHash: ${txHash}`);

    return { output: data, txHash };
  } catch (error: any) {
    console.warn('[KeeperHub] Execution fallback triggered:', error.message);
    return {
      output: { skipped: true, reason: `KeeperHub execution failed: ${error.message}` },
      txHash: null,
    };
  }
}
