import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@agentbazaar/database';
import { jwtVerify } from 'jose';
import { executeAgent } from '@/lib/agent-executor';
import { executeAgentViaKeeperHub } from '@/lib/keeperhub';
import { retrieveAgentKeys } from '@/lib/cdr-server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/agents/run
 *
 * Execute a custom agent.
 *
 * Flow:
 * 1. Authenticate buyer via JWT
 * 2. Find the agent record in DB
 * 3. If the agent has CDR-vaulted API keys, retrieve them server-side
 *    using the platform wallet (no buyer wallet signature required —
 *    the x402 payment is the authorisation proof)
 * 4. Execute via KeeperHub (x402 payment) or fallback to direct LLM call
 * 5. Discard keys, record the run, return result + txHash
 */

const prisma = new PrismaClient();
// Use ACCESS_TOKEN_SECRET to match the Express API token signing
const JWT_SECRET = new TextEncoder().encode(process.env.ACCESS_TOKEN_SECRET || 'at_super-secret-key');

export async function POST(req: NextRequest) {
  try {
    // ── 1. Authenticate ───────────────────────────────────────────────────────
    // Cookie name matches what auth.controller.ts sets: 'accessToken'
    const token = req.cookies.get('accessToken')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    // JWT is signed with { userId } — matches auth.controller.ts generateTokens()
    const userId = payload.userId as string;

    const body = await req.json();
    const { agentSlug, input, txHash: clientTxHash } = body;

    if (!agentSlug || !input?.prompt) {
      return NextResponse.json(
        { error: 'Missing required fields: agentSlug, input.prompt' },
        { status: 400 }
      );
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

    // ── 4. Execute via KeeperHub (Payment Gate — MUST run first) ─────────────
    // Two paths:
    //   A) Connected wallet: clientTxHash provided = buyer already paid on-chain directly.
    //      Skip KeeperHub, treat clientTxHash as payment proof, proceed to CDR + LLM.
    //   B) No wallet (Web2): No clientTxHash. KeeperHub platform payer wallet
    //      auto-signs the x402 challenge and settles on Base.
    const logic = agent.readme || agent.description || '';
    let apiKeys: { name: string; value: string }[] = [];
    let result: Awaited<ReturnType<typeof executeAgent>>;
    let txHash: string | null = clientTxHash || null;

    if (clientTxHash) {
      // ── Path A: Connected wallet paid directly — txHash is the payment proof ─
      console.log(`[Run] Direct wallet payment confirmed — txHash: ${clientTxHash}`);

      // Now safe to retrieve CDR keys (payment already settled on-chain)
      if (agent.cdrKeysVaultUuid) {
        try {
          apiKeys = await retrieveAgentKeys(agent.cdrKeysVaultUuid);
        } catch (cdrErr: any) {
          console.error('[Run] CDR key retrieval failed:', cdrErr.message);
        }
      }

      result = await executeAgent({
        logic,
        apiKeys: apiKeys || [],
        modelProvider: agent.modelProvider,
        modelName: agent.modelName || undefined,
        apiEndpoint: agent.apiEndpoint || undefined,
        input,
      });
    } else {
      // ── Path B: KeeperHub platform payer wallet handles x402 payment ──────────
      const workflowSlug = agent.keeperhubSlug || agent.slug;
      const keeperHubResult = await executeAgentViaKeeperHub(workflowSlug, input, null);

      if (keeperHubResult.txHash || keeperHubResult.output?.skipped !== true) {
        // Payment confirmed by KeeperHub — now retrieve CDR keys
        txHash = keeperHubResult.txHash || null;
        console.log(`[Run] KeeperHub payment confirmed — txHash: ${txHash}`);

        if (agent.cdrKeysVaultUuid) {
          try {
            apiKeys = await retrieveAgentKeys(agent.cdrKeysVaultUuid);
          } catch (cdrErr: any) {
            console.error('[Run] CDR key retrieval failed:', cdrErr.message);
          }
        }

        result = {
          output: keeperHubResult.output,
          model: agent.modelProvider,
          provider: agent.modelProvider,
          tokensUsed: 0,
          estimatedCost: 0,
          executionTime: 0,
        } as Awaited<ReturnType<typeof executeAgent>>;
      } else {
        // Fallback: KeeperHub unconfigured/skipped — execute directly
        if (agent.cdrKeysVaultUuid) {
          try {
            apiKeys = await retrieveAgentKeys(agent.cdrKeysVaultUuid);
          } catch (cdrErr: any) {
            console.error('[Run] CDR key retrieval failed:', cdrErr.message);
          }
        }

        result = await executeAgent({
          logic,
          apiKeys: apiKeys || [],
          modelProvider: agent.modelProvider,
          modelName: agent.modelName || undefined,
          apiEndpoint: agent.apiEndpoint || undefined,
          input,
        });
      }
    }

    // ── 5. Record Run + Buyer & Treasury Transactions ────────────────────────
    const feePercent = Number(process.env.TREASURY_FEE_PERCENT || '10') / 100;
    const creatorShare = agent.pricePerRun * (1 - feePercent); // 90%
    const treasuryShare = agent.pricePerRun * feePercent;       // 10%
    const treasuryAddress = process.env.TREASURY_WALLET_ADDRESS || '0xd6C48a201B275A21966Aef9D6C1bc087e754D848';

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
      // Record treasury fee (10% platform cut → 0xd6C48a201B275A21966Aef9D6C1bc087e754D848)
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
        keeperhubSlug: agent.keeperhubSlug,
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
