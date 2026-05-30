import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { jwtVerify } from 'jose';
import { deployAgentCDR } from '@/lib/cdr-server';
import type { ApiKey } from '@/lib/cdr-client';

export const dynamic = 'force-dynamic';

/**
 * POST /api/agents/deploy
 *
 * Deploy a new custom agent with CDR-vaulted credentials.
 *
 * Flow:
 * 1. Validate authentication and input
 * 2. Call deployAgentCDR() — vaults logic + API keys on Story Protocol
 * 3. Create DeployedAgent record (stores CDR vault UUIDs, NOT plaintext keys)
 */

const prisma = new PrismaClient();
const secret = new TextEncoder().encode(process.env.ACCESS_TOKEN_SECRET || 'at_super-secret-key');

export async function POST(req: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const token = req.cookies.get('accessToken')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;

    const body = await req.json();
    const {
      name,
      description,
      longDescription,
      category,
      tags,
      apiEndpoint,
      webhookUrl,
      modelProvider,
      modelName,
      pricePerRun,
      setupFee,
      icon,
      color,
      readme,
      inputSchema,
      outputSchema,
      examples,
      // CDR fields — passed as plain text; server vaults them
      logic,
      apiKeys,        // ApiKey[] | undefined
      credentialSchema,
    } = body;

    // ── Validation ────────────────────────────────────────────────────────────
    if (!name || !description || !category || !pricePerRun) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!logic) {
      return NextResponse.json({ error: 'Agent logic (system prompt) is required' }, { status: 400 });
    }

    // ── Slug ──────────────────────────────────────────────────────────────────
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const existing = await prisma.deployedAgent.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: 'An agent with this name already exists' }, { status: 400 });
    }

    // ── CDR Vault ─────────────────────────────────────────────────────────────
    let cdrVaultUuid: number | null = null;
    let cdrKeysVaultUuid: number | null = null;
    let hasCredentials = false;

    try {
      const normalizedKeys: ApiKey[] = (apiKeys as ApiKey[] | undefined) ?? [];
      const cdrResult = await deployAgentCDR({ name, description, logic, apiKeys: normalizedKeys });

      cdrVaultUuid     = cdrResult.vaultUuid;
      cdrKeysVaultUuid = cdrResult.keysVaultUuid ?? null;
      hasCredentials   = cdrResult.hasApiKeys;

      console.log(`[Deploy] CDR vaults created — logic: ${cdrVaultUuid}, keys: ${cdrKeysVaultUuid ?? 'none'}`);
    } catch (cdrError: any) {
      console.error('[Deploy] CDR vaulting failed:', cdrError.message);
      return NextResponse.json(
        { error: `Failed to vault agent on Story Protocol: ${cdrError.message}` },
        { status: 502 }
      );
    }

    // ── Create DB Record ──────────────────────────────────────────────────────
    const agent = await prisma.deployedAgent.create({
      data: {
        userId,
        name,
        slug,
        description,
        longDescription: longDescription || description,
        category,
        tags: tags || [],
        apiEndpoint: apiEndpoint || null,
        webhookUrl: webhookUrl || null,
        modelProvider: modelProvider || 'custom',
        modelName: modelName || null,
        pricePerRun,
        setupFee: setupFee || 0,
        icon: icon || '🤖',
        color: color || '#f97316',
        readme: readme || '',
        inputSchema: inputSchema || {},
        outputSchema: outputSchema || {},
        examples: examples || [],
        capabilities: ['text'],
        status: 'pending',
        screenshots: [],
        coverImage: null,

        // CDR vault references
        requiresCredentials: hasCredentials,
        credentialSchema: credentialSchema || null,
        cdrVaultUuid,
        cdrKeysVaultUuid,
        cdrDeployedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      agent: {
        id: agent.id,
        slug: agent.slug,
        name: agent.name,
        status: agent.status,
        hasCredentials,
        cdrVaultUuid,
        cdrKeysVaultUuid,
      },
    });
  } catch (error: any) {
    console.error('[Deploy] Error:', error);
    return NextResponse.json({ error: 'Failed to deploy agent' }, { status: 500 });
  }
}
