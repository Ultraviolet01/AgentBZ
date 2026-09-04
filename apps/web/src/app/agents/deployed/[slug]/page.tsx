'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, AlertCircle, Clock, ShieldCheck } from 'lucide-react';
import { RunAgentButton } from '@/components/RunAgentButton';

export default function DeployedAgentPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const [agent, setAgent] = useState<any>(null);
  const isNewlyDeployed = searchParams?.get('deployed') === 'true';

  useEffect(() => {
    fetchAgent();
  }, [params.slug]);

  const fetchAgent = async () => {
    const response = await fetch(`/api/agents/deployed/${params.slug}`);
    if (response.ok) {
      const data = await response.json();
      setAgent(data.agent);
    }
  };

  if (!agent) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      
      {/* Success Banner */}
      {isNewlyDeployed && (
        <Card className="bg-green-50 border-green-200 p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-green-900 mb-2">
                Agent Deployed Successfully!
              </h3>
              <p className="text-sm text-green-700 mb-4">
                Your agent has been submitted for review. We'll notify you within 24-48 hours once it's approved.
              </p>
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Clock className="w-4 h-4" />
                Status: Pending Review
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Agent Details */}
      <Card className="bg-white border border-gray-200 p-8">
        <div className="flex items-start gap-6 mb-8">
          <div 
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl"
            style={{ backgroundColor: agent.color + '20' }}
          >
            {agent.icon}
          </div>
          
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{agent.name}</h1>
              <Badge 
                className={
                  agent.status === 'live' ? 'bg-green-100 text-green-700' :
                  agent.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }
              >
                {agent.status}
              </Badge>
            </div>
            
            <p className="text-gray-600 mb-4">{agent.description}</p>
            
            <div className="flex items-center gap-4 text-sm">
              <span className="px-3 py-1 bg-gray-100 rounded-full text-gray-700 font-medium">
                {agent.category}
              </span>
              <span className="text-orange-600 font-bold">
                {agent.pricePerRun} CRD per run
              </span>
              <span className="text-gray-600">
                {agent.totalRuns} runs
              </span>
              
              {agent.teeAttestation && (
                <div className="flex items-center space-x-1.5 px-3 py-1 bg-green-50 border border-green-100 rounded-full">
                  <ShieldCheck size={14} className="text-green-600" />
                  <span className="text-[11px] font-bold uppercase text-green-700 tracking-widest">
                    TEE Verified
                  </span>
                </div>
              )}

              {agent.hcs14TopicId && (
                <div className="mt-2">
                  <a
                    href={agent.hcs14HashscanUrl || `https://hashscan.io/testnet/topic/${agent.hcs14TopicId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:text-blue-600 underline font-medium flex items-center gap-1"
                  >
                    ↗ Verify on-chain identity (HCS-14) — HashScan
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-gray-200 bg-gray-50/70 p-5">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Run this agent</h2>
            <p className="text-sm text-gray-600">Hedera testnet x402 payment settled via Blocky402.</p>
          </div>
          <RunAgentButton
            agentId={agent.id}
            agentName={agent.name}
            priceHbar={agent.priceHbar ?? agent.pricePerRun ?? 1.0}
          />
        </div>

        {/* Documentation */}
        {agent.readme && (
          <div className="prose max-w-none mt-8">
            <h2>Documentation</h2>
            <div dangerouslySetInnerHTML={{ __html: agent.readme }} />
          </div>
        )}
      </Card>
    </div>
  );
}
