'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  PenTool, 
  Copy, 
  RotateCcw, 
  Trash2, 
  MessageSquare, 
  Sparkles,
  Cpu,
  Database,
  CheckCircle2,
  Check,
  ExternalLink,
  Flame,
  Clock,
  Hash,
  Share2,
  Layers,
  FileText,
  TrendingUp,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useHashConnect } from "@/context/HashConnectContext";
import { useAuthStore } from "@/lib/store/auth.store";

interface TweetItem {
  order?: number;
  content: string;
  type?: string;
  engagement_target?: string;
}

interface ParsedThread {
  id?: string;
  title?: string;
  tone?: string;
  estimatedViralScore?: number;
  tweets: TweetItem[];
  metadata?: {
    hashtags?: string[];
    suggestedPostTime?: string;
    estimatedReach?: string;
    keywordDensity?: Record<string, number>;
  };
  recommendations?: {
    optimization?: string[];
  };
  viralElements?: {
    hooks?: string;
    structure?: string;
    storytelling?: string;
    callToAction?: string;
  };
}

function normalizeParsed(parsed: any): ParsedThread | null {
  if (!parsed) return null;
  const data = parsed.thread || parsed.data || parsed;

  const rawTweets =
    (Array.isArray(data) && data) ||
    (Array.isArray(data.thread_content) && data.thread_content) ||
    (Array.isArray(data.tweets) && data.tweets) ||
    (Array.isArray(data.posts) && data.posts) ||
    (Array.isArray(data.items) && data.items) ||
    (Array.isArray(parsed.thread_content) && parsed.thread_content) ||
    (Array.isArray(parsed.tweets) && parsed.tweets) ||
    (Array.isArray(parsed.posts) && parsed.posts);

  if (rawTweets && rawTweets.length > 0) {
    const meta = data.thread_metadata || data.metadata || parsed.thread_metadata || parsed.metadata || {};
    const perf = data.performance_metrics || parsed.performance_metrics || {};

    const collectedTags: string[] = [];
    if (Array.isArray(meta.hashtags)) collectedTags.push(...meta.hashtags);
    rawTweets.forEach((t: any) => {
      if (Array.isArray(t.engagement_tags)) collectedTags.push(...t.engagement_tags);
      if (Array.isArray(t.tags)) collectedTags.push(...t.tags);
    });
    const uniqueTags = Array.from(new Set(collectedTags));

    return {
      id: data.id || parsed.id,
      title: meta.title || data.title || parsed.title || meta.topic,
      tone: meta.tone || data.tone || parsed.tone,
      estimatedViralScore: data.estimatedViralScore || parsed.estimatedViralScore || (perf.retweet_potential === 'high' ? 9 : 8),
      tweets: rawTweets.map((t: any, idx: number) => {
        const text = typeof t === 'string' ? t : (t.content || t.text || t.tweet || t.message || '');
        const itemType = t.type || (idx === 0 ? 'hook' : idx === rawTweets.length - 1 ? 'CTA' : 'body');
        return {
          order: t.order ?? t.tweet_number ?? idx + 1,
          content: text,
          type: itemType,
          engagement_target: t.engagement_target || t.key_insight,
        };
      }),
      metadata: {
        hashtags: uniqueTags.length > 0 ? uniqueTags : meta.hashtags,
        suggestedPostTime: perf.ideal_post_time || meta.suggestedPostTime,
        estimatedReach: perf.estimated_reach || meta.estimatedReach,
      },
      recommendations: data.recommendations || parsed.recommendations,
      viralElements: data.viralElements || parsed.viralElements,
    };
  }
  return null;
}

