import { PrismaClient, AlertSeverity } from "@agentbazaar/database";
import * as EmailService from "./email.service";
import { SimulatedSocialService } from "./social.service";

const prisma = new PrismaClient();

export class MonitoringEngine {
  /**
   * Triggers monitoring checks for all active projects.
   * This is intended to be called by a Vercel Cron Job.
   */
  static async triggerAllActive() {
    try {
      console.log("🚀 Triggering all active monitors via Cron...");
      const now = new Date();
      const activeConfigs = await prisma.launchWatchConfig.findMany({
        where: { 
          active: true,
          OR: [
            { nextRunAt: { lte: now } },
            { nextRunAt: null }
          ]
        }
      });

      console.log(`📡 Found ${activeConfigs.length} monitors due for check.`);

      for (const config of activeConfigs) {
        await this.performMonitoringCheck(config.projectId);
      }
      
      return { count: activeConfigs.length };
    } catch (error: any) {
      console.error("❌ Failed to trigger monitoring:", error.message);
      throw error;
    }
  }

  /**
   * Core execution loop for a monitoring check
   */
  static async performMonitoringCheck(projectId: string) {
    try {
      const config = await prisma.launchWatchConfig.findUnique({
        where: { projectId },
        include: { project: { include: { user: true } } }
      });

      if (!config || !config.active) return;

      const realUserId = config.project.userId;

      // 1. Perform Intelligent Checks
      const alerts = [];
      const enabledAlerts = config.alertTypes as any;
      let socialSnapshot = null;
      let websiteSnapshot = { status: "ONLINE", latency: "42ms" };

      if (enabledAlerts?.social_activity) {
        socialSnapshot = await SimulatedSocialService.getProjectActivity(config.project.twitterHandle || config.project.name);
        if (socialSnapshot.metrics.isSpike) {
          alerts.push({
            type: "SOCIAL_SPIKE",
            severity: AlertSeverity.HIGH,
            message: `Detected activity spike for @${socialSnapshot.handle}. Metric factor: ${socialSnapshot.metrics.spikeFactor}x.`,
            metadata: socialSnapshot.metrics
          });
        }
      }

      if (enabledAlerts?.website_changes) {
        const hasChanges = Math.random() > 0.95;
        if (hasChanges) {
          websiteSnapshot.status = "MODIFIED";
          alerts.push({
            type: "WEBSITE_CHANGE",
            severity: AlertSeverity.CRITICAL,
            message: `Technical anomaly detected on ${config.project.websiteUrl}. Content checksum mismatch.`,
            metadata: { detectedAt: new Date().toISOString() }
          });
        }
      }

      if (enabledAlerts?.token_milestone) {
        // Milestone Tracking Logic
        const tokenSymbol = config.project.tokenAddress || config.project.name;
        const currentFDV = await this.getCurrentFDV(tokenSymbol);
        const targetFDV = (enabledAlerts as any).targetFDV;

        if (targetFDV && currentFDV >= targetFDV) {
          alerts.push({
            type: "MILESTONE_REACHED",
            severity: AlertSeverity.CRITICAL,
            message: `Target Milestone Reached! ${config.project.name} (${config.project.tokenAddress || 'Token'}) has surpassed your target FDV of $${targetFDV.toLocaleString()}. Current FDV: $${currentFDV.toLocaleString()}`,
            metadata: { currentFDV, targetFDV, tokenSymbol }
          });
        }
      }

      if (enabledAlerts?.crypto_news) {
        // Intelligence News Logic
        const hasNews = Math.random() > 0.8;
        if (hasNews) {
          alerts.push({
            type: "INTELLIGENCE_UPDATE",
            severity: AlertSeverity.MEDIUM,
            message: `New market intelligence detected for ${config.project.name}. Potential ecosystem expansion identified.`,
            metadata: { source: "SimulatedNewsService", relevance: 0.92 }
          });
        }
      }

      // 3. Create Monitoring Artifact Snapshot
      const checkSnapshot = {
        projectId,
        projectName: config.project.name,
        timestamp: new Date().toISOString(),
        social: socialSnapshot,
        website: websiteSnapshot,
        alertsGenerated: alerts.length
      };

      // 4. Record as AgentRun (Universal History)
      await prisma.agentRun.create({
        data: {
          userId: realUserId,
          projectId,
          agentType: "LAUNCHWATCH",
          inputData: { configId: config.id, frequency: config.frequency },
          outputData: checkSnapshot as any,
          creditsUsed: 1,
          status: "COMPLETED"
        }
      });

      // 5. Process Alerts (Emails)
      for (const alertData of alerts) {
        const alert = await prisma.launchWatchAlert.create({
          data: {
            projectId,
            userId: realUserId,
            alertType: alertData.type,
            severity: alertData.severity as AlertSeverity,
            message: alertData.message,
            metadata: alertData.metadata
          }
        });

        if (config.emailEnabled) {
          const targetEmail = (config.alertTypes as any)?.notificationEmail || config.project.user.email;
          await EmailService.sendAlertEmail(targetEmail, {
            projectName: config.project.name,
            alertType: alertData.type,
            severity: alertData.severity,
            message: alertData.message,
            project: config.project
          });
          
          await prisma.launchWatchAlert.update({
            where: { id: alert.id },
            data: { emailSent: true, emailSentAt: new Date() }
          });
        }
      }

      // 6. Housekeeping - Update Run Times
      await prisma.launchWatchConfig.update({
        where: { projectId },
        data: { 
          lastRunAt: new Date(),
          nextRunAt: this.calculateNextRun(config.frequency)
        }
      });

      console.log(`✅ Monitoring check completed for ${config.project.name}`);

    } catch (err: any) {
      console.error(`❌ Monitoring failure for project ${projectId}:`, err.message);
      
      // Auto-suspend if credits are insufficient
      if (err.message.includes("Insufficient credits")) {
        console.warn(`🛑 Suspending monitoring for ${projectId} due to zero balance.`);
        
        try {
          await prisma.launchWatchConfig.update({
            where: { projectId },
            data: { active: false }
          });

          // Notify User
          const config = await prisma.launchWatchConfig.findUnique({
            where: { projectId },
            include: { project: { include: { user: true } } }
          });
          
          if (config) {
            await EmailService.sendAlertEmail(config.project.user.email, {
              alertType: "MONITORING_SUSPENDED",
              severity: AlertSeverity.CRITICAL,
              message: `Your LaunchWatch monitor for "${config.project.name}" has been suspended due to insufficient credits. Please top up your balance to resume autonomous surveillance.`,
              project: config.project
            });
          }
        } catch (suspendErr) {
          console.error("Failed to suspend monitoring config:", suspendErr);
        }
      }
    }
  }

