'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useClerk, useUser } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';

function CallbackBridge() {
  const clerk = useClerk();
  const { user, isLoaded: isUserLoaded, isSignedIn } = useUser();
  const searchParams = useSearchParams();
  const [statusMessage, setStatusMessage] = useState('Authorizing college account…');
  const syncExecuted = useRef(false);

  useEffect(() => {
    const errorParam = searchParams.get('error') || searchParams.get('error_description');
    if (errorParam) {
      window.location.replace('/login?error=domain_not_allowed');
      return;
    }

    // If Clerk is not yet loaded, wait
    if (!clerk.loaded) return;

    async function handleAuth() {
      // 1. If we have redirect params from OAuth, let Clerk process them
      const hasOAuthParams =
        typeof window !== 'undefined' &&
        (window.location.search.includes('__clerk') ||
          window.location.search.includes('created_session_id') ||
          window.location.search.includes('status'));

      if (hasOAuthParams && typeof clerk.handleRedirectCallback === 'function' && !isSignedIn) {
        try {
          await clerk.handleRedirectCallback({});
        } catch (err) {
          console.error('handleRedirectCallback error:', err);
        }
      }

      // 2. Resolve user email (from useUser, clerk.user, or clerk.session)
      const email =
        user?.primaryEmailAddress?.emailAddress ||
        user?.emailAddresses?.[0]?.emailAddress ||
        clerk.user?.primaryEmailAddress?.emailAddress ||
        clerk.user?.emailAddresses?.[0]?.emailAddress;

      // If user is not yet ready, allow the next render cycle when useUser updates
      if (!email && !isSignedIn && hasOAuthParams) {
        return;
      }

      if (syncExecuted.current) return;
      syncExecuted.current = true;

      try {
        setStatusMessage('Setting up your portal session…');
        const token = await clerk.session?.getToken();

        const res = await fetch('/api/auth/clerk-sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ email, role: 'STUDENT' }),
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok && data.success) {
          if (typeof window !== 'undefined' && data.user) {
            try {
              localStorage.setItem(
                'sih_user_session',
                JSON.stringify({
                  name: data.user.name || '',
                  role: data.user.role || 'STUDENT',
                  isOnboarded: Boolean(data.user.isOnboarded),
                })
              );
            } catch {}
          }
          const destination = data.redirectUrl || (data.user?.isOnboarded ? '/dashboard' : '/onboarding');
          window.location.replace(destination);
          return;
        }

        if (data.error && (data.error.includes('restricted') || data.error.includes('official') || data.error.includes('Access restricted'))) {
          window.location.replace('/login?error=domain_not_allowed');
          return;
        }

        if (data.error && data.error.includes('Suspended')) {
          window.location.replace('/login?error=account_suspended');
          return;
        }

        window.location.replace('/login?error=oauth_failed');
      } catch (err) {
        console.error('Sync error:', err);
        window.location.replace('/onboarding');
      }
    }

    handleAuth();
  }, [clerk.loaded, clerk, isUserLoaded, isSignedIn, user, searchParams]);

  return (
    <p className="text-sm font-semibold text-[#6F645B]">{statusMessage}</p>
  );
}

export default function SSOCallbackPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#EFE9E1] px-4">
      <div className="size-10 animate-spin rounded-full border-4 border-[#72383D] border-t-transparent" />
      <Suspense fallback={<p className="text-sm font-semibold text-[#6F645B]">Authorizing college account…</p>}>
        <CallbackBridge />
      </Suspense>
    </div>
  );
}
