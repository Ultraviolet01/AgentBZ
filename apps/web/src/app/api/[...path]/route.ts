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
  const url = req.nextUrl.pathname;
  console.warn(`[API Catch-all] Unhandled API request to: ${url}`);
  
  // Return standard 404 response without legacy placeholder error strings
  return NextResponse.json({ error: "API endpoint not found", path: url }, { status: 404 });
}
