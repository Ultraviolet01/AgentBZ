import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

/**
 * GET /api/agents/deployed/[slug]
 * 
 * Fetch deployed agent details by slug.
 * Used by the agent detail page.
 */

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    const agent = await prisma.deployedAgent.findUnique({
      where: { slug },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: { runs: true, reviews: true },
        },
      },
    });

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Sanitize — never expose sensitive fields
    return NextResponse.json({
      agent: {
        id: agent.id,
        name: agent.name,
        slug: agent.slug,
        description: agent.description,
        longDescription: agent.longDescription,
        category: agent.category,
        tags: agent.tags,
        icon: agent.icon,
        color: agent.color,
        coverImage: agent.coverImage,
        screenshots: agent.screenshots,
        
        // Pricing
        pricePerRun: agent.pricePerRun,
        setupFee: agent.setupFee,
        
        // Technical (safe to show)
        modelProvider: agent.modelProvider,
        modelName: agent.modelName,
        capabilities: agent.capabilities,
        inputSchema: agent.inputSchema,
        outputSchema: agent.outputSchema,
        
        // Documentation
        readme: agent.readme,
        examples: agent.examples,
        videoUrl: agent.videoUrl,
        
        // Status
        status: agent.status,
        isVerified: agent.isVerified,
        isFeatured: agent.isFeatured,
        
        // TEE
        requiresCredentials: agent.requiresCredentials,

        // Analytics
        totalRuns: agent.totalRuns,
        totalRevenue: agent.totalRevenue,
        averageRating: agent.averageRating,
        reviewCount: agent._count.reviews,
        
        // Creator
        creator: agent.user,
        
        // Reviews
        reviews: agent.reviews,
        
        // Timestamps
        createdAt: agent.createdAt,
        approvedAt: agent.approvedAt,
      },
    });
  } catch (error: any) {
    console.error('[Deployed Agent] Error:', error.message);
    return NextResponse.json(
      { error: 'Failed to fetch agent' },
      { status: 500 }
    );
  }
}
