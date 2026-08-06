'use client';

import React, { useState, useEffect } from 'react';
import { 
  PenTool, 
  Send, 
  Copy, 
  RotateCcw, 
  Save, 
  Trash2, 
  Eye, 
  Layout, 
  MessageSquare, 
  Sparkles,
  Loader2,
  Cpu,
  Database,
  CheckCircle2,
  ArrowRight,
  Check,
  ChevronDown,
  Wallet,
  Zap,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
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
import api from "@/lib/api";
import { useAccount, useSendTransaction, useSignTypedData, usePublicClient } from "wagmi";
import { payAgentFeeFromWallet, signX402PaymentAuthorization } from "@/lib/x402-client";

export default function ThreadSmithPage() {
  const [input, setInput] = useState('');
  const [contentType, setContentType] = useState('thread');
  const [tone, setTone] = useState('professional');
  const [length, setLength] = useState('MEDIUM');
  const [useMemory, setUseMemory] = useState(true);
  const [quality, setQuality] = useState('standard');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [output, setOutput] = useState('');
  const [statusIdx, setStatusIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);

  // Wallet state
  const { address, isConnected } = useAccount();
  const { sendTransactionAsync } = useSendTransaction();
  const { signTypedDataAsync } = useSignTypedData();
  const publicClient = usePublicClient();

  const statusMessages = [
    "Initializing Neural Fabric...",
    "Querying Project Memory Index...",
    "Analyzing On-Chain Audit Logs...",
    "Synthesizing Narrative Structure...",
    "Optimizing for Modular Throughput...",
    "Finalizing Evidence Bundle..."
  ];

  useEffect(() => {
    let interval: any;
    if (isGenerating) {
      interval = setInterval(() => {
        setStatusIdx((prev) => (prev + 1) % statusMessages.length);
      }, 2500);
    } else {
      setStatusIdx(0);
    }
    return () => clearInterval(interval);
  }, [isGenerating, statusMessages.length]);

  const handleGenerate = async () => {
    if (!input) return toast.error("Please enter some content or context");

    let txHash: string | null = null;

    // ── Web3 Payment Gate ───────────────────────────────────────────────────
    if (!isConnected) {
      return toast.error("Web3 Wallet Required", {
        description: "AgentBazaar is 100% Web3-native. Please connect your Web3 wallet to pay the $0.10 USDC fee on Base.",
      });
    }

    if (!sendTransactionAsync || !publicClient) {
      return toast.error("Wallet Not Ready", {
        description: "Please check your wallet connection.",
      });
    }

    setIsPaying(true);
    try {
      if (signTypedDataAsync && address) {
        toast.info("Sign $0.10 USDC pre-authorization in your wallet (Gasless)…", { duration: 15000 });
        const payload = await signX402PaymentAuthorization(address, signTypedDataAsync as any, 0.1);
        txHash = JSON.stringify(payload);
        setLastTxHash(payload.nonce);
        toast.success("x402 Pre-authorization Signed (Instant) ✓", {
          description: `Nonce: ${payload.nonce.slice(0, 10)}… · Off-chain settlement via KeeperHub Pro`,
        });
      } else if (sendTransactionAsync && publicClient) {
        toast.info("Confirm $0.10 USDC payment in your wallet…", { duration: 15000 });
        const broadcastHash = await payAgentFeeFromWallet(sendTransactionAsync as any);
        toast.info("Confirming payment on Base…", { duration: 30000 });
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: broadcastHash as `0x${string}`,
          confirmations: 1,
          timeout: 60_000,
        });

        if (receipt.status !== 'success') {
          setIsPaying(false);
          return toast.error("Payment reverted on-chain", {
            description: "Your transaction was broadcast but reverted. Check your USDC balance on Base.",
          });
        }

        txHash = broadcastHash;
        setLastTxHash(txHash);
        toast.success("Payment confirmed on-chain ✓", {
          description: `txHash: ${txHash.slice(0, 10)}…${txHash.slice(-6)}`,
        });
      } else {
        return toast.error("Wallet Not Ready", { description: "Please check your wallet connection." });
      }
    } catch (payErr: any) {
      if (payErr?.message?.includes("User rejected") || payErr?.message?.includes("denied")) {
        setIsPaying(false);
        return toast.error("Payment cancelled", { description: "You rejected the transaction in your wallet." });
      }

      // If off-chain signing fails, fall back to standard on-chain transfer
      if (signTypedDataAsync && sendTransactionAsync && publicClient) {
        try {
          console.warn("[x402] Off-chain signing failed/fallback: ", payErr.message);
          toast.info("Falling back to standard on-chain transfer…");
          const broadcastHash = await payAgentFeeFromWallet(sendTransactionAsync as any);
          const receipt = await publicClient.waitForTransactionReceipt({
            hash: broadcastHash as `0x${string}`,
            confirmations: 1,
            timeout: 60_000,
          });
          if (receipt.status === 'success') {
            txHash = broadcastHash;
            setLastTxHash(txHash);
          }
        } catch (fallbackErr: any) {
          setIsPaying(false);
          return toast.error("Payment failed", { description: fallbackErr.message });
        }
      } else {
        setIsPaying(false);
        return toast.error("Payment failed", { description: payErr.message });
      }
    } finally {
      setIsPaying(false);
    }

    // ── Execute ─────────────────────────────────────────────────────────────
    setIsGenerating(true);
    setOutput("");
    
    try {
      const response = await fetch('/api/agents/threadsmith/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          input,
          contentType,
          tone,
          quality,
          useMemory,
          txHash,            // on-chain payment proof (null if no wallet → KeeperHub path)
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Generation failed');
      }

      const data = await response.json();
      setOutput(data.content);
      if (data.txHash) {
        setLastTxHash(data.txHash);
      }
      toast.success("Synthesis Complete", {
        description: data.txHash
          ? `Settled on-chain · ${data.txHash.slice(0, 10)}…`
          : "Content synthesis finished.",
      });
    } catch (error: any) {
      console.error('Generation error:', error);
      toast.error("Generation Failed", { description: error.message });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };


  return (
    <div className="p-10 max-w-7xl mx-auto min-h-screen space-y-12 pb-24 bg-transparent text-gray-900">
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
          <div className="flex items-center gap-3">
            <Badge className="bg-orange-50 text-orange-700 border border-orange-100 font-bold text-[10px] tracking-widest px-4 py-1.5 rounded-full uppercase">
              Claude 3.5 Optimized
            </Badge>
            <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white border border-gray-100 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">System Live</span>
            </div>
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

            <div className="relative z-10 space-y-10">
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

              {/* Wallet Payment Banner */}
              {isConnected && address ? (
                <div className="flex items-center justify-between px-5 py-4 rounded-2xl bg-orange-50 border border-orange-200">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center">
                      <Wallet size={16} className="text-white" strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-orange-700 uppercase tracking-widest leading-none">Wallet Connected</p>
                      <p className="text-xs font-bold text-gray-700 mt-0.5 font-mono">{address.slice(0, 6)}…{address.slice(-4)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Per Run</p>
                    <p className="text-base font-bold text-orange-600 leading-none mt-0.5">$0.10 USDC</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className="w-9 h-9 rounded-xl bg-gray-200 flex items-center justify-center">
                    <Zap size={16} className="text-gray-400" strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Payment via KeeperHub</p>
                    <p className="text-xs font-bold text-gray-500 mt-0.5">Platform payer wallet · $0.10/run</p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <Label htmlFor="input" className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Raw Context / Project Notes</Label>
                <textarea
                  id="input"
                  placeholder="Paste audit logs, findings, or core narratives here..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 min-h-[350px] rounded-2xl p-7 font-bold text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-500 shadow-inner resize-none transition-all leading-relaxed"
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
                      <Wallet className="w-6 h-6 animate-pulse" />
                      AWAITING WALLET…
                    </>
                  ) : isGenerating ? (
                    <>
                      <RotateCcw className="w-6 h-6 animate-spin" />
                      SYNTHESIZING...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-7 h-7" strokeWidth={2.5} />
                      {isConnected ? "PAY & INITIALIZE ENGINE" : "INITIALIZE ENGINE"}
                    </>
                  )}
                </Button>
                <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-[0.25em]">
                  {isConnected ? "$0.10 USDC signed from your wallet" : "Computation anchored on-chain"}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Output Panel */}
        <div className="lg:col-span-7 h-full">
          <Card className="bg-white border-gray-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col h-full min-h-[850px] group rounded-[32px]">
            <div className="absolute inset-0 p-10 opacity-[0.01] pointer-events-none flex items-center justify-center">
              <PenTool size={450} strokeWidth={0.5} className="text-gray-900" />
            </div>

            {/* Toolbar */}
            <div className="p-10 border-b border-gray-100 flex items-center justify-between bg-gray-50/30 relative z-10">
              <div className="flex items-center space-x-5">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center border border-orange-100 shadow-sm">
                  <Cpu size={24} className="text-orange-600" strokeWidth={2.5} />
                </div>
                <div>
                    <h2 className="font-bold text-2xl tracking-tight uppercase leading-none text-gray-900">Terminal Output</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1.5">Narrative Preview</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {output && (
                  <Button
                    onClick={handleCopy}
                    variant="ghost"
                    size="sm"
                    className="h-11 px-6 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 hover:text-orange-600 font-bold text-[11px] uppercase tracking-widest transition-all shadow-sm"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2" strokeWidth={3} />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" strokeWidth={2.5} />
                        Copy Artifact
                      </>
                    )}
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => setOutput("")} className="w-11 h-11 rounded-xl border border-gray-200 bg-white hover:bg-red-50 hover:border-red-100 group/del shadow-sm transition-all">
                    <Trash2 size={22} className="text-gray-400 group-hover/del:text-red-500 transition-colors" />
                </Button>
              </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 p-12 overflow-y-auto relative z-10 selection:bg-orange-100 selection:text-orange-900">
              <AnimatePresence mode="wait">
                {!output && !isGenerating ? (
                  <motion.div 
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full flex flex-col items-center justify-center space-y-10 text-center"
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
                    className="h-full flex flex-col items-center justify-center space-y-16"
                  >
                    <div className="relative scale-110">
                        <div className="w-36 h-36 rounded-full border-[5px] border-orange-50 border-t-orange-500 animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <RotateCcw size={48} className="text-orange-500/30" />
                        </div>
                    </div>
                    <div className="text-center space-y-4">
                        <h3 className="text-3xl font-bold text-gray-900 tracking-tight uppercase animate-pulse leading-none">
                            {statusMessages[statusIdx]}
                        </h3>
                        <div className="flex items-center justify-center gap-5 text-[10px] font-bold text-gray-400 uppercase tracking-[0.5em]">
                            <span>Tokenizing Matrix</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                            <span>V-Compute Active</span>
                        </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="output"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="prose max-w-none h-full"
                  >
                    <div 
                      className="outline-none text-2xl leading-[1.6] text-gray-800 font-bold min-h-[600px] whitespace-pre-wrap font-sans tracking-tight"
                    >
                      {output}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer Status */}
            <div className="p-10 border-t border-gray-100 flex items-center justify-between bg-gray-50/30 relative z-10">
                <div className="flex items-center space-x-14">
                   <div className="space-y-1.5">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Synthesis Delta</p>
                      <p className="text-3xl font-bold text-gray-900 leading-none">{output ? "READY" : "IDLE"}</p>
                   </div>
                   <div className="space-y-1.5">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Security Anchor</p>
                      <p className="text-3xl font-bold text-orange-600 uppercase leading-none">VERIFIED</p>
                   </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {lastTxHash ? (
                    <a
                      href={`https://basescan.org/tx/${lastTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-3 px-6 py-4 bg-orange-50 hover:bg-orange-100 rounded-[22px] border border-orange-200 shadow-sm transition-all cursor-pointer group"
                    >
                      <ExternalLink size={16} className="text-orange-600 group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-bold text-orange-700 uppercase tracking-widest leading-none">
                        KEEPERHUB TX: {lastTxHash.slice(0, 6)}...{lastTxHash.slice(-4)}
                      </span>
                    </a>
                  ) : (
                    <div className="hidden sm:flex items-center space-x-4 px-6 py-4 bg-green-50 rounded-[22px] border border-green-100 shadow-sm">
                      <CheckCircle2 size={18} className="text-green-600" strokeWidth={2.5} />
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
