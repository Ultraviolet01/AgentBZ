import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

export const dynamic = 'force-dynamic';

const secret = new TextEncoder().encode(process.env.ACCESS_TOKEN_SECRET || 'at_super-secret-key');

async function getUserId(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get('accessToken')?.value || req.cookies.get('auth_token')?.value;
  let userId: string | null = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, secret);
      userId = (payload.userId || payload.id) as string;
    } catch (err) {
      console.warn('[Projects API] Token verification failed');
    }
  }

  if (!userId) {
    const fallbackUser = await prisma.user.findFirst({ select: { id: true } });
    if (fallbackUser) userId = fallbackUser.id;
  }

  return userId;
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return NextResponse.json([]);
    }

    const projects = await prisma.project.findMany({
      where: { userId },
      include: { _count: { select: { agentRuns: true, memories: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(projects);
  } catch (error: any) {
    console.error('Fetch projects error:', error);
    return NextResponse.json([], { status: 200 }); // Return empty list gracefully
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, websiteUrl, tokenAddress, twitterHandle, notes } = body;

    if (!name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    const project = await prisma.project.create({
      data: {
        userId,
        name,
        description,
        websiteUrl,
        tokenAddress,
        twitterHandle,
        notes,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error: any) {
    console.error('Create project error:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
