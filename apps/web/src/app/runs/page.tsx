"use client";

import { motion } from "framer-motion";
import { Zap, Search, Clock, ExternalLink, Cpu, HardDrive, BarChart3, Rocket, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";

export default function RunsPage() {
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    api.get("/agents/runs").then(res => {
        setRuns(res.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-6 lg:p-10 max-w-7xl mx-auto space-y-12 pb-24 bg-transparent text-gray-900"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-5 text-orange-500">
            <div className="w-16 h-16 rounded-[24px] bg-orange-100 flex items-center justify-center border border-orange-200 shadow-sm transition-all hover:scale-105">
              <Zap size={32} strokeWidth={2.5} />
            </div>
            <div>
                <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 tracking-tight uppercase leading-none">Terminal Runs</h1>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-3">Execution Logs</p>
            </div>
          </div>
          <p className="text-gray-500 text-lg max-w-2xl leading-relaxed font-semibold">
            Immutable audit trail of every agent execution. All artifacts are anchored on-chain.
          </p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-5">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-[32px] bg-gray-100" />)}
        </div>
      ) : runs.length > 0 ? (
        <div className="space-y-5">
            {runs.map((run) => (
                <Card key={run.id} className="p-8 group hover:border-orange-200 transition-all flex items-center justify-between bg-white border-gray-100 shadow-sm hover:shadow-md rounded-[32px]">
                    <div className="flex items-center space-x-7">
                        <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100 group-hover:bg-orange-50 group-hover:border-orange-100 transition-all shadow-sm">
                            <Cpu size={24} className="text-orange-500" strokeWidth={2.5} />
                        </div>
                        <div className="space-y-1.5">
                            <h3 className="text-2xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors uppercase tracking-tight">
                                {run.agentType} Execution
                            </h3>
                            <div className="flex items-center space-x-6 text-[10px] font-bold uppercase text-gray-400 tracking-widest">
                                <div className="flex items-center space-x-2">
                                    <Clock size={14} className="text-gray-300" />
                                    <span>{new Date(run.createdAt).toLocaleString()}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <HardDrive size={14} className="text-gray-300" />
                                    <span>CID: {run.artifactCid?.slice(0, 10)}...</span>
                                </div>
                            </div>
                            
                            {run.deployedAgent?.teeAttestation && (
                              <div className="flex items-center space-x-2 mt-2 px-3 py-1 bg-green-50 border border-green-100 rounded-full w-fit">
                                <ShieldCheck size={14} className="text-green-600" />
                                <span className="text-[10px] font-bold uppercase text-green-700 tracking-widest">
                                  TEE Verified Execution
                                </span>
                              </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center space-x-10">
                        <div className="text-right space-y-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Computation Cost</p>
                            <p className="text-xl font-bold text-gray-900">{run.creditsUsed} CRD</p>
                        </div>
                        <Button variant="outline" className="rounded-2xl border-gray-100 bg-white hover:bg-gray-50 text-gray-600 font-bold text-[11px] uppercase tracking-widest h-12 px-7 shadow-sm transition-all hover:border-orange-200">
                            Details <ExternalLink size={14} className="ml-2.5 text-orange-500" strokeWidth={2.5} />
                        </Button>
                    </div>
                </Card>
            ))}
        </div>
      ) : (
        <Card className="bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-[40px] p-24 shadow-inner">
            <EmptyState 
                icon={BarChart3}
                title="No Executions Found"
                description="Your terminal history is empty. Deploy your first agent to generate permanent audit logs."
                actionLabel="EXPLORE AGENTS"
                onAction={() => router.push("/")}
            />
        </Card>
      )}
    </motion.div>
  );
}
