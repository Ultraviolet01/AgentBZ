"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitoringEngine = void 0;
const database_1 = require("@agentbazaar/database");
const EmailService = __importStar(require("./email.service"));
const social_service_1 = require("./social.service");
const prisma = new database_1.PrismaClient();
const storageService = new database_1.StorageService();
const creditsService = new database_1.CreditsService(prisma);
class MonitoringEngine {
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
        }
        catch (error) {
            console.error("❌ Failed to trigger monitoring:", error.message);
            throw error;
        }
    }
    /**
     * Core execution loop for a monitoring check
     */
    static async performMonitoringCheck(projectId) {
        try {
            const config = await prisma.launchWatchConfig.findUnique({
                where: { projectId },
                include: { project: { include: { user: true } } }
            });
            if (!config || !config.active)
                return;
            const realUserId = config.project.userId;
            // 1. Credit Deduction (1 CRD per check)
            await creditsService.deductCredits(realUserId, 1, `LaunchWatch Monitoring Check: ${config.project.name}`);
            // 2. Perform Intelligent Checks
            const alerts = [];
            const enabledAlerts = config.alertTypes;
            let socialSnapshot = null;
            let websiteSnapshot = { status: "ONLINE", latency: "42ms" };
            if (enabledAlerts?.social_activity) {
                socialSnapshot = await social_service_1.SimulatedSocialService.getProjectActivity(config.project.twitterHandle || config.project.name);
                if (socialSnapshot.metrics.isSpike) {
                    alerts.push({
                        type: "SOCIAL_SPIKE",
                        severity: database_1.AlertSeverity.HIGH,
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
                        severity: database_1.AlertSeverity.CRITICAL,
                        message: `Technical anomaly detected on ${config.project.websiteUrl}. Content checksum mismatch.`,
                        metadata: { detectedAt: new Date().toISOString() }
                    });
                }
            }
            if (enabledAlerts?.token_milestone) {
                // Milestone Tracking Logic
                const tokenSymbol = config.project.tokenAddress || config.project.name;
                const currentFDV = await this.getCurrentFDV(tokenSymbol);
                const targetFDV = enabledAlerts.targetFDV;
                if (targetFDV && currentFDV >= targetFDV) {
                    alerts.push({
                        type: "MILESTONE_REACHED",
                        severity: database_1.AlertSeverity.CRITICAL,
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
                        severity: database_1.AlertSeverity.MEDIUM,
                        message: `New market intelligence detected for ${config.project.name}. Potential ecosystem expansion identified.`,
                        metadata: { source: "SimulatedNewsService", relevance: 0.92 }
                    });
                }
            }
            // 3. Create Monitoring Artifact Snapshot for 0G Storage
            const checkSnapshot = {
                projectId,
                projectName: config.project.name,
                timestamp: new Date().toISOString(),
                social: socialSnapshot,
                website: websiteSnapshot,
                alertsGenerated: alerts.length
            };
            const uploadResult = await storageService.uploadArtifact(checkSnapshot, {
                agent: "LAUNCHWATCH",
                projectId,
                type: "MONITORING_SNAPSHOT"
            });
            // 4. Record as AgentRun (Universal History)
            await prisma.agentRun.create({
                data: {
                    userId: realUserId,
                    projectId,
                    agentType: "LAUNCHWATCH",
                    inputData: { configId: config.id, frequency: config.frequency },
                    outputData: checkSnapshot,
                    creditsUsed: 1,
                    status: "COMPLETED",
                    artifactCid: uploadResult.cid
                }
            });
            // 5. Process Alerts (Emails)
            for (const alertData of alerts) {
                const alert = await prisma.launchWatchAlert.create({
                    data: {
                        projectId,
                        userId: realUserId,
                        alertType: alertData.type,
                        severity: alertData.severity,
                        message: alertData.message,
                        metadata: alertData.metadata
                    }
                });
                if (config.emailEnabled) {
                    const targetEmail = config.alertTypes?.notificationEmail || config.project.user.email;
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
        }
        catch (err) {
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
                            severity: database_1.AlertSeverity.CRITICAL,
                            message: `Your LaunchWatch monitor for "${config.project.name}" has been suspended due to insufficient credits. Please top up your balance to resume autonomous surveillance.`,
                            project: config.project
                        });
                    }
                }
                catch (suspendErr) {
                    console.error("Failed to suspend monitoring config:", suspendErr);
                }
            }
        }
    }
    static calculateNextRun(frequency) {
        const now = new Date();
        if (frequency === "HOURLY")
            return new Date(now.getTime() + 60 * 60 * 1000);
        if (frequency === "WEEKLY")
            return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        return new Date(now.getTime() + 24 * 60 * 60 * 1000); // Daily
    }
    static async getCurrentFDV(symbol) {
        // In production, this would call CoinGecko, DexScreener, etc.
        // For this simulation, we'll return a value that occasionally hits the target
        console.log(`[MonitoringEngine] Fetching FDV for ${symbol}...`);
        // Simulate a value between 1M and 100M
        return Math.floor(Math.random() * 99000000) + 1000000;
    }
}
exports.MonitoringEngine = MonitoringEngine;
