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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController = __importStar(require("../controllers/auth.controller"));
const projectsController = __importStar(require("../controllers/projects.controller"));
const agentsController = __importStar(require("../controllers/agents.controller"));
const walletController = __importStar(require("../controllers/wallet.controller"));
const alertsController = __importStar(require("../controllers/alerts.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const cron_routes_1 = __importDefault(require("./cron.routes"));
const router = (0, express_1.Router)();
// Cron Routes
router.use("/cron", cron_routes_1.default);
// Auth Routes
router.post("/auth/register", authController.register);
router.post("/auth/login", authController.login);
router.post("/auth/google", authController.googleAuth);
router.get("/auth/verify", authController.verify);
router.post("/auth/refresh", authController.refresh);
router.post("/auth/forgot-password", authController.forgotPassword);
router.post("/auth/reset-password", authController.resetPassword);
router.post("/auth/change-password", auth_middleware_1.authMiddleware, authController.changePassword);
router.delete("/auth/account", auth_middleware_1.authMiddleware, authController.deleteAccount);
router.post("/auth/logout", auth_middleware_1.authMiddleware, authController.logout);
router.post("/auth/onboarding/complete", auth_middleware_1.authMiddleware, authController.completeOnboarding);
router.get("/auth/me", auth_middleware_1.authMiddleware, authController.me);
// Projects Routes
router.get("/projects", auth_middleware_1.authMiddleware, projectsController.getProjects);
router.post("/projects", auth_middleware_1.authMiddleware, projectsController.createProject);
router.put("/projects/:id", auth_middleware_1.authMiddleware, projectsController.updateProject);
router.delete("/projects/:id", auth_middleware_1.authMiddleware, projectsController.deleteProject);
router.get("/projects/:id/memory", auth_middleware_1.authMiddleware, projectsController.getProjectMemory);
// Agents Routes
router.get("/agents/my", auth_middleware_1.authMiddleware, agentsController.getMyAgents);
router.post("/agents/scamsniff/run", auth_middleware_1.authMiddleware, agentsController.runScamSniff);
router.post("/agents/threadsmith/run", auth_middleware_1.authMiddleware, agentsController.runThreadSmith);
router.post("/agents/launchwatch/setup", auth_middleware_1.authMiddleware, agentsController.setupLaunchWatch);
// Wallet Routes
router.post("/wallet/connect", auth_middleware_1.authMiddleware, walletController.connectWallet);
router.get("/wallet/status", auth_middleware_1.authMiddleware, walletController.getStatus);
router.get("/wallet/transactions", auth_middleware_1.authMiddleware, walletController.getTransactions);
router.post("/wallet/verify-signature", walletController.verifySignature);
// Alerts Routes
router.get("/alerts/list", auth_middleware_1.authMiddleware, alertsController.listAlerts);
router.patch("/alerts/:id/mark-read", auth_middleware_1.authMiddleware, alertsController.markRead);
router.post("/alerts/preferences", auth_middleware_1.authMiddleware, alertsController.updatePreferences);
exports.default = router;
