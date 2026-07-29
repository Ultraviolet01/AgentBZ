'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Zap, 
  Search, 
  ArrowRight, 
  Check,
  Network,
  Lock,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Marketplace from '@/components/Marketplace';
import { cn } from '@/lib/utils';

export default function RootPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoading && user && !user.onboardingCompleted) {
      router.replace('/onboarding');
    }
  }, [mounted, isLoading, user, router]);

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (user) {
    // If user is authenticated but not onboarded, show nothing (useEffect will handle redirect)
    if (!user.onboardingCompleted) return null;
    
    return <Marketplace />;
  }

  return <LandingPage />;
}

function LandingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

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
      
      {/* Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-md">
              <Network className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">AgentBazaar</h1>
              <p className="text-[10px] font-bold text-orange-600 tracking-widest uppercase mt-0.5">AI MARKETPLACE</p>
            </div>
          </div>

          {/* Nav Actions */}
          <div className="flex items-center gap-4">
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
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-white via-orange-50/30 to-white py-20 pt-40">
        
        {/* Status Badge */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium text-gray-700">System Live</span>
          </div>
        </div>

        <div className="text-center max-w-4xl mx-auto px-6">
          <h1 className="text-6xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">
            Deploy Autonomous Agents
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">
              With Verifiable Memory
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed font-medium">
            Build, deploy, and monetize AI agents with permanent intelligence storage 
            on the world&apos;s first AI-native decentralized data layer.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Button 
              variant="primary"
              size="lg"
              onClick={handleGetStarted}
              disabled={isLoading}
              className="px-8 py-3 rounded-xl shadow-lg hover:shadow-xl font-medium h-auto"
            >
              Launch Your Agent
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              variant="secondary"
              size="lg"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-3 rounded-xl shadow-md h-auto font-medium"
            >
              Learn More
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex items-center justify-center gap-8 mt-12">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-3 h-3 text-green-600" />
              </div>
              <span className="text-sm text-gray-600 font-medium tracking-tight">Decentralized</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-3 h-3 text-green-600" />
              </div>
              <span className="text-sm text-gray-600 font-medium tracking-tight">Verifiable</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-3 h-3 text-green-600" />
              </div>
              <span className="text-sm text-gray-600 font-medium tracking-tight">On-Chain Proof</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Agents Section */}
      <section id="features" className="py-24 px-6 bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-16 text-gray-900 tracking-tight uppercase">Built-in Intelligence Agents</h2>
          <div className="grid md:grid-cols-3 gap-8 text-left">
            <AgentCard 
              icon={Shield} 
              title="ScamSniff" 
              desc="Real-time threat detection for contracts and profiles."
              cost="$0.10 / run"
              highlight="HIGH ACCURACY"
              color="text-green-600"
              bgColor="bg-green-100"
            />
            <AgentCard 
              icon={Sparkles} 
              title="ThreadSmith" 
              desc="AI content synthesis for Web3 project updates."
              cost="$0.10 / run"
              highlight="MULTI-MODAL"
              color="text-orange-600"
              bgColor="bg-orange-100"
            />
            <AgentCard 
              icon={Search} 
              title="LaunchWatch" 
              desc="Autonomous monitoring for modular network activity."
              cost="$0.10 / run"
              highlight="24/7 PULSE"
              color="text-blue-600"
              bgColor="bg-blue-100"
            />
          </div>
        </div>
      </section>

      <footer className="bg-white border-t border-gray-200 py-16 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 text-sm text-gray-500 font-medium">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-orange-500 shadow-md flex items-center justify-center text-white font-bold">
               B
            </div>
            <span>© 2026 AgentBazaar. All rights reserved.</span>
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

function AgentCard({ icon: Icon, title, desc, cost, highlight, color, bgColor }: any) {
  const router = useRouter();
  
  // High fidelity theme mapping for landing page
  const themeMap: Record<string, string> = {
    'ScamSniff': 'hover:border-green-300',
    'ThreadSmith': 'hover:border-orange-300',
    'LaunchWatch': 'hover:border-blue-300'
  };
  
  const hoverBorder = themeMap[title] || 'hover:border-orange-300';
  const iconHoverBg = bgColor.replace('100', '200');

  return (
    <Card 
      isClickable={true}
      className={cn(
        "bg-white border border-gray-200 p-6 rounded-3xl",
        hoverBorder
      )}
    >
      <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center transition-colors mb-4", bgColor, `group-hover:${iconHoverBg}`)}>
        <Icon className={cn("w-7 h-7", color)} strokeWidth={2.5} />
      </div>
      
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-xl font-semibold text-gray-900 tracking-tight leading-none uppercase">{title}</h3>
        <Badge className={cn("border-none text-[9px] font-bold tracking-widest h-6 px-3 rounded-full flex items-center shadow-sm", bgColor, color.replace('text-', 'text-'))}>
          {highlight}
        </Badge>
      </div>

      <p className="text-sm text-gray-600 mb-8 leading-relaxed font-medium min-h-[60px]">{desc}</p>
      
      <div className="flex items-center justify-between border-t border-gray-50 pt-6">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Fee per run</span>
          <span className="text-sm font-bold text-gray-900 leading-none">{cost}</span>
        </div>
        <Button 
          variant="primary"
          onClick={() => router.push('/marketplace')}
          className="px-6 py-2 h-10 rounded-xl"
        >
          Launch
          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </Card>
  );
}

