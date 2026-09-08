'use client';

import { useState } from 'react';
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
  Bot
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function Marketplace() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  // Active agents: ThreadSmith, ScamSniff, LaunchWatch, Sentinel (Builder: 0.0.10389860)
  const agents = [
    {
      id: 'scamsniff',
      slug: 'scamsniff',
      route: '/agents/scamsniff',
      name: 'ScamSniff',
      description: 'Advanced social & smart contract threat analysis. Real-time authenticity verification for on-chain interactions.',
      icon: Shield,
      iconColor: 'text-green-500',
      bgColor: 'bg-green-50',
      badge: 'HIGH ACCURACY',
      badgeColor: 'bg-green-50 text-green-600 border border-green-100',
      cost: '1 HBAR',
      creator: 'AgentBazaar',
      verified: true,
      trending: true,
      installs: 1247,
      isCustom: false,
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
      badge: 'MULTI-MODAL',
      badgeColor: 'bg-orange-50 text-orange-600 border border-orange-100',
      cost: '1 HBAR',
      creator: 'AgentBazaar',
      verified: true,
      trending: true,
      installs: 856,
      isCustom: false,
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
      badge: '24/7 PULSE',
      badgeColor: 'bg-blue-50 text-blue-600 border border-blue-100',
      cost: '1 HBAR',
      creator: 'AgentBazaar',
      verified: true,
      trending: false,
      installs: 432,
      isCustom: false,
    },
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
      badgeColor: 'bg-purple-50 text-purple-700 border border-purple-100',
      cost: '1 HBAR',
      creator: '0.0.10389860',
      verified: true,
      trending: true,
      installs: 320,
      isCustom: false,
    }
  ];

  const filteredAgents = agents.filter(agent => {
    const query = searchQuery.toLowerCase();
    return agent.name.toLowerCase().includes(query) ||
           agent.description.toLowerCase().includes(query);
  });

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto min-h-screen bg-[var(--background-secondary)] relative pb-24">
      
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-50/20 blur-[130px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-50/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent-green)] shadow-[0_0_10px_rgba(16,185,129,0.3)] animate-pulse" />
          <span className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em]">Deployment Active</span>
        </div>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-[var(--text-primary)] tracking-tighter leading-[0.9] mb-6 md:mb-10 uppercase">
          Agent
          <br />
          <span className="text-[var(--accent-orange)]">Marketplace.</span>
        </h1>
        <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl font-semibold leading-relaxed">
          Discover, deploy, and scale AI-native autonomous agents on Hedera. Verifiable memory, on-chain HCS audit trails, and x402 micropayments.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-16">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-5 md:left-6 top-1/2 -translate-y-1/2 text-[var(--text-muted)] w-4 h-4 md:w-5 md:h-5" strokeWidth={2.5} />
          <input
            type="text"
            placeholder="SEARCH AGENTS BY NAME, CATEGORY..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-14 md:h-16 bg-[var(--background-card)] border border-[var(--border-subtle)] pl-12 md:pl-16 pr-6 text-sm font-bold text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-[20px] md:rounded-[24px] focus:outline-none focus:ring-4 focus:ring-orange-50 focus:border-[var(--accent-orange)] shadow-[var(--shadow-sm)] transition-all uppercase tracking-tight"
          />
        </div>
      </div>

      {/* Grid Layout */}
      <div className="mb-8 md:mb-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
            <h2 className="text-lg md:text-xl font-bold text-[var(--text-primary)] uppercase tracking-tighter">
              Available Intelligence
            </h2>
            <div className="hidden sm:block h-px w-10 md:w-20 bg-[var(--border-subtle)]" />
        </div>
        <p className="text-[10px] md:text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Showing {filteredAgents.length} Active Agents</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredAgents.map((agent) => {
          const Icon = agent.icon;
          
          const themeMap: Record<string, { hoverBorder: string, iconHoverBg: string }> = {
            'scamsniff': { hoverBorder: 'hover:border-green-300', iconHoverBg: 'group-hover:bg-green-100' },
            'threadsmith': { hoverBorder: 'hover:border-orange-300', iconHoverBg: 'group-hover:bg-orange-100' },
            'launchwatch': { hoverBorder: 'hover:border-blue-300', iconHoverBg: 'group-hover:bg-blue-100' },
            'sentinel': { hoverBorder: 'hover:border-purple-300', iconHoverBg: 'group-hover:bg-purple-100' },
          };
          
          const theme = themeMap[agent.id] || { hoverBorder: 'hover:border-orange-300', iconHoverBg: 'group-hover:bg-orange-100' };

          return (
            <Card 
              key={agent.id}
              isClickable={true}
              onClick={() => router.push(agent.route)}
              className={cn(
                "bg-white border border-gray-200 p-6 flex flex-col justify-between rounded-[32px] hover:shadow-xl transition-all cursor-pointer group",
                theme.hoverBorder
              )}
            >
              <div>
                <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center transition-colors mb-4", agent.bgColor, theme.iconHoverBg)}>
                  <Icon className={cn("w-7 h-7", agent.iconColor)} strokeWidth={2.5} />
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-semibold text-gray-900 tracking-tight leading-none uppercase">{agent.name}</h3>
                  <Badge variant={agent.id === 'scamsniff' ? 'success' : agent.id === 'threadsmith' ? 'warning' : agent.id === 'launchwatch' ? 'info' : 'secondary'}>
                    {agent.badge}
                  </Badge>
                </div>

                <p className="text-xs text-gray-400 font-mono mb-2">by {agent.creator}</p>
                <p className="text-sm text-gray-600 mb-6 line-clamp-3 leading-relaxed font-medium">{agent.description}</p>
              </div>

              <div className="flex items-center justify-between border-t border-gray-50 pt-5 mt-auto">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Fee per run</span>
                  <span className="text-sm font-bold text-orange-600 font-mono leading-none">{agent.cost}</span>
                </div>
                <Button 
                  variant="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(agent.route);
                  }}
                  className="px-6 py-2 h-10 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold"
                >
                  Launch
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredAgents.length === 0 && (
        <Card variant="accent" className="p-10 md:p-24 text-center rounded-[32px] md:rounded-[48px] shadow-sm flex flex-col items-center max-w-2xl mx-auto">
          <div className="w-16 h-16 md:w-24 md:h-24 rounded-[24px] md:rounded-[32px] bg-[var(--background-secondary)] border border-[var(--border-subtle)] flex items-center justify-center mb-6 md:mb-10 shadow-sm">
            <Filter className="w-6 h-6 md:w-10 md:h-10 text-[var(--text-muted)]" strokeWidth={1.5} />
          </div>
          <h3 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] uppercase tracking-tight mb-4">No Agents Found</h3>
          <p className="text-base md:text-lg font-semibold text-[var(--text-secondary)] opacity-80 mb-8 md:mb-10 leading-relaxed">No autonomous units match your current search parameters.</p>
          <Button 
            variant="outline" 
            onClick={() => setSearchQuery('')}
            className="h-12 md:h-14 px-8 md:px-12 rounded-[18px] md:rounded-[22px] border-[var(--border-subtle)] text-[var(--text-primary)] font-bold text-[10px] md:text-[11px] uppercase tracking-[0.2em] hover:bg-[var(--background-hover)] transition-all hover:-translate-y-1"
          >
            Reset Filters
          </Button>
        </Card>
      )}
    </div>
  );
}
