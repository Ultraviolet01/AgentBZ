"use client";

import { 
  Settings, 
  Database, 
  Shield, 
  Globe, 
  Cpu, 
  LineChart, 
  Smartphone, 
  Bell, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  HardDrive,
  Link as LinkIcon,
  ExternalLink
} from "lucide-react";
import { useAccount } from 'wagmi';

export default function SettingsPage() {
  const { isConnected, address } = useAccount();

  return (
    <div className="max-w-5xl mx-auto space-y-12 p-8 lg:p-10 pb-20 bg-transparent text-gray-900">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center space-x-5 text-blue-600">
          <div className="w-16 h-16 rounded-[24px] bg-blue-50 flex items-center justify-center border border-blue-100 shadow-sm transition-all hover:scale-105">
            <Settings size={36} strokeWidth={2.5} />
          </div>
          <div>
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 tracking-tight uppercase leading-none">Settings</h1>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-3">Node & Protocol Control</p>
          </div>
        </div>
        <p className="text-gray-500 text-lg max-w-2xl leading-relaxed font-semibold">
          Configure your 0G Network nodes, storage preferences, and account security.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 pt-4">
        {/* Navigation Sidebar */}
        <div className="space-y-2.5">
            <SettingsNavItem label="0G Network" icon={Globe} active />
            <SettingsNavItem label="Storage Index" icon={HardDrive} />
            <SettingsNavItem label="Agents & API" icon={Cpu} />
            <SettingsNavItem label="Notifications" icon={Bell} />
            <SettingsNavItem label="Security" icon={Shield} />
        </div>

        {/* Content Area */}
        <div className="md:col-span-3 space-y-12">
            {/* 0G Status Section */}
            <section className="space-y-8">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-3 uppercase tracking-tight">
                        <Globe size={22} className="text-blue-600" strokeWidth={2.5} />
                        <span>Network Configuration</span>
                    </h2>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Mainnet v1.0.4</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <StatusCard 
                        label="Connection Status" 
                        value={isConnected ? "Active - Mainnet" : "Disconnected"} 
                        status={isConnected ? "success" : "error"}
                        subValue={isConnected ? `Node: ${address?.substring(0, 10)}...` : "Please connect wallet"}
                    />
                    <StatusCard 
                        label="RPC Endpoint" 
                        value="Mainnet Optimal" 
                        status="success"
                        subValue="https://evmrpc-mainnet-1.0g.ai"
                    />
                </div>
            </section>

            {/* Storage Usage */}
            <section className="space-y-8">
                 <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-3 uppercase tracking-tight">
                    <HardDrive size={22} className="text-blue-600" strokeWidth={2.5} />
                    <span>Decentralized Storage (0G)</span>
                </h2>
                
                <div className="bg-white border border-gray-100 rounded-[40px] p-10 space-y-10 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                    
                    <div className="flex justify-between items-end relative z-10">
                        <div className="space-y-2">
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Total Stored Data</p>
                            <p className="text-5xl font-bold text-gray-900">412.5 <span className="text-2xl text-gray-400">MB</span></p>
                        </div>
                        <div className="text-right space-y-2">
                             <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mr-1">Index Coverage</p>
                             <span className="inline-flex items-center bg-emerald-50 text-emerald-600 text-[10px] font-bold px-4 py-1.5 rounded-full border border-emerald-100 shadow-sm uppercase tracking-wider">
                                <CheckCircle2 size={12} className="mr-1.5" strokeWidth={3} />
                                100% Verified
                             </span>
                        </div>
                    </div>

                    <div className="space-y-4 relative z-10">
                        <div className="w-full bg-gray-50 h-4 rounded-full overflow-hidden border border-gray-100 shadow-inner">
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full w-[15%] rounded-full shadow-[0_0_15px_rgba(37,99,235,0.3)]"></div>
                        </div>
                        <div className="flex justify-between text-[11px] font-bold px-1">
                            <span className="text-gray-400 uppercase tracking-wider">Storage Capacity: 15% used of 2GB Free Tier</span>
                            <span className="text-blue-600 hover:text-blue-700 cursor-pointer transition-colors uppercase tracking-widest font-black">Upgrade to Enterprise Nodes</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6 pt-4 relative z-10">
                         <div className="p-6 bg-gray-50/50 rounded-2xl border border-gray-100 transition-all hover:bg-white hover:border-blue-100 hover:shadow-sm">
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">Audit Reports</p>
                            <p className="text-3xl font-bold text-gray-900">84</p>
                         </div>
                         <div className="p-6 bg-gray-50/50 rounded-2xl border border-gray-100 transition-all hover:bg-white hover:border-blue-100 hover:shadow-sm">
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">Snapshots</p>
                            <p className="text-3xl font-bold text-gray-900">228</p>
                         </div>
                         <div className="p-6 bg-gray-50/50 rounded-2xl border border-gray-100 transition-all hover:bg-white hover:border-blue-100 hover:shadow-sm">
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">Permanent CIDs</p>
                            <p className="text-3xl font-bold text-gray-900">312</p>
                         </div>
                    </div>
                </div>
            </section>

            {/* Explorer Integration */}
            <section className="bg-blue-50/50 border border-blue-100 rounded-[32px] p-10 flex flex-col sm:flex-row items-center justify-between gap-10 shadow-sm relative overflow-hidden group">
                <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-blue-100 rounded-full blur-3xl opacity-50 group-hover:scale-150 transition-transform duration-700" />
                
                <div className="space-y-4 relative z-10 text-center sm:text-left">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center justify-center sm:justify-start space-x-3 uppercase tracking-tight">
                        <LinkIcon size={22} className="text-blue-600" strokeWidth={2.5} />
                        <span>0G Explorer Integration</span>
                    </h3>
                    <p className="text-[15px] text-gray-500 font-medium max-w-md leading-relaxed">
                        Your on-chain records are permanently immutable on 0G Network. Click to verify your project&apos;s heartbeat.
                    </p>
                </div>
                <a 
                    href="https://scan.0g.ai/" 
                    target="_blank"
                    className="whitespace-nowrap bg-gray-900 text-white font-bold px-8 py-4 rounded-2xl flex items-center space-x-3 hover:bg-black transition-all shadow-xl hover:-translate-y-1 relative z-10"
                >
                    <span className="text-[13px] uppercase tracking-wider">Open Explorer</span>
                    <ExternalLink size={18} strokeWidth={2.5} />
                </a>
            </section>
        </div>
      </div>
    </div>
  );
}

