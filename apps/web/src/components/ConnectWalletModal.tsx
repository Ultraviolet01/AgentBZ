"use client";

import { useState } from "react";
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
  ArrowRight
} from "lucide-react";
import { useWallet } from "@buidlerlabs/hashgraph-react-wallets";
import { HashpackConnector, KabilaConnector } from "@buidlerlabs/hashgraph-react-wallets/connectors";
import { toast } from "sonner";

interface ConnectWalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConnectWalletModal({ open, onOpenChange }: ConnectWalletModalProps) {
  const hashpackSession = useWallet(HashpackConnector);
  const kabilaSession = useWallet(KabilaConnector);
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);

  const handleConnectHashPack = async () => {
    setConnectingWallet("hashpack");
    try {
      await hashpackSession.connect();
      toast.success("Connected to HashPack wallet on Hedera Testnet!");
      onOpenChange(false);
    } catch (err: any) {
      console.error("[HashPack] connect error:", err);
      toast.error(err?.message || "Failed to connect HashPack wallet");
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

        <div className="space-y-3 pt-3">
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
                  Hedera native browser extension & mobile wallet
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

          {/* Kabila Wallet Option */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 to-cyan-50/60 border border-blue-200/80 hover:border-blue-300 transition-all flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-600 text-white font-black text-lg flex items-center justify-center shadow-md flex-shrink-0">
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
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-sm transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
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
