// apps/web/src/lib/blocky402.ts
// Server-side Blocky402 payment validation and settlement for Web App API routes

const BLOCKY402_URL =
  process.env.BLOCKY402_URL ||
  process.env.NEXT_PUBLIC_BLOCKY402_URL ||
  "https://api.testnet.blocky402.com";

let _feePayer: string | null = null;

export async function getFeePayer(): Promise<string> {
  if (_feePayer) return _feePayer;

  const res = await fetch(`${BLOCKY402_URL}/supported`);
  const data = await res.json();

  const hederaKind = data.kinds?.find(
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

export const PLATFORM_FEE_HBAR = 0.5;

export async function buildHederaPaymentRequirements(
  priceHbar: number,
  resourcePath: string,
  description: string
) {
  const feePayer = await getFeePayer();

  const agentPriceTinybars = Math.round(priceHbar * 100_000_000);
  const platformFeeTinybars = Math.round(PLATFORM_FEE_HBAR * 100_000_000);
  const totalTinybars = agentPriceTinybars + platformFeeTinybars;

  const payTo =
    process.env.AGENTBAZAAR_PAY_TO ||
    process.env.NEXT_PUBLIC_PLATFORM_ACCOUNT ||
    "0.0.10368450";
  const platformAccountId =
    process.env.HEDERA_ACCOUNT_ID ||
    process.env.NEXT_PUBLIC_PLATFORM_ACCOUNT ||
    "0.0.10368450";

  return {
    scheme: "exact" as const,
    network: "hedera:testnet" as const,
    amount: String(totalTinybars),
    payTo,
    maxTimeoutSeconds: 300,
    asset: "0.0.0",
    extra: {
      feePayer,
      customFees: [
        {
          type: "fixed",
          amount: String(platformFeeTinybars),
          denominatingTokenId: "0.0.0",
          feeCollectorAccountId: platformAccountId,
        },
      ],
      agentPriceTinybars,
      platformFeeTinybars,
    },
    resource: `${process.env.NEXT_PUBLIC_APP_URL || "https://agentbazaar.io"}${resourcePath}`,
    description,
  };
}

export async function verifyWithBlocky402(
  paymentPayload: any,
  paymentRequirements: any
): Promise<{ isValid: boolean; payer?: string; error?: string }> {
  try {
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
    console.log("[Web Blocky402 /verify] status:", res.status, "response:", JSON.stringify(data));

    if (res.ok && data.isValid) {
      return { isValid: true, payer: data.payer };
    }

    return {
      isValid: false,
      error: data.invalidReason || data.error || data.message || `Blocky402 verification failed with status ${res.status}`,
    };
  } catch (err: any) {
    console.error("[Web Blocky402] Verify API error:", err.message);
    return {
      isValid: false,
      error: err.message || "Failed to reach Blocky402 verify endpoint",
    };
  }
}

export async function settleWithBlocky402(
  paymentPayload: any,
  paymentRequirements: any
): Promise<{ success: boolean; transaction?: string; error?: string }> {
  try {
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
    console.log("[Web Blocky402 /settle] status:", res.status, "response:", JSON.stringify(data));

    if (res.ok && data.success && data.transaction) {
      return { success: true, transaction: data.transaction };
    }

    return {
      success: false,
      error: data.invalidReason || data.error || data.message || `Blocky402 settlement failed with status ${res.status}`,
    };
  } catch (err: any) {
    console.error("[Web Blocky402] Settle API error:", err.message);
    return {
      success: false,
      error: err.message || "Failed to reach Blocky402 settle endpoint",
    };
  }
}
