import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@agentbazaar/database';
import { jwtVerify } from 'jose';
import { executeAgent } from '@/lib/agent-executor';
import { decryptApiKeys } from '@/lib/key-vault';

export const dynamic = 'force-dynamic';

/**
 * POST /api/agents/run
 *
 * Execute a custom agent.
 *
 * Flow:
 * 1. Authenticate buyer via JWT
 * 2. Find the agent record in DB
 * 3. If the agent has encrypted API keys, decrypt them using the vault
 * 4. Execute via agent executor
 * 5. Discard keys, record the run, return result + txHash
 */

const prisma = new PrismaClient();
// Use ACCESS_TOKEN_SECRET to match the Express API token signing
const JWT_SECRET = new TextEncoder().encode(process.env.ACCESS_TOKEN_SECRET || 'at_super-secret-key');

export async function POST(req: NextRequest) {
  try {
    // ── 1. Authenticate ───────────────────────────────────────────────────────
    const token = req.cookies.get('accessToken')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as string;

    const body = await req.json();
    const { agentSlug, input, txHash: clientTxHash } = body;

    if (!agentSlug || !input?.prompt) {
      return NextResponse.json(
        { error: 'Missing required fields: agentSlug, input.prompt' },
        { status: 400 }
      );
    }

    // ── 2. Find Agent ─────────────────────────────────────────────────────────
    const agent = await prisma.deployedAgent.findUnique({
      where: { slug: agentSlug },
    });

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    if (agent.status !== 'live' && agent.status !== 'approved') {
      return NextResponse.json(
        { error: `Agent is not available (status: ${agent.status})` },
        { status: 403 }
      );
    }

    // ── 3. Execute Agent ──────────────────────────────────────────────────────
    // Use stored logic (system prompt) — fallback to readme/description for legacy agents
    const logic = agent.logic || agent.readme || agent.description || '';
    let apiKeys: { name: string; value: string }[] = [];
    let txHash: string | null = clientTxHash || null;

    // Decrypt API keys from vault — keys are in-memory only, never logged
    if (agent.encryptedApiKeys) {
      apiKeys = decryptApiKeys(agent.encryptedApiKeys);
    }

    const result = await executeAgent({
      logic,
      apiKeys: apiKeys || [],
      modelProvider: agent.modelProvider,
      modelName: agent.modelName || undefined,
      apiEndpoint: agent.apiEndpoint || undefined,
      input,
    });

    // ── 4. Record Run + Buyer & Treasury Transactions ────────────────────────
    const feePercent = Number(process.env.TREASURY_FEE_PERCENT || '10') / 100;
    const creatorShare = agent.pricePerRun * (1 - feePercent); // 90%
    const treasuryShare = agent.pricePerRun * feePercent;       // 10%
    const treasuryAddress = process.env.TREASURY_WALLET_ADDRESS || '0.0.XXXXXX';

    await prisma.$transaction([
      // Update agent analytics
      prisma.deployedAgent.update({
        where: { id: agent.id },
        data: {
          totalRuns: { increment: 1 },
          totalRevenue: { increment: agent.pricePerRun },
          totalApiCost: { increment: result.estimatedCost || 0 },
        },
      }),
      // Record run history
      prisma.agentRun.create({
        data: {
          userId,
          agentType: agent.slug,
          deployedAgentId: agent.id,
          creditsUsed: agent.pricePerRun,
          inputData: input,
          outputData: {
            content: result.output,
            metadata: {
              model: result.model,
              provider: result.provider,
              tokensUsed: result.tokensUsed,
              estimatedCost: result.estimatedCost,
              executionTime: result.executionTime,
              txHash,
            },
          },
          status: 'COMPLETED',
        },
      }),
      // Record buyer payment transaction (full run cost)
      prisma.transaction.create({
        data: {
          userId,
          amount: agent.pricePerRun,
          type: 'AGENT_RUN',
          status: txHash ? 'CONFIRMED' : 'COMPLETED',
          description: `Ran agent: ${agent.name}`,
          txHash: txHash || undefined,
        },
      }),
      // Record treasury fee (10% platform cut)
      prisma.transaction.create({
        data: {
          userId,
          amount: treasuryShare,
          type: 'PLATFORM_FEE',
          status: 'COMPLETED',
          description: `Platform fee (${Math.round(feePercent * 100)}%) for agent: ${agent.name} → ${treasuryAddress}`,
          txHash: txHash || undefined,
        },
      }),
    ]);

    // ── 5. Return Result ──────────────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      output: result.output,
      metadata: {
        model: result.model,
        provider: result.provider,
        tokensUsed: result.tokensUsed,
        estimatedCost: result.estimatedCost,
        executionTime: result.executionTime,
        creditsUsed: agent.pricePerRun,
        creatorEarned: creatorShare,
        txHash,
      },
      txHash,
    });
  } catch (error: any) {
    console.error('[Agent Run] Error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Agent execution failed' },
      { status: 500 }
    );
  }
}
