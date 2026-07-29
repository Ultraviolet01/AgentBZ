'use client';

import { useState } from 'react';
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
  Check
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export default function MarketplacePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

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

  // Built-in agents
  const agentBazaarAgents = [
    {
      id: 'scamsniff',
      name: 'ScamSniff',
      description: 'Advanced social & smart contract threat analysis',
      icon: Shield,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-100',
      badgeText: 'HIGH ACCURACY',
      badgeColor: 'bg-green-100 text-green-700',
      cost: '$0.10 / run',
      creator: 'AgentBazaar',
      verified: true,
      trending: true,
      installs: 1247
    },
    {
      id: 'threadsmith',
      name: 'ThreadSmith',
      description: 'Context-aware AI content synthesis',
      icon: Sparkles,
      iconColor: 'text-orange-600',
      bgColor: 'bg-orange-100',
      badgeText: 'MULTI-MODAL',
      badgeColor: 'bg-orange-100 text-orange-700',
      cost: '$0.10 / run',
      creator: 'AgentBazaar',
      verified: true,
      trending: true,
      installs: 856
    },
    {
      id: 'launchwatch',
      name: 'LaunchWatch',
      description: 'Autonomous real-time monitoring & alerting',
      icon: Search,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-100',
      badgeText: '24/7 PULSE',
      badgeColor: 'bg-blue-100 text-blue-700',
      cost: '$0.10 / run',
      creator: 'AgentBazaar',
      verified: true,
      trending: false,
      installs: 432
    }
  ];

  // Community agents (examples)
  const communityAgents = [
    {
      id: 'tokenscout',
      name: 'TokenScout',
      description: 'Automated token discovery and analysis',
      icon: TrendingUp,
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-100',
      badgeText: 'ANALYTICS',
      badgeColor: 'bg-purple-100 text-purple-700',
      cost: '$0.10 / run',
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

  // FIXED: Proper navigation handler
  const handleLaunchAgent = (agentId: string) => {
    console.log('Launching agent:', agentId);
    router.push(`/agents/${agentId}`);
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-gray-600 font-medium">System Live</span>
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-4 leading-tight uppercase">
          Agent
          <br />
          <span className="text-orange-600">Marketplace.</span>
        </h1>
        <p className="text-base text-gray-600 max-w-2xl">
          Discover, run, and publish AI agents with verifiable memory and permanent artifacts 
          on the world&apos;s first AI-native modular data layer.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-white border-gray-300 pl-10"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            className={filter === 'all' ? 'bg-orange-500 text-white' : 'border-gray-300 text-gray-700'}
            size="sm"
          >
            All Agents
          </Button>
          <Button
            variant={filter === 'agentbazaar' ? 'default' : 'outline'}
            onClick={() => setFilter('agentbazaar')}
            className={filter === 'agentbazaar' ? 'bg-orange-500 text-white' : 'border-gray-300 text-gray-700'}
            size="sm"
          >
            AgentBazaar
          </Button>
          <Button
            variant={filter === 'community' ? 'default' : 'outline'}
            onClick={() => setFilter('community')}
            className={filter === 'community' ? 'bg-orange-500 text-white' : 'border-gray-300 text-gray-700'}
            size="sm"
          >
            Community
          </Button>
        </div>
      </div>

      {/* Trending Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-orange-600" />
          <h2 className="text-xl font-semibold text-gray-900">Trending Intelligence</h2>
        </div>
        
        <div className="grid md:grid-cols-3 gap-4">
          {allAgents
            .filter(agent => agent.trending)
            .slice(0, 3)
            .map((agent) => {
              const Icon = agent.icon;
              return (
                <Card 
                  key={agent.id}
                  className="bg-white border border-gray-200 p-5 hover:border-orange-300 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => handleLaunchAgent(agent.id)}
                >
                  <div className={`w-12 h-12 rounded-xl ${agent.bgColor} flex items-center justify-center mb-3`}>
                    <Icon className={`w-6 h-6 ${agent.iconColor}`} />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{agent.name}</h3>
                    {agent.verified && (
                      <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{agent.description}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">{agent.installs} runs</span>
                    <span className="text-orange-600 font-medium">{agent.cost}</span>
                  </div>
                </Card>
              );
            })}
        </div>
      </div>

      {/* All Agents Grid */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {filter === 'all' && 'All Agents'}
          {filter === 'agentbazaar' && 'AgentBazaar Agents'}
          {filter === 'community' && 'Community Agents'}
        </h2>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAgents.map((agent) => {
          const Icon = agent.icon;
          return (
            <Card 
              key={agent.id}
              className="bg-white border border-gray-200 p-5 hover:border-orange-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-12 h-12 rounded-xl ${agent.bgColor} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${agent.iconColor}`} />
                </div>
                {agent.trending && (
                  <Badge className="bg-orange-100 text-orange-600 border-0 text-xs">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Trending
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{agent.name}</h3>
                {agent.verified && (
                  <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-500 mb-2">by {agent.creator}</p>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{agent.description}</p>

              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-gray-500">{agent.installs} runs</span>
                <span className="text-sm text-orange-600 font-medium">{agent.cost}</span>
              </div>

              {/* FIXED: Proper Launch Button */}
              <Button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card click
                  handleLaunchAgent(agent.id);
                }}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white shadow-md transition-all"
                size="sm"
              >
                Launch
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredAgents.length === 0 && (
        <Card className="bg-white border border-gray-200 p-12 text-center shadow-sm">
          <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No agents found matching your search</p>
        </Card>
      )}
    </div>
  );
}
