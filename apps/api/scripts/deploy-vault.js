const fs = require("fs");
const path = require("path");
const solc = require("solc");
const { ethers } = require("ethers");
require("dotenv").config({ path: path.resolve(__dirname, "../../../.env") });

async function main() {
  console.log("=== AgentBazaar HederaVault Smart Contract Deployment ===");

  const contractPath = path.resolve(
    __dirname,
    "../../../packages/database/contracts/HederaVault.sol"
  );
  const source = fs.readFileSync(contractPath, "utf8");

  console.log("1. Compiling HederaVault.sol...");
  const input = {
    language: "Solidity",
    sources: {
      "HederaVault.sol": {
        content: source,
      },
    },
    settings: {
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode"],
        },
      },
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  if (output.errors) {
    for (const err of output.errors) {
      if (err.severity === "error") {
        console.error("Compilation error:", err.formattedMessage);
        process.exit(1);
      }
    }
  }

  const contractOutput = output.contracts["HederaVault.sol"]["HederaVault"];
  const abi = contractOutput.abi;
  const bytecode = contractOutput.evm.bytecode.object;

  console.log("✓ Contract compiled successfully.");

  // Save compiled artifact
  const artifactDir = path.resolve(__dirname, "../artifacts");
  if (!fs.existsSync(artifactDir)) fs.mkdirSync(artifactDir, { recursive: true });
  fs.writeFileSync(
    path.join(artifactDir, "HederaVault.json"),
    JSON.stringify({ abi, bytecode }, null, 2)
  );

  // Deploy using operator private key on Hedera Testnet JSON-RPC
  const rpcUrl = "https://testnet.hashio.io/api";
  const privateKey =
    process.env.HEDERA_PRIVATE_KEY ||
    "0xc3ee5761d96b0280156128ad347fca03964f33e2a0cf7e8d2b6e8791867b4e2f";
  const accountId = process.env.HEDERA_ACCOUNT_ID || "0.0.10360854";

  console.log(`2. Deploying to Hedera Testnet (${rpcUrl})...`);
  console.log(`   Deployer Account ID: ${accountId}`);

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  console.log(`   Deployer EVM Address: ${wallet.address}`);

  const balance = await provider.getBalance(wallet.address);
  console.log(`   Deployer Balance: ${ethers.formatEther(balance)} HBAR/ETH`);

  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  console.log("3. Submitting ContractCreate deployment transaction...");
  const contract = await factory.deploy();
  console.log(`   Transaction Hash: ${contract.deploymentTransaction().hash}`);

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log(`\n🎉 HederaVault deployed successfully!`);
  console.log(`   Contract Address: ${contractAddress}`);
  console.log(
    `   HashScan URL: https://hashscan.io/testnet/contract/${contractAddress}`
  );
  console.log(
    `   Platform Payout Wallet: ${process.env.AGENTBAZAAR_PAY_TO || "0.0.10843793"}`
  );

  // Save deployed address to artifact
  fs.writeFileSync(
    path.join(artifactDir, "deployment.json"),
    JSON.stringify(
      {
        network: "hedera:testnet",
        contractAddress,
        deployerAccountId: accountId,
        deployerEvmAddress: wallet.address,
        platformPayoutAccountId: process.env.AGENTBAZAAR_PAY_TO || "0.0.10843793",
        deployedAt: new Date().toISOString(),
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error("Deployment failed:", err);
  process.exit(1);
});
