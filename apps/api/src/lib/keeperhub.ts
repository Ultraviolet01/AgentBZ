import axios from 'axios';
// @ts-ignore
import { withPaymentInterceptor } from 'x402-axios';

const KEEPERHUB_BASE = process.env.NEXT_PUBLIC_KEEPERHUB_BASE_URL || 'https://app.keeperhub.com';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export function getPayingClient(walletClient?: any) {
  const base = axios.create({ baseURL: KEEPERHUB_BASE.replace(/\/+$/, '') });
  if (!walletClient || !process.env.KEEPERHUB_API_KEY) {
    return base;
  }

  return withPaymentInterceptor(base, walletClient as any);
}

export async function registerAgentWorkflow(agent: { name: string; description: string; priceUsd: number }) {
  if (!process.env.KEEPERHUB_API_KEY) {
    return { slug: slugify(agent.name) };
  }

  try {
    const response = await axios.post(
      `${KEEPERHUB_BASE.replace(/\/+$/, '')}/api/workflows`,
      {
        name: agent.name,
        description: agent.description,
        price: agent.priceUsd,
        currency: 'USDC',
        protocol: 'x402',
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.KEEPERHUB_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return { slug: response.data?.slug || slugify(agent.name) };
  } catch (error) {
    console.warn('[KeeperHub] Workflow registration skipped:', error);
    return { slug: slugify(agent.name) };
  }
}

export async function executeAgentViaKeeperHub(
  walletClient: any,
  workflowSlug: string,
  inputs: Record<string, unknown>
) {
  if (!process.env.KEEPERHUB_API_KEY) {
    return { output: { skipped: true, reason: 'KeeperHub is not configured' }, txHash: null };
  }

  try {
    const client = getPayingClient(walletClient);
    const response = await client.post(`/api/workflows/${workflowSlug}/run`, { inputs });
    return {
      output: response.data,
      txHash: response.headers?.['x-payment-tx-hash'] || null,
    };
  } catch (error) {
    console.warn('[KeeperHub] Execution fallback triggered:', error);
    return { output: { skipped: true, reason: 'KeeperHub execution failed' }, txHash: null };
  }
}
