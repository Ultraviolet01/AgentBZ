import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@agentbazaar/database';
import { jwtVerify } from 'jose';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();
const secret = new TextEncoder().encode(process.env.ACCESS_TOKEN_SECRET || 'at_super-secret-key');

export async function GET(req: NextRequest) {
  try {
    let userId: string | null = null;
    const token =
      req.cookies.get('accessToken')?.value ||
      req.cookies.get('auth_token')?.value ||
      req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

    if (token) {
      try {
        const { payload } = await jwtVerify(token, secret);
        userId = (payload.userId || payload.id) as string;
      } catch {}
    }

    const { searchParams } = new URL(req.url);
    const walletAddressQuery = searchParams.get('walletAddress');

    if (!userId && walletAddressQuery) {
      const matched = await prisma.user.findFirst({
        where: {
          walletAddress: {
            equals: walletAddressQuery,
            mode: 'insensitive',
          },
        },
      });
      if (matched) userId = matched.id;
    }

    if (!userId) {
      const fallback = await prisma.user.findFirst({
        orderBy: { createdAt: 'desc' },
      });
      if (fallback) userId = fallback.id;
    }

    if (!userId) {
      return NextResponse.json({
        totalRuns: 0,
        lifetimeSpentHbar: 0,
        walletAddress: walletAddressQuery || null,
        runs: [],
        transactions: [],
      });
    }

    const [runs, transactions, user] = await Promise.all([
      prisma.agentRun.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { walletAddress: true },
      }),
    ]);

    const totalRuns = runs.length;
    const spentFromRuns = runs.reduce((sum, r) => sum + (r.creditsUsed || 1.0), 0);
    const spentFromTxs = transactions
      .filter((t) => t.type === 'AGENT_RUN' || t.type === 'DEBIT')
      .reduce((sum, t) => sum + t.amount, 0);

    const lifetimeSpentHbar = Math.max(spentFromRuns, spentFromTxs);

    return NextResponse.json({
      totalRuns,
      lifetimeSpentHbar,
      walletAddress: user?.walletAddress || walletAddressQuery || null,
      runs,
      transactions,
    });
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}
