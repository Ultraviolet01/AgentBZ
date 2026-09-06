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
  RefreshCw,
  Zap,
  ChevronDown,
  ChevronUp
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
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    if (open) {
      // Fetch pairing code & ensure HashConnect is ready
      import("@/lib/hashconnect").then(({ initHashConnect, getPairingString }) => {
        initHashConnect().then(() => {
          const code = getPairingString();
          if (code) setPairingCode(code);
        });
      });
    }
  }, [open]);

  // Auto-close immediately once wallet is automatically detected
  useEffect(() => {
    if (isConnected && accountId && open) {
      toast.success(`Connected to Hedera wallet ${accountId}`);
      onOpenChange(false);
      setConnecting(false);
    }
  }, [isConnected, accountId, open, onOpenChange]);

  const handleLaunchHashPack = async () => {
    setConnecting(true);
    try {
      const { connectHashPack, getPairingString } = await import("@/lib/hashconnect");
      const code = await connectHashPack();
      if (code) setPairingCode(code);
      toast.info("Prompting HashPack. Please approve the connection request in HashPack!");
    } catch (err: any) {
      console.error(err);
      toast.error("Could not trigger extension popup. Check if HashPack is installed.");
    } finally {
      // keep connecting spinner active for a few seconds while user interacts with popup
      setTimeout(() => setConnecting(false), 8000);
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
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 shadow-xs flex-shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black text-gray-900 uppercase tracking-tight">
                Connect Hedera Wallet
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 font-medium">
                Automatic 1-click detection via HashPack extension
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-3">
          {/* Primary Action: 1-Click Auto Detection with HashPack */}
          <div className="relative group">
            <button
              onClick={handleLaunchHashPack}
              disabled={connecting}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20 hover:from-orange-600 hover:to-amber-600 transition-all text-left group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-white font-black text-xl border border-white/30 shadow-xs">
                  Ħ
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-white tracking-wide">
                      HashPack Extension
                    </p>
                    <span className="text-[10px] font-extrabold uppercase bg-white text-orange-600 px-1.5 py-0.2 rounded">
                      Auto-Detect
                    </span>
                  </div>
                  <p className="text-xs text-orange-100 font-medium">
                    {connecting ? "Waiting for approval in HashPack..." : "1-click automatic connect (No typing needed)"}
                  </p>
                </div>
              </div>
              <div className="p-2 rounded-xl bg-white/20 text-white group-hover:translate-x-1 transition-transform border border-white/20">
                {connecting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
              </div>
            </button>
          </div>

          <div className="flex items-center gap-2 px-1 text-xs text-gray-500 font-medium">
            <Zap className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            <span>Clicking above automatically fetches your Hedera Account ID from HashPack.</span>
          </div>

          {/* Optional Fallback Dropdown */}
          <div className="border-t border-gray-100 pt-3">
            <button
              type="button"
              onClick={() => setShowManual(!showManual)}
              className="w-full flex items-center justify-between py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
            >
              <span>Manual or Mobile Connection Options</span>
              {showManual ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showManual && (
              <div className="space-y-3 mt-3 pt-2">
                {/* Manual Account ID Input */}
                <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">
                      Manual Account ID (Testing Fallback)
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      Testnet
                    </span>
                  </div>
                  <form onSubmit={handleManualSubmit} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="0.0.4812345"
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs font-mono bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                    />
                    <Button 
                      type="submit" 
                      size="sm"
                      className="bg-gray-900 hover:bg-black text-white font-bold rounded-xl text-xs uppercase px-3"
                    >
                      Connect
                    </Button>
                  </form>
                </div>

                {/* Pairing Code for Mobile */}
                {pairingCode && (
                  <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200/70 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        HashPack Pairing String (Mobile App)
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyPairingCode}
                        className="flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:text-orange-700"
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-gray-200 font-mono text-[10px] text-gray-600 truncate select-all">
                      {pairingCode}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[11px] text-gray-500">
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
