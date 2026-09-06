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
    <button
      onClick={connect}
      className="px-3.5 py-1.5 text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-xs transition-all flex items-center gap-1.5 uppercase tracking-wide cursor-pointer"
    >
      <Wallet className="w-3.5 h-3.5" />
      Connect Wallet
    </button>
  );
}

