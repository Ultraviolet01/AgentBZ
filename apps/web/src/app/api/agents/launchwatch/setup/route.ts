import { NextResponse } from "next/server";
import { PrismaClient } from "@agentbazaar/database";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key");

async function getAuthUser() {
  const cookieStore = cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { id: string; email: string };
  } catch (error) {
    return null;
  }
}

export async function POST(req: Request) {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { monitoringType, ...formData } = body;

    // 1. Resolve Project
    let projectId = formData.projectId;

    if (!projectId) {
      // Create a project automatically for this monitor
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

    // 3. Create or Update LaunchWatchConfig
    const alertTypes = {
      social_activity: formData.monitorSocial ?? false,
      website_changes: formData.monitorWebsite ?? false,
      sentiment_shifts: formData.monitorSentiment ?? false,
      token_milestone: monitoringType === 'token_milestone',
      crypto_news: monitoringType === 'crypto_news',
      targetFDV: formData.targetFDV ? parseFloat(formData.targetFDV) : null,
      newsTopics: formData.newsTopics || [],
      notificationEmail: formData.notificationEmail || null
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

    // 4. Send Confirmation Email
    try {
      const { sendAlertEmail } = await import("@/../../apps/api/src/services/email.service");
      await sendAlertEmail(formData.notificationEmail || authUser.email, {
        alertType: "MONITORING_ACTIVATED",
        severity: "INFO",
        message: `Your LaunchWatch autonomous monitor for "${config.project.name}" has been successfully initialized. Our agents are now scanning for updates according to your "${config.frequency}" protocol.`,
        project: config.project
      });
    } catch (emailErr) {
      console.error("Failed to send setup confirmation email:", emailErr);
    }

    return NextResponse.json({ 
      success: true, 
      message: "Monitoring activated successfully", 
      monitor: {
        id: config.id,
        type: monitoringType,
        email: formData.notificationEmail || authUser.email,
        projectUrl: config.project.websiteUrl || config.project.name,
        tokenSymbol: config.project.tokenAddress,
        frequency: config.frequency,
        createdAt: config.createdAt
      } 
    });

  } catch (error: any) {
    console.error("LaunchWatch Setup Error:", error);
    return NextResponse.json({ error: error.message || "Setup failed" }, { status: 500 });
  }
}
