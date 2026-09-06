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
                Hedera Testnet · HashPack & WalletConnect
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* HashPack WalletConnect Button */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100/50 border border-orange-200 space-y-3 text-center">
            <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white font-black text-lg flex items-center justify-center mx-auto shadow-md">
              Ħ
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">HashPack Wallet</h3>
              <p className="text-xs text-gray-600 mt-0.5">
                Click below to launch the official WalletConnect QR modal and scan with HashPack.
              </p>
            </div>

            <Button
              type="button"
              onClick={() => {
                onOpenChange(false);
                handleLaunchHashPack();
              }}
              disabled={connecting}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs uppercase shadow-sm flex items-center justify-center gap-2"
            >
              {connecting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Opening WalletConnect...
                </>
              ) : (
                <>
                  <QrCode className="w-4 h-4" />
                  Connect with HashPack (QR Code)
                </>
              )}
            </Button>
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
