'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useClerk } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';

function CallbackBridge() {
  const clerk = useClerk();
  const searchParams = useSearchParams();
  const processed = useRef(false);

  useEffect(() => {
    const errorParam = searchParams.get('error') || searchParams.get('error_description');
    if (errorParam) {
      window.location.replace('/login?error=domain_not_allowed');
      return;
    }

    async function handleAuth() {
      if (processed.current) return;
      processed.current = true;

      try {
        // 1. Process the OAuth redirect callback with Clerk
        await clerk.handleRedirectCallback({});

        // 2. Extract session token and user details directly from Clerk client
        const token = await clerk.session?.getToken();
        const user = clerk.user;
        const email =
          user?.primaryEmailAddress?.emailAddress ||
          user?.emailAddresses?.[0]?.emailAddress;

        // 3. Post to backend endpoint to establish first-party session cookie
        const res = await fetch('/api/auth/clerk-sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ email, role: 'STUDENT' }),
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok) {
          window.location.replace('/dashboard');
          return;
        }

        if (data.error && (data.error.includes('restricted') || data.error.includes('official'))) {
          window.location.replace('/login?error=domain_not_allowed');
          return;
        }

        window.location.replace('/login?error=oauth_failed');
      } catch (err) {
        console.error('SSO Callback error:', err);
        window.location.replace('/api/auth/clerk-sync');
      }
    }

    if (clerk.loaded) {
      handleAuth();
    }
  }, [clerk.loaded, clerk, searchParams]);

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
    </div>
  );
}
