'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth.store';
import api from '@/lib/api';
import { toast } from 'sonner';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

type CredentialResponse = { credential?: string };

/**
 * "Continue with Google" button backed by Google Identity Services (GIS).
 *
 * GIS returns an ID token to the browser, which we relay to the API
 * (POST /auth/google). The API verifies it and issues our own session cookies,
 * so this plugs directly into the existing JWT/cookie auth flow.
 *
 * Renders nothing if NEXT_PUBLIC_GOOGLE_CLIENT_ID is not configured.
 */
export function GoogleSignInButton({ onError }: { onError?: (message: string) => void }) {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleCredential = useCallback(
    async (response: CredentialResponse) => {
      if (!response.credential) {
        onError?.('Google did not return a credential. Please try again.');
        return;
      }
      try {
        const { data } = await api.post('/auth/google', { credential: response.credential });
        setAuth(data.user);
        toast.success('Signed in with Google');

        if (data.isNew || !data.user.onboardingCompleted) {
          router.push('/onboarding');
        } else {
          router.push('/');
        }
        router.refresh();
      } catch (err: any) {
        let message = err?.response?.data?.error || 'Google sign-in failed. Please try again.';
        if (typeof message === 'object') message = 'Google sign-in failed. Please try again.';
        onError?.(message);
      }
    },
    [router, setAuth, onError]
  );

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const SCRIPT_ID = 'google-gsi-client';

    const init = () => {
      const google = (window as any).google;
      if (!google?.accounts?.id || !containerRef.current) return;

      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredential,
      });

      // GIS renderButton takes a pixel width (200–400). Match the container.
      const width = Math.min(400, Math.max(240, containerRef.current.offsetWidth || 320));
      containerRef.current.innerHTML = '';
      google.accounts.id.renderButton(containerRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'pill',
        logo_alignment: 'center',
        width,
      });
    };

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      init();
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = init;
    document.body.appendChild(script);
  }, [handleCredential]);

  if (!GOOGLE_CLIENT_ID) return null;

  return <div ref={containerRef} className="flex w-full justify-center" />;
}
