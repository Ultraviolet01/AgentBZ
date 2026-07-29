'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Check, 
  Wallet, 
  Zap, 
  ArrowRight 
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user?.onboardingCompleted) {
      router.replace('/');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    // If not logged in, they shouldn't be here
    router.replace('/login');
    return null;
  }

  const steps = [
    {
      title: 'Welcome to AgentBazaar',
      description: 'Set up your account to get started',
      icon: Check
    },
    {
      title: 'Connect Wallet',
      description: 'Link your wallet to your account',
      icon: Wallet
    },
    {
      title: 'Ready to Launch',
      description: 'Start deploying autonomous agents',
      icon: Zap
    }
  ];

  const handleNext = async () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      setIsSubmitting(true);
      try {
        // Complete onboarding via existing API client
        await api.post('/auth/onboarding/complete');
        router.push('/');
      } catch (err) {
        console.error('Failed to complete onboarding:', err);
        // Fallback to home if API fails for some reason
        router.push('/');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleSkip = () => {
    router.push('/');
  };

  const StepIcon = steps[step - 1].icon;

  return (
    <div className="min-h-screen bg-[#fcfcfd] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 opacity-[0.4] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #e5e7eb 1px, transparent 0)', backgroundSize: '32px 32px' }} />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[600px] bg-orange-100/30 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-50/50 blur-[120px] rounded-full pointer-events-none" />

      <Card className="w-full max-w-2xl bg-white border-gray-100/80 p-12 relative overflow-hidden group shadow-[0_20px_60px_rgba(0,0,0,0.05)] rounded-[48px] backdrop-blur-sm z-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-50/40 blur-[100px] rounded-full pointer-events-none group-hover:bg-orange-100/40 transition-colors duration-700" />
        
        {/* Progress */}
        <div className="mb-14 relative z-10">
          <div className="flex justify-between items-end mb-5 px-1">
            <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">Onboarding Sequence</span>
                <p className="text-sm font-bold text-gray-900 uppercase tracking-tight">Phase {step} of 3</p>
            </div>
            <span className="text-xl font-black text-orange-500 tracking-tighter">{Math.round((step / 3) * 100)}% <span className="text-[10px] font-bold text-gray-300 ml-1">SYNC</span></span>
          </div>
          <div className="h-2.5 w-full bg-gray-50 rounded-full border border-gray-100 overflow-hidden shadow-inner">
            <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(step / 3) * 100}%` }}
                className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.3)]"
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="text-center py-8 relative z-10">
          <motion.div 
            key={step}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-28 h-28 rounded-[36px] bg-orange-50 border border-orange-100 flex items-center justify-center mx-auto mb-10 shadow-sm relative group-hover:scale-105 transition-all duration-500"
          >
            <div className="absolute inset-0 bg-white/50 rounded-[36px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <StepIcon className="w-12 h-12 text-orange-500 relative z-10" strokeWidth={2.5} />
          </motion.div>

          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 tracking-tight leading-none uppercase">{steps[step - 1].title}</h2>
          <p className="text-gray-500 font-semibold text-lg mb-12 max-w-md mx-auto leading-relaxed">{steps[step - 1].description}</p>

          {/* Step-specific content */}
          {step === 1 && (
            <Card className="bg-gray-50/50 border border-gray-100 p-10 mb-12 shadow-inner group/stat rounded-[32px] relative overflow-hidden">
              <div className="absolute -right-20 -top-20 w-40 h-40 bg-white/40 blur-3xl rounded-full" />
              <div className="flex items-center justify-center gap-12 relative z-10">
                <div className="text-center space-y-1">
                  <div className="text-7xl font-bold text-gray-900 tracking-tighter">
                    ∞
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">Scale Potential</p>
                </div>
              </div>
            </Card>
          )}

          {step === 2 && (
            <Card className="bg-gray-50/50 border border-gray-100 p-10 mb-12 shadow-inner rounded-[32px]">
              <p className="text-[15px] font-semibold text-gray-500 mb-8 leading-relaxed max-w-sm mx-auto">
                Connect your wallet to link it to your account for agent access and on-chain identity.
              </p>
              <Button
                variant="outline"
                className="h-15 px-10 rounded-[22px] border-gray-200 hover:border-orange-500 hover:text-orange-500 bg-white font-bold tracking-tight text-sm uppercase shadow-sm transition-all hover:-translate-y-1 flex items-center mx-auto"
                onClick={() => {/* Connect wallet logic */}}
              >
                <Wallet className="w-5 h-5 mr-3 text-orange-500" strokeWidth={2.5} />
                Connect Wallet
              </Button>
            </Card>
          )}

          {step === 3 && (
            <div className="grid grid-cols-3 gap-6 mb-12">
              <div className="bg-gray-50/50 border border-gray-100 p-8 rounded-3xl shadow-inner hover:bg-white hover:border-orange-200 hover:shadow-sm transition-all duration-500 group/feature">
                <div className="text-4xl font-bold text-orange-500 mb-2 tracking-tighter group-hover/feature:scale-110 transition-transform">3</div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">Native<br/>Agents</p>
              </div>
              <div className="bg-gray-50/50 border border-gray-100 p-8 rounded-3xl shadow-inner hover:bg-white hover:border-orange-200 hover:shadow-sm transition-all duration-500 group/feature">
                <div className="text-4xl font-bold text-orange-500 mb-2 tracking-tighter group-hover/feature:scale-110 transition-transform">Web3</div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">Decentralized<br/>Data</p>
              </div>
              <div className="bg-gray-50/50 border border-gray-100 p-8 rounded-3xl shadow-inner hover:bg-white hover:border-orange-200 hover:shadow-sm transition-all duration-500 group/feature">
                <div className="text-4xl font-bold text-orange-500 mb-2 tracking-tighter group-hover/feature:scale-110 transition-transform">24/7</div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">Autonomous<br/>Nodes</p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between relative z-10 border-t border-gray-100 pt-10">
          <div className="w-1/3">
            {(step === 2 || step === 1) && (
              <Button
                variant="ghost"
                onClick={handleSkip}
                className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 hover:text-gray-900 transition-colors px-0"
              >
                Skip identification
              </Button>
            )}
          </div>
          
          <Button
            onClick={handleNext}
            disabled={isSubmitting}
            className="h-16 px-12 bg-orange-500 hover:bg-orange-600 text-white rounded-[24px] font-bold text-lg shadow-xl shadow-orange-100 group/btn transition-all transform hover:-translate-y-1 active:scale-[0.98]"
          >
            <span className="uppercase tracking-wider">{isSubmitting ? 'Finalizing...' : (step === 3 ? 'Initialize Console' : 'Continue Protocol')}</span>
            <ArrowRight className="w-6 h-6 ml-4 group-hover/btn:translate-x-1.5 transition-transform" strokeWidth={3} />
          </Button>
        </div>
      </Card>
    </div>
  );
}
