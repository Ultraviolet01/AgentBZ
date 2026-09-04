"use client";

import { useHashPack } from "@/hooks/useHashPack";

export function HashPackButton() {
  const { accountId, isConnected, isInitialized, connect, disconnect } =
    useHashPack();

  if (!isInitialized) {
    return (
      <button
        disabled
        className="px-4 py-2 text-sm bg-[#1A1A1A] text-gray-500 rounded-lg"
      >
        Initializing...
      </button>
    );
  }

  if (isConnected && accountId) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-500" />
        <span className="text-xs text-gray-300 font-mono">{accountId}</span>
        <button
          onClick={disconnect}
          className="px-2 py-1 text-xs text-red-400 border border-red-400/30 rounded-lg hover:bg-red-500/10 transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      className="px-4 py-2 text-sm bg-[#6C3BFF] text-white rounded-lg font-medium flex items-center gap-2 hover:bg-[#582bd6] transition-colors"
    >
      <img
        src="/hashpack-logo.png"
        alt="HashPack"
        className="w-4 h-4"
        onError={(e) => {
          (e.currentTarget as HTMLElement).style.display = "none";
        }}
      />
      Connect HashPack
    </button>
  );
}
