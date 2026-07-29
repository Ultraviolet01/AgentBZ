import { parseUnits, encodeFunctionData } from 'viem';

// Base Mainnet USDC Contract Address
export const BASE_USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const;

// Treasury Wallet Address
export const TREASURY_WALLET_ADDRESS = '0xd6C48a201B275A21966Aef9D6C1bc087e754D848' as const;

// Standard ERC-20 transfer ABI
const ERC20_TRANSFER_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

/**
 * Pay agent execution fee ($0.10 USDC on Base) directly from buyer's wallet to Treasury
 */
export async function payAgentFeeFromWallet(
  sendTransactionAsync: (args: { to: `0x${string}`; data: `0x${string}` }) => Promise<`0x${string}`>,
  amountUsd: number = 0.1
): Promise<string> {
  // USDC has 6 decimals on Base (0.1 USD = 100,000 units)
  const amountUnits = parseUnits(amountUsd.toString(), 6);

  const data = encodeFunctionData({
    abi: ERC20_TRANSFER_ABI,
    functionName: 'transfer',
    args: [TREASURY_WALLET_ADDRESS, amountUnits],
  });

  const txHash = await sendTransactionAsync({
    to: BASE_USDC_ADDRESS,
    data,
  });

  return txHash;
}
