import dotenv from "dotenv";
import path from "path";
// Load the monorepo-root .env regardless of the process cwd
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
// Fallback to a local .env if one exists (does not override already-set vars)
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

const expressApp: express.Application = express();
const httpServer = createServer(expressApp);
const port = Number(process.env.PORT) || 3001;

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
const allowedOrigins = [
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3010",
  "https://agentb.netlify.app",
  "https://agentbazaar.vercel.app"
];

expressApp.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`), false);
    }
  },
  credentials: true
}));
expressApp.use(cookieParser());
expressApp.use(limiter);

expressApp.use(express.json());

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
