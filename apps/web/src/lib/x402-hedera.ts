// Frontend x402 Hedera payment utility
// From Blocky402 quickstart and x402-foundation/x402

import { ExactHederaScheme } from "@x402/hedera/exact/client";
import { createClientHederaSigner, PrivateKey } from "@x402/hedera";

const BLOCKY402_URL =
  process.env.NEXT_PUBLIC_BLOCKY402_URL ?? "https://api.testnet.blocky402.com";

// Fetch feePayer from Blocky402 (required for building payment requirements)
export async function getBlocky402FeePayer(): Promise<string> {
  const res = await fetch(`${BLOCKY402_URL}/supported`);
  const data = await res.json();

  const hederaKind = data.kinds?.find(
    (k: { network: string }) => k.network === "hedera:testnet"
  );

  return (
    hederaKind?.extra?.feePayer ?? data.signers?.["hedera:*"]?.[0]
  );
}

// Sign a payment payload with the buyer's Hedera account
// In testnet demo: buyer provides their account ID + ECDSA private key
// In production: use HashPack wallet integration instead
export async function signHederaPayment(
  buyerAccountId: string,
  buyerPrivateKey: string,
  paymentRequirements: any
): Promise<string> {
  const signer = createClientHederaSigner(
    buyerAccountId,
    PrivateKey.fromStringECDSA(buyerPrivateKey),
    { network: "hedera:testnet" }
  );

  const scheme = new ExactHederaScheme(signer);
  const signed = await scheme.createPaymentPayload(2, paymentRequirements);

  const paymentPayload = {
    x402Version: 2,
    scheme: "exact",
    network: "hedera:testnet",
    accepted: paymentRequirements,
    payload: signed.payload,
  };

  // Base64-encode for PAYMENT-SIGNATURE header
  return Buffer.from(JSON.stringify(paymentPayload)).toString("base64");
}

// Full x402 fetch — handles 402 challenge + payment + retry automatically
export async function x402Fetch(
  url: string,
  options: RequestInit,
  buyerAccountId: string,
  buyerPrivateKey: string
): Promise<Response> {
  // First request — no payment
  const firstRes = await fetch(url, options);

  // If not 402 — return directly
  if (firstRes.status !== 402) return firstRes;

  // Parse payment requirements from PAYMENT-REQUIRED header
  const paymentRequiredHeader = firstRes.headers.get("PAYMENT-REQUIRED");
  if (!paymentRequiredHeader) {
    throw new Error("402 response missing PAYMENT-REQUIRED header");
  }

  const paymentRequirements = JSON.parse(
    Buffer.from(paymentRequiredHeader, "base64").toString("utf-8")
  );

  // Sign the payment
  const paymentSignature = await signHederaPayment(
    buyerAccountId,
    buyerPrivateKey,
    paymentRequirements
  );

  // Retry with PAYMENT-SIGNATURE header
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      "PAYMENT-SIGNATURE": paymentSignature,
    },
  });
}
