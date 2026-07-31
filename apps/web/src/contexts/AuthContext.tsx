'use client';

import { createContext, useContext, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth.store';

type User = {
  id: string;
  email: string;
  username: string;
  onboardingCompleted: boolean;
} | null;

type AuthContextType = {
  user: User;
  isLoading: boolean;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signOut: () => {}
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading, setAuth, setLoading, logout } = useAuthStore();
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    // Only set loading if we don't have a user yet to prevent flickering on credit updates
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) setLoading(true);
    try {
      const response = await api.get('/auth/me');
      if (response.data?.user) {
        setAuth(response.data.user);
      }
    } catch (error: any) {
      console.error('Auth check failed:', error);
      if (error?.response?.status === 401 && !currentUser) {
        setAuth(null);
      }
    } finally {
      setLoading(false);
    }
  }, [setAuth, setLoading]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const signOut = async () => {
    try {
      // Sign out from server side (clears cookies)
      await api.post('/auth/logout');
      
      // Clear client side state
      logout();
      
      router.push('/login');
    } catch (error) {
      console.error('Sign out failed:', error);
      // Still clear client state even if server logout fails
      logout();
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user: user as User, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
