'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Plus, 
  Bot,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function MarketplacePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace('/');
      } else if (!user.onboardingCompleted) {
        router.replace('/onboarding');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || !user.onboardingCompleted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  // Built-in featured agents: ThreadSmith, ScamSniff, LaunchWatch, Sentinel
  const marketplaceAgents = [
    {
      id: 'scamsniff',
      slug: 'scamsniff',
      name: 'ScamSniff',
      description: 'Advanced Web3 smart contract, honeypot & rug-pull security auditing with on-chain proofs.',
      icon: Shield,
      iconColor: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      badgeText: 'SECURITY AUDIT',
      badgeColor: 'bg-emerald-100 text-emerald-700',
      cost: '1.0 HBAR',
      creator: 'AgentBazaar Core',
      verified: true,
      trending: true,
      installs: 1247,
      rating: 4.9,
      category: 'Web3 Security',
    },
    {
      id: 'threadsmith',
      slug: 'threadsmith',
      name: 'ThreadSmith',
      description: 'Viral social media & thread generator with multi-tone synthesis and brand voice memory.',
      icon: Sparkles,
      iconColor: 'text-orange-600',
      bgColor: 'bg-orange-100',
      badgeText: 'SOCIAL & VIRAL',
      badgeColor: 'bg-orange-100 text-orange-700',
      cost: '0.8 HBAR',
      creator: 'AgentBazaar Core',
      verified: true,
      trending: true,
      installs: 856,
      rating: 4.9,
      category: 'Social & Content',
    },
    {
      id: 'launchwatch',
      slug: 'launchwatch',
      name: 'LaunchWatch',
      description: 'Autonomous 24/7 token monitoring, FDV milestones & real-time threshold alert engine.',
      icon: Search,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-100',
      badgeText: 'REAL-TIME MONITOR',
      badgeColor: 'bg-blue-100 text-blue-700',
      cost: '1.5 HBAR',
      creator: 'AgentBazaar Core',
      verified: true,
      trending: true,
      installs: 432,
      rating: 4.8,
      category: 'Crypto & Trading',
    },
    {
      id: 'sentinel',
      slug: 'sentinel',
      name: 'Sentinel',
      description: 'Real-time AI sentiment and security analyzer for Web3 tokens and contracts.',
      icon: Bot,
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-100',
      badgeText: 'ANALYTICS',
      badgeColor: 'bg-purple-100 text-purple-700',
      cost: '1.0 HBAR',
      creator: '0.0.10389860',
      verified: true,
      trending: true,
      installs: 320,
      rating: 5.0,
      category: 'Analytics',
    }
  ];

  const filteredAgents = marketplaceAgents.filter(agent => {
    const query = searchQuery.toLowerCase();
    return agent.name.toLowerCase().includes(query) ||
           agent.description.toLowerCase().includes(query) ||
           agent.category.toLowerCase().includes(query);
  });

  const handleLaunchAgent = (agent: any) => {
    router.push(`/agents/${agent.slug}`);
  };

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

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="flex-1 w-full relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search agents by name, topic, or capability..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-white border-gray-200 pl-11 h-12 rounded-2xl text-sm font-medium shadow-sm focus-visible:ring-orange-500"
          />
        </div>
      </div>

      {/* Featured / Trending Section */}
      {searchQuery === '' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Featured Intelligence</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {marketplaceAgents.map((agent) => {
              const Icon = agent.icon;
              return (
                <Card 
                  key={agent.id}
                  onClick={() => handleLaunchAgent(agent)}
                  className="bg-white border border-gray-200/80 rounded-3xl p-6 hover:border-orange-300 hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className={`w-14 h-14 rounded-2xl ${agent.bgColor} flex items-center justify-center transition-transform group-hover:scale-105`}>
                        <Icon className={`w-7 h-7 ${agent.iconColor}`} />
                      </div>
                      <Badge className="bg-orange-50 text-orange-700 border border-orange-200 font-bold text-[10px] px-2.5 py-1 rounded-lg">
                        {agent.badgeText}
                      </Badge>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition-colors">{agent.name}</h3>
                        <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[10px] text-white">
                          ✓
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">by {agent.creator}</p>
                    </div>

                    <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">{agent.description}</p>
                  </div>

                  <div className="pt-6 mt-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">{agent.cost} / run</span>
                    </div>
                    <Button size="sm" className="bg-orange-500 group-hover:bg-orange-600 text-white font-bold rounded-xl text-xs h-9 px-4 gap-1.5 shadow-sm">
                      Launch <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Catalog Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            All Active Agents
          </h2>
          <span className="text-xs font-bold text-gray-400 font-mono">{filteredAgents.length} Agents Available</span>
        </div>

        {filteredAgents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents.map((agent) => {
              const Icon = agent.icon;
              return (
                <Card 
                  key={agent.id}
                  onClick={() => handleLaunchAgent(agent)}
                  className="bg-white border border-gray-200/80 rounded-3xl p-6 hover:border-orange-300 hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className={`w-13 h-13 rounded-2xl ${agent.bgColor} flex items-center justify-center transition-transform group-hover:scale-105`}>
                        <Icon className={`w-6 h-6 ${agent.iconColor}`} />
                      </div>
                      <Badge className="bg-gray-100 text-gray-700 font-bold text-[10px] px-2.5 py-1 rounded-lg border border-gray-200">
                        {agent.badgeText || agent.category}
                      </Badge>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-gray-900 group-hover:text-orange-600 transition-colors">{agent.name}</h3>
                        {agent.verified && (
                          <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[10px] text-white" title="Verified On-Chain">
                            ✓
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">by {agent.creator}</p>
                    </div>

                    <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">{agent.description}</p>
                  </div>

                  <div className="pt-5 mt-4 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg text-xs">
                        {agent.cost}
                      </span>
                    </div>
                    <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs h-9 px-4 gap-1.5 shadow-sm">
                      Run <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="bg-white border border-gray-200 rounded-3xl p-12 text-center shadow-sm space-y-4">
            <Filter className="w-12 h-12 text-gray-300 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-gray-900">No agents found</h3>
              <p className="text-xs text-gray-500">No agents matched &ldquo;{searchQuery}&rdquo;.</p>
            </div>
          </Card>
        )}
      </div>

    </div>
  );
}
