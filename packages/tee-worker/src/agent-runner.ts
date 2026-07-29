/**
 * TEE Worker — Agent Runner
 * 
 * The core execution engine that:
 * 1. Fetches encrypted credentials from decentralized storage
 * 2. Decrypts them inside the TEE
 * 3. Calls the external AI API with the real credentials
 * 4. Returns the result with an attestation proof
 * 
 * SECURITY: Plaintext credentials exist ONLY in TEE memory.
 * They are never written to disk, logged, or transmitted.
 */

import crypto from 'node:crypto';
import { decryptCredentials } from './crypto';
import { generateAttestation } from './attestation';

export interface AgentRunRequest {
  // Agent metadata
  agentId: string;
  agentSlug: string;
  
  // Encrypted credentials location
  teeCredentialId: string; // rootHash on decentralized storage
  encryptedCredentials?: {
    encryptedKey: string;
    encryptedData: string;
    iv: string;
  };
  
  // Agent configuration
  modelProvider: string; // 'openai', 'anthropic', 'custom'
  modelName?: string;
  apiEndpoint?: string;
  
  // User input
  input: {
    prompt: string;
    systemPrompt?: string;
    maxTokens?: number;
    temperature?: number;
    [key: string]: any;
  };
}

export interface AgentRunResult {
  success: boolean;
  output: string;
  metadata: {
    model: string;
    provider: string;
    tokensUsed?: number;
    estimatedCost?: number;
    executionTime: number;
  };
  attestation: {
    isRealTEE: boolean;
    quote: string;
    timestamp: number;
    dataHash: string;
    provider: string;
  };
}

/**
 * Execute an agent run inside the TEE.
 * 
 * This is the main entry point for agent execution.
 */
export async function executeAgentRun(request: AgentRunRequest): Promise<AgentRunResult> {
  const startTime = Date.now();
  
  // 1. Decrypt credentials
  if (!request.encryptedCredentials) {
    throw new Error('No encrypted credentials provided');
  }
  
  const credentials = decryptCredentials(request.encryptedCredentials);
  const apiKey = credentials.apiKey;
  
  if (!apiKey) {
    throw new Error('Decrypted credentials missing apiKey');
  }
  
  // 2. Call the external AI API
  let output: string;
  let tokensUsed: number | undefined;
  let estimatedCost: number | undefined;
  let modelUsed: string;
  
  switch (request.modelProvider) {
    case 'openai':
      ({ output, tokensUsed, estimatedCost, modelUsed } = await callOpenAI(
        apiKey,
        credentials.orgId,
        request.modelName || 'gpt-4',
        request.input,
        request.apiEndpoint
      ));
      break;
      
    case 'anthropic':
      ({ output, tokensUsed, estimatedCost, modelUsed } = await callAnthropic(
        apiKey,
        request.modelName || 'claude-sonnet-4-20250514',
        request.input
      ));
      break;
      
    case 'custom':
      ({ output, tokensUsed, estimatedCost, modelUsed } = await callCustomAPI(
        apiKey,
        request.apiEndpoint || '',
        request.modelName || 'custom',
        request.input
      ));
      break;
      
    default:
      throw new Error(`Unsupported model provider: ${request.modelProvider}`);
  }
  
  const executionTime = Date.now() - startTime;
  
  // 3. Generate attestation proof
  const inputHash = crypto.createHash('sha256').update(JSON.stringify(request.input)).digest('hex');
  const outputHash = crypto.createHash('sha256').update(output).digest('hex');
  const attestation = await generateAttestation(request.agentId, inputHash, outputHash);
  
  // 4. Return result (credentials are garbage collected, never stored)
  return {
    success: true,
    output,
    metadata: {
      model: modelUsed,
      provider: request.modelProvider,
      tokensUsed,
      estimatedCost,
      executionTime,
    },
    attestation,
  };
}

// --- Provider-specific API callers ---

