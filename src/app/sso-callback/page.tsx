'use client';

import { Suspense, useEffect } from 'react';
import { useClerk, AuthenticateWithRedirectCallback } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';

function CallbackObserver() {
  const clerk = useClerk();
  const searchParams = useSearchParams();

  useEffect(() => {
    // 1. If error parameter is present from provider
    const errorParam = searchParams.get('error') || searchParams.get('error_description');
    if (errorParam) {
      window.location.replace('/login?error=domain_not_allowed');
      return;
    }

    // 2. If Clerk loaded and session/user is active, navigate to sync endpoint
    if (clerk.loaded && (clerk.user || clerk.session)) {
      window.location.replace('/api/auth/clerk-sync');
      return;
    }

    // 3. Fallback timeout: guarantees the spinner never hangs
    const timer = setTimeout(() => {
      window.location.replace('/api/auth/clerk-sync');
    }, 2500);

    return () => clearTimeout(timer);
  }, [clerk.loaded, clerk.user, clerk.session, searchParams]);

  return null;
}

export default function SSOCallbackPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#EFE9E1] px-4">
      <Suspense fallback={null}>
        <CallbackObserver />
      </Suspense>
      <div className="size-10 animate-spin rounded-full border-4 border-[#72383D] border-t-transparent" />
      <p className="text-sm font-semibold text-[#6F645B]">Completing Google sign-in…</p>
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
