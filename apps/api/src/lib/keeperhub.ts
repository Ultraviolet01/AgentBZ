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
    const msg =
      '[KeeperHub] KEEPERHUB_API_KEY is not set — workflow registration cannot proceed. ' +
      'Add it to your environment variables and redeploy.';
    console.error(msg);
    throw new Error(msg);
  }

  let response;
  try {
    response = await axios.post(
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
        timeout: 8000,
      }
    );
  } catch (error: any) {
    const msg = `[KeeperHub] Workflow registration failed: ${error.message}`;
    console.error(msg);
    throw new Error(msg);
  }

  const slug = response.data?.slug;
  if (!slug) {
    const msg = `[KeeperHub] Registration succeeded but response contained no slug. Response: ${JSON.stringify(response.data)}`;
    console.error(msg);
    throw new Error(msg);
  }

  console.log(`[KeeperHub] ✓ Workflow registered → slug: "${slug}"`);
  return { slug };
}

export async function executeAgentViaKeeperHub(
  walletClient: any,
  workflowSlug: string,
  inputs: Record<string, unknown>
) {
  if (!process.env.KEEPERHUB_API_KEY) {
    console.error(
      '[KeeperHub] KEEPERHUB_API_KEY is not configured. ' +
      'Set it in your environment variables and redeploy. ' +
      'Falling back to direct LLM execution.'
    );
    return { output: { skipped: true, reason: 'KEEPERHUB_API_KEY not configured' }, txHash: null };
  }

  try {
    const client = getPayingClient(walletClient);
    const response = await client.post(`/api/workflows/${workflowSlug}/run`, { inputs });
    const txHash = response.headers?.['x-payment-tx-hash'] || null;
    console.log(`[KeeperHub] ✓ Workflow "${workflowSlug}" executed → txHash: ${txHash}`);
    return { output: response.data, txHash };
  } catch (error: any) {
    console.error(`[KeeperHub] Execution error for slug "${workflowSlug}": ${error.message}`);
    return { output: { skipped: true, reason: `KeeperHub execution failed: ${error.message}` }, txHash: null };
  }
}
