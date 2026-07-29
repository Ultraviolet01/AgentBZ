"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePreferences = exports.markRead = exports.listAlerts = void 0;
const database_1 = require("@agentbazaar/database");
const prisma = new database_1.PrismaClient();
const listAlerts = async (req, res) => {
    try {
        const userId = req.userId;
        const alerts = await prisma.launchWatchAlert.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" }
        });
        res.json(alerts);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch alerts" });
    }
};
exports.listAlerts = listAlerts;
const markRead = async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;
        const alert = await prisma.launchWatchAlert.updateMany({
            where: { id, userId },
            data: { read: true }
        });
        if (alert.count === 0) {
            return res.status(404).json({ error: "Alert not found or unauthorized" });
        }
        res.json({ success: true, id, read: true });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to mark alert as read" });
    }
};
exports.markRead = markRead;
const updatePreferences = async (req, res) => {
    try {
        // In a real app, this would update a user preferences table or column
        res.json({ message: "Alert preferences updated" });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to update preferences" });
    }
};
exports.updatePreferences = updatePreferences;
