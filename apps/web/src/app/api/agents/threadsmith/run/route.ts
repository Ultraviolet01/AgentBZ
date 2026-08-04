import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

async function callAnthropic(apiKey: string, topic: string, style: string, tweetCount: number): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  const systemPrompt = `You are ThreadSmith, an expert Web3 content creator and Twitter/X thread writer.`;
  const userMessage = `Write a ${tweetCount}-tweet Twitter thread about: "${topic}".
Style: ${style}.
Rules:
- Number each tweet: 1/ 2/ 3/ etc
- Each tweet max 280 characters
- Hook on tweet 1 must stop the scroll
- End with a call to action on the last tweet
- Web3 and crypto native tone`;

  const modelsToTry = [
    "claude-3-5-sonnet-20241022",
    "claude-3-5-haiku-20241022",
    "claude-3-haiku-20240307",
  ];

  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      console.log(`[ThreadSmith Webhook] Calling Anthropic with model: ${model}`);
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
        const errorText = await response.text();
        throw new Error(`Anthropic HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const text = data.content?.[0]?.text || "";
      if (text) return text;
    } catch (err: any) {
      console.error(`[ThreadSmith Webhook] Model ${model} failed:`, err.message);
      lastError = err;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError || new Error("Failed to generate thread from AI engine");
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("x-keeper-auth");
    const secretKey = process.env.KEEPER_WEBHOOK_SECRET || "keeper-webhook-secret-key";

    // Validate webhook security header if KEEPER_WEBHOOK_SECRET is set
    if (process.env.KEEPER_WEBHOOK_SECRET && authHeader !== secretKey) {
      return NextResponse.json({ error: "Unauthorized: Invalid x-keeper-auth header" }, { status: 401 });
    }

    const body = await req.json();
    const topic = body.topic || body.input || body.prompt || "Web3 AI Agents";
    const style = body.style || body.tone || "web3-native";
    const tweetCount = parseInt(body.tweetCount || "7", 10);

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY environment variable is missing" }, { status: 500 });
    }

    const thread = await callAnthropic(apiKey, topic, style, tweetCount);

    return NextResponse.json({
      success: true,
      thread,
      content: thread,
      metadata: {
        topic,
        style,
        tweetCount,
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error: any) {
    console.error("ThreadSmith Webhook Run Error:", error);
    return NextResponse.json({ error: error.message || "Webhook execution failed" }, { status: 500 });
  }
}
