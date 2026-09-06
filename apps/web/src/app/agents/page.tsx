'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Sparkles, Search, ArrowRight, Cpu, Activity, BarChart3, TrendingUp, ArrowUp, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AgentsPage() {
  const router = useRouter();
  

  const agents = [
    {
      id: 'scamsniff',
      name: 'ScamSniff',
      description: 'Advanced social & smart contract threat analysis. Real-time authenticity verification for on-chain interactions.',
      icon: Shield,
      iconColor: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      badge: 'HIGH ACCURACY',
      badgeColor: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      cost: '1 HBAR',
      status: 'active',
      totalRuns: 1247,
      successRate: 99.2
    },
    {
      id: 'threadsmith',
      name: 'ThreadSmith',
      description: 'Context-aware AI content synthesis. Transform raw intelligence into viral-ready threads for the Web3 ecosystem.',
      icon: Sparkles,
      iconColor: 'text-[#f5a623]',
      bgColor: 'bg-[#f5a623]/10',
      badge: 'MULTI-MODAL',
      badgeColor: 'bg-[#f5a623]/10 text-[#f5a623] border-[#f5a623]/20',
      cost: '1 HBAR',
      status: 'active',
      totalRuns: 856,
      successRate: 97.8
    },
    {
      id: 'launchwatch',
      name: 'LaunchWatch',
      description: 'Autonomous real-time monitoring & alerting. 24/7 project health surveillance across modular networks.',
      icon: Search,
      iconColor: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      badge: '24/7 PULSE',
      badgeColor: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      cost: '1 HBAR',
      status: 'active',
      totalRuns: 432,
      successRate: 98.5
    }
  ];

  const totalRuns = agents.reduce((acc, agent) => acc + agent.totalRuns, 0);
  const avgSuccessRate = (agents.reduce((acc, agent) => acc + agent.successRate, 0) / agents.length).toFixed(1);

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-100/30 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-100/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="p-6 lg:p-10 max-w-7xl mx-auto relative z-10 space-y-8 pb-16">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center shadow-md shadow-orange-200">
               <Cpu className="w-6 h-6 text-white" strokeWidth={3} />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight uppercase leading-none">Agents</h1>
              <p className="text-[10px] font-bold text-orange-600 tracking-[0.3em] uppercase mt-1">Intelligence Console</p>
            </div>
          </div>
          <p className="text-base font-semibold text-gray-600 max-w-2xl leading-relaxed">
            AgentBazaar&apos;s built-in intelligence agents - production-ready nodes for autonomous decision making.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Operational Agents */}
          <Card className="bg-white border border-gray-200 p-8 shadow-sm hover:shadow-md transition-shadow group rounded-[32px]">
            <div className="flex items-center justify-between mb-6">
              <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <TrendingUp className="w-7 h-7 text-orange-600" />
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100">
                <ArrowUp className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">12%</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-4xl font-bold text-gray-900 tracking-tight">{agents.length}</p>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Operational Agents</p>
            </div>
          </Card>

          {/* Cumulative Cycles */}
          <Card className="bg-white border border-gray-200 p-8 shadow-sm hover:shadow-md transition-shadow group rounded-[32px]">
            <div className="flex items-center justify-between mb-6">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <Activity className="w-7 h-7 text-blue-600" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-4xl font-bold text-gray-900 tracking-tight">{totalRuns.toLocaleString()}</p>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Cumulative Cycles</p>
            </div>
          </Card>

          {/* Integrity Index - Highlighted */}
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 p-8 shadow-xl shadow-orange-100 hover:shadow-2xl hover:shadow-orange-200 transition-all duration-500 border-0 group rounded-[32px] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full -mr-10 -mt-10" />
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:rotate-12 transition-transform duration-500">
                <Zap className="w-7 h-7 text-white" />
              </div>
            </div>
            <div className="space-y-1 relative z-10">
              <p className="text-4xl font-bold text-white tracking-tight">{avgSuccessRate}%</p>
              <p className="text-xs text-orange-100 font-bold uppercase tracking-widest">Integrity Index</p>
            </div>
          </Card>
        </div>

        {/* Agent Cards */}
        <div className="space-y-6">
          {agents.map((agent) => {
            const Icon = agent.icon;
            
            return (
              <Card 
                key={agent.id}
                variant="elevated"
                isClickable={true}
                className="p-8 group relative rounded-3xl overflow-hidden"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
                  
                  {/* Agent Info */}
                  <div className="flex items-start gap-8 flex-1">
                    <div className={`w-20 h-20 rounded-2xl ${agent.bgColor} border border-white flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105 duration-500`}>
                      <Icon className={`w-10 h-10 ${agent.iconColor}`} strokeWidth={2.5} />
                    </div>
                    
                    <div className="flex-1 space-y-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-2xl font-bold text-gray-900 tracking-tight uppercase">{agent.name}</h3>
                        <Badge variant={agent.id === 'scamsniff' ? 'success' : agent.id === 'threadsmith' ? 'warning' : 'info'}>
                          {agent.badge}
                        </Badge>
                        <div className="flex items-center gap-2 py-1 px-3 rounded-full bg-emerald-50 border border-emerald-100">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Live</span>
                        </div>
                      </div>
                      
                      <p className="text-sm font-semibold text-gray-600 max-w-2xl leading-relaxed">
                        {agent.description}
                      </p>

                      {/* Agent Stats */}
                      <div className="flex flex-wrap items-center gap-x-10 gap-y-4 pt-2">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-1">Execution Fee</span>
                          <span className="text-orange-600 font-bold text-base tracking-tight">{agent.cost}</span>
                        </div>
                        <div className="w-px h-8 bg-gray-100 hidden sm:block" />
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-1">Cycle History</span>
                          <span className="text-gray-900 font-bold text-base tracking-tight">{agent.totalRuns.toLocaleString()}</span>
                        </div>
                        <div className="w-px h-8 bg-gray-100 hidden sm:block" />
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-1">Success Index</span>
                          <span className="text-emerald-600 font-bold text-base tracking-tight">{agent.successRate}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => router.push(`/agents/${agent.id}`)}
                      className="bg-orange-500 hover:bg-orange-600 text-white shadow-md w-28"
                      size="sm"
                    >
                      Launch →
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
