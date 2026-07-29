import { NextResponse } from "next/server";
import { PrismaClient, THREADSMITH_SYSTEM_PROMPT } from "@agentbazaar/database";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const prisma = new PrismaClient();
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key");

async function getAuthUser() {
  const cookieStore = cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { id: string; email: string };
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
    const { projectId, contentType, tone, quality, useMemory, input } = await req.json();

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

    // 3. AI Generation — Pure fetch, no SDK
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "AI configuration missing (API Key)" }, { status: 500 });
    }

    const trimmedKey = apiKey.trim();
    console.log(`[ThreadSmith] Key prefix: ${trimmedKey.substring(0, 15)}... len=${trimmedKey.length} quality=${quality}`);

    const modelsToTry = [
      "claude-sonnet-4-20250514",
      "claude-3-5-sonnet-20241022",
      "claude-3-5-haiku-20241022",
      "claude-3-5-sonnet-20240620",
      "claude-3-haiku-20240307",
      "claude-3-sonnet-20240229",
      "claude-3-opus-20240229",
    ];

    const userMessage = `ContentType: ${contentType}\nTone: ${tone}\nContext: ${context}`;
    let generatedContent = "";
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

    if (!generatedContent) {
      throw new Error("Empty response from AI engine");
    }

    // 4. Persistence
    let run;
    try {
      run = await prisma.agentRun.create({
        data: {
          userId: authUser.id,
          projectId: projectId || null,
          agentType: "THREADSMITH",
          inputData: { contentType, tone, quality, input, useMemory },
          outputData: { content: generatedContent },
          creditsUsed,
          status: "COMPLETED"
        }
      });
    } catch (dbError) {
      console.error("Failed to persist agent run", dbError);
      return NextResponse.json({ 
        content: generatedContent, 
        warning: "Persistence failed" 
      });
    }

    // 6. Project Memory
    if (projectId) {
      await prisma.projectMemory.create({
        data: {
          projectId,
          sourceAgent: "THREADSMITH",
          memoryType: "CONTENT_GENERATION",
          content: { contentType, tone, excerpt: generatedContent.substring(0, 200) },
          storageCid: ""
        }
      });
    }

    return NextResponse.json({
      content: generatedContent,
      runId: run.id
    });

  } catch (error: any) {
    console.error("ThreadSmith API Error:", error);
    return NextResponse.json({ error: error.message || "Execution failed" }, { status: 500 });
  }
}
