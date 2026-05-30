import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { createServer } from "http";
import routes from "./routes";
import { initSocket } from "./services/websocket.service";
import { MonitoringEngine } from "./services/monitoring.engine";

import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

const expressApp = express();
const httpServer = createServer(expressApp);
const port = Number(process.env.PORT) || 3005;

// Initialize WebSockets (on-demand via Pusher)
initSocket();

// Global Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased for development
  message: { error: "Too many requests, please try again later." }
});

// Middleware
expressApp.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
expressApp.use(cors({
  origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3010",
  credentials: true
}));
expressApp.use(cookieParser());
expressApp.use(limiter);

// Use express.json() for all routes EXCEPT Stripe webhooks
expressApp.use((req, res, next) => {
  if (req.originalUrl === "/webhooks/stripe") {
    next();
  } else {
    express.json()(req, res, next);
  }
});

// Main Routes
expressApp.use("/", routes);

// Health Check
expressApp.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date(), service: "AgentBazaar API" });
});

// Conditionally listen if not in a serverless environment
if (process.env.NODE_ENV !== "production" || process.env.VERCEL !== "1") {
  httpServer.listen(port, "0.0.0.0", () => {
    console.log(`✅ AgentBazaar API with LaunchWatch is LIVE`);
    console.log(`📡 URL: http://localhost:${port}`);
    console.log(`🏥 Health Check: http://localhost:${port}/health`);
    console.log(`🕰️ Started at: ${new Date().toISOString()}`);
  });
}

export default expressApp;
