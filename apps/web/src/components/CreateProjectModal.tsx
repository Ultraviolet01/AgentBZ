"use client";

import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Assuming I might need this, but I'll craft a custom one if not available
import { Label } from "@/components/ui/label";
import { FolderPlus, Rocket, Loader2, Sparkles, Globe, Link as LinkIcon } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export function CreateProjectModal({ open, onOpenChange, onSuccess }: { 
    open: boolean; 
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return toast.error("Project name is required");

    setLoading(true);
    try {
      await api.post("/projects", { name, description, url });
      toast.success("Project Initialized", {
        description: `${name} has been added to your terminal workspace.`,
      });
      onSuccess();
      onOpenChange(false);
      setName("");
      setDescription("");
      setUrl("");
    } catch (err: any) {
      toast.error("Initialization Failed", {
        description: err.response?.data?.error || "An error occurred during project setup.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-white border-none shadow-[0_20px_60px_rgba(0,0,0,0.1)] p-0 overflow-hidden rounded-[40px]">
        <div className="relative h-40 bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
            <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute -right-16 -bottom-16 w-64 h-64 bg-white/20 rounded-full blur-3xl"
            />
            <div className="relative z-10 text-center space-y-3">
                <div className="bg-white/20 backdrop-blur-xl p-4 rounded-[28px] border border-white/30 inline-block shadow-lg">
                    <FolderPlus className="text-white" size={36} strokeWidth={2.5} />
                </div>
                <div className="space-y-1">
                    <h2 className="text-white font-bold text-2xl tracking-tight uppercase">New Workspace</h2>
                    <p className="text-white/80 text-[10px] font-bold uppercase tracking-[0.2em]">Project Initialization</p>
                </div>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8">
            <div className="space-y-6">
                <div className="space-y-3">
                    <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-1">Project Identifier</label>
                    <div className="relative group/input">
                        <Sparkles className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within/input:text-orange-500 transition-colors" size={18} strokeWidth={2.5} />
                        <input 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Apollo Protocol"
                            className="w-full h-15 bg-gray-50 border border-gray-100 rounded-[22px] pl-14 pr-4 text-sm font-bold text-gray-900 placeholder-gray-300 focus:bg-white focus:border-orange-200 focus:ring-4 focus:ring-orange-50/50 outline-none transition-all shadow-sm"
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-1">Landing Endpoint (URL)</label>
                    <div className="relative group/input">
                        <Globe className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within/input:text-orange-500 transition-colors" size={18} strokeWidth={2.5} />
                        <input 
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://apollo.network"
                            className="w-full h-15 bg-gray-50 border border-gray-100 rounded-[22px] pl-14 pr-4 text-sm font-bold text-gray-900 placeholder-gray-300 focus:bg-white focus:border-orange-200 focus:ring-4 focus:ring-orange-50/50 outline-none transition-all shadow-sm"
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-1">Mission briefing (Description)</label>
                    <textarea 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Define the scope and objectives for autonomous surveillance..."
                        className="w-full h-32 bg-gray-50 border border-gray-100 rounded-[22px] p-6 text-sm font-bold text-gray-900 placeholder-gray-300 focus:bg-white focus:border-orange-200 focus:ring-4 focus:ring-orange-50/50 outline-none transition-all resize-none shadow-sm"
                    />
                </div>
            </div>

            <div className="pt-4">
                <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full h-16 rounded-[24px] text-lg font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-xl shadow-orange-100 uppercase tracking-wider transition-all transform hover:-translate-y-1 active:scale-[0.98]"
                >
                    {loading ? <Loader2 className="animate-spin" /> : (
                        <>
                            Initialize Workspace <Rocket className="ml-3" size={20} strokeWidth={3} />
                        </>
                    )}
                </Button>
            </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
