import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SignJWT, decodeJwt } from 'jose';

export const dynamic = 'force-dynamic';

const secret = new TextEncoder().encode(process.env.ACCESS_TOKEN_SECRET || 'at_super-secret-key');

export async function POST(req: NextRequest) {
  try {
    const { credential } = await req.json();

    if (!credential) {
      return NextResponse.json({ error: 'Missing Google credential' }, { status: 400 });
    }

    let payload: any = null;
    try {
      payload = decodeJwt(credential);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid Google credential token' }, { status: 400 });
    }

    if (!payload || !payload.email) {
      return NextResponse.json({ error: 'Invalid Google account credential' }, { status: 401 });
    }

    const googleId = payload.sub as string;
    const email = (payload.email as string).toLowerCase();
    const displayName = (payload.name as string) || (payload.given_name as string) || email.split('@')[0];
    const avatarUrl = (payload.picture as string) || null;

    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId }, { email }] },
    });
    let isNew = false;

    if (!user) {
      let username = displayName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15);
      if (username.length < 3) username = `user_${Date.now().toString().slice(-4)}`;
      
      const existingUser = await prisma.user.findUnique({ where: { username } });
      if (existingUser) {
        username = `${username}_${Math.floor(1000 + Math.random() * 9000)}`;
      }

      user = await prisma.user.create({
        data: {
          email,
          username,
          googleId,
          avatarUrl,
          emailVerified: true,
        },
      });
      isNew = true;
    } else if (!user.googleId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId,
          avatarUrl: user.avatarUrl || avatarUrl,
          emailVerified: true,
        },
      });
    }

    const accessToken = await new SignJWT({ userId: user.id, id: user.id })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .setIssuedAt()
      .sign(secret);

    const userPayload = {
      id: user.id,
      email: user.email,
      username: user.username,
      avatarUrl: user.avatarUrl,
      onboardingCompleted: user.onboardingCompleted,
    };

    const res = NextResponse.json({
      isNew,
      user: userPayload,
    });

    res.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return res;
  } catch (error: any) {
    console.error('Google Auth API Error:', error);
    return NextResponse.json({ error: 'Google authentication failed' }, { status: 500 });
  }
}
