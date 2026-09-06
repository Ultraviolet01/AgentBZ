"use client";

import { useState } from "react";
import { useHashPack } from "@/hooks/useHashPack";
import { TopicCreateTransaction, AccountId } from "@hashgraph/sdk";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiKey {
  name: string;
  value: string;
}

interface FormData {
  // Step 1: Mode
  mode: "api" | "mcp" | "custom";

  // Step 2: Identity
  name: string;
  category: string;
  slug: string;

  // Step 3: Endpoint
  apiEndpoint: string;
  webhookUrl: string;

  // Step 4: Metadata
  description: string;
  longDescription: string;
  tags: string[];
  icon: string;
  color: string;

  // Step 5: Pricing
  priceHbar: number;
  setupFee: number;

  // Step 6: Exec Config
  logic: string;
  apiKeys: ApiKey[];
}

const STEPS = [
  { id: 1, label: "Mode",      sub: "Deploy target" },
  { id: 2, label: "Identity",  sub: "Name & category" },
  { id: 3, label: "Endpoint",  sub: "API / MCP schema" },
  { id: 4, label: "Metadata",  sub: "Tags & description" },
  { id: 5, label: "Pricing",   sub: "Access prices" },
  { id: 6, label: "Exec Config", sub: "Logic & API keys" },
  { id: 7, label: "Deploy",    sub: "Publish" },
];

