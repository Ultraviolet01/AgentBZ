'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Rocket, 
  Info, 
  Loader2, 
  AlertTriangle,
  Check,
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  X,
  Lock,
  Eye,
  EyeOff,
  Globe,
  Database,
  Tag,
  DollarSign,
  Settings,
  Upload,
  Zap,
  ShieldCheck,
  Cpu,
  Wallet,
  ExternalLink,
  Code
} from 'lucide-react';
import { useHashConnect } from '@/context/HashConnectContext';

// ─── Step Definitions (Exact 7 Steps from Agentra) ───────────────────────────

const STEPS = [
  { id: 1, label: 'Mode', icon: Database, description: 'Deploy target' },
  { id: 2, label: 'Identity', icon: Zap, description: 'Name & category' },
  { id: 3, label: 'Endpoint', icon: Globe, description: 'MCP & API schema' },
  { id: 4, label: 'Metadata', icon: Tag, description: 'Tags & description' },
  { id: 5, label: 'Pricing', icon: DollarSign, description: 'Access prices' },
  { id: 6, label: 'Exec Config', icon: Settings, description: 'Request schema & secrets' },
  { id: 7, label: 'Deploy', icon: Upload, description: 'Publish on-chain' },
];

const CATEGORIES = [
  { value: 'security', label: '🛡️ Security & Safety', color: '#22c55e' },
  { value: 'content', label: '🎨 Content & Creative', color: '#f97316' },
  { value: 'monitoring', label: '📡 Monitoring & Alerts', color: '#3b82f6' },
  { value: 'analytics', label: '📊 Analytics & Insights', color: '#8b5cf6' },
  { value: 'automation', label: '🤖 Automation & Tasks', color: '#ec4899' },
  { value: 'web3', label: '🌐 Web3 & DeFi', color: '#06b6d4' },
  { value: 'others', label: '📁 Others', color: '#64748b' },
];

const MODEL_PROVIDERS = [
  { value: 'anthropic', label: 'Anthropic (Claude)' },
  { value: 'openai', label: 'OpenAI (GPT)' },
  { value: 'custom', label: 'Custom Model' },
  { value: 'mcp', label: 'MCP Server Endpoint' },
];

const FIELD_TYPES = ['text', 'textarea', 'number', 'file', 'password', 'boolean'];