async function callOpenAI(
  apiKey: string,
  orgId: string | undefined,
  model: string,
  input: AgentRunRequest['input'],
  baseUrl?: string
): Promise<{ output: string; tokensUsed?: number; estimatedCost?: number; modelUsed: string }> {
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
  if (orgId) headers['OpenAI-Organization'] = orgId;
  
  const response = await fetch(baseUrl || 'https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages: [
        ...(input.systemPrompt ? [{ role: 'system' as const, content: input.systemPrompt }] : []),
        { role: 'user' as const, content: input.prompt },
      ],
      max_tokens: input.maxTokens || 1500,
      temperature: input.temperature ?? 0.7,
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${error}`);
  }
  
  const data: any = await response.json();
  const usage = data.usage;
  
  return {
    output: data.choices?.[0]?.message?.content || '',
    tokensUsed: usage ? usage.prompt_tokens + usage.completion_tokens : undefined,
    estimatedCost: usage ? estimateOpenAICost(model, usage.prompt_tokens, usage.completion_tokens) : undefined,
    modelUsed: model,
  };
}

async function callAnthropic(
  apiKey: string,
  model: string,
  input: AgentRunRequest['input']
): Promise<{ output: string; tokensUsed?: number; estimatedCost?: number; modelUsed: string }> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: input.maxTokens || 1500,
      ...(input.systemPrompt ? { system: input.systemPrompt } : {}),
      messages: [{ role: 'user', content: input.prompt }],
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${error}`);
  }
  
  const data: any = await response.json();
  const usage = data.usage;
  
  return {
    output: data.content?.[0]?.text || '',
    tokensUsed: usage ? usage.input_tokens + usage.output_tokens : undefined,
    estimatedCost: usage ? estimateAnthropicCost(model, usage.input_tokens, usage.output_tokens) : undefined,
    modelUsed: model,
  };
}

async function callCustomAPI(
  apiKey: string,
  endpoint: string,
  model: string,
  input: AgentRunRequest['input']
): Promise<{ output: string; tokensUsed?: number; estimatedCost?: number; modelUsed: string }> {
  // Custom APIs use OpenAI-compatible format by default
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        ...(input.systemPrompt ? [{ role: 'system' as const, content: input.systemPrompt }] : []),
        { role: 'user' as const, content: input.prompt },
      ],
      max_tokens: input.maxTokens || 1500,
      temperature: input.temperature ?? 0.7,
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Custom API error (${response.status}): ${error}`);
  }
  
  const data: any = await response.json();
  
  return {
    output: data.choices?.[0]?.message?.content || data.output || JSON.stringify(data),
    tokensUsed: data.usage ? data.usage.total_tokens : undefined,
    estimatedCost: undefined,
    modelUsed: model,
  };
}

// --- Cost estimation ---

function estimateOpenAICost(model: string, inputTokens: number, outputTokens: number): number {
  const rates: Record<string, { input: number; output: number }> = {
    'gpt-4': { input: 0.03, output: 0.06 },
    'gpt-4-turbo': { input: 0.01, output: 0.03 },
    'gpt-4o': { input: 0.005, output: 0.015 },
    'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
    'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
  };
  const rate = rates[model] || rates['gpt-4o'];
  return (inputTokens / 1000) * rate.input + (outputTokens / 1000) * rate.output;
}

function estimateAnthropicCost(model: string, inputTokens: number, outputTokens: number): number {
  const rates: Record<string, { input: number; output: number }> = {
    'claude-sonnet-4-20250514': { input: 0.003, output: 0.015 },
    'claude-3-5-sonnet-20241022': { input: 0.003, output: 0.015 },
    'claude-3-5-haiku-20241022': { input: 0.001, output: 0.005 },
    'claude-3-opus-20240229': { input: 0.015, output: 0.075 },
  };
  const rate = rates[model] || rates['claude-sonnet-4-20250514'];
  return (inputTokens / 1000) * rate.input + (outputTokens / 1000) * rate.output;
}