const CATEGORIES = [
  "DeFi", "Security", "Content", "Analytics",
  "Trading", "Research", "Automation", "Other",
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function NewAgentPage() {
  const { isConnected, connect, accountId } = useHashPack();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    agentId: string;
    hcs14TopicId: string;
    hashscanUrl: string;
  } | null>(null);

  const [form, setForm] = useState<FormData>({
    mode: "api",
    name: "",
    category: "DeFi",
    slug: "",
    apiEndpoint: "",
    webhookUrl: "",
    description: "",
    longDescription: "",
    tags: [],
    icon: "🤖",
    color: "#6C3BFF",
    priceHbar: 1,
    setupFee: 0,
    logic: "",
    apiKeys: [],
  });

  // Auto-generate slug from name
  function handleNameChange(name: string) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    setForm(f => ({ ...f, name, slug }));
  }

  function addApiKey() {
    setForm(f => ({ ...f, apiKeys: [...f.apiKeys, { name: "", value: "" }] }));
  }

  function updateApiKey(index: number, field: "name" | "value", val: string) {
    setForm(f => {
      const keys = [...f.apiKeys];
      keys[index] = { ...keys[index], [field]: val };
      return { ...f, apiKeys: keys };
    });
  }

  function removeApiKey(index: number) {
    setForm(f => ({
      ...f,
      apiKeys: f.apiKeys.filter((_, i) => i !== index),
    }));
  }

  function addTag(tag: string) {
    if (tag && !form.tags.includes(tag)) {
      setForm(f => ({ ...f, tags: [...f.tags, tag] }));
    }
  }

  function removeTag(tag: string) {
    setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }));
  }

  function next() {
    setError(null);
    setCurrentStep(s => Math.min(s + 1, 7));
  }

  function back() {
    setError(null);
    setCurrentStep(s => Math.max(s - 1, 1));
  }

  // ── Step 7: Deploy ──────────────────────────────────────────────────────────
  async function handleDeploy() {
    if (!isConnected || !accountId) {
      connect();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Builder signs HCS-14 topic with their own HashPack wallet
      setStatus("Creating agent identity on Hedera...");

      const { HashConnect } = await import("hashconnect");
      const hc = (window as any).__hc as InstanceType<typeof HashConnect>;
      if (!hc) throw new Error("HashConnect not initialized");

      const fromAccount = AccountId.fromString(accountId);
      const signer = hc.getSigner(fromAccount as any);

      const topicTx = await new TopicCreateTransaction()
        .setTopicMemo(`AgentBazaar Agent — ${form.name}`)
        .freezeWithSigner(signer as any);

      const signedTopic = await topicTx.signWithSigner(signer as any);
      const topicResponse = await signedTopic.executeWithSigner(signer as any);
      const receipt = await topicResponse.getReceiptWithSigner(signer as any);

      if (!receipt.topicId) {
        throw new Error("Failed to create HCS-14 topic");
      }

      const hcs14TopicId = receipt.topicId.toString();
      setStatus(`HCS-14 topic created: ${hcs14TopicId}. Deploying agent...`);

      // 2. Submit to API
      const res = await fetch("/api/agents/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          builderAccountId: accountId,
          hcs14TopicId,
          hcs14HashscanUrl: `https://hashscan.io/testnet/topic/${hcs14TopicId}`,
          pricePerRun: form.priceHbar,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Deploy failed");

      setSuccess({
        agentId: data.agent?.id || data.agentId,
        hcs14TopicId,
        hashscanUrl: `https://hashscan.io/testnet/topic/${hcs14TopicId}`,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setStatus("");
    }
  }

  // ── Success screen ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#111] rounded-2xl p-8 text-center space-y-4">
          <div className="text-5xl">🎉</div>
          <h2 className="text-2xl font-bold text-white">Agent Listed!</h2>
          <p className="text-gray-400 text-sm">
            Your agent is pending review and will be live on AgentBazaar soon.
          </p>
          <div className="bg-[#1A1A1A] rounded-lg p-4 text-left space-y-2">
            <p className="text-xs text-gray-500">On-chain identity</p>
            <a
              href={success.hashscanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 underline block"
            >
              ↗ HCS-14 Topic — HashScan: {success.hcs14TopicId}
            </a>
          </div>
          <a
            href="/marketplace"
            className="block w-full py-3 bg-[#6C3BFF] text-white rounded-lg text-sm font-medium"
          >
            Go to Marketplace
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">

      {/* ── Step progress bar ─────────────────────────────────────────────── */}
      <div className="border-b border-[#1A1A1A] px-6 lg:px-10 py-4 overflow-x-auto">
        <div className="flex items-center gap-0 min-w-max">
          {STEPS.map((step, i) => (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                className={`flex flex-col items-center px-4 py-2 rounded-lg transition-colors ${
                  step.id === currentStep
                    ? "bg-[#6C3BFF]/20 border border-[#6C3BFF]"
                    : step.id < currentStep
                    ? "opacity-60 cursor-pointer hover:opacity-80"
                    : "opacity-30 cursor-not-allowed"
                }`}
              >
                <span className="text-xs font-semibold text-white">
                  {step.label}
                </span>
                <span className="text-xs text-gray-500">{step.sub}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div
                  className={`w-8 h-px ${
                    step.id < currentStep ? "bg-[#6C3BFF]" : "bg-[#2A2A2A]"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Step content ──────────────────────────────────────────────────── */}
      <div className="p-6 lg:p-10 max-w-7xl mx-auto">
        <div className="max-w-2xl space-y-6">

        {/* Step 1: Mode */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Select Deploy Target</h2>
            <div className="grid grid-cols-3 gap-4">
              {[
                { id: "api", label: "API Agent", icon: "⚡", desc: "Wrap any HTTP API as an agent" },
                { id: "mcp", label: "MCP Agent", icon: "🔗", desc: "Model Context Protocol server" },
                { id: "custom", label: "Custom", icon: "🛠", desc: "Custom execution logic" },
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setForm(f => ({ ...f, mode: m.id as any }))}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    form.mode === m.id
                      ? "border-[#6C3BFF] bg-[#6C3BFF]/10"
                      : "border-[#2A2A2A] bg-[#111] hover:border-[#3A3A3A]"
                  }`}
                >
                  <div className="text-2xl mb-2">{m.icon}</div>
                  <div className="text-sm font-medium">{m.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Identity */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Agent Identity</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Agent Name *</label>
                <input
                  value={form.name}
                  onChange={e => handleNameChange(e.target.value)}
                  placeholder="e.g. DeFi Risk Analyser"
                  className="w-full bg-[#1A1A1A] text-white rounded-lg px-4 py-3 border border-[#2A2A2A] outline-none focus:border-[#6C3BFF]"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Slug (auto-generated)</label>
                <input
                  value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                  className="w-full bg-[#111] text-gray-400 rounded-lg px-4 py-3 border border-[#2A2A2A] outline-none font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Category *</label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full bg-[#1A1A1A] text-white rounded-lg px-4 py-3 border border-[#2A2A2A] outline-none focus:border-[#6C3BFF]"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Endpoint */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Endpoint Configuration</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">API Endpoint URL</label>
                <input
                  value={form.apiEndpoint}
                  onChange={e => setForm(f => ({ ...f, apiEndpoint: e.target.value }))}
                  placeholder="https://your-agent-endpoint.com/execute"
                  className="w-full bg-[#1A1A1A] text-white rounded-lg px-4 py-3 border border-[#2A2A2A] outline-none focus:border-[#6C3BFF]"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Webhook URL (optional)</label>
                <input
                  value={form.webhookUrl}
                  onChange={e => setForm(f => ({ ...f, webhookUrl: e.target.value }))}
                  placeholder="https://your-webhook.com/callback"
                  className="w-full bg-[#1A1A1A] text-white rounded-lg px-4 py-3 border border-[#2A2A2A] outline-none focus:border-[#6C3BFF]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Metadata */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Agent Metadata</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Short Description *</label>
                <input
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="One line describing what your agent does"
                  maxLength={160}
                  className="w-full bg-[#1A1A1A] text-white rounded-lg px-4 py-3 border border-[#2A2A2A] outline-none focus:border-[#6C3BFF]"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Long Description</label>
                <textarea
                  value={form.longDescription}
                  onChange={e => setForm(f => ({ ...f, longDescription: e.target.value }))}
                  placeholder="Detailed description, use cases, capabilities..."
                  rows={4}
                  className="w-full bg-[#1A1A1A] text-white rounded-lg px-4 py-3 border border-[#2A2A2A] outline-none focus:border-[#6C3BFF] resize-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.tags.map(tag => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 px-2 py-1 bg-[#6C3BFF]/20 text-[#6C3BFF] rounded text-xs"
                    >
                      {tag}
                      <button onClick={() => removeTag(tag)} className="text-[#6C3BFF] hover:text-red-400">×</button>
                    </span>
                  ))}
                </div>
                <input
                  placeholder="Type a tag and press Enter"
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      addTag((e.target as HTMLInputElement).value.trim());
                      (e.target as HTMLInputElement).value = "";
                    }
                  }}
                  className="w-full bg-[#1A1A1A] text-white rounded-lg px-4 py-2 border border-[#2A2A2A] outline-none text-sm"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm text-gray-400 mb-1">Icon</label>
                  <input
                    value={form.icon}
                    onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                    placeholder="🤖"
                    className="w-full bg-[#1A1A1A] text-white rounded-lg px-4 py-2 border border-[#2A2A2A] outline-none text-2xl text-center"
                    maxLength={2}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-gray-400 mb-1">Color</label>
                  <input
                    type="color"
                    value={form.color}
                    onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                    className="w-full h-10 rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Pricing */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Access Pricing</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Price per Run (HBAR) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={form.priceHbar}
                    onChange={e => setForm(f => ({ ...f, priceHbar: parseFloat(e.target.value) || 1 }))}
                    min={0.1}
                    step={0.1}
                    className="w-full bg-[#1A1A1A] text-white rounded-lg px-4 py-3 border border-[#2A2A2A] outline-none focus:border-[#6C3BFF] pr-16"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">HBAR</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Buyer pays {form.priceHbar + 0.5} HBAR per run (includes 0.5 HBAR platform fee)
                </p>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Setup Fee (HBAR) — optional
                </label>
                <input
                  type="number"
                  value={form.setupFee}
                  onChange={e => setForm(f => ({ ...f, setupFee: parseFloat(e.target.value) || 0 }))}
                  min={0}
                  step={0.1}
                  className="w-full bg-[#1A1A1A] text-white rounded-lg px-4 py-3 border border-[#2A2A2A] outline-none focus:border-[#6C3BFF]"
                />
              </div>
              <div className="bg-[#1A1A1A] rounded-lg p-4 space-y-1">
                <p className="text-xs text-gray-500">Earnings per run</p>
                <p className="text-white font-medium">{form.priceHbar} HBAR → you</p>
                <p className="text-gray-500 text-sm">0.5 HBAR → AgentBazaar platform</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Exec Config */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Execution Config</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  System Prompt / Logic *
                </label>
                <textarea
                  value={form.logic}
                  onChange={e => setForm(f => ({ ...f, logic: e.target.value }))}
                  placeholder="You are a DeFi risk analyser. Analyse the provided contract address and return a structured risk report..."
                  rows={6}
                  className="w-full bg-[#1A1A1A] text-white rounded-lg px-4 py-3 border border-[#2A2A2A] outline-none focus:border-[#6C3BFF] resize-none font-mono text-sm"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-400">API Keys (optional)</label>
                  <button
                    onClick={addApiKey}
                    className="text-xs text-[#6C3BFF] hover:underline"
                  >
                    + Add key
                  </button>
                </div>
                {form.apiKeys.length === 0 && (
                  <p className="text-xs text-gray-600">
                    No API keys needed? Leave empty. Encrypted & stored securely if added.
                  </p>
                )}
                {form.apiKeys.map((key, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input
                      value={key.name}
                      onChange={e => updateApiKey(i, "name", e.target.value)}
                      placeholder="Key name (e.g. OPENAI_API_KEY)"
                      className="flex-1 bg-[#1A1A1A] text-white rounded-lg px-3 py-2 border border-[#2A2A2A] outline-none text-sm"
                    />
                    <input
                      type="password"
                      value={key.value}
                      onChange={e => updateApiKey(i, "value", e.target.value)}
                      placeholder="Value"
                      className="flex-1 bg-[#1A1A1A] text-white rounded-lg px-3 py-2 border border-[#2A2A2A] outline-none text-sm"
                    />
                    <button
                      onClick={() => removeApiKey(i)}
                      className="text-red-400 px-2 hover:text-red-300"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {form.apiKeys.length > 0 && (
                  <p className="text-xs text-green-500 mt-1">
                    🔒 Keys encrypted with AES-256-GCM — only accessible after payment
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 7: Deploy */}
        {currentStep === 7 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Review & Deploy</h2>

            {/* Summary */}
            <div className="bg-[#111] rounded-xl border border-[#2A2A2A] divide-y divide-[#2A2A2A]">
              {[
                { label: "Mode", value: form.mode.toUpperCase() },
                { label: "Name", value: form.name },
                { label: "Category", value: form.category },
                { label: "Slug", value: form.slug },
                { label: "Price", value: `${form.priceHbar} HBAR per run` },
                { label: "API Keys", value: form.apiKeys.length > 0 ? `${form.apiKeys.length} encrypted key(s)` : "None" },
                { label: "Logic", value: form.logic ? `${form.logic.slice(0, 60)}...` : "Not set" },
              ].map(row => (
                <div key={row.label} className="flex justify-between px-4 py-3">
                  <span className="text-xs text-gray-500">{row.label}</span>
                  <span className="text-xs text-white">{row.value}</span>
                </div>
              ))}
            </div>

            {/* HashPack connection */}
            {!isConnected ? (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 space-y-2">
                <p className="text-sm text-yellow-400">
                  Connect HashPack to deploy. Your wallet becomes the owner of your agent's on-chain identity.
                </p>
                <button
                  onClick={connect}
                  className="w-full py-2 bg-[#6C3BFF] text-white rounded-lg text-sm"
                >
                  Connect HashPack
                </button>
              </div>
            ) : (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                <p className="text-xs text-green-400">
                  ✓ HashPack connected — {accountId}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Deploying will open 1 HashPack popup to create your HCS-14 agent identity on Hedera testnet.
                </p>
              </div>
            )}

            {error && <p className="text-red-400 text-sm">{error}</p>}
            {status && <p className="text-yellow-400 text-sm">{status}</p>}

            <button
              onClick={handleDeploy}
              disabled={loading || !isConnected || !form.name || !form.logic}
              className="w-full py-4 bg-[#6C3BFF] text-white rounded-xl font-medium disabled:opacity-50 text-lg"
            >
              {loading ? status || "Deploying..." : "Deploy Agent ↗"}
            </button>
          </div>
        )}

        {/* ── Navigation ───────────────────────────────────────────────────── */}
        {currentStep < 7 && (
          <div className="flex justify-between mt-8">
            <button
              onClick={back}
              disabled={currentStep === 1}
              className="px-6 py-2 text-sm text-gray-400 border border-[#2A2A2A] rounded-lg disabled:opacity-30"
            >
              ← Back
            </button>
            <button
              onClick={next}
              className="px-6 py-2 text-sm text-white bg-[#6C3BFF] rounded-lg"
            >
              Next →
            </button>
          </div>
        )}

        {currentStep === 7 && (
          <button
            onClick={back}
            className="mt-4 px-6 py-2 text-sm text-gray-400 border border-[#2A2A2A] rounded-lg"
          >
            ← Back
          </button>
        )}
        </div>
      </div>
    </div>
  );
}
