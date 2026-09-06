"use client";

import React from 'react';
import { 
  Zap, 
  ShieldCheck, 
  PenTool, 
  Search,
  ArrowRight,
  TrendingUp,
  Cpu
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const agents = [
  {
    id: "scamsniff",
    name: "ScamSniff",
    description: "Advanced social & smart contract threat analysis.",
    icon: ShieldCheck,
    cost: "1 HBAR",
    color: "text-green-600",
    bg: "bg-green-100",
    href: "/agents/scamsniff",
    tag: "High Accuracy"
  },
  {
    id: "threadsmith",
    name: "ThreadSmith",
    description: "Context-aware AI content synthesis for terminal projects.",
    icon: PenTool,
    cost: "1 HBAR",
    color: "text-orange-600",
    bg: "bg-orange-100",
    href: "/agents/threadsmith",
    tag: "Multi-Modal"
  },
  {
    id: "launchwatch",
    name: "LaunchWatch",
    description: "Autonomous real-time health & security monitoring.",
    icon: Search,
    cost: "1 HBAR",
    color: "text-blue-600",
    bg: "bg-blue-100",
    href: "/agents/launchwatch",
    tag: "24/7 Pulse"
  }
];

export function AgentSelectionModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();

  const handleLaunch = (agentHref: string) => {
    onOpenChange(false);
    router.push(agentHref);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white border-none shadow-2xl rounded-[24px]">
        <DialogHeader>
            <div className="flex items-center space-x-2 text-orange-500 mb-2">
                <Cpu size={16} strokeWidth={2.5} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Selection Terminal</span>
            </div>
          <DialogTitle className="text-3xl font-bold tracking-tight text-gray-900">Launch Agent</DialogTitle>
          <DialogDescription className="text-gray-500 font-medium">
            Select an autonomous unit to deploy on your project.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-8">
          {agents.map((agent) => (
            <Card 
                key={agent.id} 
                className="group relative cursor-pointer border-gray-100 hover:border-orange-500 hover:shadow-md transition-all rounded-2xl overflow-hidden"
                onClick={() => handleLaunch(agent.href)}
            >
              <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-all", agent.bg, "group-hover:scale-105 shadow-sm")}>
                        <agent.icon className={agent.color} size={28} strokeWidth={2.5} />
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-xl text-gray-900 tracking-tight">{agent.name}</h3>
                            <span className="text-[10px] font-bold uppercase bg-gray-50 border border-gray-100 px-2 py-0.5 rounded text-gray-500 tracking-wider font-mono">{agent.tag}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-500 max-w-[300px] leading-relaxed">
                            {agent.description}
                        </p>
                    </div>
                </div>

                <div className="text-right flex flex-col items-end gap-3">
                    <div className="space-y-0">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Exec Cost</p>
                        <p className="text-xl font-bold text-gray-900 tracking-tight">{agent.cost}</p>
                    </div>
                    <Button size="sm" className="rounded-full px-6 h-9 text-[11px] font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-sm hover:shadow-md transition-all">
                        Launch <ArrowRight size={12} className="ml-2" />
                    </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-6 p-4 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-3 text-gray-500">
                <TrendingUp size={16} strokeWidth={2.5} className="text-orange-500" />
                <p className="text-xs font-bold font-mono tracking-tight">Project throughput: <span className="text-green-600">OPTIMAL</span></p>
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">Infrastructure Active</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
