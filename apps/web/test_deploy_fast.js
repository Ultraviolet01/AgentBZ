require("dotenv").config({ path: "../../.env" });
const { PrismaClient } = require("@prisma/client");
const { SignJWT } = require("jose");

const prisma = new PrismaClient();
const secret = new TextEncoder().encode(process.env.ACCESS_TOKEN_SECRET || "at_super-secret-key");

async function main() {
  const user = await prisma.user.findFirst();
  const token = await new SignJWT({ userId: user.id, email: user.email })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("2h")
    .sign(secret);

  const slugSuffix = Math.floor(1000 + Math.random() * 9000);
  const payload = {
    name: `DeFi Sentinel Bot ${slugSuffix}`,
    description: "Autonomous risk monitoring and liquidity health checker.",
    category: "DeFi",
    pricePerRun: 0.25,
    logic: "System prompt for sentinel bot",
    apiKeys: [],
  };

  console.log("Sending POST /api/agents/deploy...");
  const start = Date.now();
  const res = await fetch("http://localhost:3010/api/agents/deploy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": `accessToken=${token}`,
    },
    body: JSON.stringify(payload),
  });

  const duration = Date.now() - start;
  console.log(`HTTP Status: ${res.status} (${duration}ms)`);
  const data = await res.json();
  console.log("Response:", JSON.stringify(data, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
