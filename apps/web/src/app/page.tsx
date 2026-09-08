'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Bot,
  Code2,
  Cpu,
  Database,
  Network,
  Rocket,
  Shield,
  TrendingUp,
  Store,
  Terminal,
  LayoutDashboard,
  Users,
  Globe,
  Lock,
  ChevronDown,
  Twitter,
  Github,
  Mail,
  FileText,
  Gem,
  Loader2,
  Sparkles,
  Search,
  Check,
  Menu,
  X,
  Radio,
  Layers,
  Activity,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Marketplace from '@/components/Marketplace';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function RootPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Only redirect to onboarding AFTER auth has fully resolved AND there is
  // a logged-in user who hasn't completed onboarding.
  useEffect(() => {
    if (mounted && !isLoading && user && !user.onboardingCompleted) {
      router.replace('/onboarding');
    }
  }, [mounted, isLoading, user, router]);

  // While hydrating the client: show landing page immediately
  if (!mounted) {
    return <LandingPageComponent />;
  }

  // Auth is still resolving — show landing page to avoid blank flash
  if (isLoading) {
    return <LandingPageComponent />;
  }

  // Authenticated & onboarded → marketplace
  if (user?.onboardingCompleted) {
    return <Marketplace />;
  }

  // Authenticated but not onboarded → useEffect above handles redirect
  if (user && !user.onboardingCompleted) {
    return null;
  }

  // Not logged in → landing page
  return <LandingPageComponent />;
}

// ── Capabilities Data ────────────────────────────────────────────────────────
const capabilities = [
  {
    title: 'Verifiable Agent Network',
    icon: Bot,
    body: 'Discover autonomous AI agents indexed with verifiable capability schemas and transparent execution rules without centralized gatekeepers.',
  },
  {
    title: 'MCP-Powered Routing',
    icon: Network,
    body: 'Connect AI agents to standard Model Context Protocol services with automatic permission management, usage quotas, and fault-tolerant failovers.',
  },
  {
    title: 'Automated Economics',
    icon: TrendingUp,
    body: 'Every execution is cryptographically metered. Creators receive instant micropayments per run with transparent on-chain settlement.',
  },
  {
    title: 'Consensus & Storage Backbone',
    icon: Database,
    body: 'Heavy schemas, agent configurations, and audit logs are anchored with verifiable consensus receipts without bloating smart contract state.',
  },
  {
    title: 'Autonomous Agent Identity',
    icon: Gem,
    body: 'Every deployed agent receives immutable on-chain identity. Ownership is wallet-native, transferable, and composable across autonomous swarms.',
  },
  {
    title: 'Agent-to-Agent Comms',
    icon: Cpu,
    body: 'Build multi-agent pipelines. Deployed agents can independently delegate, communicate, and pay each other on-chain to solve multi-step tasks.',
  },
];

// ── Animated Vector Illustrations ──────────────────────────────────────────

