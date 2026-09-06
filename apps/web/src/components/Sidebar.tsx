"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutGrid, 
  Cpu, 
  FolderOpen, 
  UserRound, 
  Settings, 
  LogOut, 
  Network, 
  Rocket, 
  Menu, 
  X, 
  LayoutDashboard,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";

const HashPackButton = dynamic(
  () => import("./HashPackButton").then((mod) => mod.HashPackButton),
  { ssr: false }
);

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Pages that never show the sidebar regardless of auth state
  const noSidebarPages = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
  ];
  const isNoSidebarPage = noSidebarPages.some((p) => pathname.startsWith(p));
  if (isNoSidebarPage) return null;

  // Root path ("/") — sidebar only when user is authenticated and onboarded.
  const isLandingPage = pathname === '/';
  if (isLandingPage && !user) return null;

  // While auth is still resolving, don't flash the sidebar
  if (isLoading) return null;

  // For all other app pages, require authentication
  if (!user) return null;

  const navItems = [
    { 
      label: 'Marketplace', 
      href: '/', 
      icon: LayoutGrid,
    },
    { 
      label: 'Agents', 
      href: '/agents', 
      icon: Cpu,
    },
    { 
      label: 'My Projects', 
      href: '/projects', 
      icon: FolderOpen,
    },
    { 
      label: 'Deploy Agent', 
      href: '/deploy', 
      icon: Rocket,
    },
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    }
  ];

  const accountItems = [
    { label: 'Profile', href: '/profile', icon: UserRound },
    { label: 'Settings', href: '/settings', icon: Settings }
  ];

  const renderNavGroup = (items: typeof navItems, groupTitle: string) => (
    <div className="space-y-1">
      <span className="text-[10px] font-bold text-gray-400 uppercase px-3 mb-2 block tracking-[0.2em] opacity-80 select-none">
        {groupTitle}
      </span>
      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const isHovered = hoveredTab === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onMouseEnter={() => setHoveredTab(item.href)}
              onMouseLeave={() => setHoveredTab(null)}
              className="relative block"
            >
              <motion.div
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={cn(
                  "relative z-10 flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-colors duration-200",
                  isActive ? "text-orange-600 font-bold" : "text-gray-600 hover:text-gray-900"
                )}
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ scale: isActive ? 1.08 : 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <Icon 
                      className={cn("w-4 h-4 transition-colors", isActive ? "text-orange-600" : "text-gray-400")} 
                      strokeWidth={isActive ? 2.5 : 2} 
                    />
                  </motion.div>
                  <span className="text-sm tracking-tight">{item.label}</span>
                </div>

                {isActive && (
                  <motion.span 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]"
                  />
                )}
              </motion.div>

              {/* Sliding Active Pill */}
              {isActive && (
                <motion.div
                  layoutId="sidebarActivePill"
                  className="absolute inset-0 bg-gradient-to-r from-orange-50/90 to-orange-100/40 border border-orange-200/60 rounded-xl z-0 shadow-sm"
                  transition={{
                    type: "spring",
                    stiffness: 350,
                    damping: 30
                  }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white">
      {/* Logo */}
      <div className="p-6 pt-7 border-b border-gray-100 flex items-center justify-between mb-3">
        <Link href="/" className="flex items-center gap-2.5 group">
          <motion.div 
            whileHover={{ rotate: 8, scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-md shadow-orange-500/20"
          >
             <Network className="w-5 h-5 text-white" strokeWidth={2.5} />
          </motion.div>
          <div>
            <h1 className="text-lg font-black text-gray-900 leading-none uppercase tracking-tighter group-hover:text-orange-600 transition-colors">
              AgentBazaar
            </h1>
            <p className="text-[9px] font-black text-orange-600 tracking-[0.2em] uppercase mt-1">
              AI MARKETPLACE
            </p>
          </div>
        </Link>
        <button 
          onClick={() => setIsMobileMenuOpen(false)}
          className="lg:hidden p-2 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-2 space-y-5 overflow-y-auto custom-scrollbar">
        {renderNavGroup(navItems, "Global Console")}
        {renderNavGroup(accountItems, "Management")}
      </nav>

      {/* Bottom - User Profile & Live Indicator */}
      <div className="p-4 border-t border-gray-100 mt-auto bg-gray-50/50">
        {(user || pathname === '/onboarding') ? (
          <div className="space-y-3 mb-3">
            <div className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-white transition-colors">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                {(user?.username || 'U')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-900 truncate">
                  {user?.username || 'New User'}
                </p>
                <p className="text-[10px] text-gray-400 font-medium truncate">Hedera Testnet</p>
              </div>
            </div>
            <Button 
              variant="secondary"
              onClick={signOut}
              className="w-full h-8 text-[10px] font-bold uppercase tracking-widest bg-white border border-gray-200/80 hover:bg-gray-100 rounded-xl text-gray-600 hover:text-gray-900 transition-all shadow-2xs"
            >
              <LogOut className="w-3 h-3 mr-2" strokeWidth={2.5} />
              Sign Out
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Button asChild variant="secondary" className="h-8 rounded-xl text-[10px] font-bold border-gray-200 hover:bg-white text-gray-900 uppercase tracking-tight shadow-xs">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild variant="primary" className="h-8 rounded-xl text-[10px] font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-sm uppercase tracking-tight">
              <Link href="/register">Join</Link>
            </Button>
          </div>
        )}
        
        <div className="flex items-center justify-between px-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] text-gray-500 font-semibold tracking-tight">System Live</span>
          </div>
          <span className="text-[9px] font-mono font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">v2.4</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Header */}
      <header className="lg:hidden h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 z-30 w-full">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center shadow-sm">
             <Network className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-black text-gray-900 uppercase tracking-tighter">AgentBazaar</span>
        </Link>
        <div className="flex items-center gap-2">
          <HashPackButton />
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Mobile Backdrop & Slide Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="fixed inset-y-0 left-0 w-64 bg-white z-50 shadow-2xl h-screen flex flex-col lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:flex lg:relative lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:flex-shrink-0 bg-white border-r border-gray-200/80 flex-col z-30 shadow-[1px_0_12px_rgba(0,0,0,0.02)]">
        {sidebarContent}
      </aside>
    </>
  );
}
