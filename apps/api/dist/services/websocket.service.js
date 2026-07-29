"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.broadcastAlert = exports.getIO = exports.initSocket = void 0;
const pusher_1 = __importDefault(require("pusher"));
let pusher = null;
/**
 * Initializes Pusher with environment variables.
 * In a serverless environment, this is called on demand.
 */
const initSocket = () => {
    if (!pusher) {
        const appId = process.env.PUSHER_APP_ID;
        const key = process.env.PUSHER_KEY;
        const secret = process.env.PUSHER_SECRET;
        const cluster = process.env.PUSHER_CLUSTER || "mt1";
        if (!appId || !key || !secret || appId.startsWith("mock_")) {
            console.warn("⚠️ Pusher is not fully configured (using mock/missing credentials). Websockets broadcast disabled.");
            return null;
        }
        pusher = new pusher_1.default({
            appId,
            key,
            secret,
            cluster,
            useTLS: true,
        });
    }
    return pusher;
};
exports.initSocket = initSocket;
const getIO = () => {
    return (0, exports.initSocket)();
};
exports.getIO = getIO;
/**
 * Broadcasts an alert to a specific project channel using Pusher.
 */
const broadcastAlert = async (projectId, alert) => {
    const p = (0, exports.getIO)();
    if (!p)
        return;
    try {
        await p.trigger(`project_${projectId}`, "newAlert", alert);
        console.log(`📡 Pusher alert broadcasted for project ${projectId}`);
    }
    catch (error) {
        console.error("❌ Pusher broadcast failed:", error);
    }
};
exports.broadcastAlert = broadcastAlert;
