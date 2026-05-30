import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { jwtVerify } from 'jose';
import { verifyMessage } from 'viem';
import { executeAgent } from '@/lib/agent-executor';
import type { ApiKey } from '@/lib/cdr-client';

export const dynamic = 'force-dynamic';

/**
 * POST /api/agents/run
 *
 * Execute a custom agent using CDR-unlocked credentials (Option 1 — Buyer Signature Relay).
 *
 * Flow:
 * 1. Authenticate user via JWT
 * 2. Verify the buyer's wallet signature (proves on-chain identity match)
 * 3. Accept the CDR-decrypted { logic, apiKeys } from the client
 * 4. Deduct credits
 * 5. Execute the agent directly using the decrypted credentials
 * 6. Record the run and return results
 */

const prisma = new PrismaClient();
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export async function POST(req: NextRequest) {
  try {
    // ── 1. Authenticate ───────────────────────────────────────────────────────
    const token = req.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.id as string;

    const body = await req.json();
    const {
      agentSlug,
      input,
      // CDR-decrypted content from buyer's browser
      accessedContent,
      // Buyer wallet signature relay (Option 1)
      buyerAddress,
      buyerSignature,
      signatureMessage,
    } = body;

    if (!agentSlug || !input?.prompt) {
      return NextResponse.json(
        { error: 'Missing required fields: agentSlug, input.prompt' },
        { status: 400 }
      );
    }

    if (!accessedContent?.logic) {
      return NextResponse.json(
        { error: 'Missing accessedContent from CDR unlock. Ensure the buyer called accessAgentCDR() first.' },
        { status: 400 }
      );
    }

    // ── 2. Verify Buyer Wallet Signature ─────────────────────────────────────
    // The buyer signed a message in their browser wallet before calling this endpoint.
    // We verify it here to confirm their on-chain identity (Option 1 relay).
    if (buyerAddress && buyerSignature && signatureMessage) {
      try {
        const valid = await verifyMessage({
          address: buyerAddress as `0x${string}`,
          message: signatureMessage,
          signature: buyerSignature as `0x${string}`,
        });
        if (!valid) {
          return NextResponse.json({ error: 'Invalid buyer wallet signature' }, { status: 401 });
        }
        console.log(`[Run] Buyer wallet verified: ${buyerAddress}`);
      } catch {
        return NextResponse.json({ error: 'Failed to verify buyer wallet signature' }, { status: 401 });
      }
    }

    // ── 3. Find Agent ─────────────────────────────────────────────────────────
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

    // ── 4. Check Credits ──────────────────────────────────────────────────────
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    });

    if (!user || user.credits < agent.pricePerRun) {
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          required: agent.pricePerRun,
          current: user?.credits || 0,
        },
        { status: 402 }
      );
    }

    // ── 5. Execute Agent with CDR-decrypted credentials ───────────────────────
    const { logic, apiKeys } = accessedContent as { logic: string; apiKeys: ApiKey[] };

    const result = await executeAgent({
      logic,
      apiKeys: apiKeys || [],
      modelProvider: agent.modelProvider,
      modelName: agent.modelName || undefined,
      apiEndpoint: agent.apiEndpoint || undefined,
      input,
    });

    // ── 6. Deduct Credits & Record Run ────────────────────────────────────────
    const creatorShare = agent.pricePerRun * 0.9;

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { credits: { decrement: agent.pricePerRun } },
      }),
      prisma.user.update({
        where: { id: agent.userId },
        data: { credits: { increment: creatorShare } },
      }),
      prisma.deployedAgent.update({
        where: { id: agent.id },
        data: {
          totalRuns: { increment: 1 },
          totalRevenue: { increment: agent.pricePerRun },
          totalApiCost: { increment: result.estimatedCost || 0 },
        },
      }),
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
            },
          },
          status: 'COMPLETED',
        },
      }),
    ]);

    // ── 7. Return Result ──────────────────────────────────────────────────────
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
        cdrVerified: !!(buyerAddress && buyerSignature),
      },
    });
  } catch (error: any) {
    console.error('[Agent Run] Error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Agent execution failed' },
      { status: 500 }
    );
  }
}
