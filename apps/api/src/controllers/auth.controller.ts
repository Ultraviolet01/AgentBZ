import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@agentbazaar/database";
import { z } from "zod";
import crypto from "crypto";
import { sendVerificationEmail, sendPasswordResetEmail } from "../services/email.service";

const prisma = new PrismaClient();
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "at_super-secret-key";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "rt_super-secret-key";

// Validation Schemas
const RegisterSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(20),
  password: z.string().min(8),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Helper: Generate Tokens
const generateTokens = (userId: string) => {
  const accessToken = jwt.sign({ userId }, ACCESS_TOKEN_SECRET, { expiresIn: "15m" }); // Short lived
  const refreshToken = jwt.sign({ userId }, REFRESH_TOKEN_SECRET, { expiresIn: "7d" }); // Long lived
  return { accessToken, refreshToken };
};

// Helper: Set Cookie
const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 15 * 60 * 1000, // 15 mins
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const register = async (req: Request, res: Response) => {
  try {
    const validated = RegisterSchema.parse(req.body);
    const email = validated.email.toLowerCase();
    const { username, password } = validated;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        emailVerified: true, // Auto-verify
        verificationToken: null,
        credits: 20.0
      }
    });

    // Create Transaction record for signup bonus
    await prisma.transaction.create({
      data: {
        userId: user.id,
        amount: 20.0,
        type: "CREDIT",
        status: "COMPLETED",
        description: "Signup Bonus"
      }
    });

    const { accessToken, refreshToken } = generateTokens(user.id);

    // Save refresh token to DB
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken }
    });

    setAuthCookies(res, accessToken, refreshToken);

    res.status(201).json({ 
      message: "Registration successful",
      user: { 
        id: user.id, 
        email: user.email, 
        username: user.username,
        onboardingCompleted: user.onboardingCompleted
      } 
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.flatten() });
    }
    res.status(500).json({ error: "Registration failed" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const validated = LoginSchema.parse(req.body);
    const email = validated.email.toLowerCase();
    const { password } = validated;

    console.log(`--- Login Attempt: ${email}`);
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      console.warn(`--- Login Failed: User not found [${email}]`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      console.warn(`--- Login Failed: Password mismatch [${email}]`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Email verification check removed for seamless login
    /*
    if (!user.emailVerified) {
      return res.status(403).json({ error: "Please verify your email address before logging in." });
    }
    */

    const { accessToken, refreshToken } = generateTokens(user.id);

    // Save refresh token to DB
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken }
    });

    setAuthCookies(res, accessToken, refreshToken);

    res.json({ 
      user: { 
        id: user.id, 
        email: user.email, 
        username: user.username,
        onboardingCompleted: user.onboardingCompleted
      } 
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.flatten() });
    }
    res.status(500).json({ error: "Login failed" });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.status(401).json({ error: "Refresh token missing" });

    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as { userId: string };
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ error: "Invalid refresh token" });
    }

    const tokens = generateTokens(user.id);
    
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken }
    });

    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    res.json({ message: "Token refreshed" });
  } catch (error) {
    res.status(403).json({ error: "Refresh failed" });
  }
};

export const verify = async (req: Request, res: Response) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: "Token required" });

    const user = await prisma.user.findFirst({ where: { verificationToken: token as string } });
    if (!user) return res.status(400).json({ error: "Invalid or expired token" });

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, verificationToken: null }
    });

    res.json({ message: "Email verified successfully. You can now log in." });
  } catch (error) {
    res.status(500).json({ error: "Verification failed" });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (user) {
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken, resetTokenExpires }
      });

      await sendPasswordResetEmail(email, resetToken);
    }

    res.json({ message: "If an account with that email exists, we have sent a reset link." });
  } catch (error) {
    res.status(500).json({ error: "Request failed" });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;
    const user = await prisma.user.findFirst({
      where: { 
        resetToken: token,
        resetTokenExpires: { gt: new Date() }
      }
    });

    if (!user) return res.status(400).json({ error: "Invalid or expired reset token" });

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        passwordHash, 
        resetToken: null, 
        resetTokenExpires: null,
        refreshToken: null // Logout all sessions
      }
    });

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Reset failed" });
  }
};

export const logout = async (req: Request, res: Response) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });
  
  // Optional: Invalidate in DB
  const userId = (req as any).userId;
  if (userId) {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null }
    });
  }

  res.json({ message: "Logged out" });
};

export const completeOnboarding = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { onboardingCompleted: true }
    });

    res.json({ success: true, message: "Onboarding completed successfully" });
  } catch (error) {
    console.error("Onboarding complete error:", error);
    res.status(500).json({ error: "Failed to complete onboarding" });
  }
};

export const me = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        credits: true,
        onboardingCompleted: true,
        agentRuns: {
          select: {
            creditsUsed: true
          }
        }
      }
    });

    if (!user) return res.status(401).json({ error: "User not found" });
    
    const totalSpent = user.agentRuns.reduce((sum, run) => sum + run.creditsUsed, 0);
 
    res.json({ 
      user: {
        ...user,
        agentRuns: undefined, // Don't send full runs list
        totalSpent
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to get user data" });
  }
};
