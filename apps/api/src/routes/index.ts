import express, { Router } from "express";
import * as authController from "../controllers/auth.controller";
import * as projectsController from "../controllers/projects.controller";
import * as agentsController from "../controllers/agents.controller";
import * as walletController from "../controllers/wallet.controller";
import * as alertsController from "../controllers/alerts.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import cronRoutes from "./cron.routes";

const router: Router = Router();

// Cron Routes
router.use("/cron", cronRoutes);

// Auth Routes
router.post("/auth/register", authController.register);
router.post("/auth/login", authController.login);
router.post("/auth/google", authController.googleAuth);
router.get("/auth/verify", authController.verify);
router.post("/auth/refresh", authController.refresh);
router.post("/auth/forgot-password", authController.forgotPassword);
router.post("/auth/reset-password", authController.resetPassword);
router.post("/auth/change-password", authMiddleware, authController.changePassword);
router.delete("/auth/account", authMiddleware, authController.deleteAccount);
router.post("/auth/logout", authMiddleware, authController.logout);
router.post("/auth/onboarding/complete", authMiddleware, authController.completeOnboarding);
router.get("/auth/me", authMiddleware, authController.me);

// Projects Routes
router.get("/projects", authMiddleware, projectsController.getProjects);
router.post("/projects", authMiddleware, projectsController.createProject);
router.put("/projects/:id", authMiddleware, projectsController.updateProject);
router.delete("/projects/:id", authMiddleware, projectsController.deleteProject);
router.get("/projects/:id/memory", authMiddleware, projectsController.getProjectMemory);

// Agents Routes
router.get("/agents/my", authMiddleware, agentsController.getMyAgents);
router.post("/agents/scamsniff/run", authMiddleware, agentsController.runScamSniff);
router.post("/agents/threadsmith/run", authMiddleware, agentsController.runThreadSmith);
router.post("/agents/launchwatch/setup", authMiddleware, agentsController.setupLaunchWatch);
router.post("/agents/run", async (req, res) => {
  try {
    const { POST: handleRun } = await import("./agents/run");
    const webReq = new Request(`http://${req.headers.host || "localhost"}${req.originalUrl}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(req.body),
    });
    const webRes = await handleRun(webReq);
    const data = await webRes.json();
    const xPayment = webRes.headers.get("X-Payment");
    if (xPayment) res.setHeader("X-Payment", xPayment);
    res.status(webRes.status).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to run agent" });
  }
});

router.post("/agents/deploy", async (req, res) => {
  try {
    const { POST: handleDeploy } = await import("./agents/deploy");
    const webReq = new Request(`http://${req.headers.host || "localhost"}${req.originalUrl}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(req.body),
    });
    const webRes = await handleDeploy(webReq);
    const data = await webRes.json();
    res.status(webRes.status).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to deploy agent" });
  }
});

// Chat Orchestrator Routes
router.post("/chat/orchestrate", async (req, res) => {
  try {
    const { POST: handleOrchestrate } = await import("./chat/orchestrate");
    const webReq = new Request(`http://${req.headers.host || "localhost"}${req.originalUrl}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(req.body),
    });
    const webRes = await handleOrchestrate(webReq);
    const data = await webRes.json();
    res.status(webRes.status).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Orchestration failed" });
  }
});

// Wallet Routes
router.post("/wallet/connect", authMiddleware, walletController.connectWallet);
router.get("/wallet/status", authMiddleware, walletController.getStatus);
router.get("/wallet/transactions", authMiddleware, walletController.getTransactions);
router.post("/wallet/verify-signature", walletController.verifySignature);

// Alerts Routes
router.get("/alerts/list", authMiddleware, alertsController.listAlerts);
router.patch("/alerts/:id/mark-read", authMiddleware, alertsController.markRead);
router.post("/alerts/preferences", authMiddleware, alertsController.updatePreferences);

export default router;
