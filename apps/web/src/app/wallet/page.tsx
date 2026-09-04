"use client";

import { VaultDashboard } from "@/components/VaultDashboard";
import { CircleUserRound } from "lucide-react";

export default function WalletPage() {
  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 pb-16 text-gray-900">
      <header className="flex items-center gap-4 mb-2">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
          <CircleUserRound className="w-7 h-7" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-purple-600 uppercase tracking-[0.24em] mb-1">
            Hedera Vault System
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Buyer Vault & Balance</h1>
        </div>
      </header>

      <VaultDashboard />
    </main>
  );
}
