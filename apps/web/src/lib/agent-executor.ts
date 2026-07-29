/**
 * Agent Executor — Server-side LLM runner
 *
 * Called by /api/agents/run to execute the agent against the configured
 * AI provider using credentials passed through from the agent record.
 */

export interface ApiKey {
  name: string;
  value: string;
}

export interface ExecutionRequest {
  logic: string;
  apiKeys: ApiKey[];
  modelProvider: string;
  modelName?: string;
  apiEndpoint?: string;
  input: {
    prompt: string;
    systemPrompt?: string;
    maxTokens?: number;
    temperature?: number;
    [key: string]: unknown;
  };
}

export interface ExecutionResult {
  output: string;
  model: string;
  provider: string;
  tokensUsed?: number;
  estimatedCost?: number;
  executionTime: number;
}

// ─── Main Entry ───────────────────────────────────────────────────────────────

export async function executeAgent(req: ExecutionRequest): Promise<ExecutionResult> {
  const startTime = Date.now();

  // Build a key-value map from the decrypted ApiKey array
  const keyMap: Record<string, string> = {};
  for (const k of req.apiKeys) {
    keyMap[k.name] = k.value;
  }

  // Merge the agent's logic as a system prompt if not already provided
  const systemPrompt = req.input.systemPrompt || req.logic;

  let output: string;
  let tokensUsed: number | undefined;
  let estimatedCost: number | undefined;
  let modelUsed: string;

  switch (req.modelProvider) {
    case 'openai': {
      const apiKey = keyMap['OPENAI_API_KEY'] || keyMap['openai_api_key'];
      if (!apiKey) throw new Error('OpenAI API key not found in decrypted credentials');
      ({ output, tokensUsed, estimatedCost, modelUsed } = await callOpenAI(
        apiKey,
        keyMap['OPENAI_ORG_ID'],
        req.modelName || 'gpt-4o',
        { ...req.input, systemPrompt },
        req.apiEndpoint
      ));
      break;
    }

    case 'anthropic': {
      const apiKey = keyMap['ANTHROPIC_API_KEY'] || keyMap['anthropic_api_key'];
      if (!apiKey) throw new Error('Anthropic API key not found in decrypted credentials');
      ({ output, tokensUsed, estimatedCost, modelUsed } = await callAnthropic(
        apiKey,
        req.modelName || 'claude-sonnet-4-20250514',
        { ...req.input, systemPrompt }
      ));
      break;
    }

    case 'custom': {
      const apiKey = keyMap['API_KEY'] || keyMap['custom_api_key'] || Object.values(keyMap)[0] || '';
      const endpoint = req.apiEndpoint;
      if (!endpoint) throw new Error('Custom model provider requires an API endpoint');
      ({ output, tokensUsed, estimatedCost, modelUsed } = await callCustom(
        apiKey,
        endpoint,
        req.modelName || 'custom',
        { ...req.input, systemPrompt }
      ));
      break;
    }

    default:
      throw new Error(`Unsupported model provider: ${req.modelProvider}`);
  }

  return {
    output,
    model: modelUsed,
    provider: req.modelProvider,
    tokensUsed,
    estimatedCost,
    executionTime: Date.now() - startTime,
  };
}

// ─── Provider Callers ─────────────────────────────────────────────────────────

async function callOpenAI(
  apiKey: string,
  orgId: string | undefined,
  model: string,
  input: ExecutionRequest['input'],
  baseUrl?: string
): Promise<{ output: string; tokensUsed?: number; estimatedCost?: number; modelUsed: string }> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
  if (orgId) headers['OpenAI-Organization'] = orgId;

  const res = await fetch(baseUrl || 'https://api.openai.com/v1/chat/completions', {
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

  if (!res.ok) throw new Error(`OpenAI error (${res.status}): ${await res.text()}`);
  const data: any = await res.json();
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
  input: ExecutionRequest['input']
): Promise<{ output: string; tokensUsed?: number; estimatedCost?: number; modelUsed: string }> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
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

  if (!res.ok) throw new Error(`Anthropic error (${res.status}): ${await res.text()}`);
  const data: any = await res.json();
  const usage = data.usage;

  return {
    output: data.content?.[0]?.text || '',
    tokensUsed: usage ? usage.input_tokens + usage.output_tokens : undefined,
    estimatedCost: usage ? estimateAnthropicCost(model, usage.input_tokens, usage.output_tokens) : undefined,
    modelUsed: model,
  };
}

async function callCustom(
  apiKey: string,
  endpoint: string,
  model: string,
  input: ExecutionRequest['input']
): Promise<{ output: string; tokensUsed?: number; estimatedCost?: number; modelUsed: string }> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
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

  if (!res.ok) throw new Error(`Custom API error (${res.status}): ${await res.text()}`);
  const data: any = await res.json();

  return {
    output: data.choices?.[0]?.message?.content || data.output || JSON.stringify(data),
    tokensUsed: data.usage?.total_tokens,
    estimatedCost: undefined,
    modelUsed: model,
  };
}

// ─── Cost Estimation ──────────────────────────────────────────────────────────

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
