'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  Search,
  ArrowRight,
  Check,
  Network,
  Sparkles,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Marketplace from '@/components/Marketplace';
import { AgentChat } from '@/components/AgentChat';
import { cn } from '@/lib/utils';

export default function RootPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Only redirect to onboarding AFTER auth has fully resolved AND there is
  // a logged-in user who hasn't completed onboarding.
  // Never redirect unauthenticated visitors — they should see the landing page.
  useEffect(() => {
    if (mounted && !isLoading && user && !user.onboardingCompleted) {
      router.replace('/onboarding');
    }
  }, [mounted, isLoading, user, router]);

  // While hydrating the client: show landing page immediately so unauthenticated
  // users never see a blank screen or get wrongly redirected.
  if (!mounted) {
    return <LandingPage />;
  }

  // Auth is still resolving — show landing page (not a spinner) so users don't
  // see a flash of blank/loading before the landing page appears.
  if (isLoading) {
    return <LandingPage />;
  }

  // Authenticated & onboarded → marketplace
  if (user?.onboardingCompleted) {
    return <Marketplace />;
  }

  // Authenticated but not onboarded → useEffect above handles redirect;
  // show nothing briefly to avoid flash.
  if (user && !user.onboardingCompleted) {
    return null;
  }

  // Not logged in → landing page
  return <LandingPage />;
}

function LandingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close mobile menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    }
    if (mobileMenuOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [mobileMenuOpen]);

  const handleSignIn = () => {
    setIsLoading(true);
    router.push('/login');
  };

  const handleGetStarted = () => {
    setIsLoading(true);
    router.push('/register');
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">

      {/* ── Navigation ─────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-md flex-shrink-0">
              <Network className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight">AgentBazaar</h1>
              <p className="text-[9px] sm:text-[10px] font-bold text-orange-600 tracking-widest uppercase mt-0.5">
                AI MARKETPLACE
              </p>
            </div>
          </div>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={handleSignIn}
              className="text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              disabled={isLoading}
            >
              Sign In
            </Button>
            <Button
              onClick={handleGetStarted}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all"
              disabled={isLoading}
            >
              Get Started
            </Button>
          </div>

          {/* Mobile hamburger */}
          <div className="sm:hidden" ref={menuRef}>
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-gray-700" />
              ) : (
                <Menu className="w-5 h-5 text-gray-700" />
              )}
            </button>

            {/* Dropdown */}
            {mobileMenuOpen && (
              <div className="absolute top-full right-4 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 flex flex-col gap-2">
                <Button
                  variant="ghost"
                  onClick={() => { setMobileMenuOpen(false); handleSignIn(); }}
                  className="w-full justify-start text-sm font-semibold text-gray-700"
                  disabled={isLoading}
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => { setMobileMenuOpen(false); handleGetStarted(); }}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm"
                  disabled={isLoading}
                >
                  Get Started
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-b from-white via-orange-50/30 to-white pt-28 sm:pt-40 pb-16 sm:pb-20">

        {/* Status badge */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium text-gray-700">System Live</span>
          </div>
        </div>

        <div className="text-center max-w-4xl mx-auto px-4 sm:px-6">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-5 sm:mb-6 leading-tight tracking-tight">
            Deploy Autonomous Agents
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">
              With Verifiable Memory
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed font-medium">
            Build, deploy, and monetize AI agents with permanent intelligence
            storage on the world&apos;s first AI-native decentralized data layer.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Button
              variant="primary"
              size="lg"
              onClick={handleGetStarted}
              disabled={isLoading}
              className="w-full sm:w-auto px-8 py-3 rounded-xl shadow-lg hover:shadow-xl font-medium h-auto"
            >
              Launch Your Agent
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() =>
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
              }
              className="w-full sm:w-auto px-8 py-3 rounded-xl shadow-md h-auto font-medium"
            >
              Learn More
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 mt-10 sm:mt-12">
            {['Decentralized', 'Verifiable', 'On-Chain Proof'].map((label) => (
              <div key={label} className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-green-600" />
                </div>
                <span className="text-sm text-gray-600 font-medium tracking-tight">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Multi-Agent Orchestration Demo ───────────────────────────────── */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight uppercase mb-2">
              Multi-Agent Orchestration (A2A)
            </h2>
            <p className="text-sm text-gray-600">
              Chain multiple autonomous agents together with zero friction. Backed by your Hedera vault balance.
            </p>
          </div>
          <AgentChat />
        </div>
      </section>

      {/* ── Featured Agents ────────────────────────────────────────────────── */}
      <section id="features" className="py-16 sm:py-24 px-4 sm:px-6 bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-10 sm:mb-16 text-gray-900 tracking-tight uppercase">
            Built-in Intelligence Agents
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8 text-left">
            <AgentCard
              icon={Shield}
              title="ScamSniff"
              desc="Real-time threat detection for contracts and profiles."
              cost="$0.10 / run"
              highlight="HIGH ACCURACY"
              color="text-green-600"
              bgColor="bg-green-100"
              status="dev"
            />
            <AgentCard
              icon={Sparkles}
              title="ThreadSmith"
              desc="AI content synthesis for Web3 project updates and social threads."
              cost="$0.10 / run"
              highlight="MULTI-MODAL"
              color="text-orange-600"
              bgColor="bg-orange-100"
              status="live"
            />
            <AgentCard
              icon={Search}
              title="LaunchWatch"
              desc="Autonomous monitoring for token milestones and network activity."
              cost="$0.10 / run"
              highlight="24/7 PULSE"
              color="text-blue-600"
              bgColor="bg-blue-100"
              status="live"
            />
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-gray-200 py-10 sm:py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-8 text-sm text-gray-500 font-medium">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-orange-500 shadow-md flex items-center justify-center text-white font-bold flex-shrink-0">
              B
            </div>
            <span className="text-center sm:text-left">© 2026 AgentBazaar. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
            <span className="text-gray-900 font-bold uppercase tracking-wider">System Live</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function AgentCard({
  icon: Icon,
  title,
  desc,
  cost,
  highlight,
  color,
  bgColor,
  status,
}: {
  icon: any;
  title: string;
  desc: string;
  cost: string;
  highlight: string;
  color: string;
  bgColor: string;
  status: 'live' | 'dev';
}) {
  const router = useRouter();

  const themeMap: Record<string, string> = {
    ScamSniff: 'hover:border-green-300',
    ThreadSmith: 'hover:border-orange-300',
    LaunchWatch: 'hover:border-blue-300',
  };

  const hoverBorder = themeMap[title] || 'hover:border-orange-300';

  return (
    <Card
      isClickable={true}
      className={cn(
        'bg-white border border-gray-200 p-5 sm:p-6 rounded-3xl',
        hoverBorder
      )}
    >
      {/* Icon + status badge row */}
      <div className="flex items-start justify-between mb-4">
        <div
          className={cn(
            'w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center transition-colors flex-shrink-0',
            bgColor
          )}
        >
          <Icon className={cn('w-6 h-6 sm:w-7 sm:h-7', color)} strokeWidth={2.5} />
        </div>
        <span
          className={cn(
            'text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest',
            status === 'live'
              ? 'bg-green-100 text-green-700'
              : 'bg-yellow-100 text-yellow-700'
          )}
        >
          {status === 'live' ? '● Live' : '⚙ In Dev'}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 tracking-tight leading-none uppercase">
          {title}
        </h3>
        <Badge
          className={cn(
            'border-none text-[9px] font-bold tracking-widest h-6 px-3 rounded-full flex items-center shadow-sm',
            bgColor,
            color
          )}
        >
          {highlight}
        </Badge>
      </div>

      <p className="text-sm text-gray-600 mb-6 sm:mb-8 leading-relaxed font-medium min-h-[44px]">
        {desc}
      </p>

      <div className="flex items-center justify-between border-t border-gray-50 pt-4 sm:pt-6">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">
            Fee per run
          </span>
          <span className="text-sm font-bold text-gray-900 leading-none">{cost}</span>
        </div>
        <Button
          variant="primary"
          onClick={() => router.push('/marketplace')}
          className="px-4 sm:px-6 py-2 h-9 sm:h-10 rounded-xl text-sm"
        >
          Launch
          <ArrowRight className="w-4 h-4 ml-1.5 sm:ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </Card>
  );
}
