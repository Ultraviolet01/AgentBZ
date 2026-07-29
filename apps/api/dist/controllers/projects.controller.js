"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProject = exports.updateProject = exports.getProjectMemory = exports.createProject = exports.getProjects = void 0;
const database_1 = require("@agentbazaar/database");
const prisma = new database_1.PrismaClient();
const getProjects = async (req, res) => {
    try {
        const userId = req.userId;
        const projects = await prisma.project.findMany({
            where: { userId },
            include: { _count: { select: { agentRuns: true, memories: true } } }
        });
        res.json(projects);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch projects" });
    }
};
exports.getProjects = getProjects;
const createProject = async (req, res) => {
    try {
        const userId = req.userId;
        const { name, description, websiteUrl, tokenAddress, twitterHandle, notes } = req.body;
        const project = await prisma.project.create({
            data: {
                userId,
                name,
                description,
                websiteUrl,
                tokenAddress,
                twitterHandle,
                notes
            }
        });
        res.status(201).json(project);
    }
    catch (error) {
        res.status(500).json({ error: "Project creation failed" });
    }
};
exports.createProject = createProject;
const getProjectMemory = async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;
        const project = await prisma.project.findFirst({ where: { id, userId } });
        if (!project) {
            return res.status(404).json({ error: "Project not found or unauthorized" });
        }
        const memory = await prisma.projectMemory.findMany({
            where: { projectId: id },
            orderBy: { createdAt: "desc" }
        });
        res.json(memory);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch project memory" });
    }
};
exports.getProjectMemory = getProjectMemory;
const updateProject = async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;
        const { name, description, websiteUrl, tokenAddress, twitterHandle, notes } = req.body;
        const existing = await prisma.project.findFirst({ where: { id, userId } });
        if (!existing) {
            return res.status(404).json({ error: "Project not found or unauthorized" });
        }
        const project = await prisma.project.update({
            where: { id },
            data: { name, description, websiteUrl, tokenAddress, twitterHandle, notes }
        });
        res.json(project);
    }
    catch (error) {
        res.status(500).json({ error: "Project update failed" });
    }
};
exports.updateProject = updateProject;
const deleteProject = async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;
        const existing = await prisma.project.findFirst({ where: { id, userId } });
        if (!existing) {
            return res.status(404).json({ error: "Project not found or unauthorized" });
        }
        await prisma.project.delete({ where: { id } });
        res.json({ message: "Project deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ error: "Project deletion failed" });
    }
};
exports.deleteProject = deleteProject;
