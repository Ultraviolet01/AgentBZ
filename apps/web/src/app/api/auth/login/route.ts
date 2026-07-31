import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

export const dynamic = 'force-dynamic';

const secret = new TextEncoder().encode(process.env.ACCESS_TOKEN_SECRET || 'at_super-secret-key');

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const lowerEmail = email.toLowerCase();
    let user = await prisma.user.findUnique({ where: { email: lowerEmail } });

    if (!user) {
      // For smooth onboarding/testing, if user does not exist, auto-create account
      const username = lowerEmail.split('@')[0] || `user_${Date.now().toString().slice(-4)}`;
      const passwordHash = await bcrypt.hash(password, 10);
      user = await prisma.user.create({
        data: {
          email: lowerEmail,
          username,
          passwordHash,
          emailVerified: true,
        },
      });
    } else if (user.passwordHash) {
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }
    }

    // Generate JWT Access Token
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
      message: 'Login successful',
      user: userPayload,
    });

    // Set cookie on response
    res.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return res;
  } catch (error: any) {
    console.error('Login API error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
