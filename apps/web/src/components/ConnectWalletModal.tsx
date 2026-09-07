"use client";

import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Wallet, 
  ExternalLink, 
  ShieldCheck, 
  RefreshCw,
  Zap,
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { useWallet } from "@buidlerlabs/hashgraph-react-wallets";
import {
  HashpackConnector,
  KabilaConnector,
  BladeConnector,
  HWCConnector,
} from "@buidlerlabs/hashgraph-react-wallets/connectors";
import { toast } from "sonner";

interface ConnectWalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConnectWalletModal({ open, onOpenChange }: ConnectWalletModalProps) {
  const hashpackSession = useWallet(HashpackConnector);
  const kabilaSession = useWallet(KabilaConnector);
  const bladeSession = useWallet(BladeConnector);
  const hwcSession = useWallet(HWCConnector);
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);

  // Trigger extension detection query whenever modal opens
  useEffect(() => {
    if (open && typeof window !== "undefined") {
      window.postMessage({ type: "hedera-extension-query" }, "*");
      window.postMessage({ type: "hashconnect-query-extension" }, "*");
    }
  }, [open]);

  const handleConnectHashPack = async () => {
    setConnectingWallet("hashpack");
    try {
      if (typeof window !== "undefined") {
        window.postMessage({ type: "hedera-extension-query" }, "*");
        window.postMessage({ type: "hashconnect-query-extension" }, "*");
      }
      await new Promise((r) => setTimeout(r, 150));
      await hashpackSession.connect();
      toast.success("Connected to HashPack wallet on Hedera Testnet!");
      onOpenChange(false);
    } catch (err: any) {
      console.warn("[HashPack] Extension connect error:", err);
      toast.error(
        "Could not connect HashPack extension. Please make sure HashPack is unlocked and on Testnet, or use the 'WalletConnect / QR Code' button below.",
        { duration: 6000 }
      );
    } finally {
      setConnectingWallet(null);
    }
  };

  const handleConnectHWC = async () => {
    setConnectingWallet("hwc");
    try {
      await hwcSession.connect();
      toast.success("Connected to Hedera wallet!");
      onOpenChange(false);
    } catch (err: any) {
      console.error("[WalletConnect] connect error:", err);
      toast.error(err?.message || "WalletConnect pairing was closed or rejected");
    } finally {
      setConnectingWallet(null);
    }
  };

  const handleConnectKabila = async () => {
    setConnectingWallet("kabila");
    try {
      await kabilaSession.connect();
      toast.success("Connected to Kabila wallet on Hedera Testnet!");
      onOpenChange(false);
    } catch (err: any) {
      console.error("[Kabila] connect error:", err);
      toast.error(err?.message || "Failed to connect Kabila wallet");
    } finally {
      setConnectingWallet(null);
    }
  };

  const handleConnectBlade = async () => {
    setConnectingWallet("blade");
    try {
      await bladeSession.connect();
      toast.success("Connected to Blade wallet on Hedera Testnet!");
      onOpenChange(false);
    } catch (err: any) {
      console.error("[Blade] connect error:", err);
      toast.error(err?.message || "Failed to connect Blade wallet");
    } finally {
      setConnectingWallet(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6 border-gray-200 shadow-2xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600 shadow-xs flex-shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black text-gray-900 uppercase tracking-tight">
                Connect Hedera Wallet
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 font-medium">
                Hedera Testnet · Native HIP-820 & WalletConnect
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Network guidance banner */}
        <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="leading-snug">
            <span className="font-bold">Important:</span> Ensure your HashPack wallet is switched to <span className="font-bold underline">Testnet</span> (in HashPack top network selector) to pair with AgentBazaar.
          </div>
        </div>

        <div className="space-y-3 pt-1">
          {/* HashPack Wallet Option */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50/80 to-indigo-50/60 border border-purple-200/80 hover:border-purple-300 transition-all flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-md flex-shrink-0">
                ℏ
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  HashPack
                  {hashpackSession.isConnected && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded-full font-bold">
                      Connected
                    </span>
                  )}
                </h3>
                <p className="text-xs text-gray-500">
                  Hedera native browser extension & mobile app
                </p>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleConnectHashPack}
              disabled={connectingWallet !== null}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-sm transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
            >
              {connectingWallet === "hashpack" ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : hashpackSession.isConnected ? (
                "Active"
              ) : (
                <>
                  Connect <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </Button>
          </div>

          {/* WalletConnect (QR Code & Universal) Option */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 to-indigo-50/60 border border-blue-200/80 hover:border-blue-300 transition-all flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-700 text-white font-black text-lg flex items-center justify-center shadow-md flex-shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  WalletConnect / QR Code
                  {hwcSession.isConnected && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded-full font-bold">
                      Connected
                    </span>
                  )}
                </h3>
                <p className="text-xs text-gray-500">
                  Scan QR code with HashPack Mobile or any Hedera wallet
                </p>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleConnectHWC}
              disabled={connectingWallet !== null}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-sm transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
            >
              {connectingWallet === "hwc" ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : hwcSession.isConnected ? (
                "Active"
              ) : (
                <>
                  Scan QR <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </Button>
          </div>

          {/* Kabila Wallet Option */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-50/80 to-blue-50/60 border border-cyan-200/80 hover:border-cyan-300 transition-all flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white font-black text-lg flex items-center justify-center shadow-md flex-shrink-0">
                K
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  Kabila Wallet
                  {kabilaSession.isConnected && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded-full font-bold">
                      Connected
                    </span>
                  )}
                </h3>
                <p className="text-xs text-gray-500">
                  Web3 multi-chain & Hedera ecosystem wallet
                </p>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleConnectKabila}
              disabled={connectingWallet !== null}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-sm transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
            >
              {connectingWallet === "kabila" ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : kabilaSession.isConnected ? (
                "Active"
              ) : (
                <>
                  Connect <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </Button>
          </div>

          {/* Blade Wallet Option */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/80 to-teal-50/60 border border-emerald-200/80 hover:border-emerald-300 transition-all flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white font-black text-lg flex items-center justify-center shadow-md flex-shrink-0">
                ⚔
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  Blade Wallet
                  {bladeSession.isConnected && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded-full font-bold">
                      Connected
                    </span>
                  )}
                </h3>
                <p className="text-xs text-gray-500">
                  Fast & secure Hedera ecosystem wallet
                </p>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleConnectBlade}
              disabled={connectingWallet !== null}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-sm transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
            >
              {connectingWallet === "blade" ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : bladeSession.isConnected ? (
                "Active"
              ) : (
                <>
                  Connect <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </Button>
          </div>

          {/* Network Info & Security */}
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1 text-[11px] text-gray-600 mt-2">
            <div className="flex items-center justify-between font-semibold">
              <span className="text-gray-500">Target Network:</span>
              <span className="text-purple-600 font-mono">Hedera Testnet (0.0.x)</span>
            </div>
            <div className="flex items-center justify-between font-semibold">
              <span className="text-gray-500">Protocol:</span>
              <span className="text-gray-800 font-mono">Blocky402 x402 Exact Scheme</span>
            </div>
          </div>

          {/* Footer note */}
          <div className="flex items-center justify-between pt-1 text-[11px] text-gray-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Non-custodial native signing
            </span>
            <a
              href="https://www.hashpack.app/download"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:underline flex items-center gap-0.5 font-semibold"
            >
              Get HashPack <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
