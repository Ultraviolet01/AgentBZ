'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Shield, Mail, Lock, XCircle, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuthStore } from "@/lib/store/auth.store";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const setAuth = useAuthStore((state) => state.setAuth);

  React.useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await api.post("/auth/login", { email, password });
      setAuth(data.user);
      router.push("/");
      router.refresh(); // Ensure sidebar updates
    } catch (err: any) {
      let message = err.response?.data?.error || "Login failed. Please check your credentials.";
      if (typeof message === 'object') {
        message = JSON.stringify(message);
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfd] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 opacity-[0.4] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #e5e7eb 1px, transparent 0)', backgroundSize: '32px 32px' }} />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-[500px] bg-orange-100/40 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-50/50 blur-[100px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-md w-full relative z-10"
      >
        <Card className="p-12 space-y-12 group bg-white border-gray-100/80 shadow-[0_20px_60px_rgba(0,0,0,0.04)] rounded-[48px] backdrop-blur-sm">
            {/* Logo area */}
            <div className="text-center space-y-5">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-[32px] bg-orange-50 border border-orange-100 mb-2 relative group-hover:scale-105 transition-all duration-500 shadow-sm">
                    <Shield className="text-orange-500" size={48} strokeWidth={2.5} />
                    <Sparkles className="absolute -top-3 -right-3 text-orange-400 animate-pulse" size={24} strokeWidth={2.5} />
                </div>
                <div className="space-y-2">
                    <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight leading-none">Welcome Back</h1>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.3em]">Accessing Agent Registry</p>
                </div>
            </div>

            {error && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <Alert variant="destructive" className="py-3 px-4 rounded-2xl border-red-100">
                      <XCircle className="w-4 h-4" />
                      <AlertDescription className="text-xs font-bold">
                        {error}
                      </AlertDescription>
                    </Alert>
                </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8 text-left">
                <div className="space-y-1.5">
                    <Label className="ml-1">Email Address</Label>
                    <div className="relative group/input">
                        <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/input:text-orange-500 transition-colors" size={18} strokeWidth={2.5} />
                        <Input 
                            type="email" 
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-14"
                            placeholder="you@example.com"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <div className="flex justify-between items-center ml-1">
                        <Label>Password</Label>
                        <Link href="/forgot-password" title="Recover your access key" className="text-[11px] font-bold text-orange-400 hover:text-orange-600 transition-colors uppercase tracking-widest">Forgot Access?</Link>
                    </div>
                    <div className="relative group/input">
                        <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/input:text-orange-500 transition-colors" size={18} strokeWidth={2.5} />
                        <Input 
                            type="password" 
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-14"
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                <div className="pt-4">
                    <Button 
                        type="submit" 
                        disabled={loading}
                        className="w-full h-16 rounded-[24px] text-lg font-bold shadow-xl shadow-orange-100 bg-orange-500 hover:bg-orange-600 text-white transition-all transform hover:-translate-y-1 group/btn"
                    >
                        {loading ? <Loader2 className="animate-spin" size={24} /> : (
                            <>
                                <span className="uppercase tracking-wider">Sign In</span>
                                <ArrowRight size={22} className="ml-3 group-hover/btn:translate-x-1.5 transition-transform" strokeWidth={3} />
                            </>
                        )}
                    </Button>
                </div>
            </form>

            <div className="space-y-6">
                <div className="flex items-center justify-center space-x-4">
                    <div className="h-px flex-1 bg-gray-100" />
                    <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Or</p>
                    <div className="h-px flex-1 bg-gray-100" />
                </div>
                <GoogleSignInButton onError={setError} />
            </div>

            <div className="text-center pt-2 space-y-4">
                <div className="flex items-center justify-center space-x-4">
                    <div className="h-px w-10 bg-gray-100" />
                    <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Terminal Identity</p>
                    <div className="h-px w-10 bg-gray-100" />
                </div>
                <p className="text-[11px] font-bold text-gray-400 leading-relaxed">
                    New to AgentBazaar? <Link href="/register" className="text-orange-500 hover:text-orange-600 transition-colors underline-offset-4 hover:underline">Sign Up</Link>
                </p>
            </div>
        </Card>
      </motion.div>
    </div>
  );
}
