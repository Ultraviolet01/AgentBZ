'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { ArrowRight, Mail, Lock, User, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/store/auth.store';

export default function SignUpPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, router]);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data } = await api.post('/auth/register', {
        email: formData.email,
        username: formData.username,
        password: formData.password
      });

      setAuth(data.user);

      toast.success('Account Created', {
        description: 'Welcome to AgentBazaar!'
      });

      // Navigate straight to onboarding
      router.push('/onboarding');
      router.refresh();
    } catch (err: any) {
      let message = err.response?.data?.error || err.message || 'Signup failed';
      if (typeof message === 'object') {
        message = JSON.stringify(message);
      }
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfd] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 opacity-[0.4] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #e5e7eb 1px, transparent 0)', backgroundSize: '32px 32px' }} />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-[500px] bg-orange-100/40 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-50/50 blur-[100px] rounded-full pointer-events-none" />

      <Card className="w-full max-w-md bg-white border-gray-100/80 p-12 relative overflow-hidden group shadow-[0_20px_60px_rgba(0,0,0,0.04)] rounded-[48px] backdrop-blur-sm z-10 transition-all duration-700">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-orange-50/50 blur-[80px] rounded-full pointer-events-none group-hover:bg-orange-100/50 transition-colors duration-500" />
        
        {/* Logo */}
        <div className="flex items-center gap-4 mb-10 relative z-10">
          <div className="w-14 h-14 rounded-[22px] bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-200 group-hover:scale-110 transition-transform duration-500">
             <User className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight leading-none uppercase">AgentBazaar</h1>
            <p className="text-[11px] font-bold text-orange-500 uppercase tracking-[0.3em] mt-1.5 font-mono">Registry Init</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-7 relative z-10">
          
          {/* Email */}
          <div className="space-y-1.5 text-left">
            <Label htmlFor="email" className="ml-1">Email Address</Label>
            <div className="relative group/input">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within/input:text-orange-500 transition-colors" strokeWidth={2.5} />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="pl-12"
                required
              />
            </div>
          </div>

          {/* Username */}
          <div className="space-y-1.5 text-left">
            <Label htmlFor="username" className="ml-1">Username</Label>
            <div className="relative group/input">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within/input:text-orange-500 transition-colors" strokeWidth={2.5} />
              <Input
                id="username"
                type="text"
                placeholder="cypher_operator"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="pl-12"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-7">
              {/* Password */}
              <div className="space-y-1.5 text-left">
                <Label htmlFor="password" className="ml-1">Password</Label>
                <div className="relative group/input">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within/input:text-orange-500 transition-colors" strokeWidth={2.5} />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min. 8 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-12"
                    required
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5 text-left">
                <Label htmlFor="confirmPassword" className="ml-1">Confirm Password</Label>
                <div className="relative group/input">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within/input:text-orange-500 transition-colors" strokeWidth={2.5} />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Repeat password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="pl-12"
                    required
                  />
                </div>
              </div>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive" className="py-3 px-4 rounded-2xl border-red-100">
              <XCircle className="w-4 h-4" />
              <AlertDescription className="text-[11px] font-bold">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-16 bg-orange-500 hover:bg-orange-600 text-white rounded-[24px] font-bold text-lg transition-all shadow-xl shadow-orange-100 flex items-center justify-center gap-3 transform hover:-translate-y-1 active:scale-[0.98] group/btn"
          >
            <span className="uppercase tracking-wider">{isSubmitting ? 'Initializing...' : 'Create Account'}</span>
            <ArrowRight className="w-6 h-6 group-hover/btn:translate-x-1.5 transition-transform" strokeWidth={3} />
          </Button>
        </form>

        {/* Divider */}
        <div className="flex items-center justify-center space-x-4 mt-10 relative z-10">
          <div className="h-px w-10 bg-gray-100" />
          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Operator Portal</p>
          <div className="h-px w-10 bg-gray-100" />
        </div>

        {/* Sign In Link */}
        <p className="text-[11px] font-bold text-gray-400 text-center mt-6 relative z-10">
          Existing Operator?{' '}
          <button
            onClick={() => router.push('/login')}
            className="text-orange-500 hover:text-orange-600 transition-colors underline-offset-4 hover:underline"
          >
            Restore Session
          </button>
        </p>
      </Card>
    </div>
  );
}

