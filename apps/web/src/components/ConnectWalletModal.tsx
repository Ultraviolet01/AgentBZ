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
  Copy, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles,
  ArrowRight,
  RefreshCw
} from "lucide-react";
import { useHashConnect } from "@/context/HashConnectContext";
import { toast } from "sonner";

interface ConnectWalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConnectWalletModal({ open, onOpenChange }: ConnectWalletModalProps) {
  const { accountId, isConnected, connect, setManualAccount } = useHashConnect();
  
  const [pairingCode, setPairingCode] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [mode, setMode] = useState<"options" | "manual" | "pairing">("options");

  useEffect(() => {
    if (open) {
      // Fetch pairing code
      import("@/lib/hashconnect").then(({ initHashConnect, getPairingString }) => {
        initHashConnect().then(() => {
          const code = getPairingString();
          if (code) setPairingCode(code);
        });
      });
    }
  }, [open]);

  // Auto-close on successful connection
  useEffect(() => {
    if (isConnected && accountId && open) {
      toast.success(`Connected to Hedera wallet ${accountId}`);
      onOpenChange(false);
    }
  }, [isConnected, accountId, open, onOpenChange]);

  const handleLaunchHashPack = async () => {
    setConnecting(true);
    try {
      const { connectHashPack, getPairingString } = await import("@/lib/hashconnect");
      const code = await connectHashPack();
      if (code) setPairingCode(code);
      toast.info("Prompted HashPack wallet. Check your extension or browser popups!");
    } catch (err: any) {
      console.error(err);
      toast.error("Could not trigger extension popup. Try pairing code below.");
    } finally {
      setConnecting(false);
    }
  };

  const handleCopyPairingCode = () => {
    if (!pairingCode) return;
    navigator.clipboard.writeText(pairingCode);
    setCopied(true);
    toast.success("Pairing code copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = manualInput.trim();
    if (!cleanId || !/^(0\.0\.\d+|0x[a-fA-F0-9]{40})$/.test(cleanId)) {
      toast.error("Please enter a valid Hedera Account ID (e.g. 0.0.1234567)");
      return;
    }
    setManualAccount(cleanId);
    toast.success(`Hedera account ${cleanId} linked successfully!`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6 border-gray-200 shadow-2xl">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 shadow-xs">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black text-gray-900 uppercase tracking-tight">
                Connect Hedera Wallet
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 font-medium">
                Pay per agent request via Hedera x402 on Testnet.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-3">
          {/* Main Option: 1-Click HashPack Extension Prompt */}
          <button
            onClick={handleLaunchHashPack}
            disabled={connecting}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-orange-50/70 border border-orange-200/80 hover:bg-orange-100/60 hover:border-orange-300 transition-all text-left group shadow-xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white font-black text-lg shadow-sm">
                Ħ
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 group-hover:text-orange-700 transition-colors">
                  HashPack Browser Extension
                </p>
                <p className="text-[11px] text-gray-500">
                  Click to launch popup or approve session
                </p>
              </div>
            </div>
            <div className="p-2 rounded-xl bg-white border border-orange-100 text-orange-600 group-hover:translate-x-1 transition-transform">
              {connecting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
            </div>
          </button>

          {/* Option 2: Quick Account ID Input (Instant Testnet Connection) */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                Quick Connect Account ID
              </span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                Testnet
              </span>
            </div>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. 0.0.4812345"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                className="flex-1 px-3.5 py-2 text-xs font-mono bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
              />
              <Button 
                type="submit" 
                size="sm"
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs uppercase px-4"
              >
                Connect
              </Button>
            </form>
          </div>

          {/* Option 3: Manual Pairing Code / Web Wallet */}
          {pairingCode && (
            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/70 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Pairing String (Mobile / Web)
                </span>
                <button
                  type="button"
                  onClick={handleCopyPairingCode}
                  className="flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:text-orange-700"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied" : "Copy Code"}
                </button>
              </div>
              <div className="p-2 bg-white rounded-lg border border-gray-200 font-mono text-[10px] text-gray-600 truncate select-all">
                {pairingCode}
              </div>
            </div>
          )}

          {/* Footer note */}
          <div className="flex items-center justify-between pt-2 text-[11px] text-gray-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Non-custodial x402
            </span>
            <a
              href="https://www.hashpack.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 hover:underline flex items-center gap-0.5 font-semibold"
            >
              Get HashPack <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
