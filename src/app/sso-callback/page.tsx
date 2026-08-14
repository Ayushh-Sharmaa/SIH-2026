'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';
import { logger } from '@/lib/logger';

function SSOCallbackContent() {
  const clerk = useClerk();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    let active = true;

    async function completeAuth() {
      try {
        if (!clerk.loaded) return;

        // Check if there is an error directly in URL parameters from OAuth provider
        const errorParam = searchParams.get('error') || searchParams.get('error_description');
        if (errorParam) {
          logger.warn('OAuth callback returned error in URL', { errorParam });
          try {
            await clerk.signOut();
          } catch {}
          if (active) router.replace('/login?error=domain_not_allowed');
          return;
        }

        await clerk.handleRedirectCallback(
          {
            signInForceRedirectUrl: '/api/auth/clerk-sync',
            signUpForceRedirectUrl: '/api/auth/clerk-sync',
            signInFallbackRedirectUrl: '/api/auth/clerk-sync',
            signUpFallbackRedirectUrl: '/api/auth/clerk-sync',
            continueSignUpUrl: '/api/auth/clerk-sync',
            firstFactorUrl: '/login?error=domain_not_allowed',
            secondFactorUrl: '/login?error=domain_not_allowed',
            resetPasswordUrl: '/login',
          },
          async (to: string): Promise<unknown> => {
            if (!active) return;
            // Prevent redirecting to Clerk's hosted Account Portal
            if (
              to.includes('accounts.dev') ||
              to.includes('default-redirect') ||
              to.includes('sign-up') ||
              to.includes('sign-in')
            ) {
              router.replace('/login?error=domain_not_allowed');
              return;
            }
            if (to.startsWith('http://') || to.startsWith('https://')) {
              const origin = window.location.origin;
              if (to.startsWith(origin)) {
                router.replace(to.slice(origin.length));
                return;
              }
              router.replace('/login?error=domain_not_allowed');
              return;
            }
            router.replace(to);
          }
        );
      } catch (err: unknown) {
        logger.error('Clerk SSO Callback failed', err);
        try {
          await clerk.signOut();
        } catch {}

        if (!active) return;

        // Any restriction / forbidden / domain error routes cleanly back to login
        router.replace('/login?error=domain_not_allowed');
      }
    }

    completeAuth();

    return () => {
      active = false;
    };
  }, [clerk, router, searchParams]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
      <div className="size-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <p className="text-sm font-semibold text-muted">Completing Google sign-in…</p>
    </div>
  );
}

export default function SSOCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
          <div className="size-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-semibold text-muted">Completing Google sign-in…</p>
        </div>
      }
    >
      <SSOCallbackContent />
    </Suspense>
  );
}

