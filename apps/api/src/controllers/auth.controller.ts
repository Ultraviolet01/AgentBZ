import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@agentbazaar/database";
import { z } from "zod";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import { sendVerificationEmail, sendPasswordResetEmail } from "../services/email.service";

const prisma = new PrismaClient();
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "at_super-secret-key";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "rt_super-secret-key";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Helper: Derive a unique username from a Google display name / email
const generateUniqueUsername = async (name: string, email: string): Promise<string> => {
  let base = (name || email.split("@")[0])
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 15);
  if (base.length < 3) base = `user${base}`;

  let username = base;
  for (let attempt = 0; attempt < 20; attempt++) {
    const taken = await prisma.user.findUnique({ where: { username } });
    if (!taken) return username;
    username = `${base}${Math.floor(1000 + Math.random() * 9000)}`;
  }
  return `user${Date.now()}`;
};

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

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

// Helper: Generate Tokens
const generateTokens = (userId: string) => {
  const accessToken = jwt.sign({ userId }, ACCESS_TOKEN_SECRET, { expiresIn: "15m" }); // Short lived
  const refreshToken = jwt.sign({ userId }, REFRESH_TOKEN_SECRET, { expiresIn: "7d" }); // Long lived
  return { accessToken, refreshToken };
};

// Cookie attributes differ by environment:
// - production: cross-site (web and API are different domains) -> SameSite=None; Secure
// - development: same-site over http://localhost -> SameSite=Lax; not Secure
//   (browsers reject Secure/SameSite=None cookies over plain http)
const isProd = process.env.NODE_ENV === "production";
const baseCookieOptions = {
  httpOnly: true as const,
  secure: isProd,
  sameSite: (isProd ? "none" : "lax") as "none" | "lax",
};

// Helper: Set Cookie
const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
  res.cookie("accessToken", accessToken, {
    ...baseCookieOptions,
    maxAge: 15 * 60 * 1000, // 15 mins
  });
  res.cookie("refreshToken", refreshToken, {
    ...baseCookieOptions,
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
        verificationToken: null
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

    console.log(`--- Login Attempt`);
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      console.warn(`--- Login Failed: User not found`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.passwordHash) {
      // Account was created via Google and has no password set
      return res.status(401).json({ error: "This account uses Google Sign-In. Please continue with Google." });
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

export const googleAuth = async (req: Request, res: Response) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ error: "Missing Google credential" });
    }

    if (!GOOGLE_CLIENT_ID) {
      console.error("Google Sign-In attempted but GOOGLE_CLIENT_ID is not configured.");
      return res.status(500).json({ error: "Google Sign-In is not configured on the server." });
    }

    // Verify the ID token issued by Google Identity Services
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload || !payload.email || !payload.email_verified) {
      return res.status(401).json({ error: "Invalid or unverified Google account" });
    }

    const googleId = payload.sub;
    const email = payload.email.toLowerCase();
    const displayName = payload.name || payload.given_name || email.split("@")[0];
    const avatarUrl = payload.picture || null;

    // Find by Google ID first, then fall back to email (to link existing accounts)
    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId }, { email }] },
    });
    let isNew = false;

    if (!user) {
      const username = await generateUniqueUsername(displayName, email);
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
      // Existing email/password account — link the Google identity to it
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId,
          avatarUrl: user.avatarUrl || avatarUrl,
          emailVerified: true,
        },
      });
    }

    const { accessToken, refreshToken } = generateTokens(user.id);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    setAuthCookies(res, accessToken, refreshToken);

    res.status(isNew ? 201 : 200).json({
      isNew,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatarUrl: user.avatarUrl,
        onboardingCompleted: user.onboardingCompleted,
      },
    });
  } catch (error: any) {
    console.error("Google auth error:", error?.message || error);
    res.status(401).json({ error: "Google authentication failed" });
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

export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const validated = ChangePasswordSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user?.passwordHash) {
      return res.status(400).json({ error: "This account does not have a password set." });
    }

    const isMatch = await bcrypt.compare(validated.currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    const passwordHash = await bcrypt.hash(validated.newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash, refreshToken: null }
    });

    res.clearCookie("accessToken", baseCookieOptions);
    res.clearCookie("refreshToken", baseCookieOptions);
    res.json({ message: "Password updated successfully" });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.flatten() });
    }
    res.status(500).json({ error: "Unable to update password" });
  }
};

export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await prisma.user.update({
      where: { id: userId },
      data: {
        email: `deleted-${suffix}@agentbazaar.local`,
        username: `deleted-${suffix.slice(0, 12)}`,
        passwordHash: null,
        googleId: null,
        avatarUrl: null,
        refreshToken: null,
        resetToken: null,
        resetTokenExpires: null,
        walletAddress: null,
        onboardingCompleted: false,
      }
    });

    res.clearCookie("accessToken", baseCookieOptions);
    res.clearCookie("refreshToken", baseCookieOptions);
    res.json({ message: "Account deactivated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Unable to deactivate account" });
  }
};

export const logout = async (req: Request, res: Response) => {
  res.clearCookie("accessToken", baseCookieOptions);
  res.clearCookie("refreshToken", baseCookieOptions);
  
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
        onboardingCompleted: true
      }
    });

    if (!user) return res.status(401).json({ error: "User not found" });

    res.json({
      user
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to get user data" });
  }
};
