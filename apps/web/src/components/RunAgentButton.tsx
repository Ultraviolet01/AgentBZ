"use client";

import { useState } from "react";
import { useHashConnect } from "@/context/HashConnectContext";

interface RunAgentButtonProps {
  agentId: string;
  agentName: string;
  priceHbar: number;
}

interface ExecutionResult {
  output: string;
  hederaTransaction: string;
  hcsTxId: string;
  hashscanUrl: string;
  hcsUrl: string;
  payer: string;
}

export function RunAgentButton({
  agentId,
  agentName,
  priceHbar,
}: RunAgentButtonProps) {
  const { isConnected, connect, sendDeposit, refreshBalance } = useHashConnect();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [breakdown, setBreakdown] = useState<{
    agentFee: string;
    platformFee: string;
    total: string;
  } | null>(null);

  async function handleRun() {
    if (!isConnected) {
      connect();
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL;
      if (!NEXT_PUBLIC_API_URL) {
        throw new Error("NEXT_PUBLIC_API_URL is not configured. Cannot determine which API to call.");
      }
      const apiUrl = `${NEXT_PUBLIC_API_URL}/api/agents/run`;

      // Step 1: First call — no payment, get 402 challenge
      const firstRes = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, inputs: { query: input } }),
      });

      if (firstRes.status !== 402) {
        const errorData = await firstRes.json().catch(() => ({}));
        throw new Error(errorData.error || `Expected 402 payment challenge, got ${firstRes.status}`);
      }

      const { paymentRequirements, breakdown: feeBreakdown } =
        await firstRes.json();

      setBreakdown(feeBreakdown);

      // Step 2: Sign native Hedera transaction (payer-signed, unsubmitted)
      const { paymentPayloadTransaction } = await sendDeposit(paymentRequirements);

      if (!paymentPayloadTransaction) {
        throw new Error("Failed to generate signed transaction payload");
      }

      // Step 3: Build x402 payment payload with signed transaction
      const paymentPayload = {
        x402Version: 2,
        scheme: "exact",
        network: "hedera:testnet",
        accepted: paymentRequirements,
        payload: { transaction: paymentPayloadTransaction },
      };

      const xPayment = Buffer.from(
        JSON.stringify(paymentPayload)
      ).toString("base64");

      // Step 4: Retry with X-Payment header — Blocky402 settles on Hedera
      const secondRes = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Payment": xPayment,
        },
        body: JSON.stringify({ agentId, inputs: { query: input } }),
      });

      if (!secondRes.ok) {
        const err = await secondRes.json();
        throw new Error(err.error ?? "Execution failed");
      }

      const data: ExecutionResult = await secondRes.json();
      setResult(data);

      if (refreshBalance) {
        refreshBalance().catch(console.warn);
      }
    } catch (err: any) {
      setError(err.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder={
          agentName === "ScamSniff"
            ? "Enter contract address (e.g. 0.0.12345)"
            : agentName === "ThreadSmith"
            ? "Enter a topic for your thread"
            : "Enter token name or address to watch"
        }
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => e.key === "Enter" && handleRun()}
        className="w-full bg-[#1A1A1A] text-white text-sm rounded-lg px-4 py-2 border border-[#2A2A2A] focus:border-[#6C3BFF] outline-none"
        disabled={loading}
      />

      {/* Fee breakdown shown after first 402 challenge */}
      {breakdown && (
        <div className="bg-[#1A1A1A] rounded-lg p-3 text-xs space-y-1">
          <div className="flex justify-between text-gray-400">
            <span>Agent fee</span>
            <span>{breakdown.agentFee}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Platform fee</span>
            <span>{breakdown.platformFee}</span>
          </div>
          <div className="flex justify-between text-white font-medium border-t border-[#2A2A2A] pt-1">
            <span>Total</span>
            <span>{breakdown.total}</span>
          </div>
        </div>
      )}

      <button
        onClick={handleRun}
        disabled={loading || !input.trim()}
        className="w-full px-4 py-3 bg-[#6C3BFF] hover:bg-[#5a2ee0] text-white rounded-lg disabled:opacity-50 font-medium cursor-pointer transition-colors"
      >
        {loading
          ? "Signing & Settling on Hedera..."
          : !isConnected
          ? "Connect Wallet to Run"
          : `Run ${agentName} — ${priceHbar + 0.5} HBAR`}
      </button>

      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}

      {result && (
        <div className="bg-[#1A1A1A] rounded-lg p-4 space-y-3">
          <p className="text-white text-sm whitespace-pre-wrap leading-relaxed">
            {result.output}
          </p>
          <div className="border-t border-[#2A2A2A] pt-3 space-y-1">
            <a
              href={result.hashscanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-xs text-blue-400 underline hover:text-blue-300"
            >
              ↗ View payment on HashScan (Hedera testnet)
            </a>
            <a
              href={result.hcsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-xs text-blue-400 underline hover:text-blue-300"
            >
              ↗ View HCS audit trail on HashScan
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
