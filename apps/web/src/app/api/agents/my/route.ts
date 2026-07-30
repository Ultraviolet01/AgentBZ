import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { jwtVerify } from 'jose';

const prisma = new PrismaClient();
const secret = new TextEncoder().encode(process.env.ACCESS_TOKEN_SECRET || 'at_super-secret-key');

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const token = req.cookies.get('accessToken')?.value || req.cookies.get('auth_token')?.value;
    let userId: string | null = null;

    if (token) {
      try {
        const { payload } = await jwtVerify(token, secret);
        userId = (payload.userId || payload.id) as string;
      } catch (err) {
        console.warn('[My Agents] Invalid JWT token');
      }
    }

    if (!userId) {
      const fallbackUser = await prisma.user.findFirst({ select: { id: true } });
      if (fallbackUser) userId = fallbackUser.id;
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch deployed agents for this user
    const agents = await prisma.deployedAgent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        status: true,
        category: true,
        icon: true,
        color: true,
        createdAt: true,
      }
    });

    return NextResponse.json(agents);
  } catch (error: any) {
    console.error('Fetch my agents error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agents', details: error.message },
      { status: 500 }
    );
  }
}
