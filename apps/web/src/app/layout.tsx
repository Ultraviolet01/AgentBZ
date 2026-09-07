import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { Providers } from "@/components/Providers";
import { Toaster } from "sonner";
import { AgentChatWidget } from "@/components/AgentChatWidget";

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
      <body className="font-sans antialiased">

        <Providers>
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
          <AgentChatWidget />
        </Providers>
      </body>
    </html>
  );
}

