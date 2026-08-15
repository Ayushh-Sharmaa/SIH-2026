'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useClerk, AuthenticateWithRedirectCallback } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';

function CallbackBridge() {
  const clerk = useClerk();
  const searchParams = useSearchParams();
  const syncAttempted = useRef(false);

  useEffect(() => {
    // 1. Check for error parameters from OAuth provider
    const errorParam = searchParams.get('error') || searchParams.get('error_description');
    if (errorParam) {
      window.location.replace('/login?error=domain_not_allowed');
      return;
    }

    async function syncSession() {
      if (syncAttempted.current) return;
      syncAttempted.current = true;

      try {
        // Fetch session token directly from Clerk browser client
        const token = await clerk.session?.getToken();

        const res = await fetch('/api/auth/clerk-sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ role: 'STUDENT' }),
        });

        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          const redirectUrl = data.user?.role ? '/dashboard' : '/onboarding';
          window.location.replace(redirectUrl);
          return;
        }

        const data = await res.json().catch(() => ({}));
        if (data.error && (data.error.includes('restricted') || data.error.includes('official'))) {
          window.location.replace('/login?error=domain_not_allowed');
          return;
        }

        // Fallback to direct GET navigation
        window.location.replace('/api/auth/clerk-sync');
      } catch (err) {
        window.location.replace('/api/auth/clerk-sync');
      }
    }

    if (clerk.loaded && (clerk.user || clerk.session)) {
      syncSession();
      return;
    }

    const timer = setTimeout(() => {
      syncSession();
    }, 1800);

    return () => clearTimeout(timer);
  }, [clerk.loaded, clerk.user, clerk.session, searchParams]);

  return null;
}

export default function SSOCallbackPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#EFE9E1] px-4">
      <Suspense fallback={null}>
        <CallbackBridge />
      </Suspense>
      <div className="size-10 animate-spin rounded-full border-4 border-[#72383D] border-t-transparent" />
      <p className="text-sm font-semibold text-[#6F645B]">Authorizing college account…</p>
      <Suspense fallback={null}>
        <AuthenticateWithRedirectCallback
          signInForceRedirectUrl="/api/auth/clerk-sync"
          signUpForceRedirectUrl="/api/auth/clerk-sync"
          signInFallbackRedirectUrl="/api/auth/clerk-sync"
          signUpFallbackRedirectUrl="/api/auth/clerk-sync"
        />
      </Suspense>
    </div>
  );
}
