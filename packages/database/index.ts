import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export * from "@prisma/client";
export * from "./src/services/prompts";
export * from "./src/auth";
