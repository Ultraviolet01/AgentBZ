"use client";

import { CircleUserRound } from "lucide-react";

export default function WalletPage() {
  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-6 pb-16 text-gray-900">
      <div className="max-w-4xl space-y-6">
        <header className="flex items-center gap-4 mb-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
            <CircleUserRound className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-purple-600 uppercase tracking-[0.24em] mb-1">
              Hedera x402
            </p>
            <h1 className="text-3xl font-bold tracking-tight">Pay Per Request</h1>
          </div>
        </header>

        <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 p-8 text-center space-y-3">
          <p className="text-lg font-semibold text-gray-800">No wallet pre-funding required</p>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Connect HashPack and pay per agent run. Each payment is settled on Hedera testnet in real-time via Blocky402.
          </p>
        </div>
      </div>
    </div>
  );
}
