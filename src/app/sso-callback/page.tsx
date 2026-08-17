'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useClerk } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';

function CallbackBridge() {
  const clerk = useClerk();
  const searchParams = useSearchParams();
  const [statusMessage, setStatusMessage] = useState('Authorizing college account…');
  const syncExecuted = useRef(false);

  useEffect(() => {
    const errorParam = searchParams.get('error') || searchParams.get('error_description');
    if (errorParam) {
      window.location.replace('/login?error=domain_not_allowed');
      return;
    }

    async function handleAuth() {
      if (syncExecuted.current) return;
      syncExecuted.current = true;

      const performSync = async () => {
        try {
          setStatusMessage('Setting up your portal session…');
          const token = await clerk.session?.getToken();
          const user = clerk.user;
          const email =
            user?.primaryEmailAddress?.emailAddress ||
            user?.emailAddresses?.[0]?.emailAddress;

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

          if (data.error && (data.error.includes('restricted') || data.error.includes('official'))) {
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
      };

      try {
        if (typeof clerk.handleRedirectCallback === 'function') {
          await clerk.handleRedirectCallback({}, async () => {
            await performSync();
          });
        }
      } catch (err) {
        console.error('handleRedirectCallback error:', err);
      } finally {
        await performSync();
      }
    }

    if (clerk.loaded) {
      handleAuth();
    }
  }, [clerk.loaded, clerk, searchParams]);

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