export default function DeployAgentPage() {
  const router = useRouter();
  const { isConnected, connect, accountId, sendDeposit } = useHashConnect();

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [successData, setSuccessData] = useState<{
    agentId: string;
    slug: string;
    name: string;
    hcs14TopicId?: string;
    hashscanUrl?: string;
  } | null>(null);

  // ── Form State ─────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    // Step 1: Mode
    deployMode: 'api' as 'api' | 'mcp' | 'custom',

    // Step 2: Identity
    name: '',
    category: 'analytics',
    slug: '',

    // Step 3: Endpoint
    apiEndpoint: 'https://api.agentbazaar.io/v1/execute',
    webhookUrl: '',
    modelProvider: 'anthropic',
    modelName: 'claude-haiku-4-5-20251001',
    mcpSchemaUrl: '',

    // Step 4: Metadata
    description: '',
    longDescription: '',
    tags: ['web3', 'analytics', 'hedera'] as string[],
    icon: '🤖',
    color: '#f97316',

    // Step 5: Pricing
    tier: 'Standard' as 'Standard' | 'Professional' | 'Enterprise',
    pricePerRun: '1.0',
    setupFee: '0',

    // Step 6: Exec Config & Secrets
    logic: 'You are an intelligent Web3 agent deployed on AgentBazaar. Analyze the user request, execute tools, and return high-accuracy results.',
    headers: [
      { key: 'Authorization', value: '', required: false, secret: true, userProvided: false, placeholder: 'Bearer token', description: 'API Authentication' }
    ] as { key: string; value: string; required: boolean; secret: boolean; userProvided: boolean; placeholder: string; description: string }[],
    bodyFields: [
      { key: 'prompt', type: 'text', required: true, userProvided: true, placeholder: 'Enter your request or query...', description: 'Primary input prompt' }
    ] as { key: string; type: string; required: boolean; userProvided: boolean; placeholder: string; description: string }[],
    apiKeys: {
      anthropic_api_key: '',
      openai_api_key: '',
      custom_api_key: '',
    } as Record<string, string>,
  });

  const [tagInput, setTagInput] = useState('');
  const [showSecretIndex, setShowSecretIndex] = useState<number | null>(null);

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    setFormData(prev => ({ ...prev, name, slug }));
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  // Header Handlers
  const addHeader = () => {
    setFormData(prev => ({
      ...prev,
      headers: [...prev.headers, { key: '', value: '', required: false, secret: false, userProvided: true, placeholder: '', description: '' }]
    }));
  };

  const updateHeader = (index: number, field: string, val: any) => {
    const updated = [...formData.headers];
    updated[index] = { ...updated[index], [field]: val };
    setFormData(prev => ({ ...prev, headers: updated }));
  };

  const removeHeader = (index: number) => {
    setFormData(prev => ({ ...prev, headers: prev.headers.filter((_, i) => i !== index) }));
  };

  // Body Field Handlers
  const addBodyField = () => {
    setFormData(prev => ({
      ...prev,
      bodyFields: [...prev.bodyFields, { key: '', type: 'text', required: false, userProvided: true, placeholder: '', description: '' }]
    }));
  };

  const updateBodyField = (index: number, field: string, val: any) => {
    const updated = [...formData.bodyFields];
    updated[index] = { ...updated[index], [field]: val };
    setFormData(prev => ({ ...prev, bodyFields: updated }));
  };

  const removeBodyField = (index: number) => {
    setFormData(prev => ({ ...prev, bodyFields: prev.bodyFields.filter((_, i) => i !== index) }));
  };

  // Validation
  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  };

  const nextStep = () => {
    setError('');
    if (currentStep === 1 && !formData.deployMode) {
      setError('Please select a deploy target mode');
      return;
    }
    if (currentStep === 2 && (!formData.name.trim() || !formData.category)) {
      setError('Agent Name and Category are required');
      return;
    }
    if (currentStep === 3 && (!formData.apiEndpoint.trim() || !isValidUrl(formData.apiEndpoint))) {
      setError('Please provide a valid API / MCP Endpoint URL');
      return;
    }
    if (currentStep === 4 && !formData.description.trim()) {
      setError('Short Description is required');
      return;
    }
    if (currentStep === 5 && (parseFloat(formData.pricePerRun) <= 0 || isNaN(parseFloat(formData.pricePerRun)))) {
      setError('Please enter a valid price per run in HBAR');
      return;
    }
    if (currentStep === 6 && !formData.logic.trim()) {
      setError('Agent logic / system prompt is required');
      return;
    }
    setCurrentStep(s => Math.min(s + 1, 7));
  };

  const prevStep = () => {
    setError('');
    setCurrentStep(s => Math.max(s - 1, 1));
  };

  // ── Step 7: On-Chain Submit & Deploy ───────────────────────────────────────
  const handleSubmit = async () => {
    if (!isConnected) {
      connect();
      setError('Please connect your Hedera wallet (HashPack) to sign and deploy the agent on-chain.');
      return;
    }

    setIsLoading(true);
    setError('');
    setStatusMessage('Preparing on-chain deployment transaction...');

    try {
      const agentSlug = formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      // Agent Identity metadata for on-chain memo and HCS-14 audit trail
      const agentIdentity = {
        name: formData.name,
        slug: agentSlug,
        category: formData.category,
        deployMode: formData.deployMode,
        modelProvider: formData.modelProvider,
        modelName: formData.modelName,
        apiEndpoint: formData.apiEndpoint,
        pricePerRun: formData.pricePerRun,
        builderAccountId: accountId || '0.0.10368450',
      };

      // 1. Trigger Hedera Wallet Transaction Signature (HashPack popup)
      setStatusMessage('Waiting for HashPack transaction signature with Agent Identity...');

      const listingRequirements = {
        scheme: 'exact' as const,
        network: 'hedera:testnet' as const,
        amount: '50000000', // 0.5 HBAR registration fee in tinybars
        payTo: process.env.NEXT_PUBLIC_PLATFORM_ACCOUNT || '0.0.10368450',
        memo: `ABZ:Deploy:${agentSlug}`.slice(0, 100),
        extra: {
          feePayer: process.env.NEXT_PUBLIC_PLATFORM_ACCOUNT || '0.0.10368450',
          action: 'agent_deployment',
          agentIdentity,
        }
      };

      let paymentPayloadTransaction = '';
      let transactionId = '';
      try {
        const depositResult = await sendDeposit(listingRequirements);
        paymentPayloadTransaction = depositResult.paymentPayloadTransaction;
        transactionId = depositResult.transactionId || '';
      } catch (signErr: any) {
        console.warn('[Deploy] Wallet signature error/notice:', signErr);
        throw new Error(signErr.message || 'Transaction signing was rejected or cancelled in your wallet.');
      }

      setStatusMessage('Encrypting secrets with AES-256-GCM vault & registering on Hedera HCS...');

      // Build API Keys array
      const apiKeysList: { name: string; value: string }[] = [];
      if (formData.apiKeys.anthropic_api_key)
        apiKeysList.push({ name: 'ANTHROPIC_API_KEY', value: formData.apiKeys.anthropic_api_key });
      if (formData.apiKeys.openai_api_key)
        apiKeysList.push({ name: 'OPENAI_API_KEY', value: formData.apiKeys.openai_api_key });
      if (formData.apiKeys.custom_api_key)
        apiKeysList.push({ name: 'API_KEY', value: formData.apiKeys.custom_api_key });

      formData.headers.forEach(h => {
        if (h.secret && h.value) apiKeysList.push({ name: h.key, value: h.value });
      });

      // Build JSON schemas
      const inputSchema = {
        type: 'object',
        properties: formData.bodyFields.reduce((acc, field) => ({
          ...acc,
          [field.key || 'input']: { type: field.type, description: field.description, placeholder: field.placeholder }
        }), {}),
        required: formData.bodyFields.filter(f => f.required).map(f => f.key),
      };

      const payload = {
        name: formData.name,
        slug: agentSlug,
        description: formData.description,
        longDescription: formData.longDescription || formData.description,
        category: formData.category,
        tags: formData.tags,
        apiEndpoint: formData.apiEndpoint,
        webhookUrl: formData.webhookUrl || null,
        modelProvider: formData.modelProvider,
        modelName: formData.modelName,
        pricePerRun: parseFloat(formData.pricePerRun),
        setupFee: parseFloat(formData.setupFee || '0'),
        icon: formData.icon || '🤖',
        color: formData.color || '#f97316',
        logic: formData.logic,
        inputSchema,
        apiKeys: apiKeysList,
        builderAccountId: accountId || undefined,
        deployMode: formData.deployMode,
        paymentPayloadTransaction,
        transactionId,
        agentIdentity,
        executionConfig: {
          headers: formData.headers,
          bodyFields: formData.bodyFields,
          endpoint: formData.apiEndpoint,
        }
      };

      const res = await fetch('/api/agents/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Agent deployment failed');

      setSuccessData({
        agentId: data.agent?.id || data.agentId,
        slug: data.agent?.slug || agentSlug,
        name: formData.name,
        hcs14TopicId: data.hcs14TopicId || process.env.NEXT_PUBLIC_HCS_TOPIC_ID || '0.0.10396393',
        hashscanUrl: data.hashscanUrl || (transactionId ? `https://hashscan.io/testnet/transaction/${transactionId}` : `https://hashscan.io/testnet/topic/${data.hcs14TopicId || '0.0.10396393'}`),
      });
    } catch (err: any) {
      setError(err.message || 'Deployment error');
    } finally {
      setIsLoading(false);
      setStatusMessage('');
    }
  };

  // ── Success Modal / Screen ──────────────────────────────────────────────────
  if (successData) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full bg-white border border-gray-200 rounded-[32px] p-8 text-center space-y-6 shadow-xl"
        >
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-3xl mx-auto shadow-sm">
            🚀
          </div>
          <div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest">
              Live on Hedera Testnet
            </span>
            <h2 className="text-2xl font-black text-gray-900 mt-2 uppercase">
              {successData.name} Deployed!
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Your agent has been minted as an on-chain intelligent asset settled via Blocky402 micro-payments.
            </p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4 text-left space-y-3 border border-gray-100 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Agent Slug:</span>
              <span className="font-bold text-gray-800">/agents/{successData.slug}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">HCS Audit Topic:</span>
              <span className="font-bold text-orange-600">{successData.hcs14TopicId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Key Vault:</span>
              <span className="font-bold text-emerald-600">AES-256-GCM Encrypted</span>
            </div>
            {successData.hashscanUrl && (
              <a
                href={successData.hashscanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-500 hover:text-orange-600 font-bold flex items-center gap-1 mt-2 text-xs"
              >
                ↗ View HCS Identity on HashScan
              </a>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => router.push(`/agents/deployed/${successData.slug}`)}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl h-12 text-sm uppercase tracking-wider cursor-pointer"
            >
              Test Agent Console
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/marketplace')}
              className="rounded-2xl border-gray-200 h-12 px-6"
            >
              Marketplace
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8 pb-16 text-gray-900">
      
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.2em]">Deploy Studio</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 uppercase tracking-tight">
            Deploy <span className="text-orange-500">Intelligent Agent.</span>
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">
            Monetize your AI model, API endpoint, or MCP server on-chain with Hedera x402 micro-payments.
          </p>
        </div>

        {/* Revenue Badge */}
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-3 px-5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center font-black">
            90%
          </div>
          <div>
            <p className="text-xs font-bold text-gray-900">Creator Revenue Share</p>
            <p className="text-[11px] text-orange-700">Instant on-chain x402 settlement</p>
          </div>
        </div>
      </div>

      {/* ── 7-Step Progress Stepper ─────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-[28px] p-3 overflow-x-auto shadow-sm">
        <div className="flex items-center min-w-max">
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            const isPassed = currentStep > s.id;
            const isCurrent = currentStep === s.id;

            return (
              <div key={s.id} className="flex items-center flex-1">
                <button
                  type="button"
                  onClick={() => s.id < currentStep && setCurrentStep(s.id)}
                  disabled={s.id > currentStep}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-orange-500 text-white shadow-sm font-bold'
                      : isPassed
                      ? 'bg-gray-100 text-gray-900 hover:bg-gray-200 font-semibold'
                      : 'text-gray-400 cursor-not-allowed opacity-60'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs ${
                    isCurrent ? 'bg-white/20 text-white' : isPassed ? 'bg-orange-100 text-orange-600' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {isPassed ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Icon className="w-3.5 h-3.5" />}
                  </div>
                  <div className="text-left">
                    <p className="text-xs tracking-wider uppercase">{s.label}</p>
                    <p className={`text-[10px] line-clamp-1 ${isCurrent ? 'text-white/80' : 'text-gray-400'}`}>
                      {s.description}
                    </p>
                  </div>
                </button>
                {idx < STEPS.length - 1 && (
                  <div className={`w-6 h-0.5 mx-1 ${isPassed ? 'bg-orange-500' : 'bg-gray-200'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Error Banner ─────────────────────────────────────────────────────── */}
      {error && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-center gap-3 text-sm font-medium">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        </motion.div>
      )}

      {/* ── Main Form Container ─────────────────────────────────────────────── */}
      <Card className="bg-white border border-gray-200/80 rounded-[32px] p-6 lg:p-10 shadow-sm relative overflow-hidden">
        
        {/* STEP 1: MODE (Deploy Target) */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">Step 1 of 7</span>
              <h2 className="text-2xl font-black text-gray-900 mt-1 uppercase">Select Deploy Target Mode</h2>
              <p className="text-sm text-gray-500">Choose how you want your agent to be hosted and executed.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  id: 'api',
                  label: 'API Agent',
                  icon: '⚡',
                  tag: 'REST / Webhook',
                  desc: 'Wrap any standard HTTP / REST API endpoint. AgentBazaar handles x402 payment gating and forward execution.',
                },
                {
                  id: 'mcp',
                  label: 'MCP Agent',
                  icon: '🔗',
                  tag: 'Model Context Protocol',
                  desc: 'Standard Model Context Protocol server. Exposes tools, resources, and structured schemas to multi-agent swarms.',
                },
                {
                  id: 'custom',
                  label: 'Custom AI Agent',
                  icon: '🛠️',
                  tag: 'Managed Logic',
                  desc: 'Hosted agent with system prompt, custom AI model routing (Claude / GPT), and encrypted API key vault.',
                },
              ].map((m) => {
                const isSelected = formData.deployMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleInputChange('deployMode', m.id)}
                    className={`p-6 rounded-3xl border-2 text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50/50 shadow-md ring-2 ring-orange-500/20'
                        : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-2xl shadow-sm">
                          {m.icon}
                        </div>
                        <Badge variant="outline" className={isSelected ? 'bg-orange-500 text-white border-transparent' : 'bg-gray-100 text-gray-600'}>
                          {m.tag}
                        </Badge>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">{m.label}</h3>
                      <p className="text-xs text-gray-500 mt-2 leading-relaxed">{m.desc}</p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-400 uppercase">Target Selection</span>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-orange-500 bg-orange-500 text-white' : 'border-gray-300'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: IDENTITY */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">Step 2 of 7</span>
              <h2 className="text-2xl font-black text-gray-900 mt-1 uppercase">Agent Identity</h2>
              <p className="text-sm text-gray-500">Define the public name and marketplace category for your agent.</p>
            </div>

            <div className="space-y-5">
              <div>
                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Agent Name *
                </Label>
                <Input
                  id="name"
                  placeholder="e.g. Sentiment Sentinel"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="mt-1 h-12 rounded-2xl text-base"
                />
                {formData.slug && (
                  <p className="text-xs text-gray-500 mt-1.5 font-mono">
                    Unique Slug: <span className="font-bold text-orange-600">/agents/{formData.slug}</span>
                  </p>
                )}
              </div>

              <div>
                <Label className="text-xs font-bold uppercase tracking-wider text-gray-700 block mb-2">
                  Marketplace Category *
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {CATEGORIES.map((cat) => {
                    const isSelected = formData.category === cat.value;
                    return (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => handleInputChange('category', cat.value)}
                        className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-orange-500 bg-orange-50 text-gray-900 font-bold'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        <span className="text-xs block">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: ENDPOINT */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">Step 3 of 7</span>
              <h2 className="text-2xl font-black text-gray-900 mt-1 uppercase">Endpoint & Protocol</h2>
              <p className="text-sm text-gray-500">Specify the API endpoint URL or MCP tool server.</p>
            </div>

            <div className="space-y-5">
              <div>
                <Label htmlFor="apiEndpoint" className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  API / MCP Endpoint URL *
                </Label>
                <Input
                  id="apiEndpoint"
                  placeholder="https://api.youragent.com/v1/execute"
                  value={formData.apiEndpoint}
                  onChange={(e) => handleInputChange('apiEndpoint', e.target.value)}
                  className="mt-1 h-12 rounded-2xl font-mono text-sm"
                />
                <p className="text-xs text-gray-400 mt-1">
                  AgentBazaar verifies x402 payment before routing verified requests to this endpoint.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label htmlFor="modelProvider" className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    AI Model Provider
                  </Label>
                  <select
                    id="modelProvider"
                    value={formData.modelProvider}
                    onChange={(e) => handleInputChange('modelProvider', e.target.value)}
                    className="w-full mt-1 h-12 px-4 border border-gray-200 rounded-2xl text-sm font-medium bg-white focus:ring-2 focus:ring-orange-500"
                  >
                    {MODEL_PROVIDERS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="modelName" className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    Model Identifier
                  </Label>
                  <Input
                    id="modelName"
                    placeholder="claude-haiku-4-5-20251001"
                    value={formData.modelName}
                    onChange={(e) => handleInputChange('modelName', e.target.value)}
                    className="mt-1 h-12 rounded-2xl font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="webhookUrl" className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Webhook / Status Notification URL (Optional)
                </Label>
                <Input
                  id="webhookUrl"
                  placeholder="https://api.youragent.com/webhook"
                  value={formData.webhookUrl}
                  onChange={(e) => handleInputChange('webhookUrl', e.target.value)}
                  className="mt-1 h-12 rounded-2xl font-mono text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: METADATA & BRANDING */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">Step 4 of 7</span>
              <h2 className="text-2xl font-black text-gray-900 mt-1 uppercase">Metadata & Branding</h2>
              <p className="text-sm text-gray-500">Provide rich descriptions and visual identity for marketplace discovery.</p>
            </div>

            <div className="space-y-5">
              <div>
                <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Short Description * (Summary)
                </Label>
                <Textarea
                  id="description"
                  placeholder="Real-time AI sentiment analyzer for Web3 tokens and smart contracts..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={2}
                  maxLength={180}
                  className="mt-1 rounded-2xl"
                />
                <p className="text-xs text-gray-400 mt-1 text-right">{formData.description.length}/180</p>
              </div>

              <div>
                <Label htmlFor="longDescription" className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Full Documentation (Markdown supported)
                </Label>
                <Textarea
                  id="longDescription"
                  placeholder="Detailed explanation of the agent capabilities, input parameters, and output format..."
                  value={formData.longDescription}
                  onChange={(e) => handleInputChange('longDescription', e.target.value)}
                  rows={4}
                  className="mt-1 rounded-2xl font-mono text-xs"
                />
              </div>

              <div>
                <Label className="text-xs font-bold uppercase tracking-wider text-gray-700 block mb-1">
                  Tags
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add tag (e.g. sentiment, hedera, defi)..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="h-11 rounded-2xl"
                  />
                  <Button type="button" onClick={addTag} className="bg-orange-500 hover:bg-orange-600 rounded-2xl px-5">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.tags.map((t) => (
                    <Badge key={t} className="bg-gray-100 text-gray-800 hover:bg-gray-200 rounded-xl px-3 py-1 flex items-center gap-1.5 text-xs">
                      #{t}
                      <X className="w-3 h-3 cursor-pointer text-gray-400 hover:text-gray-700" onClick={() => removeTag(t)} />
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <Label htmlFor="icon" className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    Icon Emoji
                  </Label>
                  <Input
                    id="icon"
                    value={formData.icon}
                    onChange={(e) => handleInputChange('icon', e.target.value)}
                    className="mt-1 h-12 rounded-2xl text-center text-2xl"
                    maxLength={2}
                  />
                </div>
                <div>
                  <Label htmlFor="color" className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    Theme Color
                  </Label>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => handleInputChange('color', e.target.value)}
                      className="w-14 h-12 rounded-2xl border border-gray-200 cursor-pointer p-1"
                    />
                    <Input
                      value={formData.color}
                      onChange={(e) => handleInputChange('color', e.target.value)}
                      className="h-12 rounded-2xl font-mono text-xs uppercase"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: PRICING & TIERS */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">Step 5 of 7</span>
              <h2 className="text-2xl font-black text-gray-900 mt-1 uppercase">Pricing & Monetization</h2>
              <p className="text-sm text-gray-500">Set micro-payment cost per run settled on-chain via Hedera x402.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { tier: 'Standard', fee: '1.0 HBAR', desc: 'Standard micro-execution for general users.', price: '1.0' },
                { tier: 'Professional', fee: '3.0 HBAR', desc: 'High-throughput or heavy analysis pipelines.', price: '3.0' },
                { tier: 'Enterprise', fee: '5.0 HBAR', desc: 'Multi-agent orchestration & deep audit suites.', price: '5.0' },
              ].map((t) => {
                const isSelected = formData.tier === t.tier;
                return (
                  <button
                    key={t.tier}
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, tier: t.tier as any, pricePerRun: t.price }));
                    }}
                    className={`p-6 rounded-3xl border-2 text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50/50 shadow-md ring-2 ring-orange-500/20'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-black uppercase text-gray-500 tracking-wider">{t.tier}</span>
                      {isSelected && <Badge className="bg-orange-500 text-white">Active</Badge>}
                    </div>
                    <div className="text-2xl font-black text-gray-900">{t.fee}</div>
                    <p className="text-xs text-gray-500 mt-2">{t.desc}</p>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4">
              <div>
                <Label htmlFor="pricePerRun" className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Custom Price Per Run (HBAR) *
                </Label>
                <Input
                  id="pricePerRun"
                  type="number"
                  step="0.1"
                  value={formData.pricePerRun}
                  onChange={(e) => handleInputChange('pricePerRun', e.target.value)}
                  className="mt-1 h-12 rounded-2xl font-mono text-base font-bold text-orange-600"
                />
              </div>

              <div>
                <Label htmlFor="setupFee" className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Setup / Lifetime Access Fee (HBAR)
                </Label>
                <Input
                  id="setupFee"
                  type="number"
                  step="1"
                  value={formData.setupFee}
                  onChange={(e) => handleInputChange('setupFee', e.target.value)}
                  className="mt-1 h-12 rounded-2xl font-mono text-base font-bold text-gray-700"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: EXEC CONFIG & KEY VAULT */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">Step 6 of 7</span>
              <h2 className="text-2xl font-black text-gray-900 mt-1 uppercase">Exec Config & Key Vault</h2>
              <p className="text-sm text-gray-500">Configure request schema, system prompt logic, and AES-256-GCM encrypted secrets.</p>
            </div>

            <div className="space-y-6">
              {/* System Prompt / Logic */}
              <div>
                <Label htmlFor="logic" className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Agent System Prompt & Execution Logic *
                </Label>
                <Textarea
                  id="logic"
                  value={formData.logic}
                  onChange={(e) => handleInputChange('logic', e.target.value)}
                  rows={4}
                  className="mt-1 rounded-2xl font-mono text-xs"
                />
              </div>

              {/* Request Headers Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    Request Headers ({formData.headers.length})
                  </Label>
                  <Button type="button" variant="outline" size="sm" onClick={addHeader} className="rounded-xl gap-1 text-xs">
                    <Plus className="w-3.5 h-3.5" /> Add Header
                  </Button>
                </div>

                {formData.headers.map((h, i) => (
                  <div key={i} className="p-4 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold text-gray-500">HEADER #{i + 1}</span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeHeader(i)} className="text-red-500 hover:text-red-700 p-1 h-auto">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-[10px] text-gray-500 uppercase font-bold">Header Key</Label>
                        <Input
                          placeholder="Authorization"
                          value={h.key}
                          onChange={(e) => updateHeader(i, 'key', e.target.value)}
                          className="h-10 rounded-xl font-mono text-xs bg-white"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-gray-500 uppercase font-bold">Default Secret / Value</Label>
                        <div className="relative">
                          <Input
                            type={h.secret && showSecretIndex !== i ? 'password' : 'text'}
                            placeholder={h.secret ? '••••••••' : 'Bearer token...'}
                            value={h.value}
                            onChange={(e) => updateHeader(i, 'value', e.target.value)}
                            className="h-10 rounded-xl font-mono text-xs bg-white pr-9"
                          />
                          {h.secret && (
                            <button
                              type="button"
                              onClick={() => setShowSecretIndex(showSecretIndex === i ? null : i)}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                            >
                              {showSecretIndex === i ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => updateHeader(i, 'secret', !h.secret)}
                        className={`text-[10px] px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1 ${
                          h.secret ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-gray-200 text-gray-500'
                        }`}
                      >
                        <Lock className="w-3 h-3" /> Encrypt as Secret
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Request Body Fields */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    Input Body Fields ({formData.bodyFields.length})
                  </Label>
                  <Button type="button" variant="outline" size="sm" onClick={addBodyField} className="rounded-xl gap-1 text-xs">
                    <Plus className="w-3.5 h-3.5" /> Add Field
                  </Button>
                </div>

                {formData.bodyFields.map((f, i) => (
                  <div key={i} className="p-4 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold text-gray-500">INPUT FIELD #{i + 1}</span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeBodyField(i)} className="text-red-500 hover:text-red-700 p-1 h-auto">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-[10px] text-gray-500 uppercase font-bold">Field Identifier (Key)</Label>
                        <Input
                          placeholder="e.g. prompt, tokenAddress"
                          value={f.key}
                          onChange={(e) => updateBodyField(i, 'key', e.target.value)}
                          className="h-10 rounded-xl font-mono text-xs bg-white"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-gray-500 uppercase font-bold">Field Type</Label>
                        <select
                          value={f.type}
                          onChange={(e) => updateBodyField(i, 'type', e.target.value)}
                          className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs bg-white"
                        >
                          {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 7: DEPLOY & PUBLISH (COMPREHENSIVE SUMMARY & ON-CHAIN SIGNING) */}
        {currentStep === 7 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">Step 7 of 7 — Final Review</span>
                <h2 className="text-2xl font-black text-gray-900 mt-1 uppercase">Agent Deployment Summary</h2>
                <p className="text-sm text-gray-500">Review your agent configuration before signing the on-chain deployment transaction.</p>
              </div>
              <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 px-3 py-1 font-bold text-xs self-start">
                Hedera Testnet
              </Badge>
            </div>

            {/* ── Summary Overview Grid ────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Left 2 Cols: Main Configuration Specs */}
              <div className="lg:col-span-2 space-y-4">
                
                {/* 1. Identity & Branding Summary */}
                <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex items-start gap-4 pb-4 border-b border-gray-100">
                    <div 
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm flex-shrink-0"
                      style={{ backgroundColor: `${formData.color}15`, border: `2px solid ${formData.color}30` }}
                    >
                      {formData.icon || '🤖'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-gray-100 text-gray-700">
                          {formData.category}
                        </span>
                        <span className="text-xs font-mono text-gray-400">
                          /agents/{formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
                        </span>
                      </div>
                      <h3 className="text-xl font-black text-gray-900 tracking-tight">{formData.name || 'Untitled Agent'}</h3>
                      <p className="text-xs text-gray-600 line-clamp-2 mt-1">{formData.description || 'No description provided'}</p>
                    </div>
                  </div>

                  {formData.tags.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-bold text-gray-400 uppercase mr-1">Tags:</span>
                      {formData.tags.map(tag => (
                        <span key={tag} className="text-[11px] font-mono bg-gray-50 border border-gray-200 text-gray-700 px-2 py-0.5 rounded-lg">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Architecture & Endpoint Specs */}
                <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-orange-500" /> Target Execution Architecture
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                    <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">Deploy Mode</span>
                      <span className="font-bold text-gray-900 uppercase">{formData.deployMode}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">Model Provider</span>
                      <span className="font-bold text-gray-900 uppercase">{formData.modelProvider}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">Model Name</span>
                      <span className="font-bold text-gray-900 truncate block">{formData.modelName}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 space-y-1 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Endpoint URL:</span>
                      <span className="font-bold text-gray-800 break-all">{formData.apiEndpoint}</span>
                    </div>
                    {formData.webhookUrl && (
                      <div className="flex justify-between pt-1 border-t border-gray-200">
                        <span className="text-gray-400">Webhook URL:</span>
                        <span className="font-bold text-gray-800 break-all">{formData.webhookUrl}</span>
                      </div>
                    )}
                  </div>

                  {formData.logic && (
                    <div className="text-xs">
                      <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">System Logic / Prompt</span>
                      <p className="bg-gray-50 p-3 rounded-2xl border border-gray-100 text-gray-700 line-clamp-2 font-mono text-[11px]">
                        {formData.logic}
                      </p>
                    </div>
                  )}
                </div>

                {/* 3. Request Schema & Vault Summary */}
                <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                    <Code className="w-4 h-4 text-orange-500" /> Request Schema & Secrets
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-bold">Headers Configured</span>
                        <span className="font-bold text-gray-900 font-mono">{formData.headers.length} header(s)</span>
                      </div>
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                        AES-256-GCM Vault
                      </Badge>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-bold">Input Body Fields</span>
                        <span className="font-bold text-gray-900 font-mono">{formData.bodyFields.length} field(s)</span>
                      </div>
                      <Badge className="bg-orange-50 text-orange-700 border-orange-200 text-[10px]">
                        JSON Schema
                      </Badge>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Col: Monetization & On-Chain Settlement Card */}
              <div className="space-y-4">
                
                {/* Pricing & Revenue Share */}
                <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-3xl p-6 text-white shadow-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">
                      Monetization
                    </span>
                    <span className="text-xs font-bold text-orange-100">x402 Micro-Pay</span>
                  </div>

                  <div>
                    <span className="text-xs text-orange-100 font-medium block">Price Per Execution</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-3xl font-black">{formData.pricePerRun}</span>
                      <span className="text-sm font-bold text-orange-100">HBAR</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/20 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-orange-100">
                      <span>Creator Share (90%):</span>
                      <strong className="text-white font-mono">{(parseFloat(formData.pricePerRun || '0') * 0.9).toFixed(3)} ℏ</strong>
                    </div>
                    <div className="flex justify-between items-center text-orange-100">
                      <span>Protocol Share (10%):</span>
                      <strong className="text-white font-mono">{(parseFloat(formData.pricePerRun || '0') * 0.1).toFixed(3)} ℏ</strong>
                    </div>
                    <div className="flex justify-between items-center text-orange-100">
                      <span>Settlement:</span>
                      <strong className="text-white">Blocky402 Exact</strong>
                    </div>
                  </div>
                </div>

                {/* On-Chain Listing Details & Wallet Info */}
                <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> On-Chain Identity & Signing
                  </h4>

                  <div className="space-y-2.5 text-xs font-mono bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Registry Topic:</span>
                      <span className="font-bold text-orange-600">0.0.10396393</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Listing Fee:</span>
                      <span className="font-bold text-emerald-600 flex items-center gap-1">
                        FREE <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">Sponsored</span>
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Tx Memo:</span>
                      <span className="font-bold text-gray-700 truncate max-w-[150px]">
                        ABZ:Deploy:{formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-gray-200">
                      <span className="text-gray-400">Builder Account:</span>
                      <span className="font-bold text-emerald-600 truncate max-w-[140px]">
                        {accountId || 'Not Connected'}
                      </span>
                    </div>
                    <div className="pt-2 text-[10px] text-emerald-700 bg-emerald-50 p-2 rounded-xl flex items-center gap-1.5 border border-emerald-100">
                      <span>⚡</span>
                      <span>AgentBazaar sponsors 100% of on-chain HCS registration fees for builders.</span>
                    </div>
                  </div>

                  {/* Wallet Connection Status */}
                  {!isConnected ? (
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl space-y-3">
                      <div className="flex items-center gap-2 text-xs text-amber-900 font-bold">
                        <Wallet className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <span>Wallet Required</span>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        Connect HashPack to sign the deployment transaction with your embedded agent identity.
                      </p>
                      <Button
                        type="button"
                        onClick={connect}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl h-10 text-xs shadow-sm cursor-pointer"
                      >
                        Connect Hedera Wallet
                      </Button>
                    </div>
                  ) : (
                    <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                        ✓
                      </div>
                      <div>
                        <p className="text-xs font-bold text-emerald-950">Wallet Connected & Ready</p>
                        <p className="text-[11px] text-emerald-700 font-mono">{accountId}</p>
                      </div>
                    </div>
                  )}

                </div>

              </div>

            </div>
          </div>
        )}

        {/* ── Action Navigation Buttons ────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-8 mt-8 border-t border-gray-100">
          {currentStep > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={isLoading}
              className="rounded-2xl border-gray-200 h-12 px-6 gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          ) : <div />}

          {currentStep < 7 ? (
            <Button
              type="button"
              onClick={nextStep}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl h-12 px-8 gap-2 cursor-pointer"
            >
              Next Step <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-orange-500 hover:bg-orange-600 text-white font-black rounded-2xl h-12 px-10 gap-2 cursor-pointer shadow-lg hover:shadow-xl active:scale-95 transition-all text-sm uppercase tracking-wider"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {statusMessage || 'Signing & Publishing Agent...'}
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" /> 🚀 Sign & Deploy Agent On-Chain
                </>
              )}
            </Button>
          )}
        </div>

      </Card>
    </div>
  );
}
