import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

export const dynamic = 'force-dynamic';

const secret = new TextEncoder().encode(process.env.ACCESS_TOKEN_SECRET || 'at_super-secret-key');

export async function POST(req: NextRequest) {
  try {
    const { email, username, password } = await req.json();

    if (!email || !username || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const lowerEmail = email.toLowerCase();
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: lowerEmail }, { username }],
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'User with this email or username already exists' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email: lowerEmail,
        username,
        passwordHash,
        emailVerified: true,
      },
    });

    const accessToken = await new SignJWT({ userId: user.id, id: user.id })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .setIssuedAt()
      .sign(secret);

    const userPayload = {
      id: user.id,
      email: user.email,
      username: user.username,
      onboardingCompleted: user.onboardingCompleted,
    };

    const res = NextResponse.json({
      message: 'Registration successful',
      user: userPayload,
    }, { status: 201 });

    res.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return res;
  } catch (error: any) {
    console.error('Register API error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
