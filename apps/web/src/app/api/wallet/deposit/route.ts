import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

// removed — OG token deposit / credits (CRD) top-up removed
export async function POST() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
