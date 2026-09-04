'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Download, 
  Chrome,
  Check,
  AlertTriangle,
  Info,
  ExternalLink
} from 'lucide-react';
import { RunAgentButton } from '@/components/RunAgentButton';

export default function ScamSniffPage() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="p-6 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-green-100 flex items-center justify-center">
              <Shield className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">ScamSniff</h1>
              <p className="text-gray-600">Real-time threat detection & authenticity verification</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className="bg-green-100 text-green-700">HIGH ACCURACY</Badge>
                <Badge className="bg-blue-100 text-blue-700">CLAUDE 4.5 HAIKU</Badge>
                <Badge className="bg-orange-100 text-orange-700">VOICE ENABLED</Badge>
              </div>
            </div>
          </div>

          {/* Download Button */}
          <Button 
            className="bg-orange-500 hover:bg-orange-600 text-white shadow-lg"
            onClick={() => window.open('/scamsniff-extension.zip', '_blank')}
          >
            <Download className="w-4 h-4 mr-2" />
            Download Extension
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {['overview', 'how-it-works', 'reports'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          
          {/* Quick Run with Hedera x402 */}
          <Card className="bg-white border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Run ScamSniff Instant Scan</h2>
            <p className="text-gray-600 text-sm mb-4">
              Enter a contract address or domain to analyze on Hedera testnet with x402 settlement.
            </p>
            <RunAgentButton
              agentId="scamsniff"
              agentName="ScamSniff"
              priceHbar={1.0}
            />
          </Card>
          
          {/* What is ScamSniff */}
          <Card className="bg-white border border-gray-200 p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What is ScamSniff?</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              ScamSniff is a browser extension that provides real-time authenticity verification 
              for Web3 projects, contracts, and social profiles. When you&apos;re browsing and encounter 
              something suspicious, just click the ScamSniff orb to get an instant risk assessment.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-900">
                  <strong>Important:</strong> ScamSniff provides risk-based assessments, not absolute truth. 
                  We gather signals, check them against intelligence sources, and give you an informed verdict. 
                  Always verify important decisions independently.
                </p>
              </div>
            </div>
          </Card>

          {/* Installation */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200 p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center flex-shrink-0">
                <Chrome className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Install ScamSniff Extension
                </h3>
                <p className="text-gray-700 mb-4">
                  Get the ScamSniff floating orb on every webpage. Click it whenever you need 
                  instant verification.
                </p>
                <ol className="text-sm text-gray-700 space-y-2 mb-4">
                  <li className="flex items-start gap-2">
                    <span className="font-semibold text-green-600">1.</span>
                    <span>Download the ScamSniff extension</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold text-green-600">2.</span>
                    <span>Go to <code className="bg-white px-1 py-0.5 rounded text-xs">chrome://extensions</code></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold text-green-600">3.</span>
                    <span>Enable &quot;Developer mode&quot; (top right)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold text-green-600">4.</span>
                    <span>Click &quot;Load unpacked&quot; and select the extracted folder</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold text-green-600">5.</span>
                    <span>The green shield orb will appear on all webpages</span>
                  </li>
                </ol>
                <Button 
                  className="bg-green-600 hover:bg-green-700 text-white shadow-md"
                  onClick={() => window.open('/scamsniff-extension.zip', '_blank')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Extension (Chrome)
                </Button>
              </div>
            </div>
          </Card>

          {/* Features */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="bg-white border border-gray-200 p-6">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Page Context Analysis
              </h3>
              <p className="text-sm text-gray-600">
                Reads the current page to extract contract addresses, social handles, 
                links, branding, and suspicious patterns.
              </p>
            </Card>

            <Card className="bg-white border border-gray-200 p-6">
              <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center mb-4">
                <Check className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Rule-Based Checks
              </h3>
              <p className="text-sm text-gray-600">
                Fast deterministic checks for typo domains, urgency language, 
                wallet pressure tactics, and known scam patterns.
              </p>
            </Card>

            <Card className="bg-white border border-gray-200 p-6">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                <Info className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Entity Verification
              </h3>
              <p className="text-sm text-gray-600">
                Verifies domains, social handles, contract addresses, and checks 
                if claims match reality.
              </p>
            </Card>

            <Card className="bg-white border border-gray-200 p-6">
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Spoken Verdict
              </h3>
              <p className="text-sm text-gray-600">
                Instant voice feedback telling you if the page appears suspicious, 
                safe, or needs caution.
              </p>
            </Card>
          </div>
        </div>
      )}

      {/* How It Works Tab */}
      {activeTab === 'how-it-works' && (
        <div className="space-y-6">
          <Card className="bg-white border border-gray-200 p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              ScamSniff Evidence Pipeline
            </h2>

            <div className="space-y-6">
              {/* Layer 1 */}
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 font-bold">1</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Page Context Extraction
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    ScamSniff reads the active tab to gather:
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• URL, domain, visible text</li>
                    <li>• Links, external destinations</li>
                    <li>• Contract addresses, token symbols</li>
                    <li>• Social handles (Twitter, Telegram, Discord)</li>
                    <li>• Branding clues and suspicious phrases</li>
                  </ul>
                </div>
              </div>

              {/* Layer 2 */}
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-orange-600 font-bold">2</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Structured Extraction
                  </h3>
                  <p className="text-sm text-gray-600">
                    Raw page data converted into structured payload with detected entities, 
                    target type classification, and context summary.
                  </p>
                </div>
              </div>

              {/* Layer 3 */}
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold">3</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Rule-Based Risk Checks
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Fast deterministic checks:
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Typo domain detection</li>
                    <li>• Urgency language overload</li>
                    <li>• Wallet pressure tactics</li>
                    <li>• Brand/domain mismatch</li>
                    <li>• Suspicious redirect patterns</li>
                  </ul>
                </div>
              </div>

              {/* Layer 4 */}
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-600 font-bold">4</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Entity Verification
                  </h3>
                  <p className="text-sm text-gray-600">
                    Verify domain age, SSL certificate, social consistency, contract addresses, 
                    and link destinations against known sources.
                  </p>
                </div>
              </div>

              {/* Layer 5 */}
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-indigo-600 font-bold">5</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Project Intelligence
                  </h3>
                  <p className="text-sm text-gray-600">
                    Check if this project has been scanned before. Compare current page against 
                    historical data for inconsistencies.
                  </p>
                </div>
              </div>

              {/* Layer 6 */}
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-pink-600 font-bold">6</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    AI Reasoning
                  </h3>
                  <p className="text-sm text-gray-600">
                    AI layer weighs all evidence, calculates risk score, generates reasoning, 
                    and produces confidence-weighted verdict.
                  </p>
                </div>
              </div>

              {/* Layer 7 */}
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 font-bold">7</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Spoken Verdict
                  </h3>
                  <p className="text-sm text-gray-600">
                    Short, clear spoken summary delivered via text-to-speech. 
                    Example: &quot;This page appears suspicious. Avoid interaction.&quot;
                  </p>
                </div>
              </div>

              {/* Layer 8 */}
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-600 font-bold">8</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Full Report
                  </h3>
                  <p className="text-sm text-gray-600">
                    Complete analysis stored permanently with all evidence, reasoning steps, 
                    and cryptographic proof. View detailed report on this page.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Pricing */}
      <Card className="bg-white border border-gray-200 p-6 mt-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Execution Cost</h3>
            <p className="text-sm text-gray-600">Per scan with full evidence pipeline</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-orange-600">1 CRD</div>
            <p className="text-xs text-gray-500">~$0.10 USD</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
