// apps/api/src/lib/blocky402.ts
// Wire format based on Blocky402 quickstart documentation

import { ExactHederaScheme } from "@x402/hedera/exact/client";
import { createClientHederaSigner, PrivateKey } from "@x402/hedera";

const BLOCKY402_URL =
  process.env.BLOCKY402_URL ?? "https://api.testnet.blocky402.com";

// ─── Step 1: Fetch feePayer from Blocky402 /supported ────────────────────────
// MUST be fetched dynamically — do not hardcode.
// From quickstart: feePayer is in supported.kinds[hedera:testnet].extra.feePayer
// OR supported.signers["hedera:*"][0]

let _feePayer: string | null = null;

export async function getFeePayer(): Promise<string> {
  if (_feePayer) return _feePayer;

  const res = await fetch(`${BLOCKY402_URL}/supported`);
  const data = await res.json();

  const hederaKind = data.kinds.find(
    (k: { network: string }) => k.network === "hedera:testnet"
  );

  if (!hederaKind) {
    throw new Error("Blocky402 does not advertise hedera:testnet support");
  }

  _feePayer =
    hederaKind.extra?.feePayer ?? data.signers?.["hedera:*"]?.[0];

  if (!_feePayer) {
    throw new Error("Could not determine feePayer from Blocky402 /supported");
  }

  return _feePayer;
}

// Platform fee: 0.5 HBAR collected by AgentBazaar on every agent payment
// Confirmed from docs.hedera.com — Fixed Fee: paid by sender,
// collected in HBAR, independent of transfer size
export const PLATFORM_FEE_HBAR = 0.5;

export async function buildHederaPaymentRequirements(
  priceHbar: number,
  resourcePath: string,
  description: string
) {
  const feePayer = await getFeePayer();

  // Total amount = agent price + platform fee (both in tinybars)
  // 1 HBAR = 100,000,000 tinybars (from Blocky402 quickstart)
  const agentPriceTinybars = Math.round(priceHbar * 100_000_000);
  const platformFeeTinybars = Math.round(PLATFORM_FEE_HBAR * 100_000_000);
  const totalTinybars = agentPriceTinybars + platformFeeTinybars;

  return {
    scheme: "exact" as const,
    network: "hedera:testnet" as const,
    amount: String(totalTinybars), // total buyer pays (agent + platform fee)
    payTo: process.env.AGENTBAZAAR_PAY_TO!,
    maxTimeoutSeconds: 300,
    asset: "0.0.0", // HBAR
    extra: {
      feePayer,
      customFees: [
        {
          type: "fixed",
          amount: String(platformFeeTinybars), // 0.5 HBAR platform fee
          denominatingTokenId: "0.0.0", // collected in HBAR
          feeCollectorAccountId: process.env.HEDERA_ACCOUNT_ID!, // AgentBazaar
        },
      ],
      agentPriceTinybars,
      platformFeeTinybars,
    },
    resource: `${process.env.NEXT_PUBLIC_APP_URL}${resourcePath}`,
    description,
  };
}

// ─── Step 3: Sign a payment payload (server-side for testing) ────────────────
// In production, the BUYER signs this using their own Hedera wallet (HashPack)
// For testnet demo, AgentBazaar signs with its own account

export async function signPaymentPayload(
  paymentRequirements: any
) {
  // Option B: server signs on behalf of user using demo buyer account
  // From docs.hedera.com: createClientHederaSigner + ExactHederaScheme
  const accountId =
    process.env.HEDERA_DEMO_BUYER_ACCOUNT_ID ||
    process.env.HEDERA_ACCOUNT_ID!;
  const privateKeyStr =
    process.env.HEDERA_DEMO_BUYER_PRIVATE_KEY ||
    process.env.HEDERA_PRIVATE_KEY!;

  const signer = createClientHederaSigner(
    accountId,
    PrivateKey.fromStringECDSA(privateKeyStr),
    { network: "hedera:testnet" }
  );

  const scheme = new ExactHederaScheme(signer);
  const signed = await scheme.createPaymentPayload(2, paymentRequirements);

  return {
    x402Version: 2,
    scheme: "exact",
    network: "hedera:testnet",
    accepted: paymentRequirements,
    payload: signed.payload,
  };
}

// ─── Step 4: Verify payment with Blocky402 ────────────────────────────────────
// From quickstart: POST /verify with { x402Version, paymentPayload, paymentRequirements }
// Returns: { isValid: boolean, payer: string }

export async function verifyWithBlocky402(
  paymentPayload: object,
  paymentRequirements: object
): Promise<{ isValid: boolean; payer?: string; error?: string }> {
  const res = await fetch(`${BLOCKY402_URL}/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      x402Version: 2,
      paymentPayload,
      paymentRequirements,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    return {
      isValid: false,
      error: `Blocky402 verify failed: ${res.status} — ${JSON.stringify(data)}`,
    };
  }

  return { isValid: data.isValid, payer: data.payer };
}

// ─── Step 5: Settle payment with Blocky402 ───────────────────────────────────
// From quickstart: POST /settle with { x402Version, paymentPayload, paymentRequirements }
// Blocky402 adds its signature, submits to Hedera testnet, pays gas
// Returns: { transaction: string, network: string }
// NOTE: response field is "transaction" — NOT "txHash"

export async function settleWithBlocky402(
  paymentPayload: object,
  paymentRequirements: object
): Promise<{ success: boolean; transaction?: string; error?: string }> {
  const res = await fetch(`${BLOCKY402_URL}/settle`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      x402Version: 2,
      paymentPayload,
      paymentRequirements,
    }),
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    return {
      success: false,
      error: `Blocky402 settle failed: ${res.status} — ${
        data.errorMessage ?? data.errorReason ?? JSON.stringify(data)
      }`,
    };
  }

  // "transaction" is the Hedera transaction ID — use this for HashScan link
  return { success: true, transaction: data.transaction };
}
