import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const PUBLIC_AGENT_STATUSES = ['active', 'live', 'approved'];

export async function GET() {
  try {
    const agents = await prisma.deployedAgent.findMany({
      where: {
        status: {
          in: PUBLIC_AGENT_STATUSES,
        },
      },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        category: true,
        tags: true,
        apiEndpoint: true,
        webhookUrl: true,
        modelProvider: true,
        modelName: true,
        pricePerRun: true,
        setupFee: true,
        icon: true,
        color: true,
        hcs14TopicId: true,
        hcs14HashscanUrl: true,
        status: true,
        isVerified: true,
        isFeatured: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(
      {
        protocol: 'agentbazaar-directory',
        version: '1.0.0',
        name: 'AgentBazaar Public Agent Directory',
        description:
          'Public directory manifest for discoverable AgentBazaar agents. This is a directory-style discovery endpoint, not a full UCP protocol implementation.',
        isPublic: true,
        source: 'https://agent-bz-web.vercel.app/.well-known/ucp',
        generatedAt: new Date().toISOString(),
        agents: agents.map((agent) => ({
          id: agent.id,
          slug: agent.slug,
          name: agent.name,
          description: agent.description,
          category: agent.category,
          tags: agent.tags,
          endpoint: agent.apiEndpoint,
          webhookUrl: agent.webhookUrl,
          pricePerRun: agent.pricePerRun,
          setupFee: agent.setupFee,
          icon: agent.icon,
          color: agent.color,
          modelProvider: agent.modelProvider,
          modelName: agent.modelName,
          hcs14TopicId: agent.hcs14TopicId,
          hcs14HashscanUrl: agent.hcs14HashscanUrl,
          status: agent.status,
          isVerified: agent.isVerified,
          isFeatured: agent.isFeatured,
          createdAt: agent.createdAt.toISOString(),
        })),
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=60, s-maxage=60',
        },
      },
    );
  } catch (error) {
    console.error('[Discovery] /.well-known/ucp error:', error);

    return NextResponse.json(
      {
        protocol: 'agentbazaar-directory',
        version: '1.0.0',
        name: 'AgentBazaar Public Agent Directory',
        description:
          'Public directory manifest for discoverable AgentBazaar agents. This is a directory-style discovery endpoint, not a full UCP protocol implementation.',
        isPublic: true,
        agents: [],
        error: 'Failed to load public agent directory',
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    );
  }
}
