"use client";

import { useState, useEffect } from "react";

interface VaultData {
  hederaAccountId: string;
  balanceHbar: number;
  deposits: {
    amount: number;
    transaction: string;
    hashscanUrl: string;
    date: string;
  }[];
  deductions: {
    agentId: string;
    amount: number;
    date: string;
  }[];
}

export function VaultDashboard() {
  const [accountId, setAccountId] = useState("");
  const [inputAccountId, setInputAccountId] = useState("");
  const [vault, setVault] = useState<VaultData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Deposit flow state
  const [depositTxId, setDepositTxId] = useState("");
  const [depositing, setDepositing] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState<string | null>(null);

  const platformAccount =
    process.env.NEXT_PUBLIC_PLATFORM_ACCOUNT ||
    process.env.NEXT_PUBLIC_HEDERA_ACCOUNT_ID ||
    "0.0.10360854";

  async function loadVault(id: string) {
    setLoading(true);
    setError(null);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await fetch(
        `${baseUrl}/api/vault/balance?accountId=${encodeURIComponent(id)}`
      );
      const data = await res.json();
      setVault(data);
      setAccountId(id);
      if (typeof window !== "undefined") {
        localStorage.setItem("agentbazaar-hedera-account", id);
      }
    } catch {
      setError("Failed to load vault");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("agentbazaar-hedera-account");
      if (saved) loadVault(saved);
    }
  }, []);

  async function handleDeposit() {
    if (!depositTxId.trim()) {
      setError("Enter your Hedera transaction ID");
      return;
    }

    setDepositing(true);
    setError(null);
    setDepositSuccess(null);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await fetch(
        `${baseUrl}/api/vault/deposit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hederaAccountId: accountId,
            hederaTransactionId: depositTxId.trim(),
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Deposit failed");

      setDepositSuccess(
        `✓ ${data.amountDeposited} HBAR deposited. New balance: ${data.newBalance} HBAR`
      );
      setDepositTxId("");
      await loadVault(accountId);
    } catch (err: any) {
      setError(err.message || "Failed to process deposit");
    } finally {
      setDepositing(false);
    }
  }

  // Not connected yet
  if (!accountId) {
    return (
      <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-xl p-6 space-y-4">
        <h2 className="text-white font-semibold">My Vault</h2>
        <p className="text-gray-400 text-sm">
          Enter your Hedera account ID to view your vault
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="0.0.XXXXXX"
            value={inputAccountId}
            onChange={(e) => setInputAccountId(e.target.value)}
            className="flex-1 bg-[#1A1A1A] text-white text-sm rounded-lg px-4 py-2 border border-[#2A2A2A] outline-none"
          />
          <button
            onClick={() => loadVault(inputAccountId.trim())}
            disabled={!inputAccountId.trim() || loading}
            className="px-4 py-2 bg-[#6C3BFF] text-white text-sm rounded-lg disabled:opacity-50"
          >
            {loading ? "Connecting..." : "Connect"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-white font-semibold">My Vault</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-mono">{accountId}</span>
          <button
            onClick={() => {
              setAccountId("");
              setVault(null);
              if (typeof window !== "undefined") {
                localStorage.removeItem("agentbazaar-hedera-account");
              }
            }}
            className="text-xs text-gray-500 hover:text-red-400 underline"
          >
            Disconnect
          </button>
        </div>
      </div>

      {/* Balance */}
      <div className="bg-[#1A1A1A] rounded-xl p-4 text-center">
        <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">
          Available Balance
        </p>
        <p className="text-4xl font-bold text-white">
          {vault?.balanceHbar !== undefined ? vault.balanceHbar.toFixed(2) : "0.00"}
          <span className="text-gray-400 text-xl ml-2">HBAR</span>
        </p>
        <p className="text-gray-500 text-xs mt-1">Hedera testnet</p>
      </div>

      {/* Deposit instructions */}
      <div className="bg-[#6C3BFF]/10 border border-[#6C3BFF]/30 rounded-xl p-4 space-y-3">
        <p className="text-white text-sm font-medium">Deposit HBAR</p>
        <div className="space-y-1">
          <p className="text-gray-400 text-xs">Step 1 — Send HBAR to:</p>
          <p className="text-white font-mono text-sm bg-[#1A1A1A] rounded px-3 py-2 select-all">
            {platformAccount}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-gray-400 text-xs">
            Step 2 — Paste your Hedera transaction ID here:
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="0.0.12345@1234567890.000000000"
              value={depositTxId}
              onChange={(e) => setDepositTxId(e.target.value)}
              className="flex-1 bg-[#1A1A1A] text-white text-xs font-mono rounded-lg px-3 py-2 border border-[#2A2A2A] outline-none"
            />
            <button
              onClick={handleDeposit}
              disabled={depositing || !depositTxId.trim()}
              className="px-4 py-2 bg-[#6C3BFF] text-white text-sm rounded-lg disabled:opacity-50 whitespace-nowrap"
            >
              {depositing ? "Verifying..." : "Verify & Credit"}
            </button>
          </div>
        </div>

        {depositSuccess && (
          <p className="text-green-400 text-xs">{depositSuccess}</p>
        )}
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {/* Deposit history */}
      {vault && vault.deposits && vault.deposits.length > 0 && (
        <div className="space-y-2">
          <p className="text-gray-400 text-xs uppercase tracking-wide">
            Deposits
          </p>
          {vault.deposits.map((d, i) => (
            <div
              key={i}
              className="flex items-center justify-between bg-[#1A1A1A] rounded-lg px-3 py-2"
            >
              <div>
                <p className="text-green-400 text-sm font-medium">
                  +{d.amount} HBAR
                </p>
                <p className="text-gray-500 text-xs">
                  {new Date(d.date).toLocaleDateString()}
                </p>
              </div>
              <a
                href={d.hashscanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 underline"
              >
                HashScan ↗
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Deduction history */}
      {vault && vault.deductions && vault.deductions.length > 0 && (
        <div className="space-y-2">
          <p className="text-gray-400 text-xs uppercase tracking-wide">
            Agent Runs
          </p>
          {vault.deductions.map((d, i) => (
            <div
              key={i}
              className="flex items-center justify-between bg-[#1A1A1A] rounded-lg px-3 py-2"
            >
              <div>
                <p className="text-red-400 text-sm font-medium">
                  -{d.amount} HBAR
                </p>
                <p className="text-gray-500 text-xs">
                  {new Date(d.date).toLocaleDateString()}
                </p>
              </div>
              <span className="text-gray-500 text-xs">agent run</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
