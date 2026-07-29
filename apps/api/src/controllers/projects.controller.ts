import { Request, Response } from "express";
import { PrismaClient } from "@agentbazaar/database";

import { MonitoringEngine } from "../services/monitoring.engine";

const prisma = new PrismaClient();

export const getProjects = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const projects = await prisma.project.findMany({
      where: { userId },
      include: { _count: { select: { agentRuns: true, memories: true } } }
    });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch projects" });
  }
};

export const createProject = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
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
  } catch (error) {
    res.status(500).json({ error: "Project creation failed" });
  }
};

export const getProjectMemory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
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
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch project memory" });
  }
};

export const updateProject = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
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
  } catch (error) {
    res.status(500).json({ error: "Project update failed" });
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const existing = await prisma.project.findFirst({ where: { id, userId } });
    if (!existing) {
      return res.status(404).json({ error: "Project not found or unauthorized" });
    }
    
    await prisma.project.delete({ where: { id } });
    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Project deletion failed" });
  }
};
