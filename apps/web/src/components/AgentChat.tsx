"use client";

import { useState } from "react";
import { useHashPack } from "@/hooks/useHashPack";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  hashscanUrl?: string;
  hcsUrl?: string;
}

interface PlanState {
  plan: string;
  agentsToCall: { agentId: string; agentName: string }[];
  estimatedCostHbar: number;
  originalMessage: string;
  paymentRequirements: object;
}

export function AgentChat() {
  const { isConnected, connect, sendDeposit } = useHashPack();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! Tell me what you need — I'll find the right agents and handle everything. Connect HashPack to get started.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<PlanState | null>(null);

  // Step 1 — Send message, get plan + 402
  async function sendMessage() {
    if (!input.trim() || loading) return;

    if (!isConnected) {
      connect();
      return;
    }

    const userMessage = input;
    setInput("");
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    try {
      const res = await fetch("/api/chat/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await res.json();

      if (res.status === 402 && data.status === "payment_required") {
        setPendingPlan({
          plan: data.plan,
          agentsToCall: data.agentsToCall,
          estimatedCostHbar: data.estimatedCostHbar,
          originalMessage: userMessage,
          paymentRequirements: data.paymentRequirements,
        });

        setMessages((prev) => [
          ...prev,
          {
            role: "system",
            content: `📋 Plan: ${data.plan}\n\n💰 Cost: ${
              data.estimatedCostHbar
            } HBAR\n🤖 Agents: ${data.agentsToCall
              .map((a: { agentName: string }) => a.agentName)
              .join(" → ")}`,
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Something went wrong. Please try again.",
        },
      ]);
    }

    setLoading(false);
  }

  // Step 2 — HashPack signs ONE payment for total, server runs all agents
  async function approveAndPay() {
    if (!pendingPlan) return;
    setLoading(true);

    try {
      // HashPack popup — buyer signs ONE HBAR transfer for total cost
      const txId = await sendDeposit(
        process.env.NEXT_PUBLIC_PLATFORM_ACCOUNT!,
        pendingPlan.estimatedCostHbar
      );

      // Build x402 payment payload from signed transaction
      const paymentPayload = {
        x402Version: 2,
        scheme: "exact",
        network: "hedera:testnet",
        accepted: pendingPlan.paymentRequirements,
        payload: { transaction: txId },
      };

      const xPayment = Buffer.from(JSON.stringify(paymentPayload)).toString(
        "base64"
      );

      // Retry with X-Payment header — Blocky402 settles, all agents run
      const res = await fetch("/api/chat/orchestrate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Payment": xPayment,
        },
        body: JSON.stringify({ message: pendingPlan.originalMessage }),
      });

      const data = await res.json();
      setPendingPlan(null);

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Error: ${data.error}` },
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response,
          hashscanUrl: data.hashscanUrl,
          hcsUrl: data.hcsUrl,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Payment failed: ${err.message}` },
      ]);
    }

    setLoading(false);
  }

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-gray-100 bg-white flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-sm font-semibold text-gray-900">AgentBazaar Chat</span>
        <span className="text-xs font-medium text-gray-400 ml-auto">Hedera testnet</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-[#F97316] text-white rounded-br-sm shadow-sm"
                  : msg.role === "system"
                  ? "bg-amber-50 text-amber-900 border border-amber-200/80 font-mono text-xs w-full"
                  : "bg-gray-100 text-gray-800 border border-gray-200/60 rounded-bl-sm"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.hashscanUrl && (
                <div className="mt-2.5 space-y-1.5 border-t border-gray-200/80 pt-2">
                  <a
                    href={msg.hashscanUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-xs font-medium text-blue-600 hover:text-blue-700 underline"
                  >
                    ↗ Payment — HashScan (Hedera testnet)
                  </a>
                  {msg.hcsUrl && (
                    <a
                      href={msg.hcsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-xs font-medium text-blue-600 hover:text-blue-700 underline"
                    >
                      ↗ HCS Audit Trail — HashScan
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl px-4 py-3 border border-gray-200/60">
              <div className="flex gap-1.5">
                {[0, 150, 300].map((delay) => (
                  <div
                    key={delay}
                    className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Approval bar — ONE HashPack payment for all agents */}
      {pendingPlan && !loading && (
        <div className="px-4 py-3 border-t border-amber-200 bg-amber-50 flex items-center justify-between gap-3">
          <span className="text-xs font-medium text-amber-900 leading-snug">
            Pay {pendingPlan.estimatedCostHbar} HBAR via HashPack to run{" "}
            {pendingPlan.agentsToCall.length} agent(s)?
          </span>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => setPendingPlan(null)}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={approveAndPay}
              className="px-3 py-1.5 text-xs font-medium text-white bg-[#F97316] hover:bg-[#e06412] transition-colors rounded-lg shadow-sm"
            >
              Pay &amp; Run
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      {!pendingPlan && (
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50 flex gap-2 items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder={
              isConnected
                ? "Ask me anything — I'll find the right agents..."
                : "Connect HashPack to start..."
            }
            className="flex-1 bg-white text-gray-900 text-sm rounded-xl px-4 py-2.5 outline-none border border-gray-200 focus:border-[#F97316] placeholder:text-gray-400 shadow-sm transition-colors"
            disabled={loading}
          />
          <button
            onClick={isConnected ? sendMessage : connect}
            disabled={loading || (isConnected && !input.trim())}
            className="px-4 py-2.5 bg-[#F97316] hover:bg-[#e06412] transition-colors text-white text-sm font-medium rounded-xl disabled:opacity-50 shadow-sm"
          >
            {isConnected ? "Send" : "Connect"}
          </button>
        </div>
      )}
    </div>
  );
}
