import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@agentbazaar/database';
import { jwtVerify } from 'jose';
import { executeAgent } from '@/lib/agent-executor';
import { decryptApiKeys } from '@/lib/key-vault';
import {
  buildHederaPaymentRequirements,
  verifyWithBlocky402,
  settleWithBlocky402,
} from '@/lib/blocky402';

export const dynamic = 'force-dynamic';

/**
 * POST /api/agents/run
 *
 * Execute a custom agent with Hedera x402 payment verification.
 *
 * Flow:
 * 1. Authenticate buyer via JWT
 * 2. Find the agent record in DB
 * 3. If agent has pricePerRun > 0:
 *    a. If no payment payload provided, return 402 with payment requirements
 *    b. Verify & settle payment via Blocky402 (payer-signed Hedera TransferTransaction)
 * 4. Decrypt agent API keys and execute via agent executor
 * 5. Record run history & transactions, return output + Hedera tx details
 */

const prisma = new PrismaClient();
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
    const { agentSlug, input, paymentPayloadTransaction, paymentPayload: directPayload } = body;

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

    let settledTransactionId: string | null = null;
    let payerAccountId: string = '0.0.unknown';

    // ── 3. Handle Payment (x402 Exact Scheme) ─────────────────────────────────
    if (agent.pricePerRun > 0) {
      const paymentRequirements = await buildHederaPaymentRequirements(
        agent.pricePerRun,
        `/api/agents/run`,
        `Pay to execute agent: ${agent.name}`
      );

      // Check for X-Payment header or body payload
      const xPaymentHeader = req.headers.get('X-Payment');
      let paymentPayload: any = null;

      if (xPaymentHeader) {
        try {
          paymentPayload = JSON.parse(
            Buffer.from(xPaymentHeader, 'base64').toString('utf-8')
          );
        } catch {
          return NextResponse.json(
            { error: 'Invalid X-Payment header format' },
            { status: 402 }
          );
        }
      } else if (directPayload) {
        paymentPayload = directPayload;
      } else if (paymentPayloadTransaction) {
        paymentPayload = {
          x402Version: 2,
          scheme: 'exact',
          network: 'hedera:testnet',
          accepted: paymentRequirements,
          payload: { transaction: paymentPayloadTransaction },
        };
      }

      // If no valid payment payload supplied, challenge with 402
      if (!paymentPayload) {
        const paymentRequiredBase64 = Buffer.from(
          JSON.stringify(paymentRequirements)
        ).toString('base64');

        return new NextResponse(
          JSON.stringify({
            error: 'Payment required',
            paymentRequirements,
            breakdown: {
              agentFee: `${agent.pricePerRun} HBAR`,
              platformFee: '0.5 HBAR',
              total: `${agent.pricePerRun + 0.5} HBAR`,
            },
          }),
          {
            status: 402,
            headers: {
              'Content-Type': 'application/json',
              'PAYMENT-REQUIRED': paymentRequiredBase64,
            },
          }
        );
      }

      // Verify payment with Blocky402
      const { isValid, payer, error: verifyError } = await verifyWithBlocky402(
        paymentPayload,
        paymentRequirements
      );

      if (!isValid) {
        return NextResponse.json(
          { error: `Payment verification failed: ${verifyError}` },
          { status: 402 }
        );
      }

      payerAccountId = payer || payerAccountId;

      // Settle payment on Hedera Testnet
      const { success, transaction, error: settleError } =
        await settleWithBlocky402(paymentPayload, paymentRequirements);

      if (!success || !transaction) {
        return NextResponse.json(
          { error: `Payment settlement failed: ${settleError}` },
          { status: 402 }
        );
      }

      settledTransactionId = transaction;
    }

    // ── 4. Execute Agent ──────────────────────────────────────────────────────
    const logic = agent.logic || agent.readme || agent.description || '';
    let apiKeys: { name: string; value: string }[] = [];

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

    // ── 5. Record Run + Transactions ──────────────────────────────────────────
    const feePercent = Number(process.env.TREASURY_FEE_PERCENT || '10') / 100;
    const creatorShare = agent.pricePerRun * (1 - feePercent);
    const treasuryShare = agent.pricePerRun * feePercent;
    const treasuryAddress = process.env.TREASURY_WALLET_ADDRESS || '0.0.XXXXXX';

    await prisma.$transaction([
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
              txHash: settledTransactionId,
              payer: payerAccountId,
            },
          },
          status: 'COMPLETED',
        },
      }),
      prisma.transaction.create({
        data: {
          userId,
          amount: agent.pricePerRun,
          type: 'AGENT_RUN',
          status: settledTransactionId ? 'CONFIRMED' : 'COMPLETED',
          description: `Ran agent: ${agent.name}`,
          txHash: settledTransactionId || undefined,
        },
      }),
      ...(treasuryShare > 0
        ? [
            prisma.transaction.create({
              data: {
                userId,
                amount: treasuryShare,
                type: 'PLATFORM_FEE',
                status: 'COMPLETED',
                description: `Platform fee (${Math.round(feePercent * 100)}%) for agent: ${agent.name} → ${treasuryAddress}`,
                txHash: settledTransactionId || undefined,
              },
            }),
          ]
        : []),
    ]);

    // ── 6. Return Result ──────────────────────────────────────────────────────
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
        txHash: settledTransactionId,
        hashscanUrl: settledTransactionId
          ? `https://hashscan.io/testnet/transaction/${settledTransactionId}`
          : undefined,
      },
      txHash: settledTransactionId,
    });
  } catch (error: any) {
    console.error('[Agent Run] Error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Agent execution failed' },
      { status: 500 }
    );
  }
}
