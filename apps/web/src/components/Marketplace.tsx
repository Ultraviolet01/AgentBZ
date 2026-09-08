'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Sparkles, 
  Search, 
  Filter, 
  ArrowRight, 
  Globe,
  Bot,
  Zap,
  Code2,
  CheckCircle2,
  Layers,
  Cpu,
  RefreshCw
} from 'lucide-react';
import { useRouter } from 'next/navigation';
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
  badge: string;
  badgeColor?: string;
  cost: string;
  creator: string;
  builderAccountId?: string;
  verified: boolean;
  trending: boolean;
  installs: number;
  isBuiltIn: boolean;
  category?: string;
}

// Built-in featured agents created by AgentBazaar Core (3 official agents)
const BUILT_IN_AGENTS: AgentItem[] = [
  {
    id: 'scamsniff',
    slug: 'scamsniff',
    route: '/agents/scamsniff',
    name: 'ScamSniff',
    description: 'Advanced social & smart contract threat analysis. Real-time authenticity verification for on-chain interactions.',
    icon: Shield,
    iconColor: 'text-green-500',
    bgColor: 'bg-green-50',
    badge: 'SECURITY AUDIT',
    badgeColor: 'bg-green-50 text-green-700 border-green-200',
    cost: '1 HBAR',
    creator: 'AgentBazaar Core',
    verified: true,
    trending: true,
    installs: 1247,
    isBuiltIn: true,
    category: 'Security',
  },
  {
    id: 'threadsmith',
    slug: 'threadsmith',
    route: '/agents/threadsmith',
    name: 'ThreadSmith',
    description: 'Context-aware AI content synthesis. Transform raw intelligence into viral-ready threads for the Web3 ecosystem.',
    icon: Sparkles,
    iconColor: 'text-orange-500',
    bgColor: 'bg-orange-50',
    badge: 'CONTENT & SOCIAL',
    badgeColor: 'bg-orange-50 text-orange-700 border-orange-200',
    cost: '1 HBAR',
    creator: 'AgentBazaar Core',
    verified: true,
    trending: true,
    installs: 856,
    isBuiltIn: true,
    category: 'Content',
  },
  {
    id: 'launchwatch',
    slug: 'launchwatch',
    route: '/agents/launchwatch',
    name: 'LaunchWatch',
    description: 'Autonomous real-time monitoring & alerting. 24/7 project health surveillance across modular networks.',
    icon: Search,
    iconColor: 'text-blue-500',
    bgColor: 'bg-blue-50',
    badge: '24/7 MONITOR',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    cost: '1 HBAR',
    creator: 'AgentBazaar Core',
    verified: true,
    trending: false,
    installs: 432,
    isBuiltIn: true,
    category: 'Monitoring',
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
    bgColor: 'bg-purple-50',
    badge: 'ANALYTICS',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    cost: '1 HBAR',
    creator: '0.0.10389860',
    builderAccountId: '0.0.10389860',
    verified: false,
    trending: true,
    installs: 320,
    isBuiltIn: false,
    category: 'Analytics',
  },
];

