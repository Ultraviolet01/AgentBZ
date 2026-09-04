// apps/web/src/components/RunAgentButton.tsx
"use client";

import { useState, useEffect } from "react";

interface RunAgentButtonProps {
  agentId: string;
  agentName: string;
  priceHbar: number;
}

export function RunAgentButton({
  agentId,
  agentName,
  priceHbar,
}: RunAgentButtonProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [vaultBalanceAfter, setVaultBalanceAfter] = useState<number | null>(null);
  const [hashscanUrl, setHashscanUrl] = useState<string | null>(null);
  const [hcsUrl, setHcsUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inputs, setInputs] = useState("");

  const [buyerAccountId, setBuyerAccountId] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("agentbazaar-hedera-account");
      if (saved) setBuyerAccountId(saved);
    }
  }, []);

  const feeBreakdown = {
    agentFee: `${priceHbar} HBAR`,
    platformFee: "0.5 HBAR",
    total: `${priceHbar + 0.5} HBAR`,
  };

  async function handleRun() {
    if (!buyerAccountId.trim()) {
      setError("Enter your Hedera account ID");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const apiUrl = `${baseUrl}/api/agents/run`;

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          inputs: { query: inputs },
          buyerAccountId: buyerAccountId.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.shortfall !== undefined) {
          setError(
            `Insufficient vault balance. Required: ${data.required} HBAR, Available: ${data.available} HBAR. Please deposit at least ${data.shortfall.toFixed(2)} HBAR to your vault.`
          );
        } else {
          setError(data.error || "Execution failed");
        }
        return;
      }

      setResult(data.output);
      if (data.vaultBalanceAfter !== undefined) {
        setVaultBalanceAfter(data.vaultBalanceAfter);
      }
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
      {/* Hedera account input */}
      <div className="space-y-1">
        <label className="text-xs text-gray-400 font-medium">Hedera Account ID</label>
        <input
          type="text"
          placeholder="Your Hedera Account ID (0.0.XXXXX)"
          value={buyerAccountId}
          onChange={(e) => {
            setBuyerAccountId(e.target.value);
            if (typeof window !== "undefined") {
              localStorage.setItem("agentbazaar-hedera-account", e.target.value);
            }
          }}
          className="w-full bg-[#1A1A1A] text-white text-sm rounded-lg px-4 py-2 border border-[#2A2A2A] outline-none"
        />
      </div>

      {/* Input query */}
      <div className="space-y-1">
        <label className="text-xs text-gray-400 font-medium">Agent Query / Parameters</label>
        <input
          type="text"
          placeholder="Input (e.g. contract address, topic, or target)"
          value={inputs}
          onChange={(e) => setInputs(e.target.value)}
          className="w-full bg-[#1A1A1A] text-white text-sm rounded-lg px-4 py-2 border border-[#2A2A2A] outline-none"
        />
      </div>

      {/* Fee breakdown */}
      <div className="bg-[#1A1A1A] rounded-lg p-3 text-xs space-y-1 border border-[#2A2A2A]">
        <div className="flex justify-between text-gray-400">
          <span>Agent fee</span>
          <span>{feeBreakdown.agentFee}</span>
        </div>
        <div className="flex justify-between text-gray-400">
          <span>Platform fee</span>
          <span>{feeBreakdown.platformFee}</span>
        </div>
        <div className="flex justify-between text-white font-medium border-t border-[#2A2A2A] pt-1">
          <span>Total Vault Deduction</span>
          <span className="text-orange-400">{feeBreakdown.total}</span>
        </div>
      </div>

      <button
        onClick={handleRun}
        disabled={loading || !buyerAccountId.trim()}
        className="w-full px-4 py-3 bg-[#6C3BFF] hover:bg-[#582cd8] text-white rounded-lg disabled:opacity-50 font-medium transition-colors"
      >
        {loading ? "Running Agent..." : `Run ${agentName} (${feeBreakdown.total})`}
      </button>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      {result && (
        <div className="bg-[#1A1A1A] rounded-lg p-4 space-y-3 border border-[#2A2A2A]">
          <p className="text-white text-sm whitespace-pre-wrap">{result}</p>

          {vaultBalanceAfter !== null && (
            <p className="text-xs text-gray-400 font-mono">
              Vault balance after: {vaultBalanceAfter.toFixed(2)} HBAR
            </p>
          )}

          {/* Hedera on-chain proof links */}
          <div className="border-t border-[#2A2A2A] pt-3 space-y-1">
            {hashscanUrl && (
              <a
                href={hashscanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs text-blue-400 hover:text-blue-300 underline"
              >
                ↗ View payment settlement on HashScan
              </a>
            )}
            {hcsUrl && (
              <a
                href={hcsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs text-blue-400 hover:text-blue-300 underline"
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
