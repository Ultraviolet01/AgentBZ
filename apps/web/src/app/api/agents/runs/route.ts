import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@agentbazaar/database';
import { jwtVerify } from 'jose';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();
// Must match ACCESS_TOKEN_SECRET used by auth.controller.ts
const secret = new TextEncoder().encode(process.env.ACCESS_TOKEN_SECRET || 'at_super-secret-key');

export async function GET(req: NextRequest) {
  try {
    // Cookie name matches auth.controller.ts — 'accessToken'
    const token = req.cookies.get('accessToken')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, secret);
    // JWT is signed with { userId } in generateTokens()
    const userId = payload.userId as string;

    const runs = await prisma.agentRun.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(runs);
  } catch (error: any) {
    console.error('Error fetching runs:', error);
    return NextResponse.json({ error: 'Failed to fetch runs' }, { status: 500 });
  }
}
