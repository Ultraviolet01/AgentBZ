"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyAgents = exports.setupLaunchWatch = exports.runThreadSmith = exports.runScamSniff = void 0;
const database_1 = require("@agentbazaar/database");
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const monitoring_engine_1 = require("../services/monitoring.engine");
const prisma = new database_1.PrismaClient();
const anthropic = new sdk_1.default({
    apiKey: process.env.ANTHROPIC_API_KEY,
});
const runScamSniff = async (req, res) => {
    try {
        const userId = req.userId;
        const { projectId, url, pageContent, extractedData } = req.body;
        // Claude Analysis
        const response = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1000,
            system: database_1.SCAMSNIFF_SYSTEM_PROMPT,
            messages: [{
                    role: "user",
                    content: `Target URL: ${url}\nContent Snippet: ${pageContent}\nMetadata: ${JSON.stringify(extractedData)}`
                }],
        });
        let analysis;
        try {
            const textContent = response.content[0].type === 'text' ? response.content[0].text : "{}";
            analysis = JSON.parse(textContent);
        }
        catch (parseError) {
            console.warn("⚠️ ScamSniff: Failed to parse AI output. Using safe fallback.", parseError);
            analysis = {
                riskScore: 50,
                verdict: "INDETERMINATE",
                reasoning: "Automated analysis encountered an internal parsing error. Manual verification recommended.",
                risks: ["INTERNAL_PARSING_FAILURE"],
                recommendations: ["Manually audit the target URL", "Retry analysis in 5 minutes"]
            };
        }
        // 3. Persistence
        const result = await prisma.$transaction(async (tx) => {
            const run = await tx.agentRun.create({
                data: {
                    userId,
                    projectId,
                    agentType: "SCAMSNIFF",
                    inputData: { url, extractedData },
                    outputData: analysis,
                    creditsUsed: 1,
                    status: "COMPLETED"
                }
            });
            if (projectId) {
                await tx.projectMemory.create({
                    data: {
                        projectId,
                        sourceAgent: "SCAMSNIFF",
                        memoryType: "SCAN_RESULT",
                        content: { riskScore: analysis.riskScore, verdict: analysis.verdict, url },
                        storageCid: ""
                    }
                });
            }
            return run;
        });
        res.json({ ...analysis });
    }
    catch (error) {
        console.error("ScamSniff Error:", error);
        res.status(400).json({ error: error.message });
    }
};
exports.runScamSniff = runScamSniff;
const runThreadSmith = async (req, res) => {
    try {
        const userId = req.userId;
        const { projectId, contentType, tone, length, customInput, useMemory } = req.body;
        // 1. Credit Calculation (2-5 CRD based on length)
        let creditsUsed = 2; // Short
        if (length === "MEDIUM")
            creditsUsed = 3;
        if (length === "LONG")
            creditsUsed = 5;
        // 2. Context Gathering
        let context = customInput || "";
        if (useMemory && projectId) {
            const memories = await prisma.projectMemory.findMany({
                where: { projectId },
                orderBy: { createdAt: "desc" },
                take: 10
            });
            context += "\n\nProject History:\n" + memories.map((m) => `${m.memoryType}: ${JSON.stringify(m.content)}`).join("\n");
        }
        // 3. Generation
        if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your-anthropic-key-here') {
            return res.status(500).json({ error: "AI Generation failed: Anthropic API Key is missing or invalid." });
        }
        const response = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1500,
            system: database_1.THREADSMITH_SYSTEM_PROMPT,
            messages: [{
                    role: "user",
                    content: `ContentType: ${contentType}\nTone: ${tone}\nLength: ${length}\nContext: ${context}`
                }],
        });
        const generatedContent = response.content[0].type === 'text' ? response.content[0].text : "";
        if (!generatedContent) {
            throw new Error("Claude returned an empty response.");
        }
        // 4. Persistence
        const run = await prisma.agentRun.create({
            data: {
                userId,
                projectId: projectId || null,
                agentType: "THREADSMITH",
                inputData: { contentType, tone, length, customInput, useMemory },
                outputData: { content: generatedContent },
                creditsUsed,
                status: "COMPLETED"
            }
        });
        // 5. Optional: Update Project Memory
        if (projectId) {
            await prisma.projectMemory.create({
                data: {
                    projectId,
                    sourceAgent: "THREADSMITH",
                    memoryType: "CONTENT_GENERATION",
                    content: { contentType, tone, length, excerpt: generatedContent.substring(0, 200) },
                    storageCid: ""
                }
            });
        }
        res.json({ content: generatedContent, runId: run.id });
    }
    catch (error) {
        console.error("ThreadSmith Error:", error);
        res.status(400).json({ error: error.message });
    }
};
exports.runThreadSmith = runThreadSmith;
const setupLaunchWatch = async (req, res) => {
    try {
        const userId = req.userId;
        const { projectId, config } = req.body;
        // 1. Configure Monitoring
        const result = await prisma.launchWatchConfig.upsert({
            where: { projectId },
            update: { ...config, active: true },
            create: {
                projectId,
                ...config,
                active: true
            }
        });
        // 3. Trigger initial check
        await monitoring_engine_1.MonitoringEngine.performMonitoringCheck(projectId);
        res.json({ message: "LaunchWatch monitor established", result });
    }
    catch (error) {
        console.error("LaunchWatch Error:", error);
        res.status(400).json({ error: error.message });
    }
};
exports.setupLaunchWatch = setupLaunchWatch;
const getMyAgents = async (req, res) => {
    try {
        const userId = req.userId;
        const agents = await prisma.deployedAgent.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" }
        });
        res.json(agents);
    }
    catch (error) {
        console.error("GetMyAgents Error:", error);
        res.status(500).json({ error: "Failed to fetch your agents" });
    }
};
exports.getMyAgents = getMyAgents;
