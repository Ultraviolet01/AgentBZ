import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    
    // Forward headers including X-Payment
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    const xPayment = req.headers.get("X-Payment") || req.headers.get("x-payment");
    if (xPayment) headers["X-Payment"] = xPayment;

    const cookie = req.headers.get("cookie");
    if (cookie) headers["Cookie"] = cookie;

    const auth = req.headers.get("authorization");
    if (auth) headers["Authorization"] = auth;

    const res = await fetch(`${apiUrl}/chat/orchestrate`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = await res.json();
    
    const responseHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const paymentRequired = res.headers.get("PAYMENT-REQUIRED") || res.headers.get("payment-required");
    if (paymentRequired) responseHeaders["PAYMENT-REQUIRED"] = paymentRequired;

    const resXPayment = res.headers.get("X-Payment") || res.headers.get("x-payment");
    if (resXPayment) responseHeaders["X-Payment"] = resXPayment;

    return NextResponse.json(data, {
      status: res.status,
      headers: responseHeaders,
    });
  } catch (err: any) {
    console.error("[Next.js Chat Orchestrate Proxy Error]:", err);
    return NextResponse.json(
      { error: err.message || "Failed to reach orchestrator backend" },
      { status: 500 }
    );
  }
}
