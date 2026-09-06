"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/contexts/AuthContext";
import { MessageSquare, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const AgentChat = dynamic(
  () => import("./AgentChat").then((mod) => mod.AgentChat),
  { ssr: false }
);

export function AgentChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
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
      {/* Floating / Enlarged chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              transition: { type: "spring", stiffness: 380, damping: 30 },
            }}
            exit={{ opacity: 0, scale: 0.94, y: 16, transition: { duration: 0.15 } }}
            className={`fixed z-50 transition-all duration-300 ease-out shadow-2xl rounded-2xl overflow-hidden border border-gray-200/80 bg-white ${
              isExpanded
                ? "inset-3 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[860px] sm:max-w-[calc(100vw-3rem)] sm:h-[84vh] sm:max-h-[840px]"
                : "bottom-20 right-6 w-[410px] max-w-[calc(100vw-2.5rem)] h-[580px] max-h-[calc(100vh-6.5rem)]"
            }`}
          >
            <AgentChat
              isExpanded={isExpanded}
              onToggleExpand={() => setIsExpanded((prev) => !prev)}
              onClose={() => setIsOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating chat toggle button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen((prev) => !prev)}
        style={{ backgroundColor: "#F97316" }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#F97316] text-white rounded-full shadow-lg shadow-orange-500/25 flex items-center justify-center hover:bg-[#e06412] transition-colors focus:outline-none"
        title="AgentBazaar AI Assistant"
        aria-label="Toggle AgentBazaar AI Assistant"
      >
        <AnimatePresence mode="wait" initial={false}>
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-6 h-6 stroke-[2.5]" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="relative"
            >
              <MessageSquare className="w-6 h-6 stroke-[2.2]" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#F97316] animate-pulse" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}
