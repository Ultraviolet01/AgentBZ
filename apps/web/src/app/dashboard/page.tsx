"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { 
  Zap, 
  Wallet, 
  Coins, 
  ArrowUpRight, 
  ExternalLink, 
  Check, 
  Copy, 
  Search, 
  RefreshCw,
  Cpu,
  ShieldCheck,
  Activity,
  LogOut,
  ChevronRight
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useHashConnect } from "@/context/HashConnectContext";
import api from "@/lib/api";

interface TransactionItem {
  id: string;
  type: string;
  title?: string;
  description?: string;
  amount: number;
  status: string;
  createdAt: string;
  txHash?: string | null;
  agentType?: string;
}

export default function DashboardPage() {
  const { accountId, isConnected, isInitialized, connect, disconnect } = useHashConnect();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "official" | "custom">("all");
  
  const [totalRuns, setTotalRuns] = useState(0);
  const [lifetimeSpent, setLifetimeSpent] = useState(0);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [walletBalance, setWalletBalance] = useState<string | null>(null);

  // Fetch dashboard stats from backend
  const fetchDashboardData = async () => {
    try {
      // Try dedicated stats endpoint, fallback to direct runs + transactions
      let res;
      try {
        res = await api.get("/wallet/dashboard-stats");
      } catch {
        res = await fetch("/api/dashboard/stats").then(r => r.json()).then(data => ({ data }));
      }

      if (res?.data) {
        const data = res.data;
        setTotalRuns(data.totalRuns ?? 0);
        setLifetimeSpent(data.lifetimeSpentHbar ?? 0);

        // Normalize runs and transactions into unified ledger
        const unified: TransactionItem[] = [];

        // Add direct transactions
        if (Array.isArray(data.transactions)) {
          data.transactions.forEach((tx: any) => {
            unified.push({
              id: tx.id,
              type: tx.type || "PAYMENT",
              title: tx.description || (tx.type === "AGENT_RUN" ? "Agent Execution" : "x402 Settlement"),
              description: tx.description || (tx.agentType ? `${tx.agentType} execution settlement` : "Hedera x402 payment settled"),
              amount: typeof tx.amount === "number" ? tx.amount : 0,
              status: tx.status || "CONFIRMED",
              createdAt: tx.createdAt || new Date().toISOString(),
              txHash: tx.txHash || null,
            });
          });
        }

        // Add runs that might not be in transactions
        if (Array.isArray(data.runs)) {
          data.runs.forEach((run: any) => {
            const alreadyExists = unified.some(u => u.id === run.id || (u.txHash && u.txHash === run.outputData?.metadata?.txHash));
            if (!alreadyExists) {
              const agentName = run.agentType ? run.agentType.toUpperCase() : "AI AGENT";
              const cost = typeof run.creditsUsed === "number" 
                ? run.creditsUsed 
                : (typeof run.outputData?.metadata?.costHbar === "number" ? run.outputData.metadata.costHbar : 1.0);
              const summary = run.outputData?.metadata?.summary || run.outputData?.summary || `${run.agentType || "Agent"} execution`;

              unified.push({
                id: run.id,
                type: "AGENT_RUN",
                agentType: run.agentType,
                title: `${agentName} Execution`,
                description: summary,
                amount: cost,
                status: run.status === "COMPLETED" ? "CONFIRMED" : (run.status || "CONFIRMED"),
                createdAt: run.createdAt || new Date().toISOString(),
                txHash: run.outputData?.metadata?.txHash || run.artifactCid || null,
              });
            }
          });
        }

        // Sort by date descending
        unified.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setTransactions(unified);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Fetch real-time HBAR balance if Hedera account is connected
  useEffect(() => {
    if (!accountId) {
      setWalletBalance(null);
      return;
    }

    let active = true;
    async function getBalance() {
      try {
        const res = await fetch(`https://testnet.mirrornode.hedera.com/api/v1/accounts/${accountId}`);
        if (res.ok) {
          const data = await res.json();
          if (active && data.balance?.balance !== undefined) {
            const hbar = (data.balance.balance / 100_000_000).toFixed(2);
            setWalletBalance(hbar);
          }
        }
      } catch (e) {
        console.error("Error fetching mirror node balance:", e);
      }
    }

    getBalance();
    return () => { active = false; };
  }, [accountId]);

  const handleCopyAccount = () => {
    if (!accountId) return;
    navigator.clipboard.writeText(accountId);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesSearch = 
        (tx.title && tx.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (tx.description && tx.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (tx.txHash && tx.txHash.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (tx.agentType && tx.agentType.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      const isOfficial = ["scamsniff", "threadsmith", "launchwatch"].includes((tx.agentType || "").toLowerCase());
      if (filterType === "official") return isOfficial;
      if (filterType === "custom") return !isOfficial;
      return true;
    });
  }, [transactions, searchQuery, filterType]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8 pb-16 text-gray-900"
    >
      
      {/* ── Top Header & Wallet Action ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-2 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.2em]">Hedera Testnet Console</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900 uppercase leading-tight">
            Console <span className="text-orange-500">Dashboard.</span>
          </h1>
          <p className="mt-1 text-sm sm:text-base text-gray-500 font-medium max-w-xl">
            Live metrics, lifetime expenditure, and verified Hedera x402 transaction ledger.
          </p>
        </div>

        {/* Connect Wallet Button / Connected Status Pill */}
        <div className="flex items-center gap-3">
          {isConnected && accountId ? (
            <div className="flex items-center gap-2.5 bg-white border border-gray-200 rounded-2xl p-2 pr-3 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
                <Wallet className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-bold text-gray-900">{accountId}</span>
                  <button 
                    onClick={handleCopyAccount}
                    title="Copy Wallet Address"
                    className="p-1 text-gray-400 hover:text-gray-700 rounded transition-colors"
                  >
                    {copiedAccount ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {walletBalance ? `${walletBalance} HBAR` : "Connected"}
                </p>
              </div>
              <button
                onClick={disconnect}
                title="Disconnect Wallet"
                className="ml-2 p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Button
              onClick={connect}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 h-12 px-6 text-sm uppercase tracking-wider"
            >
              <Wallet className="w-4 h-4" />
              Connect Wallet
            </Button>
          )}

          <Button
            variant="outline"
            size="icon"
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="rounded-2xl border-gray-200 h-12 w-12 hover:bg-gray-50"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 text-gray-600 ${refreshing ? "animate-spin text-orange-500" : ""}`} />
          </Button>
        </div>
      </div>

      {/* ── Key Metrics Cards (Grid of 3) ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Total Runs */}
        <Card className="p-6 bg-white border border-gray-200/80 rounded-[28px] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-[100px] -z-0 pointer-events-none group-hover:scale-105 transition-transform" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 shadow-sm">
                <Zap className="w-6 h-6" strokeWidth={2.5} />
              </div>
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-[10px] font-bold uppercase tracking-wider">
                All-time runs
              </Badge>
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Agent Runs</p>
            {loading ? (
              <Skeleton className="h-10 w-24 mt-2 rounded-xl bg-gray-100" />
            ) : (
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-4xl font-black text-gray-900 tracking-tight">{totalRuns}</h3>
                <span className="text-xs font-bold text-gray-400 uppercase">Executions</span>
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">Autonomous executions completed</span>
              <Link href="/runs" className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                Logs <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </Card>

        {/* Card 2: Funds Spent (Accumulates throughout lifetime) */}
        <Card className="p-6 bg-white border border-gray-200/80 rounded-[28px] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[100px] -z-0 pointer-events-none group-hover:scale-105 transition-transform" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm">
                <Coins className="w-6 h-6" strokeWidth={2.5} />
              </div>
              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-bold uppercase tracking-wider">
                Lifetime Spent
              </Badge>
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Funds Spent</p>
            {loading ? (
              <Skeleton className="h-10 w-32 mt-2 rounded-xl bg-gray-100" />
            ) : (
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-4xl font-black text-gray-900 tracking-tight">
                  {lifetimeSpent.toFixed(2)}
                </h3>
                <span className="text-sm font-black text-orange-500 uppercase tracking-tight">HBAR</span>
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">
                ≈ ${(lifetimeSpent * 0.06).toFixed(2)} USD est.
              </span>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Adds dynamically
              </span>
            </div>
          </div>
        </Card>

        {/* Card 3: Connected Wallet & Vault Status */}
        <Card className="p-6 bg-white border border-gray-200/80 rounded-[28px] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-[100px] -z-0 pointer-events-none group-hover:scale-105 transition-transform" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm">
                <ShieldCheck className="w-6 h-6" strokeWidth={2.5} />
              </div>
              <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-wider ${
                isConnected ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-600 border-gray-200"
              }`}>
                {isConnected ? "Active Vault" : "No Wallet"}
              </Badge>
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Hedera Account</p>
            <div className="mt-1">
              {isConnected && accountId ? (
                <div>
                  <h3 className="text-2xl font-black text-gray-900 font-mono truncate">{accountId}</h3>
                  <p className="text-xs font-bold text-emerald-600 mt-1">
                    Balance: {walletBalance ? `${walletBalance} HBAR` : "Loading balance..."}
                  </p>
                </div>
              ) : (
                <div>
                  <h3 className="text-xl font-bold text-gray-700 mt-1">HashPack Disconnected</h3>
                  <p className="text-xs text-gray-500 mt-1">Connect wallet to pay per agent run</p>
                </div>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">Hedera Testnet (0.0.x)</span>
              {isConnected ? (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                </span>
              ) : (
                <button 
                  onClick={connect} 
                  className="text-xs font-bold text-orange-600 hover:text-orange-700 underline"
                >
                  Connect now
                </button>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* ── Big Transaction History Card ──────────────────────────────────────── */}
      <Card className="p-6 sm:p-8 bg-white border border-gray-200/80 rounded-[32px] shadow-sm space-y-6">
        
        {/* Header & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-5 h-5 text-orange-500" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight uppercase">
                Transaction & Execution History
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 font-medium">
              Every agent execution and Hedera testnet settlement recorded on the ledger.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search tx hash or agent..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-4 text-xs font-medium bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setFilterType("all")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  filterType === "all" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
                }`}
              >
                All ({transactions.length})
              </button>
              <button
                onClick={() => setFilterType("official")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  filterType === "official" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Official Agents ({transactions.filter(t => ["scamsniff", "threadsmith", "launchwatch"].includes((t.agentType || "").toLowerCase())).length})
              </button>
              <button
                onClick={() => setFilterType("custom")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  filterType === "custom" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Custom Deployed ({transactions.filter(t => !["scamsniff", "threadsmith", "launchwatch"].includes((t.agentType || "").toLowerCase())).length})
              </button>
            </div>
          </div>
        </div>

        {/* Transaction Table / List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((n) => (
              <Skeleton key={n} className="h-16 w-full rounded-2xl bg-gray-50" />
            ))}
          </div>
        ) : filteredTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-3">
                  <th className="pb-3 pl-2">Operation / Agent</th>
                  <th className="pb-3">Date & Time</th>
                  <th className="pb-3">Transaction / Proof</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3 text-right pr-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTransactions.map((tx) => {
                  const dateStr = new Date(tx.createdAt).toLocaleString([], {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  const isSpend = tx.type === "AGENT_RUN" || tx.type === "PAYMENT" || tx.type === "DEBIT";

                  return (
                    <tr key={tx.id} className="hover:bg-gray-50/70 transition-colors group">
                      
                      {/* Operation Name */}
                      <td className="py-4 pl-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 group-hover:scale-105 transition-transform">
                            {tx.type === "AGENT_RUN" ? <Cpu className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">
                              {tx.title || "Agent Execution"}
                            </p>
                            <p className="text-[11px] text-gray-400 font-medium line-clamp-1">
                              {tx.description || "Hedera x402 payment settled"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-4 text-xs font-semibold text-gray-500 whitespace-nowrap">
                        {dateStr}
                      </td>

                      {/* Transaction Hash / Link */}
                      <td className="py-4">
                        {tx.txHash ? (
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded-md">
                              {tx.txHash.length > 16 
                                ? `${tx.txHash.slice(0, 8)}...${tx.txHash.slice(-6)}` 
                                : tx.txHash}
                            </span>
                            <button
                              onClick={() => handleCopyHash(tx.txHash!)}
                              title="Copy Tx Hash"
                              className="text-gray-400 hover:text-gray-700 p-1"
                            >
                              {copiedHash === tx.txHash ? (
                                <Check className="w-3.5 h-3.5 text-green-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            {tx.txHash.includes("@") || tx.txHash.startsWith("0.0.") ? (
                              <a
                                href={`https://hashscan.io/testnet/transaction/${encodeURIComponent(tx.txHash)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="View on HashScan"
                                className="text-orange-500 hover:text-orange-600 p-1"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-xs font-mono text-gray-400">On-chain memo</span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-4 whitespace-nowrap">
                        <span className={`text-sm font-black ${isSpend ? "text-orange-600" : "text-emerald-600"}`}>
                          {isSpend ? `-${tx.amount.toFixed(2)}` : `+${tx.amount.toFixed(2)}`} HBAR
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 text-right pr-2 whitespace-nowrap">
                        <Badge 
                          variant="outline" 
                          className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 py-1"
                        >
                          <Check className="w-3 h-3" />
                          {tx.status || "CONFIRMED"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Empty State */
          <div className="py-16 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500 mx-auto">
              <Activity className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">No Transactions Found</h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1">
                {searchQuery 
                  ? "No transactions match your search query." 
                  : "Run your first AI agent on AgentBazaar to record executions and on-chain settlements here."}
              </p>
            </div>
            <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold uppercase text-xs tracking-wider">
              <Link href="/marketplace">Explore Agents</Link>
            </Button>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
