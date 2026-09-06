"use client";

import { useState, useRef, useEffect } from "react";
import { useHashPack } from "@/hooks/useHashPack";
import { useHashConnect } from "@/context/HashConnectContext";
import {
  Maximize2,
  Minimize2,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Loader2,
} from "lucide-react";

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

interface AgentChatProps {
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onClose?: () => void;
}

const QUICK_PROMPTS = [
  "Find top trading & arbitrage agents",
  "Audit a Hedera smart contract",
  "Analyze crypto market sentiment",
];

export function AgentChat({ isExpanded = false, onToggleExpand, onClose }: AgentChatProps) {
  const { isConnected: isHashPackConnected, connect: connectHashPack, sendDeposit } = useHashPack();
  const { isConnected: isContextConnected, connect: connectContextModal, accountId } = useHashConnect();
  
  const isConnected = isHashPackConnected || isContextConnected || !!accountId;
  const connect = () => {
    if (connectContextModal) {
      connectContextModal();
    } else {
      connectHashPack();
    }
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! Tell me what you need — I will discover the right AI agents, assemble an execution plan, and orchestrate them via Hedera x402 micro-payments.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<PlanState | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, pendingPlan]);

  // Step 1 — Send message, get plan + 402
  async function handleSend(textToSend?: string) {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    if (!isConnected) {
      connect();
      return;
    }

    setInput("");
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: text }]);

    try {
      const res = await fetch("/api/chat/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();

      if (res.status === 402 && data.status === "payment_required") {
        setPendingPlan({
          plan: data.plan,
          agentsToCall: data.agentsToCall,
          estimatedCostHbar: data.estimatedCostHbar,
          originalMessage: text,
          paymentRequirements: data.paymentRequirements,
        });

        setMessages((prev) => [
          ...prev,
          {
            role: "system",
            content: `📋 Orchestration Plan: ${data.plan}\n\n💰 Estimated Cost: ${
              data.estimatedCostHbar
            } HBAR\n🤖 Agents: ${data.agentsToCall
              .map((a: { agentName: string }) => a.agentName)
              .join(" → ")}`,
          },
        ]);
      } else if (data.response) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.response,
            hashscanUrl: data.hashscanUrl,
            hcsUrl: data.hcsUrl,
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
        process.env.NEXT_PUBLIC_PLATFORM_ACCOUNT || "0.0.4851234",
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
          { role: "assistant", content: `Execution error: ${data.error || "Failed to process request"}` },
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
        { role: "assistant", content: `Payment failed: ${err.message || "User rejected or wallet not connected"}` },
      ]);
    }

    setLoading(false);
  }

  return (
    <div className="flex flex-col h-full w-full bg-white select-text">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-white/90 backdrop-blur flex items-center justify-between gap-3 select-none flex-shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative flex h-2.5 w-2.5 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-900 truncate">AgentBazaar Orchestrator</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-orange-50 text-orange-600 border border-orange-200/60 hidden sm:inline-block">
                x402 AI
              </span>
            </div>
            <p className="text-[11px] text-gray-400 truncate">Hedera Multi-Agent Assistant</p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-[11px] font-medium text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full mr-1 hidden sm:inline-block">
            Testnet
          </span>

          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title={isExpanded ? "Collapse to standard size" : "Enlarge chat screen"}
              aria-label={isExpanded ? "Collapse chat" : "Enlarge chat"}
            >
              {isExpanded ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Close chat"
              aria-label="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30 custom-scrollbar">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex items-start gap-2.5 ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.role !== "user" && (
              <div className="w-7 h-7 rounded-lg bg-orange-100 border border-orange-200/60 flex items-center justify-center text-orange-600 flex-shrink-0 mt-0.5 shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-[#F97316] text-white rounded-br-sm shadow-sm max-w-[85%] sm:max-w-[75%]"
                  : msg.role === "system"
                  ? "bg-amber-50/90 text-amber-950 border border-amber-200/80 font-mono text-xs w-full max-w-full rounded-xl"
                  : "bg-white text-gray-800 border border-gray-200/70 rounded-bl-sm shadow-sm max-w-[88%] sm:max-w-[80%]"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>

              {msg.hashscanUrl && (
                <div className="mt-3 space-y-2 border-t border-gray-100 pt-2.5">
                  <a
                    href={msg.hashscanUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 hover:text-orange-700 hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Verify on HashScan (Hedera testnet)
                  </a>
                  {msg.hcsUrl && (
                    <a
                      href={msg.hcsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-xs font-medium text-gray-500 hover:text-gray-700 hover:underline"
                    >
                      ↗ HCS Audit Trail
                    </a>
                  )}
                </div>
              )}
            </div>

            {msg.role === "user" && (
              <div className="w-7 h-7 rounded-lg bg-gray-900 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {/* Quick prompt suggestions if conversation is just beginning */}
        {messages.length === 1 && !loading && (
          <div className="pt-2">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              Suggested requests
            </p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt)}
                  className="text-xs bg-white hover:bg-orange-50 text-gray-700 hover:text-orange-600 border border-gray-200 hover:border-orange-200 rounded-xl px-3 py-1.5 transition-all text-left shadow-2xs"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-start gap-2.5 justify-start">
            <div className="w-7 h-7 rounded-lg bg-orange-100 border border-orange-200/60 flex items-center justify-center text-orange-600 flex-shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white rounded-2xl px-4 py-3 border border-gray-200/60 shadow-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />
              <span className="text-xs text-gray-500">Discovering agents &amp; computing x402 cost...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Approval bar — ONE HashPack payment for all agents */}
      {pendingPlan && !loading && (
        <div className="px-4 py-3 border-t border-amber-200 bg-amber-50/95 flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span className="text-xs font-medium text-amber-950 truncate">
              Pay <strong className="font-bold text-orange-600">{pendingPlan.estimatedCostHbar} HBAR</strong> for{" "}
              {pendingPlan.agentsToCall.length} agent(s)
            </span>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => setPendingPlan(null)}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={approveAndPay}
              className="px-3.5 py-1.5 text-xs font-medium text-white bg-[#F97316] hover:bg-[#e06412] transition-colors rounded-lg shadow-sm flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Pay &amp; Run
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      {!pendingPlan && (
        <div className="px-4 py-3 border-t border-gray-100 bg-white flex gap-2 items-center flex-shrink-0">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={
              isConnected
                ? "Describe your goal (e.g., orchestrate agents to analyze DeFi yield)..."
                : "Connect HashPack or Testnet wallet to start..."
            }
            className="flex-1 bg-gray-50 text-gray-900 text-sm rounded-xl px-4 py-2.5 outline-none border border-gray-200 focus:border-[#F97316] focus:bg-white placeholder:text-gray-400 transition-all"
            disabled={loading}
          />
          <button
            onClick={() => (isConnected ? handleSend() : connect())}
            disabled={loading || (isConnected && !input.trim())}
            className="px-4 py-2.5 bg-[#F97316] hover:bg-[#e06412] transition-colors text-white text-sm font-semibold rounded-xl disabled:opacity-50 disabled:hover:bg-[#F97316] shadow-sm flex items-center gap-1.5 flex-shrink-0"
          >
            {isConnected ? (
              <>
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Send</span>
              </>
            ) : (
              "Connect"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
