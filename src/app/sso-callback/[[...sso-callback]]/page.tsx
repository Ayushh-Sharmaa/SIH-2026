'use client';

import { useEffect, Suspense } from 'react';
import { useClerk, AuthenticateWithRedirectCallback } from '@clerk/nextjs';

function SSOCallbackHandler() {
  const { loaded, user, session } = useClerk();

  useEffect(() => {
    // If Clerk verified the user or session on the client,
    // immediately perform a direct browser navigation to complete the sync.
    if (loaded && (user || session)) {
      window.location.href = '/api/auth/clerk-sync';
    }
  }, [loaded, user, session]);

  // Fail-safe: if the callback takes longer than 3 seconds, force navigation to /api/auth/clerk-sync
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = '/api/auth/clerk-sync';
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return null;
}

export default function SSOCallbackCatchAllPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#EFE9E1] px-4">
      <SSOCallbackHandler />
      <div className="size-10 animate-spin rounded-full border-4 border-[#72383D] border-t-transparent" />
      <p className="text-sm font-semibold text-[#6F645B]">Completing Google sign-in…</p>
      <Suspense fallback={null}>
        <AuthenticateWithRedirectCallback
          signInForceRedirectUrl="/api/auth/clerk-sync"
          signUpForceRedirectUrl="/api/auth/clerk-sync"
          signInFallbackRedirectUrl="/api/auth/clerk-sync"
          signUpFallbackRedirectUrl="/api/auth/clerk-sync"
          continueSignUpUrl="/api/auth/clerk-sync"
          firstFactorUrl="/login"
          secondFactorUrl="/login"
        />
      </Suspense>
    </div>
  );
}
