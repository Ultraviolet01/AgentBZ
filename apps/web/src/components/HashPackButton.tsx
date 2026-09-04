"use client";

import { useHashConnect } from "@/context/HashConnectContext";

export function HashPackButton() {
  const { accountId, isConnected, connect, disconnect, isInitialized } =
    useHashConnect();

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
        <span className="text-xs text-gray-400 font-mono">
          {accountId.length > 8 ? `${accountId.slice(0, 8)}...` : accountId}
        </span>
        <button
          onClick={disconnect}
          className="px-3 py-1 text-xs text-red-400 border border-red-400/30 rounded-lg hover:bg-red-500/10 transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      className="px-4 py-2 text-sm bg-[#6C3BFF] text-white rounded-lg font-medium hover:bg-[#582bd6] transition-colors"
    >
      Connect HashPack
    </button>
  );
}
