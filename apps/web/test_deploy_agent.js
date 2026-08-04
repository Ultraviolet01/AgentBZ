require("dotenv").config({ path: "../../.env" });
const { PrismaClient } = require("@prisma/client");
const { SignJWT } = require("jose");

const prisma = new PrismaClient();
const secret = new TextEncoder().encode(process.env.ACCESS_TOKEN_SECRET || "at_super-secret-key");

async function runDeployTest() {
  console.log("==========================================");
  console.log("🚀 TESTING AGENT DEPLOYMENT & ADMIN VERIFICATION STATUS");
  console.log("==========================================");

  // 1. Resolve User
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: "meedex42@gmail.com",
        username: "agent_developer",
        emailVerified: true,
      },
    });
  }

  console.log(`[1] Developer User: ${user.email} (ID: ${user.id})`);

  // 2. Sign Token
  const token = await new SignJWT({ userId: user.id, email: user.email })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("2h")
    .sign(secret);

  // 3. Deploy New Custom Agent
  const agentSlugSuffix = Date.now().toString().slice(-4);
  const agentPayload = {
    name: `DeFi Sentinel Bot ${agentSlugSuffix}`,
    description: "Autonomous risk monitoring and liquidity health checker for EVM protocols.",
    longDescription: "Monitors pool depth, slippage anomalies, and whale moves in real time.",
    category: "DeFi",
    tags: ["DeFi", "Risk", "Security"],
    pricePerRun: 0.25,
    icon: "🛡️",
    color: "#f97316",
    logic: "You are an autonomous DeFi security sentinel. Evaluate liquidity depth and return risk alerts.",
    apiKeys: []
  };

  console.log(`[2] Dispatching POST http://localhost:3010/api/agents/deploy for "${agentPayload.name}"...`);

  const deployRes = await fetch("http://localhost:3010/api/agents/deploy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": `accessToken=${token}`,
    },
    body: JSON.stringify(agentPayload),
  });

  console.log(`[2] Deploy HTTP Status: ${deployRes.status}`);
  const deployData = await deployRes.json();
  console.log(`[2] Deploy Response:`, JSON.stringify(deployData, null, 2));

  if (!deployRes.ok || !deployData.success) {
    throw new Error(`Agent deployment failed: ${JSON.stringify(deployData)}`);
  }

  const deployedAgentId = deployData.agent.id;

  // 4. Verify Status in Database
  const dbAgent = await prisma.deployedAgent.findUnique({
    where: { id: deployedAgentId },
  });

  console.log(`\n[3] DB Verification for Agent ID: ${dbAgent.id}`);
  console.log(`    Name: "${dbAgent.name}"`);
  console.log(`    Status: "${dbAgent.status}" (Expected: "pending")`);
  console.log(`    CDR Keys Vault UUID: ${dbAgent.cdrKeysVaultUuid}`);
  console.log(`    KeeperHub Workflow Slug: ${dbAgent.keeperhubSlug}`);

  // 5. Query /api/agents/my
  console.log(`\n[4] Querying GET http://localhost:3010/api/agents/my...`);
  const myRes = await fetch("http://localhost:3010/api/agents/my", {
    headers: {
      "Cookie": `accessToken=${token}`,
    },
  });

  console.log(`[4] My Agents HTTP Status: ${myRes.status}`);
  const myAgents = await myRes.json();
  console.log(`[4] My Agents Count: ${myAgents.length}`);
  
  const targetInMy = myAgents.find((a) => a.id === deployedAgentId);
  console.log(`[4] Profile Visibility & Status:`, targetInMy);

  if (targetInMy && targetInMy.status === "pending") {
    console.log("==========================================");
    console.log("🎉 AGENT DEPLOYMENT & PENDING VERIFICATION PASSED!");
    console.log("==========================================");
  } else {
    throw new Error(`Agent status mismatch or missing from profile endpoint.`);
  }
}

runDeployTest()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