function SettingsNavItem({ label, icon: Icon, active = false }: { label: string; icon: any; active?: boolean }) {
    return (
        <button className={`w-full flex items-center space-x-4 px-5 py-4 rounded-2xl transition-all group ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 -translate-x-1' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'}`}>
            <Icon size={20} className={active ? 'text-white' : 'group-hover:text-blue-600 transition-colors'} strokeWidth={active ? 2.5 : 2} />
            <span className={`text-sm font-bold uppercase tracking-wider ${active ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}>{label}</span>
        </button>
    )
}

function StatusCard({ label, value, subValue, status }: { label: string; value: string; subValue?: string; status: 'success' | 'warning' | 'error' }) {
    const colors = {
        success: 'bg-emerald-50/50 border-emerald-100 text-emerald-600 shadow-emerald-50',
        warning: 'bg-orange-50/50 border-orange-100 text-orange-600 shadow-orange-50',
        error: 'bg-red-50/50 border-red-100 text-red-600 shadow-red-50'
    };

    const statusBullets = {
        success: 'bg-emerald-500',
        warning: 'bg-orange-500',
        error: 'bg-red-500'
    };

    return (
        <div className={`p-8 rounded-[32px] border ${colors[status]} space-y-2 shadow-sm transition-all hover:shadow-md`}>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-1">{label}</p>
            <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${statusBullets[status]} ${status === 'success' ? 'animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' : ''}`}></div>
                <p className="text-xl font-bold tracking-tight uppercase">{value}</p>
            </div>
            {subValue && <p className="text-[11px] font-bold opacity-60 font-mono truncate ml-5 uppercase tracking-tighter">{subValue}</p>}
        </div>
    )
}