export default function Marketplace() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'builtin' | 'deployed'>('all');
  const [deployedAgents, setDeployedAgents] = useState<AgentItem[]>(INITIAL_DEPLOYED_AGENTS);
  const [loadingDeployed, setLoadingDeployed] = useState(false);

  // Fetch developer-deployed agents from /api/agents/deployed
  useEffect(() => {
    async function loadDeployedAgents() {
      try {
        setLoadingDeployed(true);
        const res = await fetch('/api/agents/deployed');
        if (res.ok) {
          const data = await res.json();
          if (data.agents && Array.isArray(data.agents)) {
            // Filter out any built-in slug duplicates
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
                bgColor: a.slug === 'sentinel' ? 'bg-purple-50' : 'bg-indigo-50',
                badge: a.category ? a.category.toUpperCase() : 'DEVELOPER DEPLOYED',
                badgeColor: a.slug === 'sentinel' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200',
                cost: `${a.pricePerRun || 1} HBAR`,
                creator: a.creator || a.builderAccountId || 'Community Developer',
                builderAccountId: a.builderAccountId,
                verified: false,
                trending: false,
                installs: a.runsCount || 0,
                isBuiltIn: false,
                category: a.category || 'Custom',
              }));
            
            // Merge custom agents with INITIAL_DEPLOYED_AGENTS (ensuring Sentinel is always present if not in DB yet)
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
        console.warn('[Marketplace] Could not load dynamic deployed agents:', err);
      } finally {
        setLoadingDeployed(false);
      }
    }
    loadDeployedAgents();
  }, []);

  // Combine built-in agents and developer-deployed agents
  const allAgents: AgentItem[] = [...BUILT_IN_AGENTS, ...deployedAgents];

  // Filter based on active tab & search query
  const filteredAgents = allAgents.filter((agent) => {
    if (filterTab === 'builtin' && !agent.isBuiltIn) return false;
    if (filterTab === 'deployed' && agent.isBuiltIn) return false;

    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      agent.name.toLowerCase().includes(query) ||
      agent.description.toLowerCase().includes(query) ||
      (agent.category && agent.category.toLowerCase().includes(query)) ||
      agent.creator.toLowerCase().includes(query)
    );
  });

  const builtInCount = BUILT_IN_AGENTS.length;
  const deployedCount = deployedAgents.length;

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto min-h-screen bg-[var(--background-secondary)] relative pb-24">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-50/20 blur-[130px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-50/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent-green)] shadow-[0_0_10px_rgba(16,185,129,0.3)] animate-pulse" />
          <span className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">
            Consensus Ecosystem Active
          </span>
        </div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-4xl md:text-6xl font-bold text-[var(--text-primary)] tracking-tight leading-[0.95] uppercase">
              Agent <span className="text-[var(--accent-orange)]">Marketplace.</span>
            </h1>
            <p className="text-base md:text-lg text-[var(--text-secondary)] max-w-2xl font-medium mt-3 leading-relaxed">
              Discover, execute, and monetize autonomous AI agents on Hedera. Pay per run in HBAR with verifiable consensus logs.
            </p>
          </div>
          <Button
            onClick={() => router.push('/deploy')}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl h-11 px-6 gap-2 shadow-sm"
          >
            <Code2 className="w-4 h-4" />
            DEPLOY AN AGENT
          </Button>
        </div>
      </div>

      {/* ── Compact Search & Filter Controls ─────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-10">
        {/* Filter Pills (All / Built-in / Developer Deployed) */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-gray-200 rounded-2xl shadow-2xs overflow-x-auto">
          <button
            onClick={() => setFilterTab('all')}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap',
              filterTab === 'all'
                ? 'bg-gray-900 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            )}
          >
            <Zap className="w-3.5 h-3.5" />
            Built-in Core ({builtInCount})
          </button>
          <button
            onClick={() => setFilterTab('deployed')}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5',
              filterTab === 'deployed'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            )}
          >
            <Code2 className="w-3.5 h-3.5" />
            Developer Deployed ({deployedCount})
          </button>
        </div>

        {/* Reduced & Ergonomic Search Input */}
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

      {/* Grid Subheader */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-bold text-gray-900 uppercase tracking-tight">
            {filterTab === 'builtin'
              ? 'Built-in Protocol Agents'
              : filterTab === 'deployed'
              ? 'Developer & Community Deployed Agents'
              : 'Available Agent Catalog'}
          </h2>
          <div className="h-px w-12 bg-gray-200 hidden sm:block" />
        </div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          Showing {filteredAgents.length} Active {filteredAgents.length === 1 ? 'Agent' : 'Agents'}
        </p>
      </div>

      {/* ── Agent Cards Grid ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {filteredAgents.map((agent) => {
          const Icon = agent.icon;

          const themeMap: Record<string, { hoverBorder: string; iconHoverBg: string }> = {
            scamsniff: { hoverBorder: 'hover:border-green-300', iconHoverBg: 'group-hover:bg-green-100' },
            threadsmith: { hoverBorder: 'hover:border-orange-300', iconHoverBg: 'group-hover:bg-orange-100' },
            launchwatch: { hoverBorder: 'hover:border-blue-300', iconHoverBg: 'group-hover:bg-blue-100' },
            sentinel: { hoverBorder: 'hover:border-purple-300', iconHoverBg: 'group-hover:bg-purple-100' },
          };

          const theme = themeMap[agent.id] || {
            hoverBorder: 'hover:border-indigo-300',
            iconHoverBg: 'group-hover:bg-indigo-100',
          };

          return (
            <Card
              key={agent.id}
              isClickable={true}
              onClick={() => router.push(agent.route)}
              className={cn(
                'bg-white border border-gray-200 p-6 flex flex-col justify-between rounded-3xl hover:shadow-xl transition-all cursor-pointer group',
                theme.hoverBorder
              )}
            >
              <div>
                {/* Top Row: Icon + Type Badge */}
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={cn(
                      'w-13 h-13 rounded-2xl flex items-center justify-center transition-colors',
                      agent.bgColor,
                      theme.iconHoverBg
                    )}
                  >
                    <Icon className={cn('w-6 h-6', agent.iconColor)} strokeWidth={2.5} />
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

                {/* Title & Category Badge */}
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
                    {agent.badge}
                  </span>
                </div>

                {/* Creator Attribution */}
                <p className="text-xs text-gray-400 font-mono mb-3">
                  by <span className="text-gray-700 font-semibold">{agent.creator}</span>
                </p>

                {/* Description */}
                <p className="text-xs sm:text-sm text-gray-600 mb-6 line-clamp-3 leading-relaxed font-medium">
                  {agent.description}
                </p>
              </div>

              {/* Bottom Card Footer: Fee & Launch Button */}
              <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-auto">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">
                    Fee per run
                  </span>
                  <span className="text-sm font-bold text-orange-600 font-mono leading-none">{agent.cost}</span>
                </div>
                <Button
                  variant="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(agent.route);
                  }}
                  className="px-5 py-2 h-9 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-xs"
                >
                  Launch
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </Card>
          );
        })}
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
              ? 'No developer agents deployed yet. Be the first to deploy an autonomous agent!'
              : 'No agents match your current filter or search criteria.'}
          </p>
          <div className="flex gap-3">
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
            {filterTab === 'deployed' && (
              <Button
                onClick={() => router.push('/deploy')}
                className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl"
              >
                Deploy an Agent
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
