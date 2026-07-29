"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPayingClient = getPayingClient;
exports.registerAgentWorkflow = registerAgentWorkflow;
exports.executeAgentViaKeeperHub = executeAgentViaKeeperHub;
const axios_1 = __importDefault(require("axios"));
// @ts-ignore
const x402_axios_1 = require("x402-axios");
const KEEPERHUB_BASE = process.env.NEXT_PUBLIC_KEEPERHUB_BASE_URL || 'https://app.keeperhub.com';
const slugify = (value) => value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
function getPayingClient(walletClient) {
    const base = axios_1.default.create({ baseURL: KEEPERHUB_BASE.replace(/\/+$/, '') });
    if (!walletClient || !process.env.KEEPERHUB_API_KEY) {
        return base;
    }
    return (0, x402_axios_1.withPaymentInterceptor)(base, walletClient);
}
async function registerAgentWorkflow(agent) {
    if (!process.env.KEEPERHUB_API_KEY) {
        return { slug: slugify(agent.name) };
    }
    try {
        const response = await axios_1.default.post(`${KEEPERHUB_BASE.replace(/\/+$/, '')}/api/workflows`, {
            name: agent.name,
            description: agent.description,
            price: agent.priceUsd,
            currency: 'USDC',
            protocol: 'x402',
        }, {
            headers: {
                Authorization: `Bearer ${process.env.KEEPERHUB_API_KEY}`,
                'Content-Type': 'application/json',
            },
        });
        return { slug: response.data?.slug || slugify(agent.name) };
    }
    catch (error) {
        console.warn('[KeeperHub] Workflow registration skipped:', error);
        return { slug: slugify(agent.name) };
    }
}
async function executeAgentViaKeeperHub(walletClient, workflowSlug, inputs) {
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
    }
    catch (error) {
        console.warn('[KeeperHub] Execution fallback triggered:', error);
        return { output: { skipped: true, reason: 'KeeperHub execution failed' }, txHash: null };
    }
}
