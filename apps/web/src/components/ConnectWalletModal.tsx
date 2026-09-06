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
  CheckCircle2
} from "lucide-react";
import { useHashConnect } from "@/context/HashConnectContext";
import { connectMetaMask, isMetaMaskInstalled } from "@/lib/metamask";
import { toast } from "sonner";

interface ConnectWalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConnectWalletModal({ open, onOpenChange }: ConnectWalletModalProps) {
  const { accountId, isConnected } = useHashConnect();
  const [connecting, setConnecting] = useState(false);

  const handleConnectMetaMask = async () => {
    if (!isMetaMaskInstalled()) {
      toast.error("MetaMask is not installed in your browser.");
      window.open("https://metamask.io/download/", "_blank");
      return;
    }

    setConnecting(true);
    try {
      const account = await connectMetaMask();
      if (account) {
        toast.success(`Connected MetaMask account (${account.slice(0, 6)}...${account.slice(-4)}) on Hedera Testnet!`);
        onOpenChange(false);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to connect MetaMask");
    } finally {
      setConnecting(false);
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
                Connect Wallet
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 font-medium">
                Hedera Testnet · EVM Chain ID 296
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* MetaMask Connect Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-orange-50 via-amber-50/40 to-orange-100/50 border border-orange-200/80 space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white font-black text-2xl flex items-center justify-center mx-auto shadow-md">
              🦊
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">MetaMask</h3>
              <p className="text-xs text-gray-600 mt-1 max-w-xs mx-auto">
                Connect your MetaMask wallet. The app will automatically configure the <strong>Hedera Testnet (Chain ID 296)</strong> RPC.
              </p>
            </div>

            <Button
              type="button"
              onClick={handleConnectMetaMask}
              disabled={connecting}
              className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              {connecting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Connecting to MetaMask...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-white" />
                  Connect with MetaMask
                </>
              )}
            </Button>
          </div>

          {/* Network Info & Security */}
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1 text-[11px] text-gray-600">
            <div className="flex items-center justify-between font-semibold">
              <span className="text-gray-500">Target Network:</span>
              <span className="text-orange-600 font-mono">Hedera Testnet (296)</span>
            </div>
            <div className="flex items-center justify-between font-semibold">
              <span className="text-gray-500">RPC Relay:</span>
              <span className="text-gray-800 font-mono">https://testnet.hashio.io/api</span>
            </div>
          </div>

          {/* Footer note */}
          <div className="flex items-center justify-between pt-1 text-[11px] text-gray-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Non-custodial x402 Micropayments
            </span>
            <a
              href="https://metamask.io/download/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 hover:underline flex items-center gap-0.5 font-semibold"
            >
              Get MetaMask <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

