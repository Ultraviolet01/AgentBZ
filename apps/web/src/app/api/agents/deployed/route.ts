import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/agents/deployed
 * 
 * Fetch all public active deployed agents for the Marketplace catalog.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const where: any = {
      NOT: {
        status: 'deleted',
      },
    };

    if (category && category !== 'all') {
      where.category = {
        equals: category,
        mode: 'insensitive',
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { hasSome: [search] } },
      ];
    }

    const agents = await prisma.deployedAgent.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        _count: {
          select: {
            runs: true,
            reviews: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const sanitizedAgents = agents.map((agent: any) => ({
      id: agent.id,
      name: agent.name,
      slug: agent.slug,
      description: agent.description,
      longDescription: agent.longDescription,
      category: agent.category,
      tags: agent.tags,
      icon: agent.icon,
      color: agent.color,
      pricePerRun: agent.pricePerRun,
      setupFee: agent.setupFee,
      runsCount: agent.totalRuns || agent._count?.runs || 0,
      reviewsCount: agent._count?.reviews || 0,
      rating: agent.avgRating || 5.0,
      deployMode: agent.deployMode || "PUBLIC",
      creator: agent.user?.username || 'Community Builder',
      builderAccountId: agent.builderAccountId || '0.0.10368450',
      createdAt: agent.createdAt,
    }));


    return NextResponse.json({
      success: true,
      agents: sanitizedAgents,
    });
  } catch (err: any) {
    console.error('[API] /api/agents/deployed error:', err);
    return NextResponse.json({ error: 'Failed to fetch deployed agents' }, { status: 500 });
  }
}
