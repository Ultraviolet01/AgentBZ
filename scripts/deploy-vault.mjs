/**
 * deploy-vault.mjs
 * Deploys HederaVault.sol to Hedera Testnet via JSON-RPC (hashio.io)
 * Operator: 0.0.10368450
 *
 * Run: node scripts/deploy-vault.mjs
 */

import { ethers } from "ethers";
import { readFileSync } from "fs";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// ── Config ────────────────────────────────────────────────────────────────────
const HEDERA_RPC_URL = "https://testnet.hashio.io/api";
const OPERATOR_PRIVATE_KEY =
  process.env.HEDERA_PRIVATE_KEY ||
  "0x629c714effbd5c7b4f70facc8e72ee8f460cc2ec7c0a2dc712b6f0b8eca37a20";

// ── Compile HederaVault.sol via solc JS API ───────────────────────────────────
console.log("Loading solc...");
const solc = require("solc");

const solFilePath = path.resolve(
  __dirname,
  "../packages/database/contracts/HederaVault.sol"
);
const source = readFileSync(solFilePath, "utf8");

console.log("Compiling HederaVault.sol...");

const input = {
  language: "Solidity",
  sources: {
    "HederaVault.sol": { content: source },
  },
  settings: {
    optimizer: { enabled: true, runs: 200 },
    outputSelection: {
      "*": {
        "*": ["abi", "evm.bytecode"],
      },
    },
  },
};

const outputRaw = solc.compile(JSON.stringify(input));
const output = JSON.parse(outputRaw);

if (output.errors) {
  const errors = output.errors.filter((e) => e.severity === "error");
  if (errors.length > 0) {
    console.error("Compilation errors:");
    errors.forEach((e) => console.error(e.formattedMessage));
    process.exit(1);
  }
  // Print warnings only
  output.errors.forEach((e) => console.warn("[warn]", e.formattedMessage));
}

const contractOutput =
  output.contracts["HederaVault.sol"]["HederaVault"];
const contractAbi = contractOutput.abi;
const contractBytecode = "0x" + contractOutput.evm.bytecode.object;

console.log("✅ Compilation successful\n");

// ── Deploy ────────────────────────────────────────────────────────────────────
async function deploy() {
  const provider = new ethers.JsonRpcProvider(HEDERA_RPC_URL);
  const wallet = new ethers.Wallet(OPERATOR_PRIVATE_KEY, provider);

  console.log(`Deploying from EVM address : ${wallet.address}`);
  console.log("Network                    : Hedera Testnet\n");

  const factory = new ethers.ContractFactory(
    contractAbi,
    contractBytecode,
    wallet
  );

  console.log("Sending deploy transaction...");
  const contract = await factory.deploy();
  console.log(`TX hash: ${contract.deploymentTransaction().hash}`);

  console.log("Waiting for confirmation (may take 10–20s on Hedera testnet)...");
  await contract.waitForDeployment();

  const address = await contract.getAddress();

  console.log("\n════════════════════════════════════════════════════════");
  console.log("✅ HederaVault deployed successfully!");
  console.log(`   Contract Address : ${address}`);
  console.log(`   Owner (operator) : ${wallet.address}`);
  console.log(
    `   HashScan         : https://hashscan.io/testnet/contract/${address}`
  );
  console.log("════════════════════════════════════════════════════════\n");

  console.log("📋 Copy these into your .env files:");
  console.log(`HEDERA_VAULT_CONTRACT_ADDRESS="${address}"`);
  console.log(`NEXT_PUBLIC_HEDERA_VAULT_CONTRACT="${address}"`);
}

deploy().catch((err) => {
  console.error("❌ Deployment failed:", err.message);
  process.exit(1);
});
