'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useAccount, useSendTransaction } from 'wagmi';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, AlertCircle, Clock, ShieldCheck, Wallet } from 'lucide-react';
import { payAgentFeeFromWallet } from '@/lib/x402-client';

export default function DeployedAgentPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { isConnected } = useAccount();
  const { sendTransactionAsync } = useSendTransaction();

  const [agent, setAgent] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [runOutput, setRunOutput] = useState<any>(null);
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

  const handleRunAgent = async () => {
    if (!agent) return;

    setIsRunning(true);
    setRunError(null);
    setTxHash(null);
    setRunOutput(null);

    try {
      let clientTxHash: string | undefined = undefined;

      // If buyer has connected their Web3 wallet, pay $0.10 USDC directly to Treasury
      if (isConnected && sendTransactionAsync) {
        try {
          clientTxHash = await payAgentFeeFromWallet(
            sendTransactionAsync as any,
            agent.pricePerRun || 0.1
          );
          setTxHash(clientTxHash);
        } catch (walletErr: any) {
          throw new Error(`Wallet payment canceled or failed: ${walletErr.message || walletErr}`);
        }
      }

      const response = await fetch('/api/agents/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentSlug: agent.slug,
          input: { prompt: 'Run this agent' },
          txHash: clientTxHash,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to run agent');
      }

      setRunOutput(data.output);
      setTxHash(data.txHash || clientTxHash || null);
    } catch (err: any) {
      setRunError(err.message || 'Failed to run agent');
    } finally {
      setIsRunning(false);
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
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-gray-200 bg-gray-50/70 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Run this agent</h2>
              <p className="text-sm text-gray-600">This signs a wallet message and submits the execution request with KeeperHub support.</p>
            </div>
            <Button onClick={handleRunAgent} disabled={isRunning}>
              {isRunning ? 'Running…' : 'Run agent'}
            </Button>
          </div>

          {runError ? <p className="mt-3 text-sm text-red-600">{runError}</p> : null}

          {txHash ? (
            <a
              href={`https://x402scan.com/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex text-sm font-medium text-orange-600 underline"
            >
              View execution on x402scan ↗
            </a>
          ) : null}

          {runOutput ? (
            <pre className="mt-3 overflow-x-auto rounded-xl bg-white p-4 text-xs text-gray-700">
              {JSON.stringify(runOutput, null, 2)}
            </pre>
          ) : null}
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