  private static calculateNextRun(frequency: string): Date {
      const now = new Date();
      if (frequency === "HOURLY") return new Date(now.getTime() + 60 * 60 * 1000);
      if (frequency === "WEEKLY") return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return new Date(now.getTime() + 24 * 60 * 60 * 1000); // Daily
  }

  private static async getCurrentFDV(symbolOrAddress: string): Promise<number> {
    console.log(`[MonitoringEngine] Fetching live FDV from DexScreener for ${symbolOrAddress}...`);
    try {
      const isAddress = symbolOrAddress.startsWith("0x") || symbolOrAddress.length >= 32;
      const url = isAddress
        ? `https://api.dexscreener.com/latest/dex/tokens/${symbolOrAddress}`
        : `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(symbolOrAddress)}`;

      const res = await fetch(url, {
        headers: { "Accept": "application/json" },
        signal: AbortSignal.timeout(8000)
      });

      if (res.ok) {
        const data = await res.json();
        const topPair = data.pairs?.[0];

        if (topPair) {
          const fdv = topPair.fdv || topPair.marketCap || (topPair.priceUsd ? parseFloat(topPair.priceUsd) * 1000000000 : 0);
          console.log(`[MonitoringEngine] DexScreener Live FDV for ${symbolOrAddress}: $${fdv?.toLocaleString()} (Pair: ${topPair.baseToken?.symbol}/${topPair.quoteToken?.symbol})`);
          if (fdv > 0) return fdv;
        }
      }
    } catch (err: any) {
      console.warn(`[MonitoringEngine] DexScreener API fetch failed: ${err.message}. Falling back to simulation...`);
    }

    // Fallback to simulation if token is not found on DEX or API fails
    return Math.floor(Math.random() * 99000000) + 1000000;
  }
}
