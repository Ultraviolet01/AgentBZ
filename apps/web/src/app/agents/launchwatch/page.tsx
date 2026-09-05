'use client';

export const dynamic = 'force-dynamic';


import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { 
  Search, 
  Play, 
  Check, 
  Loader2,
  Mail,
  TrendingUp,
  Bell,
  X,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

type MonitoringType = 'project' | 'token_milestone' | 'crypto_news';

export default function LaunchWatchPage() {
  const [step, setStep] = useState<'type' | 'setup' | 'active'>('type');
  const [monitoringType, setMonitoringType] = useState<MonitoringType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeMonitors, setActiveMonitors] = useState<any[]>([]);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'broadcasting' | 'mined' | 'verifying' | 'done'>('idle');
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    email: '',
    notificationEmail: '',
    projectUrl: '',
    monitorSocial: true,
    monitorWebsite: true,
    monitorSentiment: true,
    checkFrequency: 'daily',
    contractAddress: '',
    tokenSymbol: '',
    currentFDV: '',
    targetFDV: '',
    newsTopics: [] as string[],
    newsFrequency: 'daily'
  });

  const handleStartSetup = (type: MonitoringType) => {
    setMonitoringType(type);
    setStep('setup');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      setPaymentStatus('broadcasting');

      const response = await fetch('/api/agents/launchwatch/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monitoringType,
          ...formData
        })
      });

      const data = await response.json();

      if (data.success) {
        setActiveMonitors([...activeMonitors, { ...data.monitor, txHash: data.txHash }]);
        setStep('active');
        setPaymentStatus('done');
      } else {
        throw new Error(data.error || 'Setup failed');
      }
    } catch (error: any) {
      console.error('Setup error:', error);
      alert('Failed to setup monitoring: ' + error.message);
      setPaymentStatus('idle');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopMonitoring = async (monitorId: string) => {
    try {
      await fetch(`/api/agents/launchwatch/stop/${monitorId}`, {
        method: 'POST'
      });
      
      setActiveMonitors(activeMonitors.filter(m => m.id !== monitorId));
    } catch (error) {
      console.error('Stop monitoring error:', error);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center">
            <Search className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">LaunchWatch</h1>
            <p className="text-sm text-gray-600">24/7 autonomous project monitoring & alerts</p>
          </div>
        </div>
        <Badge className="bg-blue-100 text-blue-700">24/7 PULSE</Badge>
      </div>

      {/* Step 1: Choose Monitoring Type */}
      {step === 'type' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            What do you want to monitor?
          </h2>

          {/* Project Monitoring */}
          <Card 
            className="bg-white border border-gray-200 p-6 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
            onClick={() => handleStartSetup('project')}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Search className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Project Activity Monitoring
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Track social activity, website changes, sentiment shifts, and community updates
                  for any Web3 project or token.
                </p>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">Social Tracking</Badge>
                  <Badge variant="outline" className="text-xs">Website Monitor</Badge>
                  <Badge variant="outline" className="text-xs">Sentiment Analysis</Badge>
                </div>
              </div>
            </div>
          </Card>

          {/* Token Milestone Pump */}
          <Card 
            className="bg-white border border-gray-200 p-6 hover:border-green-300 hover:shadow-md transition-all cursor-pointer"
            onClick={() => handleStartSetup('token_milestone')}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Token Milestone Pump Alert
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Set FDV targets for any token. Get instant email alerts when your token 
                  reaches the milestone you set.
                </p>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">FDV Tracking</Badge>
                  <Badge variant="outline" className="text-xs">Price Alerts</Badge>
                  <Badge variant="outline" className="text-xs">Real-time</Badge>
                </div>
              </div>
            </div>
          </Card>

          {/* Crypto News */}
          <Card 
            className="bg-white border border-gray-200 p-6 hover:border-orange-300 hover:shadow-md transition-all cursor-pointer"
            onClick={() => handleStartSetup('crypto_news')}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                <Mail className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Crypto News Digest
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Receive curated crypto news, market updates, and trending topics 
                  directly to your email. Daily, weekly, or real-time.
                </p>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">Market News</Badge>
                  <Badge variant="outline" className="text-xs">DeFi Updates</Badge>
                  <Badge variant="outline" className="text-xs">Trending Topics</Badge>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Step 2: Setup Form */}
      {step === 'setup' && (
        <form onSubmit={handleSubmit}>
          <Card className="bg-white border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Setup {monitoringType === 'project' && 'Project Monitoring'}
                {monitoringType === 'token_milestone' && 'Milestone Alert'}
                {monitoringType === 'crypto_news' && 'News Digest'}
              </h2>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep('type')}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              
              {/* Common: Notification Email */}
              <div>
                <Label htmlFor="notificationEmail" className="text-sm font-medium text-gray-700">
                  Notification Email *
                </Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="notificationEmail"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.notificationEmail}
                    onChange={(e) => setFormData({ ...formData, notificationEmail: e.target.value })}
                    className="bg-white border-gray-300 pl-10"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Alerts and updates will be sent to this email
                </p>
              </div>

              {/* PROJECT MONITORING FIELDS */}
              {monitoringType === 'project' && (
                <>
                  <div>
                    <Label htmlFor="projectUrl" className="text-sm font-medium text-gray-700">
                      Project URL or Twitter Handle *
                    </Label>
                    <Input
                      id="projectUrl"
                      placeholder="https://project.com or @TwitterHandle"
                      value={formData.projectUrl}
                      onChange={(e) => setFormData({ ...formData, projectUrl: e.target.value })}
                      className="bg-white border-gray-300 mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-3 block">
                      What to Monitor
                    </Label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={formData.monitorSocial}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, monitorSocial: checked as boolean })
                          }
                        />
                        <span className="text-sm text-gray-700">Social Media Activity</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={formData.monitorWebsite}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, monitorWebsite: checked as boolean })
                          }
                        />
                        <span className="text-sm text-gray-700">Website Changes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={formData.monitorSentiment}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, monitorSentiment: checked as boolean })
                          }
                        />
                        <span className="text-sm text-gray-700">Sentiment Shifts</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="checkFrequency" className="text-sm font-medium text-gray-700">
                      Check Frequency
                    </Label>
                    <Select 
                      value={formData.checkFrequency} 
                      onValueChange={(value) => setFormData({ ...formData, checkFrequency: value })}
                    >
                      <SelectTrigger className="bg-white border-gray-300 mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Every Hour</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {/* TOKEN MILESTONE FIELDS */}
              {monitoringType === 'token_milestone' && (
                <>
                  <div>
                    <Label htmlFor="contractAddress" className="text-sm font-medium text-gray-700">
                      Token Contract Address *
                    </Label>
                    <Input
                      id="contractAddress"
                      placeholder="0x..."
                      value={formData.contractAddress}
                      onChange={(e) => setFormData({ ...formData, contractAddress: e.target.value })}
                      className="bg-white border-gray-300 mt-1 font-mono text-sm"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter the token contract address (ERC-20, BEP-20, etc.)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="tokenSymbol" className="text-sm font-medium text-gray-700">
                      Token Symbol (Optional)
                    </Label>
                    <Input
                      id="tokenSymbol"
                      placeholder="e.g., ETH, BNB, USDT"
                      value={formData.tokenSymbol}
                      onChange={(e) => setFormData({ ...formData, tokenSymbol: e.target.value })}
                      className="bg-white border-gray-300 mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="currentFDV" className="text-sm font-medium text-gray-700">
                        Current FDV (USD)
                      </Label>
                      <Input
                        id="currentFDV"
                        type="number"
                        placeholder="e.g., 1000000"
                        value={formData.currentFDV}
                        onChange={(e) => setFormData({ ...formData, currentFDV: e.target.value })}
                        className="bg-white border-gray-300 mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">Optional reference</p>
                    </div>

                    <div>
                      <Label htmlFor="targetFDV" className="text-sm font-medium text-gray-700">
                        Target FDV (USD) *
                      </Label>
                      <Input
                        id="targetFDV"
                        type="number"
                        placeholder="e.g., 10000000"
                        value={formData.targetFDV}
                        onChange={(e) => setFormData({ ...formData, targetFDV: e.target.value })}
                        className="bg-white border-gray-300 mt-1"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Alert when reached</p>
                    </div>
                  </div>

                  {/* FDV Preview */}
                  {formData.targetFDV && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Bell className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-900">
                          Alert Preview
                        </span>
                      </div>
                      <p className="text-sm text-green-700">
                        You&apos;ll receive an email when the token reaches{' '}
                        <strong>${parseInt(formData.targetFDV).toLocaleString()}</strong> FDV
                        {formData.currentFDV && ` (${((parseFloat(formData.targetFDV) / parseFloat(formData.currentFDV)) * 100).toFixed(0)}% gain from current)`}
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* CRYPTO NEWS FIELDS */}
              {monitoringType === 'crypto_news' && (
                <>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-3 block">
                      News Topics (Select at least one)
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        'DeFi Updates',
                        'NFT & Gaming',
                        'Layer 1 & Layer 2',
                        'Regulation & Policy',
                        'Market Analysis',
                        'Ecosystem News',
                        'Security & Exploits',
                        'Trending Projects'
                      ].map((topic) => (
                        <div key={topic} className="flex items-center gap-2">
                          <Checkbox
                            checked={formData.newsTopics.includes(topic)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData({
                                  ...formData,
                                  newsTopics: [...formData.newsTopics, topic]
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  newsTopics: formData.newsTopics.filter(t => t !== topic)
                                });
                              }
                            }}
                          />
                          <span className="text-sm text-gray-700">{topic}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="newsFrequency" className="text-sm font-medium text-gray-700">
                      Delivery Frequency
                    </Label>
                    <Select 
                      value={formData.newsFrequency} 
                      onValueChange={(value) => setFormData({ ...formData, newsFrequency: value })}
                    >
                      <SelectTrigger className="bg-white border-gray-300 mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="realtime">Real-time (as it happens)</SelectItem>
                        <SelectItem value="daily">Daily Digest (8 AM)</SelectItem>
                        <SelectItem value="weekly">Weekly Summary (Mondays)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <div className="pt-4 flex justify-center">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white shadow-md font-semibold text-sm rounded-xl transition-all"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Initializing Agent...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      START MONITORING
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </form>
      )}

      {/* Step 3: Active Monitors */}
      {step === 'active' && activeMonitors.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Active Monitors</h2>
            <Button
              onClick={() => setStep('type')}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              Add New Monitor
            </Button>
          </div>

          {activeMonitors.map((monitor) => (
            <Card key={monitor.id} className="bg-white border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-medium text-green-600">Active — Verified via Hedera HCS</span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {monitor.type === 'project' && `Project: ${monitor.projectUrl}`}
                    {monitor.type === 'token_milestone' && `Token Milestone: ${monitor.tokenSymbol || 'Token'}`}
                    {monitor.type === 'crypto_news' && 'Crypto News Digest'}
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-3">
                    Notifications: {monitor.email}
                  </p>

                  {(() => {
                    let displayTx = monitor.txHash;
                    if (typeof displayTx === 'string' && displayTx.trim().startsWith('{')) {
                      try {
                        const parsed = JSON.parse(displayTx);
                        displayTx = parsed.nonce || parsed.txHash || null;
                      } catch {
                        displayTx = null;
                      }
                    }
                    if (!displayTx) return null;
                    return (
                      <div className="mb-3">
                        <a
                          href={`https://hashscan.io/testnet/transaction/${displayTx}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline font-mono"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                          On-Chain Proof: {displayTx.slice(0, 10)}...{displayTx.slice(-8)}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    );
                  })()}

                  {monitor.type === 'token_milestone' && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Contract:</span>
                          <p className="font-mono text-xs text-gray-900 mt-1">
                            {monitor.contractAddress ? `${monitor.contractAddress.slice(0, 10)}...${monitor.contractAddress.slice(-8)}` : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Target FDV:</span>
                          <p className="font-semibold text-gray-900 mt-1">
                            {monitor.targetFDV && !isNaN(Number(monitor.targetFDV)) 
                              ? `$${Number(monitor.targetFDV).toLocaleString()}` 
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Next check: 2 hours</span>
                    <span>•</span>
                    <span>Total checks: {monitor.totalChecks || 0}</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={() => handleStopMonitoring(monitor.id)}
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  Stop
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
