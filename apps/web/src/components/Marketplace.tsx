'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Sparkles, 
  Search, 
  TrendingUp,
  Filter,
  ArrowRight,
  Check,
  Cpu,
  Globe,
  Users
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function Marketplace() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'agentbazaar' | 'community'>('all');

  // Built-in agents
  const agentBazaarAgents = [
    {
      id: 'scamsniff',
      route: '/scamsniff',
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
      installs: 1247
    },
    {
      id: 'threadsmith',
      route: '/threadsmith',
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
      installs: 856
    },
    {
      id: 'launchwatch',
      route: '/launchwatch',
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
      installs: 432
    }
  ];

  // Community/Third-party agents
  const communityAgents = [
    {
      id: 'tokenscout',
      route: '/agents', // Placeholder
      name: 'TokenScout',
      description: 'Automated token discovery and analysis. Identifies high-velocity alpha before the market reacts.',
      icon: TrendingUp,
      iconColor: 'text-indigo-500',
      bgColor: 'bg-indigo-50',
      badge: 'ANALYTICS',
      badgeColor: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
      cost: '1 HBAR',
      creator: 'CryptoLabs',
      verified: false,
      trending: true,
      installs: 234
    }
  ];

  const allAgents = [...agentBazaarAgents, ...communityAgents];

  const filteredAgents = allAgents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         agent.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || 
                         (filter === 'agentbazaar' && agent.creator === 'AgentBazaar') ||
                         (filter === 'community' && agent.creator !== 'AgentBazaar');
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto min-h-screen bg-[var(--background-secondary)] relative">
      
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
          Discover, deploy, and scale AI-native autonomous agents on a decentralized data layer. Verifiable memory, permanent artifacts.
        </p>
      </div>


      {/* Search & Filters */}
      <div className="flex flex-col xl:flex-row items-center gap-6 mb-20">
        <div className="flex-1 w-full relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] group-focus-within:text-[var(--accent-orange)] transition-colors" strokeWidth={2.5} />
          <input
            placeholder="Search decentralized protocol nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-14 md:h-16 bg-[var(--background-card)] border border-[var(--border-subtle)] pl-12 md:pl-16 pr-6 text-sm font-bold text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-[20px] md:rounded-[24px] focus:outline-none focus:ring-4 focus:ring-orange-50 focus:border-[var(--accent-orange)] shadow-[var(--shadow-sm)] transition-all uppercase tracking-tight"
          />
        </div>
        
        <div className="flex items-center gap-1 p-1.5 md:p-2 bg-[var(--background-secondary)] border border-[var(--border-subtle)] rounded-[24px] md:rounded-[28px] shadow-inner w-full md:w-auto overflow-x-auto no-scrollbar">
          <Button
            onClick={() => setFilter('all')}
            variant="ghost"
            className={cn(
               "h-10 md:h-12 px-4 md:px-8 rounded-[18px] md:rounded-[22px] text-[10px] md:text-[11px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
               filter === 'all' ? "bg-white text-[var(--text-primary)] shadow-[var(--shadow-md)] border border-[var(--border-subtle)]" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            )}
          >
            <Globe className={cn("w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2", filter === 'all' ? "text-[var(--accent-orange)]" : "text-[var(--text-muted)]")} strokeWidth={2.5} />
            All Nodes
          </Button>
          <Button
             onClick={() => setFilter('agentbazaar')}
             variant="ghost"
             className={cn(
                 "h-10 md:h-12 px-4 md:px-8 rounded-[18px] md:rounded-[22px] text-[10px] md:text-[11px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                 filter === 'agentbazaar' ? "bg-white text-[var(--text-primary)] shadow-[var(--shadow-md)] border border-[var(--border-subtle)]" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
             )}
          >
            <Cpu className={cn("w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2", filter === 'agentbazaar' ? "text-[var(--accent-orange)]" : "text-[var(--text-muted)]")} strokeWidth={2.5} />
            Official
          </Button>
          <Button
            onClick={() => setFilter('community')}
            variant="ghost"
            className={cn(
               "h-10 md:h-12 px-4 md:px-8 rounded-[18px] md:rounded-[22px] text-[10px] md:text-[11px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
               filter === 'community' ? "bg-white text-[var(--text-primary)] shadow-[var(--shadow-md)] border border-[var(--border-subtle)]" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            )}
          >
            <Users className={cn("w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2", filter === 'community' ? "text-[var(--accent-orange)]" : "text-[var(--text-muted)]")} strokeWidth={2.5} />
            Community
          </Button>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="mb-8 md:mb-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
            <h2 className="text-lg md:text-xl font-bold text-[var(--text-primary)] uppercase tracking-tighter">
            {filter === 'all' && 'Available Intelligence'}
            {filter === 'agentbazaar' && 'Verified Registry'}
            {filter === 'community' && 'Community Core'}
            </h2>
            <div className="hidden sm:block h-px w-10 md:w-20 bg-[var(--border-subtle)]" />
        </div>
        <p className="text-[10px] md:text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Showing {filteredAgents.length} Active Nodes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredAgents.map((agent) => {
          const Icon = agent.icon;
          
          // Map agent IDs to specific hover colors for high fidelity
          const themeMap: Record<string, { hoverBorder: string, iconHoverBg: string }> = {
            'scamsniff': { hoverBorder: 'hover:border-green-300', iconHoverBg: 'group-hover:bg-green-100' },
            'threadsmith': { hoverBorder: 'hover:border-orange-300', iconHoverBg: 'group-hover:bg-orange-100' },
            'launchwatch': { hoverBorder: 'hover:border-blue-300', iconHoverBg: 'group-hover:bg-blue-100' },
            'tokenscout': { hoverBorder: 'hover:border-indigo-300', iconHoverBg: 'group-hover:bg-indigo-100' },
          };
          
          const theme = themeMap[agent.id] || { hoverBorder: 'hover:border-orange-300', iconHoverBg: 'group-hover:bg-orange-100' };

          return (
            <Card 
              key={agent.id}
              isClickable={true}
              className={cn(
                "bg-white border border-gray-200 p-6 flex flex-col rounded-[32px]",
                theme.hoverBorder
              )}
            >
              <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center transition-colors mb-4", agent.bgColor, theme.iconHoverBg)}>
                <Icon className={cn("w-7 h-7", agent.iconColor)} strokeWidth={2.5} />
              </div>

              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-semibold text-gray-900 tracking-tight leading-none uppercase">{agent.name}</h3>
                <Badge variant={agent.id === 'scamsniff' ? 'success' : agent.id === 'threadsmith' ? 'warning' : 'info'}>
                  {agent.badge}
                </Badge>
              </div>

              <p className="text-sm text-gray-600 mb-8 line-clamp-3 leading-relaxed flex-1 font-medium">{agent.description}</p>

              <div className="flex items-center justify-between border-t border-gray-50 pt-6 mt-auto">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Fee per run</span>
                  <span className="text-sm font-bold text-gray-900 leading-none">{agent.cost}</span>
                </div>
                <Button 
                  variant="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/agents/${agent.id}`);
                  }}
                  className="px-6 py-2 h-10 rounded-xl"
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
          <h3 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] uppercase tracking-tight mb-4">No Nodes Detected</h3>
          <p className="text-base md:text-lg font-semibold text-[var(--text-secondary)] opacity-80 mb-8 md:mb-10 leading-relaxed">No autonomous units match your current search parameters in our decentralized registry.</p>
          <Button 
            variant="outline" 
            onClick={() => { setSearchQuery(''); setFilter('all'); }}
            className="h-12 md:h-14 px-8 md:px-12 rounded-[18px] md:rounded-[22px] border-[var(--border-subtle)] text-[var(--text-primary)] font-bold text-[10px] md:text-[11px] uppercase tracking-[0.2em] hover:bg-[var(--background-hover)] transition-all hover:-translate-y-1"
          >
            Reset Filters
          </Button>
        </Card>
      )}
    </div>
  );
}
