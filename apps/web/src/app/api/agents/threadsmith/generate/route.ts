import { NextResponse } from "next/server";
import { PrismaClient, THREADSMITH_SYSTEM_PROMPT } from "@agentbazaar/database";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { executeAgentViaKeeperHub } from "@/lib/keeperhub";

const prisma = new PrismaClient();
// Must match ACCESS_TOKEN_SECRET used by auth.controller.ts
const JWT_SECRET = new TextEncoder().encode(process.env.ACCESS_TOKEN_SECRET || "at_super-secret-key");

async function getAuthUser() {
  const cookieStore = cookies();
  // Try both cookie names for compatibility
  const token = cookieStore.get("accessToken")?.value || cookieStore.get("auth_token")?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    // auth.controller.ts signs { userId }, legacy may use { id }
    return { id: (payload.userId || payload.id) as string, email: payload.email as string };
  } catch (error) {
    console.error("JWT Verify Error:", error);
    return null;
  }
}

/**
 * Pure fetch-based Anthropic API call.
 * Avoids the @anthropic-ai/sdk which has connection issues on Vercel serverless.
 */
async function callAnthropic(apiKey: string, model: string, systemPrompt: string, userMessage: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000); // 25s timeout (Vercel limit is 30s)

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey.trim(),
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Anthropic ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    return data.content?.[0]?.text || "";
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(req: Request) {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({
      error: "Unauthorized",
      debug: {
        hasToken: !!cookies().get("auth_token"),
        hasSecret: !!process.env.JWT_SECRET
      }
    }, { status: 401 });
  }

  try {
    const { projectId, contentType, tone, quality, useMemory, input, txHash } = await req.json();

    // ── Payment gate ────────────────────────────────────────────────────────
    const paymentProof = txHash || null;
    if (paymentProof) {
      console.log(`[ThreadSmith] On-chain payment received — txHash: ${paymentProof}`);
    }

    if (!input) {
      return NextResponse.json({ error: "Input context is required" }, { status: 400 });
    }

    // 1. Run cost (metadata only)
    const creditsUsed = quality === 'premium' ? 5 : 2;

    // 2. Context Gathering
    let context = input || "";
    if (useMemory && projectId) {
      const memories = await prisma.projectMemory.findMany({
        where: { projectId },
        orderBy: { createdAt: "desc" },
        take: 10
      });
      context += "\n\nProject History:\n" + memories.map((m: any) => `${m.memoryType}: ${JSON.stringify(m.content)}`).join("\n");
    }

    // 3. Attempt KeeperHub remote workflow execution.
    //    KeeperHub logs the run on the dashboard and triggers the email node.
    //    It returns { executionId, status } — NOT content. The local LLM always
    //    generates the thread. KeeperHub is purely for audit-logging + email.
    let generatedContent = "";
    console.log(`[ThreadSmith] Attempting KeeperHub dispatch (slug: "threadsmith", txHash: ${paymentProof || 'none'})...`);

    try {
      const keeperHubResult = await executeAgentViaKeeperHub(
        "threadsmith",
        // Keys map to {{ trigger.<key> }} in the KeeperHub email template.
        // "input" is reserved/unresolvable — use "topic" instead.
        { topic: input, contentType, tone, quality, txHash: paymentProof },
        paymentProof || undefined
      );
      const execId = (keeperHubResult.output as any)?.executionId;
      const skipped = (keeperHubResult.output as any)?.skipped;
      if (skipped) {
        console.log(`[ThreadSmith] KeeperHub skipped (not configured) — continuing to LLM engine`);
      } else {
        console.log(`[ThreadSmith] KeeperHub dispatched ✓ executionId: ${execId} — continuing to LLM engine for content`);
      }
    } catch (khErr: any) {
      // KeeperHub failed (wrong ID, network error, etc.).
      // Log clearly but NEVER surface this to the user — they've already paid.
      console.warn(`[ThreadSmith] KeeperHub dispatch failed: ${khErr.message} — continuing to LLM engine`);
    }

    // 4. Local LLM execution (fallback or primary when KeeperHub skipped/failed)
    if (!generatedContent) {
      console.log(`[ThreadSmith] Synthesizing thread via local LLM engine...`);
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        return NextResponse.json({ error: "AI configuration missing (ANTHROPIC_API_KEY not set)" }, { status: 500 });
      }

      const trimmedKey = apiKey.trim();
      console.log(`[ThreadSmith] Key prefix: ${trimmedKey.substring(0, 15)}... len=${trimmedKey.length} quality=${quality}`);

      const modelsToTry = [
        "claude-sonnet-4-5",
        "claude-sonnet-4-20250514",
        "claude-3-5-sonnet-20241022",
        "claude-3-5-haiku-20241022",
        "claude-3-haiku-20240307",
      ];

      const userMessage = `ContentType: ${contentType}\nTone: ${tone}\nContext: ${context}`;
      let lastError: any = null;

      for (const model of modelsToTry) {
        if (generatedContent) break;
        try {
          console.log(`[ThreadSmith] Trying model: ${model}`);
          generatedContent = await callAnthropic(trimmedKey, model, THREADSMITH_SYSTEM_PROMPT, userMessage);
          console.log(`[ThreadSmith] Success with model: ${model}`);
        } catch (err: any) {
          console.error(`[ThreadSmith] Failed with model ${model}:`, err.message);
          lastError = err;
          if (err.message?.includes("401") || err.message?.includes("invalid_api_key")) break;
        }
      }

      if (!generatedContent && lastError) {
        return NextResponse.json({
          error: `AI Engine Exhausted: ${lastError.message}`,
          debug: {
            keyPrefix: `${trimmedKey.substring(0, 15)}...`,
            keyLength: trimmedKey.length,
            attemptedModels: modelsToTry,
            errorMessage: lastError.message,
          },
          suggestion: "Verify your Anthropic API key is valid and has sufficient credits at console.anthropic.com"
        }, { status: 500 });
      }
    }

    if (!generatedContent) {
      throw new Error("Empty response from AI engine");
    }

    // 5. Persistence — safe: run may be undefined if DB write fails, we still
    //    return content so the user doesn't lose their paid result.
    let runId: string | undefined;
    try {
      const run = await prisma.agentRun.create({
        data: {
          userId: authUser.id,
          projectId: projectId || null,
          agentType: "THREADSMITH",
          inputData: { contentType, tone, quality, input, useMemory },
          outputData: {
            content: generatedContent,
            metadata: { txHash: paymentProof }
          },
          creditsUsed,
          status: "COMPLETED"
        }
      });
      runId = run.id;
    } catch (dbError) {
      console.error("Failed to persist agent run:", dbError);
      // Don't return an error — user still gets their content
    }

    // 6. Project Memory
    if (projectId) {
      try {
        await prisma.projectMemory.create({
          data: {
            projectId,
            sourceAgent: "THREADSMITH",
            memoryType: "CONTENT_GENERATION",
            content: { contentType, tone, excerpt: generatedContent.substring(0, 200) },
            storageCid: ""
          }
        });
      } catch (memErr) {
        console.error("Failed to write project memory:", memErr);
      }
    }

    return NextResponse.json({
      content: generatedContent,
      runId,               // may be undefined if DB failed — frontend handles gracefully
      txHash: paymentProof,
    });

  } catch (error: any) {
    console.error("ThreadSmith API Error:", error);
    return NextResponse.json({ error: error.message || "Execution failed" }, { status: 500 });
  }
}
