// apps/api/src/lib/hedera-vault.ts
// On-Chain HederaVault Smart Contract Interaction Utility
// Interacts with HederaVault.sol deployed on Hedera Testnet: 0xe798d59561B17AdF72fEa555d5113bB248a084A4

import { ethers } from "ethers";

const HEDERA_RPC_URL =
  process.env.HEDERA_RPC_URL || "https://testnet.hashio.io/api";
const VAULT_CONTRACT_ADDRESS =
  process.env.HEDERA_VAULT_CONTRACT_ADDRESS ||
  "0xe798d59561B17AdF72fEa555d5113bB248a084A4";

const VAULT_ABI = [
  "function deposit() external payable",
  "function depositFor(address buyer) external payable",
  "function deduct(address buyer, uint256 amount, address recipient) external",
  "function withdraw(uint256 amount) external",
  "function getBalance(address buyer) external view returns (uint256)",
  "function totalDeposited() external view returns (uint256)",
  "function totalDeducted() external view returns (uint256)",
  "function owner() external view returns (address)",
  "event Deposited(address indexed buyer, uint256 amount, uint256 newBalance)",
  "event Deducted(address indexed buyer, address indexed recipient, uint256 amount, uint256 remainingBalance)",
  "event Withdrawn(address indexed buyer, uint256 amount, uint256 remainingBalance)",
];

const MIRROR_NODE_URL = "https://testnet.mirrornode.hedera.com";

/**
 * Cache for resolved EVM addresses to avoid repeated Mirror Node lookups
 */
const _evmAddressCache: Record<string, string> = {};

/**
 * Converts a Hedera Account ID (0.0.XXXXX) or EVM address to a validated 20-byte EVM address.
 * 1. If already 0x..., validates and returns checksum address.
 * 2. Checks Mirror Node for account's EVM alias address.
 * 3. Falls back to Hedera Solidity address derivation (0x000...accountNum).
 */
export async function getEvmAddress(hederaAccountIdOrAddress: string): Promise<string> {
  if (!hederaAccountIdOrAddress) return ethers.ZeroAddress;

  const input = hederaAccountIdOrAddress.trim();

  // If already standard EVM address (0x...)
  if (input.startsWith("0x") && input.length === 42) {
    try {
      return ethers.getAddress(input);
    } catch {
      return input.toLowerCase();
    }
  }

  // Check cache
  if (_evmAddressCache[input]) {
    return _evmAddressCache[input];
  }

  // Query Hedera Mirror Node
  try {
    const res = await fetch(`${MIRROR_NODE_URL}/api/v1/accounts/${input}`);
    if (res.ok) {
      const data = await res.json();
      if (data.evm_address && data.evm_address.startsWith("0x")) {
        const addr = ethers.getAddress(data.evm_address);
        _evmAddressCache[input] = addr;
        return addr;
      }
    }
  } catch (err: any) {
    console.warn(`[HederaVault] Mirror Node EVM lookup failed for ${input}:`, err.message);
  }

  // Fallback: Hedera Solidity format (0.0.num -> 0x0000000000000000000000000000000000xxxxxx)
  try {
    const parts = input.split(".");
    if (parts.length === 3) {
      const accountNum = parseInt(parts[2], 10);
      const hexNum = accountNum.toString(16).padStart(40, "0");
      const derived = ethers.getAddress("0x" + hexNum);
      _evmAddressCache[input] = derived;
      return derived;
    }
  } catch {}

  return ethers.ZeroAddress;
}

/**
 * Creates an ethers JsonRpcProvider connected to Hedera Testnet
 */
export function getProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(HEDERA_RPC_URL);
}

/**
 * Creates an ethers Wallet with the operator private key
 */
export function getOperatorWallet(): ethers.Wallet {
  const privateKey = process.env.HEDERA_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("HEDERA_PRIVATE_KEY environment variable is not set");
  }
  return new ethers.Wallet(privateKey, getProvider());
}

/**
 * Returns an instance of the HederaVault smart contract (read-only or with signer)
 */
export function getVaultContract(runner?: ethers.ContractRunner): ethers.Contract {
  const contractRunner = runner || getProvider();
  return new ethers.Contract(VAULT_CONTRACT_ADDRESS, VAULT_ABI, contractRunner);
}

/**
 * Reads the on-chain vault balance for a buyer (in HBAR)
 */
export async function getContractBalance(
  hederaAccountIdOrAddress: string
): Promise<number> {
  try {
    const evmAddress = await getEvmAddress(hederaAccountIdOrAddress);
    if (evmAddress === ethers.ZeroAddress) return 0;

    const contract = getVaultContract();
    const balanceWei = await contract.getBalance(evmAddress);
    return parseFloat(ethers.formatEther(balanceWei));
  } catch (err: any) {
    console.warn(
      `[HederaVault] Failed to query getBalance on contract for ${hederaAccountIdOrAddress}:`,
      err.message
    );
    return 0;
  }
}

/**
 * Deposits HBAR into the smart contract on behalf of a buyer.
 * Called by server after verifying buyer's Hedera transfer to the escrow account.
 */
export async function depositForBuyerOnChain(
  buyerHederaAccountId: string,
  amountHbar: number
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    const buyerEvmAddress = await getEvmAddress(buyerHederaAccountId);
    if (buyerEvmAddress === ethers.ZeroAddress) {
      throw new Error(`Invalid buyer address for ${buyerHederaAccountId}`);
    }

    const wallet = getOperatorWallet();
    const contract = getVaultContract(wallet);

    const amountWei = ethers.parseEther(amountHbar.toString());
    const tx = await contract.depositFor(buyerEvmAddress, { value: amountWei });
    const receipt = await tx.wait();

    return {
      success: true,
      txHash: receipt.hash,
    };
  } catch (err: any) {
    console.warn(`[HederaVault] depositForOnChain failed:`, err.message);
    return {
      success: false,
      error: err.message,
    };
  }
}

/**
 * Deducts HBAR from a buyer's vault on the smart contract and forwards payout to recipient.
 * Called by server upon verified agent execution.
 */
export async function deductFromBuyerOnChain(
  buyerHederaAccountId: string,
  amountHbar: number,
  recipientAccountIdOrAddress?: string
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    const buyerEvmAddress = await getEvmAddress(buyerHederaAccountId);
    const payoutAccount =
      recipientAccountIdOrAddress ||
      process.env.AGENTBAZAAR_PAY_TO ||
      "0.0.10843793";
    const recipientEvmAddress = await getEvmAddress(payoutAccount);

    if (buyerEvmAddress === ethers.ZeroAddress || recipientEvmAddress === ethers.ZeroAddress) {
      throw new Error("Invalid buyer or recipient address for deduction");
    }

    const wallet = getOperatorWallet();
    const contract = getVaultContract(wallet);

    const amountWei = ethers.parseEther(amountHbar.toString());
    const tx = await contract.deduct(buyerEvmAddress, amountWei, recipientEvmAddress);
    const receipt = await tx.wait();

    return {
      success: true,
      txHash: receipt.hash,
    };
  } catch (err: any) {
    console.warn(`[HederaVault] deductOnChain failed:`, err.message);
    return {
      success: false,
      error: err.message,
    };
  }
}
