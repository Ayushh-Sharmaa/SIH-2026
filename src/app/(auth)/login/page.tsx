'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';
import { m } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';

import {
  Aurora,
  Reveal,
  SplitText,
  DURATION,
  EASE,
} from '@/components/motion';
import { logger } from '@/lib/logger';
import { userFacingMessage } from '@/lib/errors';

const HIGHLIGHTS = [
  { title: 'Find teammates by skill', copy: 'Filter by stack, soft skills and language.' },
  { title: 'Request verified mentors', copy: 'Faculty and industry guides with active mentorship context.' },
  { title: 'Track your roster live', copy: 'Six seats, one leader, zero spreadsheets.' },
];

function GoogleButton({
  loading,
  onClick,
}: {
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <m.button
      type="button"
      onClick={onClick}
      disabled={loading}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: DURATION.hover, ease: EASE.outExpo }}
      className="flex w-full items-center justify-center gap-3 rounded-xl border border-[rgba(209,199,189,0.85)] bg-[rgba(248,246,242,0.7)] px-4 py-3 text-sm font-bold text-foreground shadow-[0_2px_10px_rgba(50,45,41,0.05)] transition-colors duration-250 hover:border-[rgba(114,56,61,0.3)] hover:bg-[rgba(248,246,242,0.95)] disabled:cursor-not-allowed disabled:opacity-55"
    >
      <svg className="size-4 shrink-0" viewBox="0 0 24 24" aria-hidden>
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        />
      </svg>
      {loading ? 'Connecting to Google…' : 'Continue with Google'}
    </m.button>
  );
}

function LoginContent() {
  const searchParams = useSearchParams();
  const urlError = searchParams?.get('error');

  const clerk = useClerk();
  const clerkUser = clerk.user;
  const clerkSignOut = clerk.signOut;
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (urlError === 'domain_not_allowed') {
      setError('Access restricted: Please sign in using your official GL Bajaj email ID only (@glbajajgroup.org).');
    } else if (urlError === 'oauth_failed') {
      setError('Google sign-in could not be completed. Please try again.');
    } else if (urlError === 'account_suspended') {
      setError('Your account access has been suspended. Please contact the administrator.');
    } else if (urlError === 'rate_limited') {
      setError('Too many sign-in attempts. Please wait a moment and try again.');
    } else if (urlError) {
      setError('An error occurred during sign-in. Please try again.');
    }
  }, [urlError]);

  // If the user reaches this page (meaning the app session is gone),
  // but Clerk thinks they are still signed in, drop the Clerk session to sync state.
  useEffect(() => {
    if (clerkUser) {
      clerkSignOut();
    }
  }, [clerkUser, clerkSignOut]);

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      if (clerk.client?.signIn) {
        await clerk.client.signIn.authenticateWithRedirect({
          strategy: 'oauth_google',
          redirectUrl: '/sso-callback',
          redirectUrlComplete: '/sso-callback',
          continueSignUp: true,
        });
        return;
      }

      if (clerk.client?.signUp) {
        await clerk.client.signUp.authenticateWithRedirect({
          strategy: 'oauth_google',
          redirectUrl: '/sso-callback',
          redirectUrlComplete: '/sso-callback',
        });
        return;
      }

      throw new Error('Authentication service is initializing. Please click again.');
    } catch (err) {
      logger.error('Google Sign-In error', err);
      setError(userFacingMessage(err, 'Google Sign-In failed. Please try again.'));
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* ── BRAND PANEL: full-bleed editorial column, desktop only ── */}
      <aside className="section-pearl relative hidden w-[44%] shrink-0 overflow-hidden lg:flex lg:flex-col lg:justify-between lg:px-12 lg:py-14 xl:px-16">
        <Aurora variant="cool" spotlight={false} />
        <div aria-hidden className="grid-lines absolute inset-0" />

        <Reveal direction="none" blur={false}>
          <Link href="/" className="relative inline-flex items-center gap-3">
            <img
              src="/Logo/NexaSphere Icon without Background.png"
              alt=""
              className="size-9 object-contain"
            />
            <span className="text-sm font-extrabold uppercase tracking-[0.18em] text-foreground">
              SIH@GLBGOI
            </span>
          </Link>
        </Reveal>

        <div className="relative">
          <SplitText
            as="p"
            text="Build the team that ships."
            className="max-w-md text-heading text-foreground"
            delay={0.12}
          />

          <ul className="mt-10 space-y-6">
            {HIGHLIGHTS.map((h, i) => (
              <Reveal key={h.title} direction="right" delay={0.4 + i * 0.1}>
                <li className="flex gap-4">
                  <span
                    aria-hidden
                    className="mt-1.5 h-px w-8 shrink-0 bg-gradient-to-r from-primary to-transparent"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-foreground">{h.title}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                      {h.copy}
                    </span>
                  </span>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>

        <Reveal delay={0.75}>
          <p className="relative text-label uppercase text-muted">
            Team formation &amp; mentorship platform
          </p>
        </Reveal>
      </aside>

      {/* ── FORM COLUMN ── */}
      <main
        id="main"
        className="relative flex flex-1 items-center justify-center overflow-visible px-5 py-14 sm:px-8"
      >
        <Aurora variant="warm" spotlight />

        <div className="relative w-full max-w-sm">
          {/* compact brand lockup for small screens */}
          <Reveal direction="none" blur={false} className="mb-8 lg:hidden">
            <Link href="/" className="flex items-center justify-center gap-2.5">
              <img
                src="/Logo/NexaSphere Icon without Background.png"
                alt=""
                className="size-8 object-contain"
              />
              <span className="text-sm font-extrabold uppercase tracking-[0.18em] text-foreground">
                SIH@GLBGOI
              </span>
            </Link>
          </Reveal>

          <Reveal delay={0.06}>
            <p className="text-label uppercase text-primary">
              Welcome back
            </p>
            <h1 className="mt-2 text-title text-foreground">
              Sign in
            </h1>
            <p className="mt-2 text-sm text-muted">
              Use your official GL Bajaj college workspace account (@glbajajgroup.org) to continue.
            </p>
          </Reveal>

          {/* Warning / Error Alert Banner */}
          {error && (
            <Reveal delay={0.1}>
              <div
                role="alert"
                className="mt-6 flex items-start gap-3 rounded-2xl border border-[rgba(114,56,61,0.35)] bg-[rgba(114,56,61,0.08)] p-4 text-xs font-semibold text-primary shadow-sm"
              >
                <ShieldAlert className="size-4 shrink-0 mt-0.5 text-primary" />
                <div className="flex-1 space-y-1">
                  <p className="font-bold text-foreground">
                    {error.toLowerCase().includes('restricted') || error.toLowerCase().includes('official')
                      ? 'Official Domain Required'
                      : 'Sign-in Notice'}
                  </p>
                  <p className="text-primary leading-relaxed">{error}</p>
                </div>
              </div>
            </Reveal>
          )}

          <Reveal delay={0.16} className="mt-8">
            <GoogleButton
              loading={loading}
              onClick={handleGoogleSignIn}
            />
          </Reveal>

          <Reveal delay={0.24} className="mt-6 text-center space-y-3">
            <p className="text-xs text-muted">
              Only official <span className="font-semibold text-foreground">@glbajajgroup.org</span> accounts are permitted.
            </p>
            <div className="pt-2 border-t border-[rgba(209,199,189,0.55)]">
              <p className="text-xs text-muted">
                New to the portal?{' '}
                <Link href="/signup" className="font-bold text-primary hover:underline">
                  Create an account
                </Link>
              </p>
            </div>
          </Reveal>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
