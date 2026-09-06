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
  Zap,
  ArrowRight,
  RefreshCw,
  QrCode
} from "lucide-react";
import { useHashConnect } from "@/context/HashConnectContext";
import { toast } from "sonner";

interface ConnectWalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConnectWalletModal({ open, onOpenChange }: ConnectWalletModalProps) {
  const { accountId, isConnected, setManualAccount } = useHashConnect();
  
  const [pairingCode, setPairingCode] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (open) {
      import("@/lib/hashconnect").then(({ initHashConnect, getPairingString }) => {
        initHashConnect().then((hc) => {
          const code = getPairingString() || hc?.pairingString;
          if (code) setPairingCode(code);
        });
      });
    }
  }, [open]);

  // Auto-close immediately once wallet is detected
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
      toast.info("Triggered HashPack connection request.");
    } catch (err: any) {
      console.error(err);
    } finally {
      setTimeout(() => setConnecting(false), 4000);
    }
  };

  const handleCopyPairingCode = () => {
    if (!pairingCode) {
      // Trigger pairing code generation
      import("@/lib/hashconnect").then(({ connectHashPack }) => {
        connectHashPack().then((code) => {
          if (code) {
            setPairingCode(code);
            navigator.clipboard.writeText(code);
            setCopied(true);
            toast.success("HashPack Pairing code copied! Paste in HashPack > Connect dApp");
            setTimeout(() => setCopied(false), 2500);
          }
        });
      });
      return;
    }
    navigator.clipboard.writeText(pairingCode);
    setCopied(true);
    toast.success("HashPack Pairing code copied! Paste in HashPack > Connect dApp");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = manualInput.trim();
    if (!cleanId || !/^(0\.0\.\d+|0x[a-fA-F0-9]{40})$/.test(cleanId)) {
      toast.error("Please enter a valid Hedera Account ID (e.g. 0.0.1234567)");
      return;
    }
    setManualAccount(cleanId);
    toast.success(`Hedera account ${cleanId} connected!`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6 border-gray-200 shadow-2xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 shadow-xs flex-shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black text-gray-900 uppercase tracking-tight">
                Connect Hedera Wallet
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 font-medium">
                Hedera Testnet · Non-custodial x402
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Method 1: Instant Account ID Connect */}
          <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-200/90 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800 uppercase tracking-wide flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-orange-500" />
                Quick Connect (Account ID)
              </span>
              <span className="text-[10px] font-extrabold text-orange-700 bg-orange-100 border border-orange-200 px-2 py-0.5 rounded-full">
                Instant
              </span>
            </div>
            <p className="text-[11px] text-gray-500">
              Enter your Hedera Testnet Account ID to link your wallet instantly:
            </p>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. 0.0.4812345"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                className="flex-1 px-3.5 py-2.5 text-sm font-mono text-gray-950 font-bold bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 placeholder:text-gray-400 placeholder:font-normal shadow-2xs transition-all"
              />
              <Button 
                type="submit" 
                size="sm"
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs uppercase px-4 shadow-sm"
              >
                Connect
              </Button>
            </form>
          </div>

          {/* Method 2: HashPack Extension / Pairing Code */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-orange-500 text-white font-black text-xs flex items-center justify-center">
                  Ħ
                </div>
                <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                  HashPack Extension / App
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              {/* Trigger extension */}
              <button
                type="button"
                onClick={handleLaunchHashPack}
                disabled={connecting}
                className="flex-1 py-2.5 px-3 rounded-xl bg-white border border-gray-200 hover:border-orange-300 hover:bg-orange-50/50 text-gray-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                {connecting ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-500" /> : <ArrowRight className="w-3.5 h-3.5 text-orange-500" />}
                Launch Prompt
              </button>

              {/* Copy pairing string */}
              <button
                type="button"
                onClick={handleCopyPairingCode}
                className="flex-1 py-2.5 px-3 rounded-xl bg-white border border-gray-200 hover:border-orange-300 hover:bg-orange-50/50 text-gray-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-orange-500" />}
                {copied ? "Copied!" : "Copy Pairing Code"}
              </button>
            </div>

            <p className="text-[11px] text-gray-500 leading-snug">
              Tip: Click <strong>&quot;Launch Prompt&quot;</strong> to open the official WalletConnect modal, or enter your <strong>Account ID</strong> above for instant connection.
            </p>
          </div>

          {/* Footer note */}
          <div className="flex items-center justify-between pt-1 text-[11px] text-gray-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Non-custodial x402
            </span>
            <a
              href="https://portal.hedera.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 hover:underline flex items-center gap-0.5 font-semibold"
            >
              Get Free Testnet Account <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
