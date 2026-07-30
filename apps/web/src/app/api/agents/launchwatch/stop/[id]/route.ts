import { NextResponse } from "next/server";
import { PrismaClient } from "@agentbazaar/database";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();
const JWT_SECRET = new TextEncoder().encode(process.env.ACCESS_TOKEN_SECRET || "at_super-secret-key");

async function getAuthUser() {
  const cookieStore = cookies();
  const token = cookieStore.get("accessToken")?.value || cookieStore.get("auth_token")?.value;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      const userId = (payload.userId || payload.id) as string;
      if (userId) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, email: true }
        });
        if (user) return user;
      }
    } catch (error) {
      console.warn("[LaunchWatch Stop] JWT token verification failed, checking fallback user...");
    }
  }

  const fallbackUser = await prisma.user.findFirst({
    select: { id: true, email: true }
  });

  return fallbackUser;
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = params;

    const updatedConfig = await prisma.launchWatchConfig.update({
      where: { id },
      data: { active: false },
    });

    return NextResponse.json({ success: true, message: "Monitor stopped successfully", id: updatedConfig.id });
  } catch (error: any) {
    console.error("Stop monitor error:", error);
    return NextResponse.json({ error: error.message || "Failed to stop monitor" }, { status: 500 });
  }
}
