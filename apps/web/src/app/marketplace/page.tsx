'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Sparkles, 
  Search, 
  TrendingUp, 
  Filter, 
  ArrowRight, 
  Plus, 
  Bot,
  Zap,
  Code2,
  CheckCircle2,
  Cpu
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface AgentItem {
  id: string;
  slug: string;
  route: string;
  name: string;
  description: string;
  icon: any;
  iconColor: string;
  bgColor: string;
  badgeText: string;
  badgeColor?: string;
  cost: string;
  creator: string;
  builderAccountId?: string;
  verified: boolean;
  trending: boolean;
  installs: number;
  rating: number;
  isBuiltIn: boolean;
  category: string;
}

// Built-in featured agents created by AgentBazaar Core (3 official agents)
const BUILT_IN_AGENTS: AgentItem[] = [
  {
    id: 'scamsniff',
    slug: 'scamsniff',
    route: '/agents/scamsniff',
    name: 'ScamSniff',
    description: 'Advanced Web3 smart contract, honeypot & rug-pull security auditing with on-chain proofs.',
    icon: Shield,
    iconColor: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    badgeText: 'SECURITY AUDIT',
    badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    cost: '1.0 HBAR',
    creator: 'AgentBazaar Core',
    verified: true,
    trending: true,
    installs: 1247,
    rating: 4.9,
    isBuiltIn: true,
    category: 'Web3 Security',
  },
  {
    id: 'threadsmith',
    slug: 'threadsmith',
    route: '/agents/threadsmith',
    name: 'ThreadSmith',
    description: 'Viral social media & thread generator with multi-tone synthesis and brand voice memory.',
    icon: Sparkles,
    iconColor: 'text-orange-600',
    bgColor: 'bg-orange-100',
    badgeText: 'SOCIAL & VIRAL',
    badgeColor: 'bg-orange-100 text-orange-700 border-orange-200',
    cost: '0.8 HBAR',
    creator: 'AgentBazaar Core',
    verified: true,
    trending: true,
    installs: 856,
    rating: 4.9,
    isBuiltIn: true,
    category: 'Social & Content',
  },
  {
    id: 'launchwatch',
    slug: 'launchwatch',
    route: '/agents/launchwatch',
    name: 'LaunchWatch',
    description: 'Autonomous 24/7 token monitoring, FDV milestones & real-time threshold alert engine.',
    icon: Search,
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-100',
    badgeText: 'REAL-TIME MONITOR',
    badgeColor: 'bg-blue-100 text-blue-700 border-blue-200',
    cost: '1.5 HBAR',
    creator: 'AgentBazaar Core',
    verified: true,
    trending: true,
    installs: 432,
    rating: 4.8,
    isBuiltIn: true,
    category: 'Crypto & Trading',
  },
];

// Initial developer deployed agents
const INITIAL_DEPLOYED_AGENTS: AgentItem[] = [
  {
    id: 'sentinel',
    slug: 'sentinel',
    route: '/agents/sentinel',
    name: 'Sentinel',
    description: 'Real-time AI sentiment and security analyzer for Web3 tokens and contracts.',
    icon: Bot,
    iconColor: 'text-purple-600',
    bgColor: 'bg-purple-100',
    badgeText: 'ANALYTICS',
    badgeColor: 'bg-purple-100 text-purple-700 border-purple-200',
    cost: '1.0 HBAR',
    creator: '0.0.10389860',
    builderAccountId: '0.0.10389860',
    verified: false,
    trending: true,
    installs: 320,
    rating: 5.0,
    isBuiltIn: false,
    category: 'Analytics',
  },
];

