import { parseUnits, encodeFunctionData } from 'viem';

// Base Mainnet USDC Contract Address
export const BASE_USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const;

// Treasury Wallet Address (Safe Global Smart Contract on Base Mainnet)
export const TREASURY_WALLET_ADDRESS = '0xcf7ad1230130b50fAf33B78D7f4Da14527a6DbB2' as const;

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

// ─── x402 Offline Settlement / EIP-3009 Pre-Authorization ──────────────────────

export interface X402AuthorizationPayload {
  from: `0x${string}`;
  to: `0x${string}`;
  value: string;
  validAfter: string;
  validBefore: string;
  nonce: `0x${string}`;
  signature: `0x${string}`;
}

import { verifyTypedData } from 'viem';

/**
 * Creates an off-chain EIP-3009 TransferWithAuthorization signature for x402 offline settlement.
 * Zero gas cost for the buyer and instant execution on KeeperHub Pro.
 */
export async function signX402PaymentAuthorization(
  fromAddress: `0x${string}`,
  signTypedDataAsync: (args: any) => Promise<`0x${string}`>,
  amountUsd: number = 0.1
): Promise<X402AuthorizationPayload> {
  const amountUnits = parseUnits(amountUsd.toString(), 6);
  const now = Math.floor(Date.now() / 1000);
  const validAfter = '0';
  const validBefore = (now + 3600).toString(); // 1 hour validity window

  // Generate a cryptographically random 32-byte nonce
  const nonceArray = new Uint8Array(32);
  crypto.getRandomValues(nonceArray);
  const nonce = (`0x` + Array.from(nonceArray).map(b => b.toString(16).padStart(2, '0')).join('')) as `0x${string}`;

  const domain = {
    name: 'USD Coin',
    version: '2',
    chainId: 8453,
    verifyingContract: BASE_USDC_ADDRESS,
  } as const;

  const types = {
    TransferWithAuthorization: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'validAfter', type: 'uint256' },
      { name: 'validBefore', type: 'uint256' },
      { name: 'nonce', type: 'bytes32' },
    ],
  } as const;

  const message = {
    from: fromAddress,
    to: TREASURY_WALLET_ADDRESS,
    value: amountUnits.toString(),
    validAfter: BigInt(validAfter),
    validBefore: BigInt(validBefore),
    nonce,
  };

  const signature = await signTypedDataAsync({
    domain,
    types,
    primaryType: 'TransferWithAuthorization',
    message,
  });

  return {
    from: fromAddress,
    to: TREASURY_WALLET_ADDRESS,
    value: amountUnits.toString(),
    validAfter,
    validBefore,
    nonce,
    signature,
  };
}

/**
 * Cryptographically verifies an off-chain x402 EIP-3009 authorization payload.
 */
export async function verifyX402Authorization(payload: X402AuthorizationPayload): Promise<boolean> {
  try {
    const domain = {
      name: 'USD Coin',
      version: '2',
      chainId: 8453,
      verifyingContract: BASE_USDC_ADDRESS,
    } as const;

    const types = {
      TransferWithAuthorization: [
        { name: 'from', type: 'address' },
        { name: 'to', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'validAfter', type: 'uint256' },
        { name: 'validBefore', type: 'uint256' },
        { name: 'nonce', type: 'bytes32' },
      ],
    } as const;

    const message = {
      from: payload.from,
      to: payload.to,
      value: BigInt(payload.value),
      validAfter: BigInt(payload.validAfter),
      validBefore: BigInt(payload.validBefore),
      nonce: payload.nonce,
    };

    return await verifyTypedData({
      address: payload.from,
      domain,
      types,
      primaryType: 'TransferWithAuthorization',
      message,
      signature: payload.signature,
    });
  } catch (err) {
    console.error('[x402 Verification] Signature verification error:', err);
    return false;
  }
}

import { createWalletClient, http, parseSignature } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';

const USDC_AUTHORIZATION_ABI = [
  {
    name: 'transferWithAuthorization',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'validAfter', type: 'uint256' },
      { name: 'validBefore', type: 'uint256' },
      { name: 'nonce', type: 'bytes32' },
      { name: 'v', type: 'uint8' },
      { name: 'r', type: 'bytes32' },
      { name: 's', type: 'bytes32' },
    ],
    outputs: [],
  },
] as const;

/**
 * Server-side Immediate Relayer Submission:
 * Submits a signed x402 EIP-3009 payload directly to Base Mainnet on behalf of the buyer.
 * Deducts the $0.10 USDC immediately on-chain.
 */
export async function relayX402PaymentOnChain(payload: X402AuthorizationPayload): Promise<string> {
  const relayerKey = process.env.AGENTBAZAAR_PLATFORM_KEY || process.env.RELAYER_PRIVATE_KEY;
  if (!relayerKey) {
    throw new Error('Relayer private key (AGENTBAZAAR_PLATFORM_KEY) not configured on server');
  }

  const formattedKey = (relayerKey.startsWith('0x') ? relayerKey : `0x${relayerKey}`) as `0x${string}`;
  const account = privateKeyToAccount(formattedKey);

  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http('https://mainnet.base.org'),
  });

  const parsedSig = parseSignature(payload.signature);
  const vNum = typeof parsedSig.v === 'bigint' ? Number(parsedSig.v) : (parsedSig.v ?? 27);

  console.log(`[x402 Server Relayer] Broadcasting EIP-3009 transferWithAuthorization to Base Mainnet on behalf of ${payload.from}...`);

  const txHash = await walletClient.writeContract({
    address: BASE_USDC_ADDRESS,
    abi: USDC_AUTHORIZATION_ABI,
    functionName: 'transferWithAuthorization',
    args: [
      payload.from,
      payload.to,
      BigInt(payload.value),
      BigInt(payload.validAfter),
      BigInt(payload.validBefore),
      payload.nonce,
      vNum,
      parsedSig.r,
      parsedSig.s,
    ],
  });

  console.log(`[x402 Server Relayer] Broadcast successful ✓ txHash: ${txHash}`);
  return txHash;
}



