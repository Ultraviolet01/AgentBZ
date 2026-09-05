"use client";

import { useState, useEffect } from "react";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  agentResults?: { agentName: string; transaction: string }[];
  hashscanUrls?: string[];
  vaultBalance?: number;
}

interface ApprovalState {
  plan: string;
  agentsToCall: { agentId: string; agentName: string }[];
  estimatedCostHbar: number;
  originalMessage: string;
}

export function AgentChat() {
  // Hedera account ID from localStorage — same as VaultDashboard
  // No wagmi, no wallet connection needed
  const [buyerAccountId, setBuyerAccountId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm the AgentBazaar assistant. Tell me what you need — I'll find the right agents and handle everything from your vault.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingApproval, setPendingApproval] =
    useState<ApprovalState | null>(null);

  // Load Hedera account ID from localStorage (set by VaultDashboard)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("agentbazaar-hedera-account");
      if (saved) setBuyerAccountId(saved);
    }
  }, []);

  // Step 1 — Send message, get plan back (no payment yet)
  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMessage = input;
    setInput("");
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await fetch(`${baseUrl}/api/chat/orchestrate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          buyerAccountId,
          approved: false, // just get the plan — no payment yet
        }),
      });

      const data = await res.json();

      if (data.status === "approval_needed") {
        setPendingApproval({
          plan: data.plan,
          agentsToCall: data.agentsToCall,
          estimatedCostHbar: data.estimatedCostHbar,
          originalMessage: userMessage,
        });

        setMessages((prev) => [
          ...prev,
          {
            role: "system",
            content: `📋 Plan: ${data.plan}\n\n💰 Cost: ~${data.estimatedCostHbar} HBAR from your vault\n🤖 Agents: ${data.agentsToCall
              .map((a: { agentName: string }) => a.agentName)
              .join(" → ")}`,
          },
        ]);
      } else if (data.error) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `⚠️ ${data.error}` },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong. Please try again." },
      ]);
    }

    setLoading(false);
  }

  // Step 2 — User approves plan, server handles vault deduction + payment
  async function approveAndExecute() {
    if (!pendingApproval) return;
    setLoading(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await fetch(`${baseUrl}/api/chat/orchestrate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: pendingApproval.originalMessage,
          buyerAccountId,
          approved: true, // server handles vault deduction + Blocky402 settlement
        }),
      });

      const data = await res.json();

      if (res.status === 402) {
        // Insufficient vault balance
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `⚠️ Insufficient vault balance.\nRequired: ${data.required} HBAR\nAvailable: ${data.available} HBAR\nDeposit ${data.shortfall} more HBAR to your vault to continue.`,
          },
        ]);
        setPendingApproval(null);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "Orchestration failed");
      }

      setPendingApproval(null);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response,
          agentResults: data.agentResults,
          hashscanUrls: data.hashscanUrls,
          vaultBalance: data.vaultBalance,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: err.message || "Execution failed. Please try again.",
        },
      ]);
    }

    setLoading(false);
  }

  return (
    <div className="flex flex-col h-[600px] bg-[#0A0A0A] rounded-2xl border border-[#1A1A1A] shadow-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-[#111] border-b border-[#1A1A1A] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-semibold text-white tracking-tight">
            AgentBazaar AI Assistant
          </span>
          <span className="text-[10px] uppercase font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
            A2A Enabled
          </span>
        </div>
        <span className="text-xs text-gray-400 font-mono">
          {buyerAccountId ? `Vault: ${buyerAccountId}` : "No account connected"}
        </span>
      </div>

      {/* Account ID prompt — shown if not set */}
      {!buyerAccountId && (
        <div className="px-4 py-2.5 bg-yellow-500/10 border-b border-yellow-500/20 flex items-center justify-between">
          <p className="text-yellow-400 text-xs font-medium">
            ⚠️ No Hedera account connected. Connect in your Vault dashboard to execute agents.
          </p>
          <a
            href="/wallet"
            className="text-xs text-yellow-300 hover:text-white underline font-medium ml-2 whitespace-nowrap"
          >
            Go to Vault ↗
          </a>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-[#6C3BFF] text-white shadow-md rounded-br-none"
                  : msg.role === "system"
                  ? "bg-[#141414] text-yellow-400 font-mono text-xs w-full border border-yellow-500/20 shadow-sm"
                  : "bg-[#161616] text-gray-200 border border-[#222] shadow-sm rounded-bl-none"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>

              {/* HashScan links — uses transaction field (not txHash) */}
              {msg.hashscanUrls && msg.hashscanUrls.length > 0 && (
                <div className="mt-3 space-y-1.5 border-t border-[#2A2A2A] pt-2.5">
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                    On-Chain Proofs
                  </p>
                  {msg.agentResults?.map((r, j) => (
                    <a
                      key={j}
                      href={msg.hashscanUrls![j]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 underline mr-3"
                    >
                      ↗ {r.agentName} (HashScan)
                    </a>
                  ))}
                  {msg.vaultBalance !== undefined && (
                    <p className="text-xs text-gray-400 font-mono pt-1">
                      Remaining Vault Balance: {msg.vaultBalance.toFixed(2)} HBAR
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#161616] border border-[#222] rounded-2xl px-4 py-3">
              <div className="flex gap-1.5 items-center">
                <span className="text-xs text-gray-400 mr-1">Orchestrating</span>
                <div
                  className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <div
                  className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <div
                  className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Approval bar */}
      {pendingApproval && !loading && (
        <div className="px-4 py-3 border-t border-yellow-500/30 bg-yellow-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <span className="text-xs text-yellow-300 font-medium">
            Deduct {pendingApproval.estimatedCostHbar} HBAR from your vault to run{" "}
            {pendingApproval.agentsToCall.length} agent(s)?
          </span>
          <div className="flex gap-2 self-end sm:self-auto">
            <button
              onClick={() => setPendingApproval(null)}
              className="px-3 py-1.5 text-xs text-gray-300 hover:text-white border border-gray-700 hover:bg-[#222] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={approveAndExecute}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-[#6C3BFF] hover:bg-[#582bd6] rounded-lg shadow-md transition-colors"
            >
              Approve & Run
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      {!pendingApproval && (
        <div className="px-4 py-3 border-t border-[#1A1A1A] bg-[#0E0E0E] flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder={
              buyerAccountId
                ? "Ask anything (e.g. 'Analyze threat for contract 0x123 and draft thread')..."
                : "Connect your vault to start chatting..."
            }
            className="flex-1 bg-[#1A1A1A] text-white text-sm rounded-xl px-4 py-2.5 outline-none border border-[#2A2A2A] focus:border-[#6C3BFF] transition-colors"
            disabled={loading || !buyerAccountId}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim() || !buyerAccountId}
            className="px-5 py-2.5 bg-[#6C3BFF] hover:bg-[#582bd6] text-white text-sm font-semibold rounded-xl disabled:opacity-40 shadow-md transition-all whitespace-nowrap"
          >
            Send
          </button>
        </div>
      )}
    </div>
  );
}
