import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  return NextResponse.json({ message: 'Token refreshed' });
}
