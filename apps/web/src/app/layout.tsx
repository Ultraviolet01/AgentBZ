import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { Web3Provider } from "@/components/Web3Provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AgentBazaar | 0G Network",
  description: "The decentralized agent marketplace powered by 0G Network",
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
          <Web3Provider>
            <div className="flex flex-col lg:flex-row h-screen bg-gray-50 overflow-hidden">
              <Sidebar />
              <main className="flex-1 overflow-y-auto bg-gray-50 custom-scrollbar">
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
          </Web3Provider>
        </AuthProvider>
      </body>
    </html>
  );
}
