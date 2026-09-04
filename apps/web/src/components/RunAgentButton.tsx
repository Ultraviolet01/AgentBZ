// apps/web/src/components/RunAgentButton.tsx
"use client";

import { useState } from "react";
import { x402Fetch } from "@/lib/x402-hedera";

interface RunAgentButtonProps {
  agentId: string;
  agentName: string;
  priceHbar: number;
}

export function RunAgentButton({ agentId, agentName, priceHbar }: RunAgentButtonProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [hashscanUrl, setHashscanUrl] = useState<string | null>(null);
  const [hcsUrl, setHcsUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feeBreakdown, setFeeBreakdown] = useState<{
    agentFee: string;
    platformFee: string;
    total: string;
  } | null>({
    agentFee: `${priceHbar} HBAR`,
    platformFee: "0.5 HBAR",
    total: `${priceHbar + 0.5} HBAR`,
  });

  // Testnet demo: buyer enters their Hedera account details
  // Production: replace with HashPack wallet integration
  const [buyerAccountId, setBuyerAccountId] = useState("");
  const [buyerPrivateKey, setBuyerPrivateKey] = useState("");
  const [inputs, setInputs] = useState("");

  async function handleRun() {
    if (!buyerAccountId || !buyerPrivateKey) {
      setError("Enter your Hedera account ID and private key");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const apiUrl = `${baseUrl}/api/agents/run`;

      const res = await x402Fetch(
        apiUrl,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agentId, inputs: { query: inputs } }),
        },
        buyerAccountId,
        buyerPrivateKey
      );

      if (!res.ok) {
        const err = await res.json();
        if (err.breakdown) {
          setFeeBreakdown(err.breakdown);
        }
        setError(err.error ?? "Execution failed");
        return;
      }

      const data = await res.json();
      setResult(data.output);
      setHashscanUrl(data.hashscanUrl);
      setHcsUrl(data.hcsUrl);
    } catch (err: any) {
      setError(err.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Hedera account inputs (testnet demo) */}
      <input
        type="text"
        placeholder="Your Hedera Account ID (e.g. 0.0.7326075)"
        value={buyerAccountId}
        onChange={e => setBuyerAccountId(e.target.value)}
        className="w-full bg-[#1A1A1A] text-white text-sm rounded-lg px-4 py-2 border border-[#2A2A2A]"
      />
      <input
        type="password"
        placeholder="Your Hedera ECDSA Private Key (0x...)"
        value={buyerPrivateKey}
        onChange={e => setBuyerPrivateKey(e.target.value)}
        className="w-full bg-[#1A1A1A] text-white text-sm rounded-lg px-4 py-2 border border-[#2A2A2A]"
      />
      <input
        type="text"
        placeholder="Input (e.g. contract address for ScamSniff)"
        value={inputs}
        onChange={e => setInputs(e.target.value)}
        className="w-full bg-[#1A1A1A] text-white text-sm rounded-lg px-4 py-2 border border-[#2A2A2A]"
      />

      {/* Fee breakdown — shown before payment */}
      {feeBreakdown && (
        <div className="bg-[#1A1A1A] rounded-lg p-3 text-xs space-y-1">
          <div className="flex justify-between text-gray-400">
            <span>Agent fee</span>
            <span>{feeBreakdown.agentFee}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Platform fee</span>
            <span>{feeBreakdown.platformFee}</span>
          </div>
          <div className="flex justify-between text-white font-medium border-t border-[#2A2A2A] pt-1">
            <span>Total</span>
            <span>{feeBreakdown.total}</span>
          </div>
        </div>
      )}

      <button
        onClick={handleRun}
        disabled={loading}
        className="w-full px-4 py-3 bg-[#6C3BFF] text-white rounded-lg disabled:opacity-50 font-medium"
      >
        {loading ? "Processing payment..." : `Run ${agentName} — ${priceHbar} HBAR`}
      </button>

      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}

      {result && (
        <div className="bg-[#1A1A1A] rounded-lg p-4 space-y-3">
          <p className="text-white text-sm whitespace-pre-wrap">{result}</p>

          {/* Hedera on-chain proof links */}
          <div className="border-t border-[#2A2A2A] pt-3 space-y-1">
            {hashscanUrl && (
              <a
                href={hashscanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs text-blue-400 underline"
              >
                ↗ View payment on HashScan (Hedera testnet)
              </a>
            )}
            {hcsUrl && (
              <a
                href={hcsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs text-blue-400 underline"
              >
                ↗ View HCS audit trail on HashScan
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