function parseMarkdownThread(raw: string): ParsedThread | null {
  if (!raw) return null;
  const sections = raw.split(/\n\s*---\s*\n|\n(?=(?:🧵|\d+[\/\.]\s|\*\*Tweet\s+\d+))/i)
    .map(s => s.trim())
    .filter(Boolean);

  if (sections.length >= 2) {
    return {
      title: sections[0].startsWith("#") ? sections[0].replace(/^#+\s*/, "") : undefined,
      tweets: sections.map((sec, idx) => ({
        order: idx + 1,
        content: sec.replace(/^#+\s*.*?\n/, "").trim(),
        type: idx === 0 ? 'hook' : idx === sections.length - 1 ? 'CTA' : 'body',
      })),
    };
  }
  return null;
}

function parseThreadData(raw: string): ParsedThread | null {
  if (!raw) return null;
  try {
    let clean = raw.trim();

    // 1. If wrapped in markdown code blocks, extract inner content
    const codeBlockMatch = clean.match(/```(?:json)?\s*([\s\S]*?)(\n```|$)/i);
    if (codeBlockMatch && codeBlockMatch[1]) {
      const inner = codeBlockMatch[1].trim();
      try {
        const parsed = JSON.parse(inner);
        const res = normalizeParsed(parsed);
        if (res) return res;
      } catch {}
    }

    // 2. Find outermost JSON object
    const firstBrace = clean.indexOf("{");
    if (firstBrace !== -1) {
      let candidate = clean.substring(firstBrace);
      
      // Try direct JSON parse
      try {
        const parsed = JSON.parse(candidate);
        const res = normalizeParsed(parsed);
        if (res) return res;
      } catch {}

      // Try truncating to last valid closing brace
      const lastBrace = candidate.lastIndexOf("}");
      if (lastBrace !== -1) {
        try {
          const parsed = JSON.parse(candidate.substring(0, lastBrace + 1));
          const res = normalizeParsed(parsed);
          if (res) return res;
        } catch {}
      }

      // Try repairing truncated json array
      for (const suffix of ['}', ']}', ']}}', '"]}}']) {
        const lastTweetEnd = candidate.lastIndexOf('}');
        if (lastTweetEnd !== -1) {
          try {
            const repaired = candidate.substring(0, lastTweetEnd + 1) + suffix;
            const parsed = JSON.parse(repaired);
            const res = normalizeParsed(parsed);
            if (res) return res;
          } catch {}
        }
      }
    }

    // 3. Fallback to parsing markdown thread sections
    const mdThread = parseMarkdownThread(clean);
    if (mdThread) return mdThread;
  } catch (e) {
    console.warn("Failed to parse thread data:", e);
  }
  return null;
}

function getFormattedThreadText(parsed: ParsedThread | null, fallbackRaw: string): string {
  if (!parsed || !parsed.tweets || parsed.tweets.length === 0) return fallbackRaw;
  
  const tweetsText = parsed.tweets
    .map((t) => t.content.trim())
    .join("\n\n---\n\n");

  const hashtags = parsed.metadata?.hashtags?.length
    ? `\n\nHashtags: ${parsed.metadata.hashtags.join(" ")}`
    : "";

  return `${parsed.title ? `# ${parsed.title}\n\n` : ""}${tweetsText}${hashtags}`;
}

export default function ThreadSmithPage() {
  const { accountId, isConnected, connect, sendDeposit, refreshBalance } = useHashConnect();
  const { user } = useAuthStore();

  const [input, setInput] = useState('');
  const [contentType, setContentType] = useState('thread');
  const [tone, setTone] = useState('professional');
  const [length, setLength] = useState('MEDIUM');
  const [useMemory, setUseMemory] = useState(true);
  const [quality, setQuality] = useState('standard');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [output, setOutput] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'raw'>('cards');
  const [copiedTweetIdx, setCopiedTweetIdx] = useState<number | null>(null);
  const [statusIdx, setStatusIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);

  const parsedThread = useMemo(() => parseThreadData(output), [output]);

  const statusMessages = [
    "Prompting Hedera x402 payment...",
    "Verifying with Blocky402 facilitator...",
    "Querying Project Memory Index...",
    "Analyzing On-Chain Audit Logs...",
    "Synthesizing Narrative Structure...",
    "Optimizing for Modular Throughput...",
    "Finalizing Evidence Bundle..."
  ];

  useEffect(() => {
    let interval: any;
    if (isGenerating || isPaying) {
      interval = setInterval(() => {
        setStatusIdx((prev) => (prev + 1) % statusMessages.length);
      }, 2500);
    } else {
      setStatusIdx(0);
    }
    return () => clearInterval(interval);
  }, [isGenerating, isPaying, statusMessages.length]);

  const handleGenerate = async () => {
    if (!input.trim()) return toast.error("Please enter some content or context");

    if (!isConnected) {
      toast.info("Please connect your Hedera wallet to pay for synthesis");
      connect();
      return;
    }

    setIsPaying(true);
    setIsGenerating(false);
    setOutput("");

    try {
      const payloadBody = {
        agentId: "threadsmith",
        inputs: {
          prompt: input,
          topic: input,
          contentType,
          tone,
          quality,
          useMemory,
        },
        userId: user?.id,
        walletAddress: accountId,
      };

      // ── Step 1: Request 402 challenge ─────────────────────────────────────
      toast.info("Requesting payment challenge from Hedera testnet...", { id: "payment-toast" });
      const firstRes = await fetch("/api/agents/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payloadBody),
      });

      if (firstRes.status !== 402) {
        const errorData = await firstRes.json().catch(() => ({}));
        throw new Error(errorData.error || `Expected 402 payment challenge, got ${firstRes.status}`);
      }

      const { paymentRequirements } = await firstRes.json();

      // ── Step 2: Prompt Hedera Wallet (HashPack / Kabila) ───────────────────
      toast.loading("Please sign payment transaction in your wallet...", { id: "payment-toast" });
      const { paymentPayloadTransaction } = await sendDeposit(paymentRequirements);

      if (!paymentPayloadTransaction) {
        throw new Error("Failed to sign payment transaction with Hedera wallet");
      }

      // ── Step 3: Build x402 Payment Payload ────────────────────────────────
      const paymentPayload = {
        x402Version: 2,
        scheme: "exact",
        network: "hedera:testnet",
        accepted: paymentRequirements,
        payload: { transaction: paymentPayloadTransaction },
      };

      const xPayment = Buffer.from(JSON.stringify(paymentPayload)).toString("base64");

      // ── Step 4: Submit Payment & Synthesize Content ───────────────────────
      setIsPaying(false);
      setIsGenerating(true);
      toast.loading("Wallet signature confirmed! Settling on Hedera & synthesizing intelligence...", { id: "payment-toast" });

      const secondRes = await fetch("/api/agents/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Payment": xPayment,
        },
        credentials: "include",
        body: JSON.stringify(payloadBody),
      });

      if (!secondRes.ok) {
        const err = await secondRes.json().catch(() => ({}));
        throw new Error(err.error || "Execution failed");
      }

      const data = await secondRes.json();
      const content = data.output || data.response || data.content || "";
      setOutput(content);
      const tx = data.hederaTransaction || data.txHash || null;
      if (tx) {
        setLastTxHash(tx);
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("agentbazaar:run-completed", { detail: data }));
      }

      if (refreshBalance) {
        refreshBalance().catch(console.warn);
      }

      toast.success("Synthesis Complete & Settled on Hedera", {
        id: "payment-toast",
        description: tx ? `Tx: ${tx.slice(0, 16)}…` : "Recorded on HCS",
      });
    } catch (error: any) {
      console.error("Generation error:", error);
      toast.error("Execution Failed", {
        id: "payment-toast",
        description: error.message || "Failed to process payment and synthesis",
      });
    } finally {
      setIsPaying(false);
      setIsGenerating(false);
    }
  };

  const handleCopyFull = () => {
    const text = getFormattedThreadText(parsedThread, output);
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Full thread copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopySingleTweet = (tweetText: string, idx: number) => {
    navigator.clipboard.writeText(tweetText);
    setCopiedTweetIdx(idx);
    toast.success(`Tweet #${idx + 1} copied!`);
    setTimeout(() => setCopiedTweetIdx(null), 2000);
  };

  const handleTweetIntent = (content: string) => {
    const encoded = encodeURIComponent(content);
    window.open(`https://twitter.com/intent/tweet?text=${encoded}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto min-h-screen space-y-12 pb-24 bg-transparent text-gray-900">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-5">
            <div className="w-16 h-16 rounded-[24px] bg-orange-100 flex items-center justify-center border border-orange-200 shadow-sm transition-all hover:scale-105">
              <PenTool size={32} className="text-orange-600" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-5xl font-bold text-gray-900 tracking-tight uppercase leading-none">ThreadSmith</h1>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-2.5">Intelligence Synthesis Engine</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge className="bg-orange-50 text-orange-700 border border-orange-100 font-bold text-[10px] tracking-widest px-4 py-1.5 rounded-full uppercase">
              Claude 3.5 Optimized
            </Badge>
            <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white border border-gray-100 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">System Live</span>
            </div>
            {parsedThread?.estimatedViralScore && (
              <Badge className="bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[10px] tracking-wider px-3.5 py-1.5 rounded-full flex items-center gap-1.5">
                <Flame size={12} className="text-amber-600 fill-amber-500" />
                VIRAL SCORE: {parsedThread.estimatedViralScore}/10
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left: Input Panel */}
        <div className="lg:col-span-5 space-y-8">
          <Card className="bg-white border-gray-100 p-10 shadow-sm hover:shadow-md transition-all relative overflow-hidden group h-full rounded-[32px]">
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none group-hover:opacity-10 transition-opacity">
              <Database size={220} className="text-orange-500" />
            </div>

            <div className="relative z-10 space-y-8">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Operational Configuration</h3>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-4">
                  <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Content Type</Label>
                  <Select value={contentType} onValueChange={setContentType}>
                    <SelectTrigger className="h-14 bg-gray-50 border-gray-100 rounded-2xl font-bold text-gray-900 focus:ring-orange-100 focus:border-orange-500 transition-all shadow-inner">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-100 text-gray-900 shadow-xl rounded-2xl">
                      <SelectItem value="thread">X THREAD</SelectItem>
                      <SelectItem value="summary">SUMMARY</SelectItem>
                      <SelectItem value="warning">WARNING POST</SelectItem>
                      <SelectItem value="explainer">EXPLAINER</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Quality Tier</Label>
                  <Select value={quality} onValueChange={setQuality}>
                    <SelectTrigger className="h-14 bg-gray-50 border-gray-100 rounded-2xl font-bold text-gray-900 focus:ring-orange-100 focus:border-orange-500 transition-all shadow-inner">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-100 text-gray-900 shadow-xl rounded-2xl">
                      <SelectItem value="standard">
                        STANDARD (SONNET 3.5) — 2 CRD
                      </SelectItem>
                      <SelectItem value="premium">
                        PREMIUM (OPUS 3.5) — 5 CRD
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-4">
                  <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Intelligence Tone</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger className="h-14 bg-gray-50 border-gray-100 rounded-2xl font-bold text-gray-900 focus:ring-orange-100 focus:border-orange-500 transition-all shadow-inner">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-100 text-gray-900 shadow-xl rounded-2xl">
                      <SelectItem value="professional">PROFESSIONAL</SelectItem>
                      <SelectItem value="casual">CASUAL</SelectItem>
                      <SelectItem value="urgent">URGENT</SelectItem>
                      <SelectItem value="educational">EDUCATIONAL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Memory Toggle */}
              <div 
                onClick={() => setUseMemory(!useMemory)}
                className={cn(
                  "p-6 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group/opt shadow-sm",
                  useMemory ? "bg-orange-50 border-orange-200" : "bg-gray-50 border-gray-100 hover:bg-gray-100"
                )}
              >
                <div className="flex items-center space-x-5">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm", 
                      useMemory ? "bg-orange-500 text-white" : "bg-white text-gray-300"
                  )}>
                      <Database size={22} className={cn(useMemory ? "text-white" : "text-gray-300")} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className={cn("text-base font-bold transition-colors uppercase tracking-tight", useMemory ? "text-gray-900" : "text-gray-400")}>Access Project Memory</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Inject audit history</p>
                  </div>
                </div>
                <div className={cn("w-6 h-6 rounded-full border-[3px] transition-all relative flex items-center justify-center", useMemory ? "border-orange-500" : "border-gray-200")}>
                    {useMemory && <div className="w-2.5 h-2.5 bg-orange-500 rounded-full" />}
                </div>
              </div>

              {/* Execution Engine Banner */}
              <div className="flex items-center justify-between px-5 py-4 rounded-2xl bg-orange-50 border border-orange-200">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center">
                    <Sparkles size={16} className="text-white" strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-orange-700 uppercase tracking-widest leading-none">Hedera x402 Engine</p>
                    <p className="text-xs font-bold text-gray-700 mt-0.5 font-mono">Micro-settlement per run</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Rate</p>
                  <p className="text-base font-bold text-orange-600 leading-none mt-0.5">Pay-per-run</p>
                </div>
              </div>

              <div className="space-y-4">
                <Label htmlFor="input" className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Raw Context / Project Notes</Label>
                <textarea
                  id="input"
                  placeholder="Paste crypto events, market notes, audit findings, or core narratives here..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 min-h-[260px] rounded-2xl p-6 font-bold text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-500 shadow-inner resize-none transition-all leading-relaxed"
                />
              </div>

              <div className="space-y-4">
                <Button
                  onClick={handleGenerate}
                  disabled={!input || isGenerating || isPaying}
                  className="w-full h-16 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xl rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-4"
                >
                  {isPaying ? (
                    <>
                      <RotateCcw className="w-6 h-6 animate-spin" />
                      SIGNING ON-CHAIN PAYMENT…
                    </>
                  ) : isGenerating ? (
                    <>
                      <RotateCcw className="w-6 h-6 animate-spin" />
                      SYNTHESIZING...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-7 h-7" strokeWidth={2.5} />
                      INITIALIZE ENGINE
                    </>
                  )}
                </Button>
                <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-[0.25em]">
                  Settled directly via Hedera testnet
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Output Panel */}
        <div className="lg:col-span-7 h-full">
          <Card className="bg-white border-gray-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col h-full min-h-[850px] group rounded-[32px]">
            
            {/* Toolbar */}
            <div className="p-8 lg:p-10 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4 bg-gray-50/30 relative z-10">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center border border-orange-100 shadow-sm">
                  <Cpu size={24} className="text-orange-600" strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="font-bold text-2xl tracking-tight uppercase leading-none text-gray-900">
                    {parsedThread?.title || "Terminal Output"}
                  </h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                    <span>Narrative Intelligence Preview</span>
                    {parsedThread?.tweets && (
                      <>
                        <span>•</span>
                        <span className="text-orange-600 font-semibold">{parsedThread.tweets.length} Tweets</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {output && parsedThread && (
                  <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200/70">
                    <button
                      onClick={() => setViewMode('cards')}
                      className={cn(
                        "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                        viewMode === 'cards' 
                          ? "bg-white text-gray-900 shadow-sm" 
                          : "text-gray-500 hover:text-gray-800"
                      )}
                    >
                      <Layers size={14} />
                      Cards
                    </button>
                    <button
                      onClick={() => setViewMode('raw')}
                      className={cn(
                        "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                        viewMode === 'raw' 
                          ? "bg-white text-gray-900 shadow-sm" 
                          : "text-gray-500 hover:text-gray-800"
                      )}
                    >
                      <FileText size={14} />
                      Raw
                    </button>
                  </div>
                )}

                {output && (
                  <Button
                    onClick={handleCopyFull}
                    variant="ghost"
                    size="sm"
                    className="h-11 px-5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 hover:text-orange-600 font-bold text-[11px] uppercase tracking-wider transition-all shadow-sm flex items-center gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-green-600" strokeWidth={3} />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" strokeWidth={2.5} />
                        Copy Thread
                      </>
                    )}
                  </Button>
                )}

                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setOutput("")} 
                  className="w-11 h-11 rounded-xl border border-gray-200 bg-white hover:bg-red-50 hover:border-red-100 group/del shadow-sm transition-all"
                  title="Clear Output"
                >
                  <Trash2 size={20} className="text-gray-400 group-hover/del:text-red-500 transition-colors" />
                </Button>
              </div>
            </div>

            {/* Metadata & Hashtags Bar (when parsed) */}
            {parsedThread?.metadata && (
              <div className="px-8 lg:px-10 py-3.5 bg-orange-50/50 border-b border-orange-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Hashtags:</span>
                  {parsedThread.metadata.hashtags?.map((tag, i) => (
                    <span key={i} className="px-2.5 py-0.5 rounded-full bg-white text-orange-700 border border-orange-200 font-mono text-[11px] font-bold">
                      {tag}
                    </span>
                  ))}
                </div>
                {parsedThread.metadata.suggestedPostTime && (
                  <div className="flex items-center gap-1.5 text-gray-600 font-medium text-[11px]">
                    <Clock size={13} className="text-orange-600" />
                    <span>Post Time: <strong className="text-gray-900">{parsedThread.metadata.suggestedPostTime}</strong></span>
                  </div>
                )}
              </div>
            )}

            {/* Main Area */}
            <div className="flex-1 p-6 lg:p-10 overflow-y-auto relative z-10 selection:bg-orange-100 selection:text-orange-900">
              <AnimatePresence mode="wait">
                {!output && !isGenerating ? (
                  <motion.div 
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full flex flex-col items-center justify-center space-y-10 text-center py-20"
                  >
                    <div className="w-28 h-28 rounded-[40px] bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
                      <MessageSquare size={44} className="text-gray-300 opacity-40" />
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-3xl font-bold text-gray-400 tracking-tight uppercase leading-none">Operational Standby</h4>
                      <p className="text-[11px] font-bold text-gray-400 max-w-xs mx-auto leading-relaxed uppercase tracking-[0.4em]">
                        Configure operational parameters to initiate high-fidelity narrative synthesis.
                      </p>
                    </div>
                  </motion.div>
                ) : isGenerating ? (
                  <motion.div 
                    key="loading"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="h-full flex flex-col items-center justify-center space-y-16 py-20"
                  >
                    <div className="relative scale-110">
                        <div className="w-36 h-36 rounded-full border-[5px] border-orange-50 border-t-orange-500 animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <RotateCcw size={48} className="text-orange-500/30" />
                        </div>
                    </div>
                    <div className="text-center space-y-4">
                        <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight uppercase animate-pulse leading-none">
                            {statusMessages[statusIdx]}
                        </h3>
                        <div className="flex items-center justify-center gap-5 text-[10px] font-bold text-gray-400 uppercase tracking-[0.5em]">
                            <span>Tokenizing Matrix</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                            <span>V-Compute Active</span>
                        </div>
                    </div>
                  </motion.div>
                ) : parsedThread && viewMode === 'cards' ? (
                  /* Visual Tweet Feed Cards View */
                  <motion.div 
                    key="cards"
                    initial={{ opacity: 0, scale: 0.99 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-6 max-w-2xl mx-auto pb-6"
                  >
                    {parsedThread.tweets.map((tweet, idx) => {
                      const charCount = tweet.content.length;
                      const isOverLimit = charCount > 280;
                      const isHook = idx === 0 || tweet.type === 'hook';
                      const isCTA = idx === parsedThread.tweets.length - 1 || tweet.type === 'CTA';
                      const isCopied = copiedTweetIdx === idx;

                      return (
                        <div key={idx} className="relative group">
                          {/* Thread connector line */}
                          {idx < parsedThread.tweets.length - 1 && (
                            <div className="absolute left-6 top-16 bottom-[-24px] w-0.5 bg-gradient-to-b from-orange-300 via-gray-200 to-gray-200 z-0" />
                          )}

                          <div className={cn(
                            "relative z-10 p-6 rounded-2xl border transition-all duration-200 shadow-sm hover:shadow-md",
                            isHook 
                              ? "bg-gradient-to-br from-orange-50/70 to-white border-orange-200/80" 
                              : isCTA 
                              ? "bg-gradient-to-br from-amber-50/50 to-white border-amber-200/70"
                              : "bg-white border-gray-200/80"
                          )}>
                            {/* Card Header */}
                            <div className="flex items-center justify-between gap-3 mb-4">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-9 h-9 rounded-xl flex items-center justify-center text-xs font-extrabold shadow-sm font-mono",
                                  isHook
                                    ? "bg-orange-600 text-white"
                                    : isCTA
                                    ? "bg-amber-600 text-white"
                                    : "bg-gray-900 text-white"
                                )}>
                                  {idx + 1}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-gray-900">
                                      Tweet {idx + 1} of {parsedThread.tweets.length}
                                    </span>
                                    {tweet.type && (
                                      <Badge variant="outline" className={cn(
                                        "text-[9px] font-mono uppercase tracking-wider py-0 px-2 rounded-full",
                                        isHook ? "border-orange-300 text-orange-700 bg-orange-50" :
                                        isCTA ? "border-amber-300 text-amber-700 bg-amber-50" :
                                        "border-gray-200 text-gray-600 bg-gray-50"
                                      )}>
                                        {tweet.type}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Card Actions */}
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "text-[10px] font-mono font-bold mr-1",
                                  isOverLimit ? "text-red-500 font-bold" : "text-gray-400"
                                )}>
                                  {charCount}/280
                                </span>
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCopySingleTweet(tweet.content, idx)}
                                  className="h-8 px-2.5 rounded-lg border border-gray-200 bg-white hover:bg-orange-50 hover:text-orange-600 text-gray-600 text-xs font-semibold shadow-2xs"
                                  title="Copy this tweet"
                                >
                                  {isCopied ? (
                                    <Check className="w-3.5 h-3.5 text-green-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleTweetIntent(tweet.content)}
                                  className="h-8 px-2.5 rounded-lg border border-gray-200 bg-white hover:bg-sky-50 hover:text-sky-600 text-gray-600 text-xs font-semibold shadow-2xs"
                                  title="Post on X"
                                >
                                  <Share2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>

                            {/* Tweet Content */}
                            <p className="text-gray-900 text-base leading-relaxed font-medium whitespace-pre-wrap">
                              {tweet.content}
                            </p>
                          </div>
                        </div>
                      );
                    })}

                    {/* Recommendations Panel */}
                    {parsedThread.recommendations?.optimization && parsedThread.recommendations.optimization.length > 0 && (
                      <div className="mt-8 p-6 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-3">
                        <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                          <Lightbulb size={16} className="text-amber-600" />
                          <span>AI Optimization Insights</span>
                        </div>
                        <ul className="space-y-1.5 text-xs text-amber-950/80 font-medium pl-5 list-disc">
                          {parsedThread.recommendations.optimization.map((tip, i) => (
                            <li key={i}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  /* Raw Output View Fallback */
                  <motion.div 
                    key="raw"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="h-full"
                  >
                    <div 
                      className="outline-none text-base lg:text-lg leading-[1.7] text-gray-800 font-sans min-h-[500px] whitespace-pre-wrap bg-gray-50/80 p-8 rounded-2xl border border-gray-200/70"
                    >
                      {getFormattedThreadText(parsedThread, output)}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer Status */}
            <div className="p-8 lg:p-10 border-t border-gray-100 flex flex-wrap items-center justify-between gap-6 bg-gray-50/30 relative z-10">
                <div className="flex items-center space-x-10">
                   <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Synthesis Delta</p>
                      <p className="text-2xl font-bold text-gray-900 leading-none">{output ? "READY" : "IDLE"}</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Security Anchor</p>
                      <p className="text-2xl font-bold text-orange-600 uppercase leading-none">VERIFIED</p>
                   </div>
                </div>
                <div className="flex items-center space-x-3">
                  {lastTxHash ? (
                    <a
                      href={`https://hashscan.io/testnet/transaction/${lastTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-3 px-5 py-3.5 bg-orange-50 hover:bg-orange-100 rounded-[20px] border border-orange-200 shadow-sm transition-all cursor-pointer group"
                    >
                      <ExternalLink size={16} className="text-orange-600 group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-bold text-orange-700 uppercase tracking-widest leading-none">
                        HEDERA TX: {lastTxHash.slice(0, 10)}...{lastTxHash.slice(-6)}
                      </span>
                    </a>
                  ) : (
                    <div className="hidden sm:flex items-center space-x-3 px-5 py-3.5 bg-green-50 rounded-[20px] border border-green-100 shadow-sm">
                      <CheckCircle2 size={16} className="text-green-600" strokeWidth={2.5} />
                      <span className="text-[10px] font-bold text-green-700 uppercase tracking-widest leading-none">NARRATIVE PROOF ANCHORED</span>
                    </div>
                  )}
                </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

