"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const routes_1 = __importDefault(require("./routes"));
const websocket_service_1 = require("./services/websocket.service");
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const expressApp = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(expressApp);
const port = Number(process.env.PORT) || 3005;
// Initialize WebSockets (on-demand via Pusher)
(0, websocket_service_1.initSocket)();
// Global Rate Limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Increased for development
    message: { error: "Too many requests, please try again later." }
});
// Middleware
expressApp.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3010",
    "https://agentb.netlify.app",
    "https://agentbazaar.vercel.app"
];
expressApp.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error(`Origin ${origin} not allowed by CORS`), false);
        }
    },
    credentials: true
}));
expressApp.use((0, cookie_parser_1.default)());
expressApp.use(limiter);
// Use express.json() for all routes EXCEPT Stripe webhooks
expressApp.use((req, res, next) => {
    if (req.originalUrl === "/webhooks/stripe") {
        next();
    }
    else {
        express_1.default.json()(req, res, next);
    }
});
// Main Routes
expressApp.use("/", routes_1.default);
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
exports.default = expressApp;
