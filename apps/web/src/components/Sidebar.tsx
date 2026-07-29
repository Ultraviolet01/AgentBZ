"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutGrid, 
  Cpu, 
  FolderOpen, 
  History,
  UserRound,
  Settings,
  Plus,
  LogOut,
  Network,
  Rocket,
  Menu,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { AgentSelectionModal } from "./AgentSelectionModal";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, signOut } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Hide sidebar on auth pages but show on onboarding
  const isAuthPage = pathname === '/login' || pathname === '/register';
  if (isAuthPage) return null;

  const navItems = [
    { 
      label: 'Marketplace', 
      href: '/', 
      icon: LayoutGrid,
      description: 'Agent Market'
    },
    { 
      label: 'Agents', 
      href: '/agents', 
      icon: Cpu,
      description: 'Official Registry'
    },
    { 
      label: 'My Projects', 
      href: '/projects', 
      icon: FolderOpen,
      description: 'Active Projects'
    },
    { 
      label: 'Deploy Agent', 
      href: '/deploy', 
      icon: Rocket,
      description: 'Deploy New Agent'
    }
  ];

  const accountItems = [
    { label: 'Profile', href: '/profile', icon: UserRound },
    { label: 'Settings', href: '/settings', icon: Settings }
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 pt-8 border-b border-gray-50/50 flex items-center justify-between mb-2">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-md transition-all group-hover:rotate-6">
             <Network className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-none uppercase tracking-tighter">AgentBazaar</h1>
            <p className="text-[10px] font-bold text-orange-600 tracking-widest uppercase mt-1">AI MARKETPLACE</p>
          </div>
        </Link>
        <button 
          onClick={() => setIsMobileMenuOpen(false)}
          className="lg:hidden p-2 text-gray-500 hover:text-gray-900"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Run Agent Button - only show when authenticated */}
      {user && (
        <div className="p-4">
          <Button 
            variant="primary"
            onClick={() => setModalOpen(true)}
            className="w-full rounded-xl shadow-md hover:shadow-lg transition-all font-bold"
          >
            <Plus className="w-4 h-4 mr-2" strokeWidth={3} />
            RUN AGENT
          </Button>
        </div>
      )}

      {/* Navigation - show when authenticated OR on onboarding */}
      {(user || pathname === '/onboarding') && (
        <nav className="flex-1 px-4 py-4 space-y-4 overflow-y-auto custom-scrollbar">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase px-3 mb-2 block tracking-[0.2em] opacity-80">
              Global Console
            </span>
            <div className="space-y-0.5">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  
                  return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                            isActive 
                            ? "bg-orange-50 text-orange-600 font-bold shadow-sm" 
                            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        )}
                      >
                        <Icon className={cn("w-4 h-4", isActive ? "text-orange-600" : "text-gray-400")} strokeWidth={isActive ? 2.5 : 2} />
                        <span className="text-sm tracking-tight">{item.label}</span>
                      </Link>
                  );
                })}
            </div>


          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase px-3 mb-2 block tracking-[0.2em] opacity-80">
              Management
            </span>
            <div className="space-y-0.5">
                {accountItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  
                  return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                            isActive 
                            ? "bg-orange-50 text-orange-600 font-bold" 
                            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        )}
                      >
                        <Icon className={cn("w-4 h-4", isActive ? "text-orange-600" : "text-gray-400")} strokeWidth={isActive ? 2.5 : 2} />
                        <span className="text-sm tracking-tight">{item.label}</span>
                      </Link>
                  );
                })}
            </div>
          </div>
        </nav>
      )}

      {/* Spacer for guest view to maintain logo and status positioning */}
      {!user && <div className="flex-1" />}

      {/* Bottom - User Profile / Auth Toggle */}
      <div className="p-4 border-t border-gray-200 mt-auto">
        {(user || pathname === '/onboarding') ? (
          <div className="space-y-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                {(user?.username || 'U')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.username || 'New User'}
                </p>
              </div>
            </div>
            <Button 
              variant="secondary"
              onClick={signOut}
              className="w-full h-8 text-[10px] font-bold uppercase tracking-widest bg-gray-50 border-gray-100 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900 transition-colors"
            >
              <LogOut className="w-3 h-3 mr-2" strokeWidth={3} />
              Sign Out
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Button asChild variant="secondary" className="h-8 rounded-lg text-[10px] font-bold border-gray-100 hover:bg-gray-50 text-gray-900 uppercase tracking-tight">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild variant="primary" className="h-8 rounded-lg text-[10px] font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-sm uppercase tracking-tight">
              <Link href="/register">Join</Link>
            </Button>
          </div>
        )}
        
        <div className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-gray-600 font-medium tracking-tight">System Live</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <AgentSelectionModal open={modalOpen} onOpenChange={setModalOpen} />
      
      {/* Mobile Top Header */}
      <header className="lg:hidden h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 z-30 w-full">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center shadow-sm">
             <Network className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-black text-gray-900 uppercase tracking-tighter">AgentBazaar</span>
        </Link>
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 text-gray-600 hover:text-gray-900"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Backdrop for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Desktop & Mobile Sidebar */}
      <aside className={cn(
        "bg-white border-r border-gray-200 flex flex-col h-screen z-50 transition-all duration-300 ease-in-out shadow-[1px_0_10px_rgba(0,0,0,0.02)]",
        "lg:relative lg:w-64 lg:translate-x-0",
        isMobileMenuOpen 
          ? "fixed inset-y-0 left-0 translate-x-0 w-64 shadow-2xl" 
          : "fixed inset-y-0 left-0 -translate-x-full lg:translate-x-0"
      )}>
        {sidebarContent}
      </aside>
    </>
  );
}
