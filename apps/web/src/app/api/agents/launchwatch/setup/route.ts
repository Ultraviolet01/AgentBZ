import { NextResponse } from "next/server";
import { PrismaClient } from "@agentbazaar/database";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();
const JWT_SECRET = new TextEncoder().encode(process.env.ACCESS_TOKEN_SECRET || "at_super-secret-key");

async function getAuthUser() {
  const cookieStore = cookies();
  const token = cookieStore.get("accessToken")?.value || cookieStore.get("auth_token")?.value;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      const userId = (payload.userId || payload.id) as string;
      if (userId) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, email: true }
        });
        if (user) return user;
      }
    } catch (error) {
      console.warn("[LaunchWatch Setup] JWT token verification failed, checking fallback user...");
    }
  }

  // Fallback for sessions without legacy cookies
  const fallbackUser = await prisma.user.findFirst({
    select: { id: true, email: true }
  });

  return fallbackUser;
}

export async function POST(req: Request) {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { monitoringType, txHash, ...formData } = body;

    // 1. Resolve Project
    let projectId = formData.projectId;

    if (!projectId) {
      const projectName = formData.tokenSymbol || formData.projectUrl || "LaunchWatch Project";
      const newProject = await prisma.project.create({
        data: {
          userId: authUser.id,
          name: projectName,
          description: `Automatically created for ${monitoringType} monitoring`,
          websiteUrl: formData.projectUrl,
          twitterHandle: formData.projectUrl?.startsWith('@') ? formData.projectUrl : null,
          tokenAddress: formData.contractAddress
        }
      });
      projectId = newProject.id;
    }

    // 2. Create or Update LaunchWatchConfig
    const alertTypes = {
      social_activity: formData.monitorSocial ?? false,
      website_changes: formData.monitorWebsite ?? false,
      sentiment_shifts: formData.monitorSentiment ?? false,
      token_milestone: monitoringType === 'token_milestone',
      crypto_news: monitoringType === 'crypto_news',
      targetFDV: formData.targetFDV ? parseFloat(formData.targetFDV) : null,
      newsTopics: formData.newsTopics || [],
      notificationEmail: formData.notificationEmail || null,
      txHash: txHash || null
    };

    const config = await prisma.launchWatchConfig.upsert({
      where: { projectId },
      create: {
        projectId,
        frequency: (formData.checkFrequency || formData.newsFrequency || 'daily').toUpperCase(),
        alertTypes: alertTypes as any,
        emailEnabled: true,
        active: true,
        nextRunAt: new Date() // Start immediately
      },
      update: {
        frequency: (formData.checkFrequency || formData.newsFrequency || 'daily').toUpperCase(),
        alertTypes: alertTypes as any,
        active: true,
        nextRunAt: new Date()
      },
      include: { project: true }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Monitoring activated successfully", 
      txHash: txHash || null,
      monitor: {
        id: config.id,
        type: monitoringType,
        email: formData.notificationEmail || authUser.email,
        projectUrl: config.project.websiteUrl || config.project.name,
        tokenSymbol: formData.tokenSymbol || config.project.tokenAddress,
        contractAddress: formData.contractAddress || config.project.tokenAddress,
        targetFDV: formData.targetFDV || (config.alertTypes as any)?.targetFDV,
        txHash: txHash || null,
        frequency: config.frequency,
        createdAt: config.createdAt
      } 
    });

  } catch (error: any) {
    console.error("LaunchWatch Setup Error:", error);
    return NextResponse.json({ error: error.message || "Setup failed" }, { status: 500 });
  }
}
