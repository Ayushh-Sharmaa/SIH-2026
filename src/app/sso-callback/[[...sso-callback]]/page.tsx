'use client';

import { Suspense } from 'react';
import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';

export default function SSOCallbackCatchAllPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[rgb(239,233,225)] px-4">
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
