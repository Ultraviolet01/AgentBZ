"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.me = exports.completeOnboarding = exports.logout = exports.resetPassword = exports.forgotPassword = exports.verify = exports.refresh = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("@agentbazaar/database");
const zod_1 = require("zod");
const crypto_1 = __importDefault(require("crypto"));
const email_service_1 = require("../services/email.service");
const prisma = new database_1.PrismaClient();
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "at_super-secret-key";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "rt_super-secret-key";
// Validation Schemas
const RegisterSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    username: zod_1.z.string().min(3).max(20),
    password: zod_1.z.string().min(8),
});
const LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string(),
});
// Helper: Generate Tokens
const generateTokens = (userId) => {
    const accessToken = jsonwebtoken_1.default.sign({ userId }, ACCESS_TOKEN_SECRET, { expiresIn: "15m" }); // Short lived
    const refreshToken = jsonwebtoken_1.default.sign({ userId }, REFRESH_TOKEN_SECRET, { expiresIn: "7d" }); // Long lived
    return { accessToken, refreshToken };
};
// Helper: Set Cookie
const setAuthCookies = (res, accessToken, refreshToken) => {
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 15 * 60 * 1000, // 15 mins
    });
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
};
const register = async (req, res) => {
    try {
        const validated = RegisterSchema.parse(req.body);
        const email = validated.email.toLowerCase();
        const { username, password } = validated;
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: "User already exists" });
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 12);
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.flatten() });
        }
        res.status(500).json({ error: "Registration failed" });
    }
};
exports.register = register;
const login = async (req, res) => {
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
        const isMatch = await bcryptjs_1.default.compare(password, user.passwordHash);
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.flatten() });
        }
        res.status(500).json({ error: "Login failed" });
    }
};
exports.login = login;
const refresh = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken)
            return res.status(401).json({ error: "Refresh token missing" });
        const decoded = jsonwebtoken_1.default.verify(refreshToken, REFRESH_TOKEN_SECRET);
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
    }
    catch (error) {
        res.status(403).json({ error: "Refresh failed" });
    }
};
exports.refresh = refresh;
const verify = async (req, res) => {
    try {
        const { token } = req.query;
        if (!token)
            return res.status(400).json({ error: "Token required" });
        const user = await prisma.user.findFirst({ where: { verificationToken: token } });
        if (!user)
            return res.status(400).json({ error: "Invalid or expired token" });
        await prisma.user.update({
            where: { id: user.id },
            data: { emailVerified: true, verificationToken: null }
        });
        res.json({ message: "Email verified successfully. You can now log in." });
    }
    catch (error) {
        res.status(500).json({ error: "Verification failed" });
    }
};
exports.verify = verify;
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        if (user) {
            const resetToken = crypto_1.default.randomBytes(32).toString("hex");
            const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour
            await prisma.user.update({
                where: { id: user.id },
                data: { resetToken, resetTokenExpires }
            });
            await (0, email_service_1.sendPasswordResetEmail)(email, resetToken);
        }
        res.json({ message: "If an account with that email exists, we have sent a reset link." });
    }
    catch (error) {
        res.status(500).json({ error: "Request failed" });
    }
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;
        const user = await prisma.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExpires: { gt: new Date() }
            }
        });
        if (!user)
            return res.status(400).json({ error: "Invalid or expired reset token" });
        const passwordHash = await bcryptjs_1.default.hash(password, 12);
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
    }
    catch (error) {
        res.status(500).json({ error: "Reset failed" });
    }
};
exports.resetPassword = resetPassword;
const logout = async (req, res) => {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    // Optional: Invalidate in DB
    const userId = req.userId;
    if (userId) {
        await prisma.user.update({
            where: { id: userId },
            data: { refreshToken: null }
        });
    }
    res.json({ message: "Logged out" });
};
exports.logout = logout;
const completeOnboarding = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        await prisma.user.update({
            where: { id: userId },
            data: { onboardingCompleted: true }
        });
        res.json({ success: true, message: "Onboarding completed successfully" });
    }
    catch (error) {
        console.error("Onboarding complete error:", error);
        res.status(500).json({ error: "Failed to complete onboarding" });
    }
};
exports.completeOnboarding = completeOnboarding;
const me = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId)
            return res.status(401).json({ error: "Unauthorized" });
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
        if (!user)
            return res.status(401).json({ error: "User not found" });
        const totalSpent = user.agentRuns.reduce((sum, run) => sum + run.creditsUsed, 0);
        res.json({
            user: {
                ...user,
                agentRuns: undefined, // Don't send full runs list
                totalSpent
            }
        });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to get user data" });
    }
};
exports.me = me;