export default function MarketplacePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'builtin' | 'deployed'>('all');
  const [deployedAgents, setDeployedAgents] = useState<AgentItem[]>(INITIAL_DEPLOYED_AGENTS);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace('/');
      } else if (!user.onboardingCompleted) {
        router.replace('/onboarding');
      }
    }
  }, [user, isLoading, router]);

  // Load deployed agents dynamically from API
  useEffect(() => {
    async function loadDeployed() {
      try {
        const res = await fetch('/api/agents/deployed');
        if (res.ok) {
          const data = await res.json();
          if (data.agents && Array.isArray(data.agents)) {
            const custom = data.agents
              .filter((a: any) => !['scamsniff', 'threadsmith', 'launchwatch'].includes((a.slug || '').toLowerCase()))
              .map((a: any) => ({
                id: a.id || a.slug,
                slug: a.slug,
                route: (a.slug === 'sentinel') ? '/agents/sentinel' : `/agents/deployed/${a.slug}`,
                name: a.name,
                description: a.description || 'Custom autonomous AI agent deployed on Hedera.',
                icon: a.slug === 'sentinel' ? Bot : Cpu,
                iconColor: a.slug === 'sentinel' ? 'text-purple-600' : 'text-indigo-600',
                bgColor: a.slug === 'sentinel' ? 'bg-purple-100' : 'bg-indigo-100',
                badgeText: a.category ? a.category.toUpperCase() : 'DEVELOPER DEPLOYED',
                badgeColor: a.slug === 'sentinel' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200',
                cost: `${a.pricePerRun || 1} HBAR`,
                creator: a.creator || a.builderAccountId || 'Community Developer',
                builderAccountId: a.builderAccountId,
                verified: false,
                trending: false,
                installs: a.runsCount || 0,
                rating: a.rating || 5.0,
                isBuiltIn: false,
                category: a.category || 'Custom',
              }));

            const merged = [...INITIAL_DEPLOYED_AGENTS];
            custom.forEach((c: AgentItem) => {
              const idx = merged.findIndex(m => m.slug.toLowerCase() === c.slug.toLowerCase());
              if (idx >= 0) {
                merged[idx] = c;
              } else {
                merged.push(c);
              }
            });
            setDeployedAgents(merged);
          }
        }
      } catch (err) {
        console.warn('[MarketplacePage] Failed to fetch deployed agents:', err);
      }
    }
    loadDeployed();
  }, []);

  if (isLoading || !user || !user.onboardingCompleted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const allAgents: AgentItem[] = [...BUILT_IN_AGENTS, ...deployedAgents];

  const filteredAgents = allAgents.filter((agent) => {
    if (filterTab === 'builtin' && !agent.isBuiltIn) return false;
    if (filterTab === 'deployed' && agent.isBuiltIn) return false;

    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      agent.name.toLowerCase().includes(query) ||
      agent.description.toLowerCase().includes(query) ||
      agent.category.toLowerCase().includes(query) ||
      agent.creator.toLowerCase().includes(query)
    );
  });

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-10 pb-20">
      
      {/* Header & Deploy CTA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Hedera x402 Ecosystem Active</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight uppercase">
            Agent <span className="text-orange-500">Marketplace.</span>
          </h1>
          <p className="text-sm md:text-base text-gray-600 max-w-2xl mt-2">
            Discover, execute, and monetize autonomous AI agents with pay-per-run HBAR micropayments and on-chain Hedera Consensus Service audit proofs.
          </p>
        </div>

        <Link href="/deploy">
          <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl h-12 px-6 gap-2 shadow-lg hover:shadow-xl transition-all cursor-pointer">
            <Plus className="w-4 h-4 stroke-[3]" />
            DEPLOY AN AGENT
          </Button>
        </Link>
      </div>

      {/* ── Compact Search & Filter Controls ─────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-50 border border-gray-200 rounded-2xl shadow-2xs overflow-x-auto">
          <button
            onClick={() => setFilterTab('all')}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap',
              filterTab === 'all'
                ? 'bg-gray-900 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white'
            )}
          >
            All Agents ({allAgents.length})
          </button>
          <button
            onClick={() => setFilterTab('builtin')}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5',
              filterTab === 'builtin'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white'
            )}
          >
            <Zap className="w-3.5 h-3.5" />
            Built-in Core ({BUILT_IN_AGENTS.length})
          </button>
          <button
            onClick={() => setFilterTab('deployed')}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5',
              filterTab === 'deployed'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white'
            )}
          >
            <Code2 className="w-3.5 h-3.5" />
            Developer Deployed ({deployedAgents.length})
          </button>
        </div>

        {/* Compact Search Input */}
        <div className="relative w-full md:w-80 lg:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" strokeWidth={2.5} />
          <input
            type="text"
            placeholder="Search by name, category, or creator..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 bg-white border border-gray-200 pl-10 pr-4 text-xs font-semibold text-gray-900 placeholder:text-gray-400 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 shadow-2xs transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Agents Catalog Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">
              {filterTab === 'builtin'
                ? 'Built-in Protocol Agents'
                : filterTab === 'deployed'
                ? 'Developer Deployed Agents'
                : 'All Intelligence Agents'}
            </h2>
          </div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            {filteredAgents.length} Available
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map((agent) => {
            const Icon = agent.icon;
            
            return (
              <Card
                key={agent.id}
                className="bg-white border-gray-200 p-6 rounded-3xl hover:border-orange-300 hover:shadow-xl transition-all flex flex-col justify-between group cursor-pointer"
                onClick={() => router.push(agent.route)}
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-colors", agent.bgColor)}>
                      <Icon className={cn("w-6 h-6", agent.iconColor)} strokeWidth={2.5} />
                    </div>

                    {agent.isBuiltIn ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-200 shadow-2xs">
                        <Zap className="w-3 h-3 text-orange-500" />
                        Built-in Core
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs">
                        <Code2 className="w-3 h-3 text-indigo-500" />
                        Developer Deployed
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <h3 className="text-lg font-bold text-gray-900 tracking-tight leading-none uppercase">
                      {agent.name}
                    </h3>
                    {agent.verified && (
                      <CheckCircle2 className="w-4 h-4 text-orange-500 inline-block shrink-0" />
                    )}
                    <span className={cn(
                      'text-[9px] font-mono font-bold px-2 py-0.5 rounded-md border uppercase',
                      agent.badgeColor || 'bg-gray-50 text-gray-600 border-gray-200'
                    )}>
                      {agent.badgeText}
                    </span>
                  </div>

                  <p className="text-xs text-gray-400 font-mono mb-2">
                    by <span className="text-gray-700 font-semibold">{agent.creator}</span>
                  </p>

                  <p className="text-xs sm:text-sm text-gray-600 mb-6 line-clamp-3 leading-relaxed font-medium">
                    {agent.description}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-auto">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">
                      Fee per run
                    </span>
                    <span className="text-sm font-bold text-orange-600 font-mono leading-none">{agent.cost}</span>
                  </div>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(agent.route);
                    }}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl h-9 px-5 text-xs shadow-xs"
                  >
                    Launch
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Empty State */}
      {filteredAgents.length === 0 && (
        <Card className="p-12 text-center rounded-3xl shadow-sm flex flex-col items-center max-w-xl mx-auto mt-8 bg-white border-gray-200">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center mb-5 shadow-2xs">
            <Filter className="w-8 h-8 text-gray-400" strokeWidth={1.5} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 uppercase tracking-tight mb-2">
            No Agents Found
          </h3>
          <p className="text-sm text-gray-500 font-medium mb-6 leading-relaxed">
            {filterTab === 'deployed'
              ? 'No developer agents deployed yet. Deploy your custom agent now!'
              : 'No agents match your current search query or filter.'}
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery('');
              setFilterTab('all');
            }}
            className="text-xs font-bold rounded-xl"
          >
            Reset Filters
          </Button>
        </Card>
      )}

    </div>
  );
}
