"use client";

import { useHashConnect } from "@/context/HashConnectContext";
import { Wallet, LogOut } from "lucide-react";

export function HashPackButton() {
  const { accountId, isConnected, connect, disconnect } = useHashConnect();

  if (isConnected && accountId) {
    return (
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-2.5 py-1 shadow-xs">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs font-mono font-bold text-gray-900">{accountId}</span>
        <button
          onClick={disconnect}
          title="Disconnect Wallet"
          className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-2">
      <button
        onClick={connect}
        className="w-full px-3.5 py-1.5 text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 uppercase tracking-wide cursor-pointer"
      >
        <Wallet className="w-3.5 h-3.5" />
        Connect Wallet
      </button>

      {!isConnected && (
        <div className="mt-2 space-y-1">
          <p className="text-[11px] text-gray-500">
            Or enter your Hedera account ID manually:
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="0.0.XXXXXX"
              className="flex-1 bg-[#1A1A1A] text-white text-xs rounded px-2 py-1 border border-[#2A2A2A] focus:outline-none focus:border-orange-500"
              onKeyDown={async (e) => {
                if (e.key === "Enter") {
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (val.startsWith("0.0.")) {
                    // Manually set connected account
                    localStorage.setItem("agentbazaar-hedera-account", val);
                    localStorage.setItem("agentbazaar-connected-account", val);
                    localStorage.setItem(
                      "agentbazaar-hashconnect",
                      JSON.stringify({ accountId: val })
                    );
                    window.location.reload();
                  }
                }
              }}
            />
            <span className="text-xs text-gray-400 self-center">↵</span>
          </div>
        </div>
      )}
    </div>
  );
}

