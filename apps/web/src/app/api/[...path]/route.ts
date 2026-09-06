import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}

export async function PUT(req: NextRequest) {
  return handle(req);
}

export async function PATCH(req: NextRequest) {
  return handle(req);
}

export async function DELETE(req: NextRequest) {
  return handle(req);
}

async function handle(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const search = req.nextUrl.search;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  
  // Strip /api prefix when proxying to Express backend
  const targetPath = pathname.startsWith("/api") ? pathname.replace(/^\/api/, "") : pathname;
  const targetUrl = `${apiUrl}${targetPath}${search}`;

  try {
    const headers = new Headers(req.headers);
    headers.delete("host");

    let body: BodyInit | null = null;
    if (req.method !== "GET" && req.method !== "HEAD") {
      body = await req.arrayBuffer();
    }

    const res = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
    });

    const data = await res.arrayBuffer();
    const resHeaders = new Headers(res.headers);

    return new NextResponse(data, {
      status: res.status,
      headers: resHeaders,
    });
  } catch (err: any) {
    console.error(`[API Proxy] Error forwarding ${pathname} to ${targetUrl}:`, err);
    return NextResponse.json({ error: "Failed to connect to API backend" }, { status: 502 });
  }
}
