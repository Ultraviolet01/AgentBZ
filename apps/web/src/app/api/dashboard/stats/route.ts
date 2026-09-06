import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@agentbazaar/database';
import { jwtVerify } from 'jose';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();
const secret = new TextEncoder().encode(process.env.ACCESS_TOKEN_SECRET || 'at_super-secret-key');

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('accessToken')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;

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
      walletAddress: user?.walletAddress || null,
      runs,
      transactions,
    });
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}
