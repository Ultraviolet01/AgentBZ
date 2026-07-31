import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const res = NextResponse.json({ message: 'Logged out successfully' });
  
  res.cookies.set('accessToken', '', {
    httpOnly: true,
    path: '/',
    maxAge: 0,
  });
  res.cookies.set('refreshToken', '', {
    httpOnly: true,
    path: '/',
    maxAge: 0,
  });

  return res;
}
