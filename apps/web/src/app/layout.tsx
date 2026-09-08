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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function shouldSuppress(err, file, stack) {
                  var str = (err || '') + ' ' + (file || '') + ' ' + (stack || '');
                  return str.indexOf('chrome-extension://') !== -1 ||
                         str.indexOf('M_ID') !== -1 ||
                         str.indexOf('WalletConnect is not initialized') !== -1;
                }
                window.addEventListener('error', function(e) {
                  if (shouldSuppress(e.message, e.filename, e.error && e.error.stack)) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                  }
                }, true);
                window.addEventListener('unhandledrejection', function(e) {
                  var reason = e.reason;
                  var str = reason ? (reason.message || reason.stack || String(reason)) : '';
                  if (shouldSuppress(str, '', '')) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                  }
                }, true);
              })();
            `,
          }}
        />
      </head>
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

