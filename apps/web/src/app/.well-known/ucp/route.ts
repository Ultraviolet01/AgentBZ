import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const PUBLIC_AGENT_STATUSES = ['active', 'live', 'approved'];
const LIVE_AGENT_ENDPOINT = 'https://agent-bz-web.vercel.app/api/agents/run';

function normalizeManifestEndpoint(rawEndpoint: string | null | undefined): string {
  if (!rawEndpoint) return LIVE_AGENT_ENDPOINT;

  try {
    const parsed = new URL(rawEndpoint);
    const hostname = parsed.hostname.toLowerCase();

    if (hostname === 'agent-bz-web.vercel.app' || hostname === 'localhost' || hostname === '127.0.0.1') {
      return rawEndpoint;
    }

    if (hostname === 'api.agentbazaar.io' && parsed.pathname === '/v1/execute') {
      return LIVE_AGENT_ENDPOINT;
    }
  } catch {
    return LIVE_AGENT_ENDPOINT;
  }

  return LIVE_AGENT_ENDPOINT;
}

const BUILT_IN_AGENTS = [
  {
    id: 'threadsmith',
    slug: 'threadsmith',
    name: 'ThreadSmith',
    description: 'AI content synthesis for Web3 project updates — generates multi-tweet threads from project data.',
    category: 'content',
    tags: ['web3', 'content', 'hedera'],
    endpoint: 'https://agent-bz-web.vercel.app/api/agents/threadsmith/run',
    webhookUrl: null,
    pricePerRun: null,
    setupFee: 0,
    icon: '🧵',
    color: '#fbbf24',
    modelProvider: 'anthropic',
    modelName: 'claude-haiku-4-5-20251001',
    hcs14TopicId: null,
    hcs14HashscanUrl: null,
    status: 'live',
    isVerified: true,
    isFeatured: true,
    builtIn: true,
    createdAt: new Date('2025-01-01T00:00:00.000Z').toISOString(),
  },
  {
    id: 'scamsniff',
    slug: 'scamsniff',
    name: 'ScamSniff',
    description: 'Security audit and honeypot/scam detection for Web3 tokens and contracts.',
    category: 'security',
    tags: ['web3', 'security', 'hedera'],
    endpoint: 'https://agent-bz-web.vercel.app/api/agents/run',
    webhookUrl: null,
    pricePerRun: null,
    setupFee: 0,
    icon: '🔍',
    color: '#f97316',
    modelProvider: 'anthropic',
    modelName: 'claude-haiku-4-5-20251001',
    hcs14TopicId: null,
    hcs14HashscanUrl: null,
    status: 'live',
    isVerified: true,
    isFeatured: true,
    builtIn: true,
    createdAt: new Date('2025-01-01T00:00:00.000Z').toISOString(),
  },
  {
    id: 'launchwatch',
    slug: 'launchwatch',
    name: 'LaunchWatch',
    description: 'Monitors token launches and market activity, alerting on FDV milestones and social spikes.',
    category: 'monitoring',
    tags: ['web3', 'monitoring', 'hedera'],
    endpoint: 'https://agent-bz-web.vercel.app/api/agents/launchwatch/setup',
    webhookUrl: null,
    pricePerRun: null,
    setupFee: 0,
    icon: '📡',
    color: '#38bdf8',
    modelProvider: 'anthropic',
    modelName: 'claude-haiku-4-5-20251001',
    hcs14TopicId: null,
    hcs14HashscanUrl: null,
    status: 'live',
    isVerified: true,
    isFeatured: true,
    builtIn: true,
    createdAt: new Date('2025-01-01T00:00:00.000Z').toISOString(),
  },
];

export async function GET() {
  try {
    const deployedAgents = await prisma.deployedAgent.findMany({
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

    const manifest = {
      protocol: 'agentbazaar-directory',
      version: '1.0.0',
      name: 'AgentBazaar Public Agent Directory',
      description:
        'Public directory manifest for discoverable AgentBazaar agents. This is a directory-style discovery endpoint, not a full UCP protocol implementation.',
      isPublic: true,
      source: 'https://agent-bz-web.vercel.app/.well-known/ucp',
      generatedAt: new Date().toISOString(),
      agents: [
        ...BUILT_IN_AGENTS,
        ...deployedAgents.map((agent) => ({
          id: agent.id,
          slug: agent.slug,
          name: agent.name,
          description: agent.description,
          category: agent.category,
          tags: agent.tags,
          endpoint: normalizeManifestEndpoint(agent.apiEndpoint),
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
      ],
    };

    return NextResponse.json(manifest, {
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=60',
      },
    });
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
        agents: BUILT_IN_AGENTS,
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
