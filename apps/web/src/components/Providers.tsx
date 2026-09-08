"use client";

import { ReactNode, useEffect } from "react";
import dynamic from "next/dynamic";
import { AuthProvider } from "@/contexts/AuthContext";

const HederaProviders = dynamic(() => import("./HederaProviders"), {
  ssr: false,
});

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleGlobalError = (event: ErrorEvent) => {
      const errorMsg = event?.message || "";
      const filename = event?.filename || "";
      const stack = event?.error?.stack || "";
      if (
        filename.includes("chrome-extension://") ||
        stack.includes("chrome-extension://") ||
        errorMsg.includes("M_ID") ||
        errorMsg.includes("WalletConnect is not initialized")
      ) {
        event.stopImmediatePropagation();
        event.preventDefault();
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event?.reason;
      const reasonStr = typeof reason === "string" ? reason : reason?.message || reason?.stack || "";
      if (
        reasonStr.includes("chrome-extension://") ||
        reasonStr.includes("M_ID") ||
        reasonStr.includes("WalletConnect is not initialized")
      ) {
        event.stopImmediatePropagation();
        event.preventDefault();
      }
    };

    window.addEventListener("error", handleGlobalError, true);
    window.addEventListener("unhandledrejection", handleUnhandledRejection, true);

    return () => {
      window.removeEventListener("error", handleGlobalError, true);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection, true);
    };
  }, []);

  return (
    <AuthProvider>
      <HederaProviders>{children}</HederaProviders>
    </AuthProvider>
  );
}
