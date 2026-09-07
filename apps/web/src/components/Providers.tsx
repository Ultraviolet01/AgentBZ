"use client";

import { ReactNode } from "react";
import dynamic from "next/dynamic";
import { AuthProvider } from "@/contexts/AuthContext";

const HederaProviders = dynamic(() => import("./HederaProviders"), {
  ssr: false,
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <HederaProviders>{children}</HederaProviders>
    </AuthProvider>
  );
}
