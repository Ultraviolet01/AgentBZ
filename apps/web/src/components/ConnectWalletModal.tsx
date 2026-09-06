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
  const { accountId, isConnected } = useHashConnect();
  
  const [pairingCode, setPairingCode] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [loadingUri, setLoadingUri] = useState(false);

  useEffect(() => {
    let active = true;
    if (open) {
      setLoadingUri(true);
      import("@/lib/hashconnect").then(async ({ getPairingUri }) => {
        try {
          const uri = await getPairingUri();
          if (active && uri) {
            setPairingCode(uri);
          }
        } catch (e) {
          console.warn("Error fetching pairing URI:", e);
        } finally {
          if (active) setLoadingUri(false);
        }
      });
    }
    return () => {
      active = false;
    };
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
      const { connectHashPack, getPairingUri } = await import("@/lib/hashconnect");
      const code = await connectHashPack();
      if (code) setPairingCode(code);
      toast.info("WalletConnect QR modal opened.");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to open WalletConnect modal.");
    } finally {
      setTimeout(() => setConnecting(false), 3000);
    }
  };

  const handleCopyPairingCode = async () => {
    let code: string | null = pairingCode || null;
    if (!code) {
      const toastId = toast.loading("Connecting to WalletConnect relay...");
      try {
        const { getPairingUri } = await import("@/lib/hashconnect");
        code = await getPairingUri();
        if (code) {
          setPairingCode(code);
          await navigator.clipboard.writeText(code);
          setCopied(true);
          toast.success(`Copied pairing URI (${code.slice(0, 16)}...)`, { id: toastId });
          setTimeout(() => setCopied(false), 3000);
        } else {
          toast.error("Pairing URI is taking longer than expected. Please use the QR Modal above.", { id: toastId });
        }
      } catch (err: any) {
        console.error(err);
        toast.error("Failed to copy pairing URI.", { id: toastId });
      }
    } else {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success(`Copied pairing URI (${code.slice(0, 16)}...)`);
      setTimeout(() => setCopied(false), 3000);
    }
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
                Hedera Testnet · HashPack & WalletConnect (HIP-820)
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Method 1: QR Modal */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100/50 border border-orange-200 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500 text-white font-black text-base flex items-center justify-center shadow-sm flex-shrink-0">
                Ħ
              </div>
              <div className="text-left">
                <h3 className="text-sm font-bold text-gray-900">HashPack (QR Modal)</h3>
                <p className="text-xs text-gray-600">
                  Scan the WalletConnect QR code with HashPack Mobile.
                </p>
              </div>
            </div>

            <Button
              type="button"
              onClick={() => {
                onOpenChange(false);
                handleLaunchHashPack();
              }}
              disabled={connecting}
              className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs uppercase shadow-sm flex items-center justify-center gap-2"
            >
              {connecting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Opening Modal...
                </>
              ) : (
                <>
                  <QrCode className="w-4 h-4" />
                  Launch QR Code Modal
                </>
              )}
            </Button>
          </div>

          {/* Method 2: Direct Pairing URI Copy for Desktop Extension */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                <Copy className="w-3.5 h-3.5 text-orange-500" />
                Pairing URI (Desktop / Extension)
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyPairingCode}
                className="h-7 px-2.5 text-[11px] font-bold rounded-lg border-gray-300 hover:bg-white text-gray-700 cursor-pointer"
              >
                {copied ? (
                  <span className="flex items-center gap-1 text-emerald-600">
                    <Check className="w-3 h-3" /> Copied!
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Copy className="w-3 h-3" /> Copy URI
                  </span>
                )}
              </Button>
            </div>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Open HashPack Extension $\rightarrow$ <strong>Settings / Connect dApp</strong> $\rightarrow$ <strong>WalletConnect</strong> $\rightarrow$ paste the <code className="bg-gray-200 text-gray-800 px-1 py-0.5 rounded font-mono text-[10px]">wc:...</code> string.
            </p>
            {pairingCode ? (
              <div 
                onClick={handleCopyPairingCode}
                className="p-2.5 bg-white border border-gray-200 rounded-xl text-[10px] font-mono text-gray-700 break-all cursor-pointer hover:border-orange-300 transition-colors"
                title="Click to copy pairing URI"
              >
                {pairingCode}
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyPairingCode}
                className="w-full py-2 bg-white hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-xl border border-gray-300 flex items-center justify-center gap-2"
              >
                <Copy className="w-3.5 h-3.5 text-orange-500" />
                Click to Generate & Copy URI
              </Button>
            )}
          </div>

          {/* Footer note */}
          <div className="flex items-center justify-between pt-1 text-[11px] text-gray-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Non-custodial x402
            </span>
            <a
              href="https://www.hashpack.app/download"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 hover:underline flex items-center gap-0.5 font-semibold"
            >
              Install HashPack <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