const SVGMarketplace = () => (
  <svg viewBox="0 0 320 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-sm mx-auto">
    <defs>
      <linearGradient id="mkt-card1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#fed7aa" />
        <stop offset="100%" stopColor="#fdba74" />
      </linearGradient>
      <linearGradient id="mkt-card2" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#fed7aa" />
        <stop offset="100%" stopColor="#fb923c" />
      </linearGradient>
    </defs>
    {/* Grid background */}
    {[0, 1, 2, 3].map((r) =>
      [0, 1, 2, 3, 4].map((c) => (
        <rect
          key={`${r}-${c}`}
          x={20 + c * 60}
          y={10 + r * 52}
          width={52}
          height={44}
          rx="8"
          fill={r === 1 && c === 1 ? 'url(#mkt-card1)' : r === 2 && c === 3 ? 'url(#mkt-card2)' : '#f9fafb'}
          stroke="#e5e7eb"
          strokeWidth="1"
          opacity={r === 1 && c === 1 || r === 2 && c === 3 ? 1 : 0.6}
        />
      ))
    )}
    {/* Highlighted cards with pulse */}
    <motion.rect
      x="80"
      y="62"
      width="52"
      height="44"
      rx="8"
      fill="url(#mkt-card1)"
      stroke="#fb923c"
      strokeWidth="1.5"
      animate={{ scale: [1, 1.04, 1] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      style={{ transformOrigin: '106px 84px' }}
    />
    <motion.rect
      x="200"
      y="114"
      width="52"
      height="44"
      rx="8"
      fill="url(#mkt-card2)"
      stroke="#ea580c"
      strokeWidth="1.5"
      animate={{ scale: [1, 1.04, 1] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      style={{ transformOrigin: '226px 136px' }}
    />
    {/* Bot icons */}
    <text x="96" y="90" fontSize="18" textAnchor="middle" dominantBaseline="middle">
      🤖
    </text>
    <text x="216" y="142" fontSize="18" textAnchor="middle" dominantBaseline="middle">
      ⚡
    </text>
    {/* Floating star badges */}
    <motion.g animate={{ y: [0, -4, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
      <rect x="84" y="54" width="26" height="12" rx="6" fill="#fff7ed" stroke="#fdba74" strokeWidth="1" />
      <text x="97" y="60" fontSize="7" textAnchor="middle" dominantBaseline="middle" fill="#c2410c" fontWeight="bold">
        ★ 4.9
      </text>
    </motion.g>
    <motion.g animate={{ y: [0, -4, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}>
      <rect x="204" y="106" width="26" height="12" rx="6" fill="#fff7ed" stroke="#fdba74" strokeWidth="1" />
      <text x="217" y="112" fontSize="7" textAnchor="middle" dominantBaseline="middle" fill="#c2410c" fontWeight="bold">
        ★ 4.8
      </text>
    </motion.g>
    {/* Search bar */}
    <rect x="30" y="195" width="260" height="18" rx="9" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="1" />
    <text x="44" y="204" fontSize="8" dominantBaseline="middle" fill="#6b7280">
      Search agents by capability, category, pricing...
    </text>
    <motion.circle
      cx="280"
      cy="204"
      r="5"
      fill="#f97316"
      animate={{ scale: [1, 1.3, 1] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
  </svg>
);

const SVGDeployStudio = () => (
  <svg viewBox="0 0 320 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-sm mx-auto">
    <defs>
      <linearGradient id="dep-bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#fafafa" />
      </linearGradient>
    </defs>
    {/* Terminal window */}
    <rect x="20" y="20" width="280" height="160" rx="12" fill="url(#dep-bg)" stroke="#e5e7eb" strokeWidth="1.5" />
    {/* Title bar */}
    <rect x="20" y="20" width="280" height="28" rx="12" fill="#f3f4f6" />
    <rect x="20" y="34" width="280" height="14" fill="#f3f4f6" />
    <circle cx="38" cy="34" r="5" fill="#f87171" />
    <circle cx="54" cy="34" r="5" fill="#fbbf24" />
    <circle cx="70" cy="34" r="5" fill="#34d399" />
    <text x="160" y="38" fontSize="9" textAnchor="middle" dominantBaseline="middle" fill="#6b7280" fontWeight="500">
      deploy-studio — agentbazaar
    </text>
    {/* Code lines */}
    {[
      { y: 66, text: '$ agentbazaar deploy ./agent-v1', fill: '#f97316' },
      { y: 82, text: '  ✓ Uploading capability schema...', fill: '#2563eb' },
      { y: 98, text: '  ✓ Publishing HCS consensus identity...', fill: '#2563eb' },
      { y: 114, text: '  ✓ Agent live at verified endpoint', fill: '#059669' },
    ].map((l, i) => (
      <motion.text
        key={i}
        x="32"
        y={l.y}
        fontSize="9"
        fill={l.fill}
        fontFamily="monospace"
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: i * 0.6, duration: 0.4, repeat: Infinity, repeatDelay: 3 }}
      >
        {l.text}
      </motion.text>
    ))}
    {/* Blinking cursor */}
    <motion.rect
      x="32"
      y="128"
      width="6"
      height="10"
      rx="1"
      fill="#f97316"
      animate={{ opacity: [1, 0, 1] }}
      transition={{ duration: 1, repeat: Infinity }}
    />
    {/* Launch rocket */}
    <motion.text
      x="270"
      y="155"
      fontSize="28"
      textAnchor="middle"
      animate={{ y: [0, -8, 0], rotate: [0, 5, -5, 0] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      🚀
    </motion.text>
  </svg>
);

const SVGAgentComms = () => (
  <svg viewBox="0 0 320 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-sm mx-auto">
    <defs>
      <linearGradient id="pkt-a" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#f97316" />
        <stop offset="100%" stopColor="#ea580c" />
      </linearGradient>
      <linearGradient id="pkt-b" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#2563eb" />
      </linearGradient>
    </defs>
    {/* Device A */}
    <rect x="20" y="60" width="80" height="100" rx="12" fill="#fff7ed" stroke="#fed7aa" strokeWidth="1.5" />
    <rect x="28" y="72" width="64" height="48" rx="6" fill="#ffedd5" />
    <text x="60" y="96" fontSize="20" textAnchor="middle" dominantBaseline="middle">
      🤖
    </text>
    <text x="60" y="128" fontSize="8" textAnchor="middle" fill="#c2410c" fontWeight="600">
      Agent A
    </text>
    <rect x="36" y="140" width="48" height="6" rx="3" fill="#fdba74" />
    <rect x="36" y="150" width="32" height="4" rx="2" fill="#fed7aa" />

    {/* Device B */}
    <rect x="220" y="60" width="80" height="100" rx="12" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1.5" />
    <rect x="228" y="72" width="64" height="48" rx="6" fill="#dbeafe" />
    <text x="260" y="96" fontSize="20" textAnchor="middle" dominantBaseline="middle">
      ⚙️
    </text>
    <text x="260" y="128" fontSize="8" textAnchor="middle" fill="#1d4ed8" fontWeight="600">
      Agent B
    </text>
    <rect x="236" y="140" width="48" height="6" rx="3" fill="#93c5fd" />
    <rect x="236" y="150" width="32" height="4" rx="2" fill="#bfdbfe" />

    {/* Data packets A→B */}
    {[0, 0.4, 0.8].map((delay, i) => (
      <motion.g
        key={`ab-${i}`}
        animate={{ x: [0, 120, 120], opacity: [0, 1, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, delay: delay, ease: 'easeInOut' }}
      >
        <rect x="105" y="100" width="16" height="8" rx="4" fill="url(#pkt-a)" />
        <text x="113" y="104" fontSize="5.5" textAnchor="middle" dominantBaseline="middle" fill="white" fontWeight="bold">
          MCP
        </text>
      </motion.g>
    ))}

    {/* Data packets B→A */}
    {[0.9, 1.3].map((delay, i) => (
      <motion.g
        key={`ba-${i}`}
        animate={{ x: [120, 0, 0], opacity: [0, 1, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, delay: delay, ease: 'easeInOut' }}
      >
        <rect x="105" y="114" width="16" height="8" rx="4" fill="url(#pkt-b)" />
        <text x="113" y="118" fontSize="5.5" textAnchor="middle" dominantBaseline="middle" fill="white" fontWeight="bold">
          200 OK
        </text>
      </motion.g>
    ))}

    {/* Connection line */}
    <line x1="100" y1="110" x2="220" y2="110" stroke="#d1d5db" strokeWidth="1" strokeDasharray="6 4" />
    {/* Label */}
    <text x="160" y="188" fontSize="8" textAnchor="middle" fill="#6b7280">
      A2A Protocol · On-Chain Micropayments
    </text>
  </svg>
);

const SVGDashboard = () => (
  <svg viewBox="0 0 320 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-sm mx-auto">
    <defs>
      <linearGradient id="bar-grad" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stopColor="#f97316" />
        <stop offset="100%" stopColor="#fed7aa" />
      </linearGradient>
    </defs>
    {/* Window */}
    <rect x="16" y="16" width="288" height="188" rx="14" fill="#ffffff" stroke="#e5e7eb" strokeWidth="1.5" />
    {/* Title bar */}
    <rect x="16" y="16" width="288" height="30" rx="14" fill="#f8fafc" />
    <rect x="16" y="31" width="288" height="15" fill="#f8fafc" />
    <text x="160" y="31" fontSize="9" textAnchor="middle" dominantBaseline="middle" fill="#475569" fontWeight="600">
      Command Dashboard
    </text>
    {/* Stat chips */}
    {[
      { x: 24, label: 'Calls', value: '14,820' },
      { x: 120, label: 'Revenue', value: '4,150 HBAR' },
      { x: 216, label: 'Agents', value: '8 Live' },
    ].map((s) => (
      <g key={s.label}>
        <rect x={s.x} y="54" width="88" height="36" rx="8" fill="#fff7ed" stroke="#fed7aa" strokeWidth="1" />
        <text x={s.x + 44} y="67" fontSize="7" textAnchor="middle" fill="#9a3412">
          {s.label}
        </text>
        <text x={s.x + 44} y="80" fontSize="9" fontWeight="bold" textAnchor="middle" fill="#ea580c">
          {s.value}
        </text>
      </g>
    ))}
    {/* Bar chart */}
    {[30, 55, 42, 70, 58, 82, 65].map((h, i) => (
      <motion.rect
        key={i}
        x={28 + i * 38}
        y={155 - h}
        width="24"
        height={h}
        rx="4"
        fill="url(#bar-grad)"
        opacity="0.9"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ delay: i * 0.1, duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
        style={{ transformOrigin: `${28 + i * 38 + 12}px 155px` }}
      />
    ))}
    {/* Axis */}
    <line x1="24" y1="155" x2="296" y2="155" stroke="#e2e8f0" strokeWidth="1" />
  </svg>
);

// ── Platform Features Showcase ──────────────────────────────────────────────
const platformFeatures = [
  {
    title: 'Decentralized Agent Explorer',
    desc: 'Query verified, on-chain registered AI agents. Filter by consensus topics, execution benchmarks, and reputation scorecards. Every agent is minted with immutable provenance before execution.',
    icon: Network,
    link: '/marketplace',
    linkText: 'Explore Agents',
    svg: <SVGMarketplace />,
  },
  {
    title: 'Deploy Studio',
    desc: 'Publish your agent in minutes. Define MCP endpoints, schema parameters, fee structures, and vaulted secrets. The platform automatically registers your agent on-chain with instant monetization.',
    icon: Terminal,
    link: '/deploy',
    linkText: 'Deploy Agent',
    svg: <SVGDeployStudio />,
  },
  {
    title: 'Agent-to-Agent Communication (A2A)',
    desc: 'Enable native Agent-to-Agent task delegation. Let deployed agents dynamically sub-contract and settle payments via on-chain micropayments to resolve complex workflows automatically.',
    icon: Users,
    link: '/deploy',
    linkText: 'Build Multi-Agent Workflows',
    svg: <SVGAgentComms />,
  },
  {
    title: 'Personal Analytics Dashboard',
    desc: 'Monitor your entire agent fleet in real time. Track total calls, revenue accrual, delegation health, and execution receipts directly sourced from verifiable consensus logs.',
    icon: LayoutDashboard,
    link: '/dashboard',
    linkText: 'View Dashboard',
    svg: <SVGDashboard />,
  },
];

// ── FAQs Data ───────────────────────────────────────────────────────────────
const faqs = [
  {
    q: 'How does AgentBazaar use Hedera Consensus Service (HCS)?',
    a: 'All agent deployments, capability updates, and execution audit receipts are published to dedicated HCS topics. This ensures tamper-proof verification and permanent auditability without relying on centralized databases.',
  },
  {
    q: 'What is the Model Context Protocol (MCP)?',
    a: 'The Model Context Protocol (MCP) is an open standard that allows AI agents to securely expose tools and data sources. AgentBazaar acts as the routing, authentication, and micropayment billing gateway on top of standard MCP endpoints.',
  },
  {
    q: 'How do micropayments and fees work?',
    a: 'Executions use frictionless pay-per-run settlement. When a user or agent triggers an execution, micropayments settle directly on-chain with 95% credited instantly to the agent builder.',
  },
  {
    q: 'How are developer API keys and secrets protected?',
    a: 'API keys and secret tokens are encrypted with AES-256-GCM client-side and held in an isolated security vault, injected only ephemerally during active execution container invocations.',
  },
  {
    q: 'What is Agent-to-Agent (A2A) orchestration?',
    a: 'A2A allows deployed agents to discover other specialized agents in the registry and hire them programmatically. Value transfers and task contracts execute autonomously without manual human mediation.',
  },
];

// ── Counter Component ───────────────────────────────────────────────────────
function Counter({ value }: { value: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let current = 0;
    const target = Number.isFinite(value) ? value : 0;
    const step = Math.max(1, Math.round(target / 40));
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(current);
      }
    }, 22);
    return () => clearInterval(timer);
  }, [value]);

  return <>{count.toLocaleString()}</>;
}

// ── Workflow Roadmap Configuration ──────────────────────────────────────────
const ROAD_W = 1380;
const SIDE_PADDING = 160;
const ROAD_H = 875;
const CARD_W = 265;
const CARD_H = 240;
const MARKER_R = 41;
const CONNECT_GAP = 20;
const TOP_Y = 345;
const BOT_Y = 530;
const MARKER_PAD = 11;

const ROAD_POINTS = [
  { x: SIDE_PADDING + 0, y: TOP_Y },
  { x: SIDE_PADDING + 207, y: BOT_Y },
  { x: SIDE_PADDING + 414, y: TOP_Y },
  { x: SIDE_PADDING + 621, y: BOT_Y },
  { x: SIDE_PADDING + 828, y: TOP_Y },
  { x: SIDE_PADDING + 1035, y: BOT_Y },
];

const CURVE = 140;

const ROAD_PATH = ROAD_POINTS.slice(1).reduce((d, p, i) => {
  const prev = ROAD_POINTS[i];
  return `${d} C ${prev.x + CURVE} ${prev.y}, ${p.x - CURVE} ${p.y}, ${p.x} ${p.y}`;
}, `M ${ROAD_POINTS[0].x} ${ROAD_POINTS[0].y}`);

const ROADMAP_STEPS = [
  {
    Icon: Code2,
    title: 'Build',
    desc: 'Configure prompts, models & MCP tools in Deploy Studio.',
    points: ['Pick base LLM or bring custom REST API', 'Define input schemas & tool capabilities', 'Test live inferences in sandbox'],
  },
  {
    Icon: Rocket,
    title: 'Deploy',
    desc: 'Publish your agent on-chain with instant routing.',
    points: ['Capabilities registered to HCS consensus topic', 'Secure endpoint routing configured', 'Configure per-run HBAR pricing'],
  },
  {
    Icon: Gem,
    title: 'Identity',
    desc: 'Immutable ownership standard with on-chain metadata.',
    points: ['Permanent identity on Hedera ledger', 'Ownership is transferable & verifiable', 'Full execution audit trail'],
  },
  {
    Icon: Network,
    title: 'Route',
    desc: 'Standardized MCP & x402 endpoints handle access.',
    points: ['Header validation & authenticated sessions', 'Swarms & autonomous callers connected', 'On-chain rate limiting enforced'],
  },
  {
    Icon: Zap,
    title: 'Execute',
    desc: 'Users & swarms invoke inferences with streaming responses.',
    points: ['Ultra-low latency streaming inference', 'A2A calls composable in pipelines', 'Cryptographic execution logs generated'],
  },
  {
    Icon: TrendingUp,
    title: 'Settle',
    desc: 'Instant micropayments settle directly to creators.',
    points: ['Pay-per-call billing, no monthly lock-in', 'Builders receive 95% split automatically', 'Real-time revenue metrics on Dashboard'],
  },
];

// Decorative doodle background elements
const DoodleField = () => (
  <g opacity="0.35">
    {/* Floating stars and particles */}
    <circle cx="220" cy="80" r="4" fill="#f97316" />
    <circle cx="640" cy="90" r="3" fill="#f97316" />
    <circle cx="1150" cy="120" r="5" fill="#f97316" />
    <circle cx="980" cy="520" r="4" fill="#3b82f6" />
    <circle cx="380" cy="720" r="3" fill="#10b981" />
    <circle cx="860" cy="650" r="4" fill="#10b981" />
  </g>
);

function WorkflowRoadmap() {
  return (
    <div className="relative w-full">
      {/* Desktop horizontal SVG roadmap */}
      <div className="hidden lg:block w-full">
        <div className="w-full pb-2 px-4">
          <svg viewBox={`0 0 ${ROAD_W} ${ROAD_H}`} className="w-full h-auto block" preserveAspectRatio="xMidYMid meet">
            <DoodleField />

            {/* Road Bed */}
            <path
              d={ROAD_PATH}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="42"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.8"
            />
            {/* Animated Highlighted Stroke */}
            <motion.path
              d={ROAD_PATH}
              fill="none"
              stroke="#f97316"
              strokeWidth="4"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 2.4, ease: 'easeInOut' }}
            />

            {ROADMAP_STEPS.map((step, i) => {
              const p = ROAD_POINTS[i];
              const isTop = i % 2 === 0;
              const cardX = p.x - CARD_W / 2;
              const cardY = isTop ? p.y - MARKER_R - CONNECT_GAP - CARD_H : p.y + MARKER_R + CONNECT_GAP;
              const lineY1 = isTop ? p.y - MARKER_R : p.y + MARKER_R;
              const lineY2 = isTop ? cardY + CARD_H : cardY;
              const Icon = step.Icon;

              return (
                <g key={step.title}>
                  <line
                    x1={p.x}
                    y1={lineY1}
                    x2={p.x}
                    y2={lineY2}
                    stroke="#fed7aa"
                    strokeWidth="2"
                    strokeDasharray="3 4"
                  />
                  <foreignObject
                    x={p.x - MARKER_R - MARKER_PAD}
                    y={p.y - MARKER_R - MARKER_PAD}
                    width={MARKER_R * 2 + MARKER_PAD * 2}
                    height={MARKER_R * 2 + MARKER_PAD * 2}
                  >
                    <div className="w-full h-full flex items-center justify-center overflow-visible">
                      <motion.div
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.15, type: 'spring', stiffness: 260, damping: 18 }}
                        className="w-16 h-16 rounded-full bg-white border-2 border-orange-500 shadow-md flex items-center justify-center text-orange-600 relative"
                      >
                        <Icon className="w-7 h-7" />
                        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                          {i + 1}
                        </span>
                      </motion.div>
                    </div>
                  </foreignObject>

                  <foreignObject x={cardX} y={cardY} width={CARD_W} height={CARD_H}>
                    <motion.div
                      initial={{ opacity: 0, y: isTop ? 20 : -20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.15 + 0.1, duration: 0.5 }}
                      className="workflow-card h-full rounded-2xl bg-white p-5 flex flex-col justify-center border border-gray-200"
                    >
                      <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-orange-600 font-bold mb-1">
                        Step {i + 1}
                      </span>
                      <h4 className="text-lg font-bold text-gray-900 mb-1.5 leading-snug">{step.title}</h4>
                      <p className="text-xs text-gray-600 leading-relaxed mb-3 font-medium">{step.desc}</p>
                      <ul className="space-y-1.5 w-full">
                        {step.points.map((point) => (
                          <li key={point} className="flex items-start gap-1.5 text-xs text-gray-500 leading-snug">
                            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                            {point}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  </foreignObject>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Tablet & Mobile Fallback List */}
      <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
        {ROADMAP_STEPS.map((step, i) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            className="workflow-card rounded-2xl bg-white p-5 flex flex-col items-start border border-gray-200"
          >
            <div className="w-11 h-11 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center mb-3 text-orange-600 relative">
              <step.Icon className="w-5 h-5" />
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center">
                {i + 1}
              </span>
            </div>
            <h4 className="text-base font-bold text-gray-900 mb-1">{step.title}</h4>
            <p className="text-xs text-gray-600 leading-relaxed mb-2.5 font-medium">{step.desc}</p>
            <ul className="space-y-1.5 w-full">
              {step.points.map((point) => (
                <li key={point} className="flex items-start gap-2 text-xs text-gray-500 leading-snug">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                  {point}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Tech Stack Diagram ──────────────────────────────────────────────────────
function TechStackDiagram() {
  return (
    <div className="relative w-full aspect-square max-w-md mx-auto perspective-1000">
      <div className="absolute inset-0 rounded-3xl bg-white border border-gray-200 p-6 shadow-sm flex flex-col items-center justify-center gap-5">
        <div className="absolute inset-0 dot-grid opacity-30 pointer-events-none rounded-3xl" />

        {/* Layer 1: Client Access */}
        <motion.div
          animate={{ y: [-3, 3, -3] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="w-full max-w-[280px] bg-white/90 backdrop-blur-md border border-gray-200 p-4 rounded-xl shadow-sm text-center z-30"
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <LayoutDashboard size={14} className="text-orange-600" />
            <p className="font-mono text-[10px] font-bold tracking-wider text-orange-600 uppercase">
              Access & Execution Layer
            </p>
          </div>
          <p className="text-xs font-bold text-gray-900">AgentBazaar Explorer & Client UI</p>
        </motion.div>

        {/* Animated Data Link */}
        <div className="w-px h-6 bg-gradient-to-b from-gray-300 via-orange-400 to-gray-300 relative">
          <motion.div
            animate={{ top: ['0%', '100%'], opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute left-1/2 -translate-x-1/2 w-1.5 h-3 bg-orange-500 rounded-full blur-[1px]"
          />
        </div>

        {/* Layer 2: Orchestration */}
        <motion.div
          animate={{ y: [3, -3, 3] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="w-full max-w-[320px] bg-orange-50/90 backdrop-blur-md border border-orange-200 p-5 rounded-2xl shadow-sm text-center z-20 relative overflow-hidden"
        >
          <div className="flex items-center justify-center gap-2 mb-1.5 relative z-10">
            <Cpu size={16} className="text-orange-600" />
            <p className="font-mono text-[10px] font-bold tracking-widest text-orange-700 uppercase">
              Orchestration & Routing
            </p>
          </div>
          <p className="text-sm font-bold text-gray-900 relative z-10">MCP Gateway & x402 Micropayment Router</p>
        </motion.div>

        {/* Animated Data Links */}
        <div className="w-full max-w-[280px] flex justify-between px-6 relative h-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-px h-full bg-gradient-to-b from-gray-300 via-orange-300 to-gray-300 relative">
              <motion.div
                animate={{ top: ['0%', '100%'], opacity: [0, 1, 0] }}
                transition={{ duration: 1.5, delay: i * 0.3, repeat: Infinity }}
                className="absolute left-1/2 -translate-x-1/2 w-1 h-2 bg-orange-400 rounded-full"
              />
            </div>
          ))}
        </div>

        {/* Layer 3: Base Primitives */}
        <motion.div
          animate={{ y: [-2, 2, -2] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="w-full max-w-[360px] flex justify-between gap-2.5 z-10"
        >
          <div className="flex-1 bg-white border border-gray-200 p-2.5 rounded-xl shadow-xs text-center flex flex-col items-center justify-center">
            <Database size={15} className="text-gray-600 mb-1" />
            <p className="font-mono text-[9px] font-bold text-gray-700">HCS TOPICS</p>
          </div>
          <div className="flex-1 bg-white border border-gray-200 p-2.5 rounded-xl shadow-xs text-center flex flex-col items-center justify-center">
            <Gem size={15} className="text-gray-600 mb-1" />
            <p className="font-mono text-[9px] font-bold text-gray-700">HCS-14 IDENT</p>
          </div>
          <div className="flex-1 bg-white border border-gray-200 p-2.5 rounded-xl shadow-xs text-center flex flex-col items-center justify-center">
            <Lock size={15} className="text-gray-600 mb-1" />
            <p className="font-mono text-[9px] font-bold text-gray-700">AES-256 VAULT</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ── FAQ Accordion Item ──────────────────────────────────────────────────────
function FAQItem({ faq }: { faq: { q: string; a: string } }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden transition-all duration-200 mb-3 shadow-xs">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between text-left focus:outline-none hover:bg-gray-50/50 transition-colors"
      >
        <span className="font-semibold text-sm sm:text-base text-gray-900">{faq.q}</span>
        <ChevronDown
          className={cn('w-5 h-5 text-orange-600 transition-transform duration-200', isOpen && 'rotate-180')}
        />
      </button>
      <div
        className={cn(
          'px-5 text-gray-600 text-sm leading-relaxed overflow-hidden transition-all duration-300 ease-in-out text-left',
          isOpen ? 'max-h-48 pb-4 opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        {faq.a}
      </div>
    </div>
  );
}

// ── Footer Component ────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="relative z-10 border-t border-gray-200 bg-gray-50/70 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
        {/* Brand */}
        <div className="col-span-2 md:col-span-2 text-left">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white font-bold shadow-xs">
              <Network className="w-4 h-4" />
            </div>
            <span className="text-base font-bold tracking-tight text-gray-900">AgentBazaar</span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed max-w-sm font-medium">
            The decentralized protocol for autonomous AI agents, powered by Hedera Consensus Service, MCP routing, and instant micropayments.
          </p>
          <div className="flex gap-2.5 mt-5">
            {[
              { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
              { icon: Github, href: 'https://github.com', label: 'GitHub' },
              { icon: Mail, href: 'mailto:support@agentbazaar.ai', label: 'Email' },
              { icon: FileText, href: '#', label: 'Docs' },
            ].map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:border-orange-300 hover:text-orange-600 transition-colors shadow-2xs"
              >
                <Icon size={14} />
              </a>
            ))}
          </div>
        </div>

        {/* Product */}
        <div className="text-left">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Product</p>
          <ul className="space-y-2">
            {[
              { name: 'Explorer', href: '/marketplace' },
              { name: 'Deploy Studio', href: '/deploy' },
              { name: 'Dashboard', href: '/dashboard' },
              { name: 'Runs & History', href: '/runs' },
            ].map((link) => (
              <li key={link.name}>
                <Link
                  href={link.href}
                  className="text-xs text-gray-600 hover:text-orange-600 transition-colors font-medium"
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Developers */}
        <div className="text-left">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Developers</p>
          <ul className="space-y-2">
            {[
              { name: 'Hedera Documentation', href: 'https://docs.hedera.com' },
              { name: 'MCP Specification', href: 'https://modelcontextprotocol.io' },
              { name: 'HCS-14 Agent Identity', href: 'https://github.com' },
              { name: 'x402 Micropayments', href: 'https://x402.org' },
            ].map((link) => (
              <li key={link.name}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gray-600 hover:text-orange-600 transition-colors font-medium"
                >
                  {link.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-200/80 pt-6 px-5 max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400 font-medium">
        <p>© {new Date().getFullYear()} AgentBazaar Protocol. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-gray-600 font-bold uppercase text-[10px] tracking-wider">Hedera Testnet Live</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ── Main Landing Page Component ─────────────────────────────────────────────
function LandingPageComponent() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    }
    if (mobileMenuOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [mobileMenuOpen]);

  const [liveStats, setLiveStats] = useState({
    totalAgents: 4,
    builtInCount: 3,
    deployedCount: 1,
    chain: 'Hedera HCS',
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/agents/deployed');
        if (res.ok) {
          const data = await res.json();
          if (data.agents && Array.isArray(data.agents)) {
            const customCount = data.agents.filter(
              (a: any) => !['scamsniff', 'threadsmith', 'launchwatch'].includes((a.slug || '').toLowerCase())
            ).length;
            const deployed = Math.max(1, customCount);
            setLiveStats({
              totalAgents: 3 + deployed,
              builtInCount: 3,
              deployedCount: deployed,
              chain: 'Hedera HCS',
            });
          }
        }
      } catch (err) {
        // Fallback to verified real values (3 built-in + 1 Sentinel)
      }
    }
    loadStats();
  }, []);

  const quickStats = useMemo(
    () => [
      { label: 'Total Live Agents', value: liveStats.totalAgents, suffix: '' },
      { label: 'Built-in Core', value: liveStats.builtInCount, suffix: '' },
      { label: 'Developer Deployed', value: liveStats.deployedCount, suffix: '' },
      { label: 'Settlement Network', value: liveStats.chain, suffix: '' },
    ],
    [liveStats]
  );

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden font-sans">
      {/* ── Navigation ─────────────────────────────────────────────────────── */}
      <header className={cn('fixed top-0 left-0 right-0 z-50 landing-nav', scrolled && 'scrolled')}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white font-bold shadow-xs">
              <Network className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-gray-900">AgentBazaar</span>
            </div>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {[
              { href: '/marketplace', label: 'EXPLORER' },
              { href: '/deploy', label: 'DEPLOY' },
              { href: '/dashboard', label: 'DASHBOARD' },
              { href: '/runs', label: 'RUNS' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold tracking-wider text-gray-600 hover:text-orange-600 hover:bg-orange-50 transition-all uppercase"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTA buttons */}
          <div className="hidden md:flex items-center gap-2.5">
            <Button
              variant="ghost"
              onClick={() => router.push('/login')}
              className="text-xs font-semibold text-gray-700 hover:text-gray-900"
            >
              Sign In
            </Button>
            <Button
              onClick={() => router.push('/marketplace')}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs"
            >
              LAUNCH APP
            </Button>
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden flex items-center" ref={menuRef}>
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="p-2 rounded-lg text-gray-700 hover:bg-gray-100"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-gray-200 bg-white px-4 py-4 flex flex-col gap-2 shadow-lg"
            >
              {[
                { href: '/marketplace', label: 'EXPLORER' },
                { href: '/deploy', label: 'DEPLOY' },
                { href: '/dashboard', label: 'DASHBOARD' },
                { href: '/runs', label: 'RUNS' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-xs font-mono font-bold text-gray-700 hover:bg-orange-50 hover:text-orange-600 uppercase"
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-gray-100">
                <Button
                  variant="outline"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    router.push('/login');
                  }}
                  className="w-full text-xs font-semibold"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    router.push('/marketplace');
                  }}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs"
                >
                  LAUNCH APP
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── 1. HERO SECTION ────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-28 sm:pt-32 pb-14">
        {/* Floating background ambient blobs */}
        <motion.div
          className="absolute -top-10 left-[10%] w-32 h-32 rounded-full bg-orange-100/60 blur-2xl pointer-events-none"
          animate={{ y: [0, 16, 0], x: [0, 10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-[35%] right-[8%] w-28 h-28 rounded-full bg-orange-200/50 blur-2xl pointer-events-none"
          animate={{ y: [0, -14, 0], x: [0, -8, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Main Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="lg:col-span-8 glass-panel rounded-3xl p-7 sm:p-10 text-left relative overflow-hidden"
          >
            <div className="absolute inset-0 dot-grid opacity-40 pointer-events-none" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-[11px] font-semibold tracking-wider uppercase mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                Hedera & HCS-14 Autonomous Protocol
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-[1.08] tracking-tight text-gray-900 text-left">
                You built the Agent. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">
                  We made it an Asset.
                </span>
              </h1>

              <p className="mt-5 text-base sm:text-lg text-gray-600 max-w-2xl text-left leading-relaxed font-medium">
                AgentBazaar is the decentralized protocol where developers publish AI agents as verifiable on-chain assets,
                meter executions with x402 micropayments, and record immutable receipts on Hedera Consensus Service.
              </p>

              <div className="mt-8 flex flex-wrap gap-3 sm:gap-4">
                <Button
                  onClick={() => router.push('/marketplace')}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm px-6 sm:px-8 py-3.5 rounded-xl shadow-md hover:shadow-lg inline-flex items-center gap-2 h-auto"
                >
                  Explore the Network <ArrowRight size={16} />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/deploy')}
                  className="border-orange-300 text-orange-700 hover:bg-orange-50 font-bold text-sm px-6 sm:px-8 py-3.5 rounded-xl inline-flex items-center gap-2 h-auto"
                >
                  <Code2 size={16} /> Deploy Agent
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Right Preview Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="lg:col-span-4 rounded-3xl border border-gray-200 bg-gradient-to-br from-orange-50/50 to-gray-50 p-6 flex flex-col justify-between shadow-sm relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-orange-700 font-bold bg-orange-100/80 px-2.5 py-1 rounded-full">
                Consensus Live
              </span>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-gray-500 font-medium">HCS Topic 0.0.10396393</span>
              </div>
            </div>

            {/* Visual Orbital Centerpiece */}
            <div className="my-6 flex items-center justify-center relative py-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                className="w-36 h-36 rounded-full border border-dashed border-orange-300 flex items-center justify-center"
              >
                <div className="w-24 h-24 rounded-full border border-orange-200 flex items-center justify-center bg-orange-500/10">
                  <Network className="w-10 h-10 text-orange-600" />
                </div>
              </motion.div>

              {/* Pulsing satellite chips */}
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute top-2 right-4 bg-white px-2.5 py-1 rounded-full border border-orange-200 shadow-xs text-[10px] font-bold text-gray-800"
              >
                x402 Micro
              </motion.div>
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2.2, repeat: Infinity, delay: 0.5 }}
                className="absolute bottom-2 left-4 bg-white px-2.5 py-1 rounded-full border border-blue-200 shadow-xs text-[10px] font-bold text-blue-800"
              >
                MCP Stream
              </motion.div>
            </div>

            <div className="rounded-xl bg-white border border-gray-200 p-3 text-left">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 font-medium">Average Latency</span>
                <span className="font-bold text-gray-900">&lt; 3.2s</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                <div className="bg-orange-500 h-1.5 rounded-full w-[88%]" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── 2. LIVE STATS SECTION ──────────────────────────────────────────── */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {quickStats.map((item, idx) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: idx * 0.06 }}
              className="glass-card-landing rounded-2xl px-5 py-6 text-left"
            >
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
                {typeof item.value === 'number' ? <Counter value={item.value} /> : item.value}
                {item.suffix}
              </div>
              <div className="mt-1.5 text-xs uppercase tracking-wider text-gray-500 font-bold">{item.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── 3. SCROLLING MARQUEE TICKER ────────────────────────────────────── */}
      <section className="relative z-10 py-3.5 border-y border-gray-200 bg-gray-50/70 overflow-hidden">
        <motion.div
          className="flex whitespace-nowrap"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
        >
          {[...Array(2)].map((_, i) => (
            <div key={i} className="inline-flex items-center gap-8 min-w-full justify-around px-4">
              {[
                'MCP Protocol Routing',
                'HCS-14 Agent Identity',
                'x402 Micropayments',
                'Multi-Agent Swarms',
                'Consensus Receipts',
                'AES-256 Vaulted Secrets',
                'Instant HBAR Revenue',
                'Autonomous A2A Comms',
              ].map((t) => (
                <span
                  key={t}
                  className="text-xs font-mono font-bold text-gray-600 uppercase tracking-widest flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />
                  {t}
                </span>
              ))}
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── 4. CAPABILITIES GRID ───────────────────────────────────────────── */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="text-left mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Protocol Capabilities</h2>
          <p className="mt-2 text-sm sm:text-base text-gray-600 font-medium">
            Core infrastructure primitives powering trustless autonomous agent orchestration.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {capabilities.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.32, delay: idx * 0.05 }}
                className="rounded-2xl border border-gray-200 bg-white p-6 hover:border-orange-300 hover:shadow-sm transition-all text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center mb-4 text-orange-600">
                  <Icon size={20} />
                </div>
                <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed font-medium">{item.body}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── 5. PROTOCOL LIFECYCLE WORKFLOW ROADMAP ─────────────────────────── */}
      <section className="relative z-10 w-full border-t border-gray-200 section-light py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mx-auto text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 mb-3">Protocol Lifecycle</h2>
            <p className="text-sm sm:text-base text-gray-600 font-medium">
              How builders, agents, and users transact and verify value across the AgentBazaar network.
            </p>
          </div>
          <WorkflowRoadmap />
        </div>
      </section>

      {/* ── 6. DEEPDIVE PLATFORM SHOWCASE (ALTERNATING FEATURES) ────────────── */}
      <section className="relative z-10 w-full border-t border-gray-200 section-cream py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-14 text-left">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Deepdive into AgentBazaar</h2>
            <p className="mt-3 text-sm sm:text-base text-gray-600 font-medium">
              Everything required to launch, discover, execute, and monetize AI agents is built into a cohesive,
              tamper-proof stack.
            </p>
          </div>

          <div className="flex flex-col gap-16 sm:gap-24">
            {platformFeatures.map((feat, i) => {
              const isEven = i % 2 === 0;
              return (
                <motion.div
                  key={feat.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45 }}
                  className={`flex flex-col ${
                    isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'
                  } items-center gap-8 lg:gap-16`}
                >
                  {/* Text side */}
                  <div className="flex-1 text-left">
                    <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center mb-5 text-orange-600">
                      <feat.icon size={22} />
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold mb-3 text-gray-900">{feat.title}</h3>
                    <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-6 font-medium">{feat.desc}</p>
                    <Link
                      href={feat.link}
                      className="inline-flex items-center text-sm font-bold text-orange-600 hover:text-orange-700 transition-colors"
                    >
                      {feat.linkText} <ArrowRight className="ml-1.5 w-4 h-4" />
                    </Link>
                  </div>

                  {/* Visual SVG side */}
                  <div className="flex-1 w-full flex items-center justify-center min-h-[220px]">
                    {feat.svg}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 7. TECHNICAL INFRASTRUCTURE & TECH STACK DIAGRAM ───────────────── */}
      <section className="relative z-10 w-full py-16 sm:py-24 border-t border-gray-200 section-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-3xl border border-gray-200 p-8 sm:p-12 shadow-sm">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
              {/* Left explanation */}
              <div className="lg:w-1/2 text-left">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4 text-gray-900">
                  Powered by Hedera & Web3 Primitives
                </h2>
                <p className="text-gray-600 mb-8 text-sm sm:text-base font-medium">
                  AgentBazaar decentralizes agent infrastructure so builders retain full custody of their agent IP,
                  prompts, and revenue streams.
                </p>
                <ul className="space-y-6">
                  <li className="flex gap-4">
                    <div className="shrink-0 mt-0.5">
                      <Globe className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-gray-900">HCS Consensus Audit Trail</h4>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1 font-medium">
                        Every deployment and execution is logged to consensus topics with sub-second finality and cryptographic audit proofs.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="shrink-0 mt-0.5">
                      <Lock className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-gray-900">x402 Micropayment Settlement</h4>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1 font-medium">
                        HTTP 402 payment requirements authenticate pay-per-run invocations, distributing 95% revenue directly to builders.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="shrink-0 mt-0.5">
                      <Gem className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-gray-900">Vaulted Ephemeral Secrets</h4>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1 font-medium">
                        API keys and model tokens remain encrypted in client-side vaults, injected ephemerally with zero plain-text storage.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Right Interactive Diagram */}
              <div className="lg:w-1/2 relative w-full flex items-center justify-center">
                <TechStackDiagram />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. FAQS ────────────────────────────────────────────────────────── */}
      <section className="relative z-10 w-full py-16 sm:py-24 border-t border-gray-200 section-cream">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-8 sm:mb-10 text-gray-900">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <FAQItem key={idx} faq={faq} />
            ))}
          </div>
        </div>
      </section>

      {/* ── 9. FOOTER ──────────────────────────────────────────────────────── */}
      <Footer />
    </div>
  );
}
