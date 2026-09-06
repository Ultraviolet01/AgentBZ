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
    <div className="flex flex-col h-[600px] bg-[#0A0A0A] rounded-xl border border-[#1A1A1A]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#1A1A1A] flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-sm font-medium text-white">AgentBazaar Chat</span>
        <span className="text-xs text-gray-500 ml-auto">Hedera testnet</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-xl px-4 py-2 text-sm ${
                msg.role === "user"
                  ? "bg-[#F97316] text-white"
                  : msg.role === "system"
                  ? "bg-[#1A1A1A] text-yellow-400 font-mono text-xs w-full"
                  : "bg-[#1A1A1A] text-gray-200"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.hashscanUrl && (
                <div className="mt-2 space-y-1 border-t border-[#2A2A2A] pt-2">
                  <a
                    href={msg.hashscanUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-xs text-blue-400 underline"
                  >
                    ↗ Payment — HashScan (Hedera testnet)
                  </a>
                  {msg.hcsUrl && (
                    <a
                      href={msg.hcsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-xs text-blue-400 underline"
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
            <div className="bg-[#1A1A1A] rounded-xl px-4 py-2">
              <div className="flex gap-1">
                {[0, 150, 300].map((delay) => (
                  <div
                    key={delay}
                    className="w-2 h-2 rounded-full bg-gray-500 animate-bounce"
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
        <div className="px-4 py-3 border-t border-yellow-500/30 bg-yellow-500/5 flex items-center justify-between">
          <span className="text-xs text-yellow-400">
            Pay {pendingPlan.estimatedCostHbar} HBAR via HashPack to run{" "}
            {pendingPlan.agentsToCall.length} agent(s)?
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPendingPlan(null)}
              className="px-3 py-1 text-xs text-gray-400 border border-gray-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={approveAndPay}
              className="px-3 py-1 text-xs text-white bg-[#F97316] hover:bg-[#e06412] transition-colors rounded-lg"
            >
              Pay &amp; Run
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      {!pendingPlan && (
        <div className="px-4 py-3 border-t border-[#1A1A1A] flex gap-2">
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
            className="flex-1 bg-[#1A1A1A] text-white text-sm rounded-lg px-4 py-2 outline-none border border-[#2A2A2A] focus:border-[#F97316]"
            disabled={loading}
          />
          <button
            onClick={isConnected ? sendMessage : connect}
            disabled={loading || (isConnected && !input.trim())}
            className="px-4 py-2 bg-[#F97316] hover:bg-[#e06412] transition-colors text-white text-sm rounded-lg disabled:opacity-50"
          >
            {isConnected ? "Send" : "Connect"}
          </button>
        </div>
      )}
    </div>
  );
}
