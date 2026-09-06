"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/contexts/AuthContext";

const AgentChat = dynamic(
  () => import("./AgentChat").then((mod) => mod.AgentChat),
  { ssr: false }
);

export function AgentChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check auth: useAuth user, or fallback to cookies/localStorage
  const isLoggedIn =
    !!user ||
    (typeof document !== "undefined" &&
      (document.cookie.includes("accessToken") ||
        document.cookie.includes("auth_token") ||
        localStorage.getItem("agentbazaar-auth") !== null));

  // Don't render anything if not mounted or not logged in
  if (!mounted || !isLoggedIn) return null;

  return (
    <>
      {/* Expanded chat panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] rounded-2xl shadow-2xl">
          <AgentChat />
        </div>
      )}

      {/* Floating chat button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        style={{ backgroundColor: "#F97316" }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#F97316] rounded-full shadow-lg flex items-center justify-center hover:bg-[#e06412] transition-all"
        title="AgentBazaar Chat"
      >
        {isOpen ? (
          // Close icon
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          // Chat icon
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}

        {/* Pulse indicator — shows the chat is AI-powered */}
        {!isOpen && (
          <span className="absolute top-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-[#0A0A0A] animate-pulse" />
        )}
      </button>
    </>
  );
}
