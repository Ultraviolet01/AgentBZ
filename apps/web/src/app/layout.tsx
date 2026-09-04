import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { AuthProvider } from "@/contexts/AuthContext";
import { HashConnectProvider } from "@/context/HashConnectContext";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AgentBazaar | AI Agent Marketplace",
  description: "The decentralized AI agent marketplace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body className={inter.className}>
        <AuthProvider>
          <HashConnectProvider>
            <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-gray-50">
              <Sidebar />
              <main className="flex-1 overflow-y-auto custom-scrollbar">
                {children}
              </main>
            </div>
            <Toaster 
              theme="light" 
              position="bottom-right" 
              toastOptions={{
                className: "bg-white border-gray-200 text-gray-900 rounded-2xl shadow-lg",
              }} 
            />
          </HashConnectProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
