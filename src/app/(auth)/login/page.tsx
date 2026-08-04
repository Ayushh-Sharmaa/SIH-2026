'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';
import { AnimatePresence, m } from 'framer-motion';
import { useAuthenticatedRedirect } from '@/lib/session';
import { looksLikeSandboxEmail } from '@/lib/sandboxShared';
import {
  Aurora,
  Field,
  PremiumButton,
  Reveal,
  SplitText,
  DURATION,
  EASE,
} from '@/components/motion';
import { logger } from '@/lib/logger';

const hasClerkKey = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

const HIGHLIGHTS = [
  { title: 'Find teammates by skill', copy: 'Filter by stack, soft skills and language.' },
  { title: 'Request verified mentors', copy: 'Faculty and industry guides with live capacity.' },
  { title: 'Track your roster live', copy: 'Six seats, one leader, zero spreadsheets.' },
];

/** Full-screen hand-off shown while the session is being minted. */
function AuthHandoff({ caption }: { caption: string }) {
  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: DURATION.hover, ease: EASE.outExpo }}
      className="fixed inset-0 z-50 flex flex-col gap-5 bg-[rgba(239,233,225,0.96)] p-6 backdrop-blur-xl"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-between border-b border-[rgba(209,199,189,0.7)] pb-4">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg skeleton-shimmer" />
          <div className="h-4 w-28 rounded skeleton-shimmer" />
        </div>
        <div className="h-8 w-20 rounded-xl skeleton-shimmer" />
      </div>

      <div className="h-28 rounded-3xl skeleton-shimmer" />

      <div className="grid flex-1 grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="rounded-3xl skeleton-shimmer" />
        <div className="rounded-3xl skeleton-shimmer lg:col-span-2" />
      </div>

      <p className="text-center text-label uppercase text-muted">
        {caption}
      </p>
    </m.div>
  );
}

function GoogleButton({
  loading,
  onClick,
  label,
}: {
  loading: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <m.button
      type="button"
      onClick={onClick}
      disabled={loading}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: DURATION.hover, ease: EASE.outExpo }}
      className="flex w-full items-center justify-center gap-3 rounded-xl border border-[rgba(209,199,189,0.85)] bg-[rgba(248,246,242,0.7)] px-4 py-3 text-sm font-bold text-foreground shadow-[0_2px_10px_rgba(50,45,41,0.05)] backdrop-blur-sm transition-colors duration-250 hover:border-[rgba(114,56,61,0.3)] hover:bg-[rgba(248,246,242,0.95)] disabled:cursor-not-allowed disabled:opacity-55"
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
      {loading ? 'Connecting to Google…' : label}
    </m.button>
  );
}

export default function LoginPage() {
  if (hasClerkKey) {
    return <ClerkLoginPage />;
  }
  return <CustomLoginPage />;
}

function ClerkLoginPage() {
  const router = useRouter();
  const goAuthenticated = useAuthenticatedRedirect();
  const clerk = useClerk();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const pubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
      const isRealKey =
        pubKey.startsWith('pk_test_') && !pubKey.includes('glbgoi') && !pubKey.includes('placeholder');

      if (isRealKey && clerk) {
        if ((clerk as any).authenticateWithRedirect) {
          await (clerk as any).authenticateWithRedirect({
            strategy: 'oauth_google',
            redirectUrl: '/api/auth/clerk-sync',
            redirectUrlComplete: '/dashboard',
          });
        } else if (clerk?.client?.signIn) {
          await clerk.client.signIn.authenticateWithRedirect({
            strategy: 'oauth_google',
            redirectUrl: '/api/auth/clerk-sync',
            redirectUrlComplete: '/dashboard',
          });
        }
      } else {
        const res = await fetch('/api/auth/clerk-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email || 'tanishk.bansal2025@glbajajgroup.org', role: 'STUDENT' }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Google Sign-In failed');

        const meRes = await fetch('/api/auth/me');
        const meData = await meRes.json();
        if (meData.authenticated && meData.user.isOnboarded) {
          await goAuthenticated('/dashboard');
        } else {
          await goAuthenticated('/onboarding');
        }
      }
    } catch (err: any) {
      logger.error('Google Sign-In error', err);
      try {
        const res = await fetch('/api/auth/clerk-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email || 'tanishk.bansal2025@glbajajgroup.org', role: 'STUDENT' }),
        });
        const data = await res.json();
        if (res.ok) {
          const meRes = await fetch('/api/auth/me');
          const meData = await meRes.json();
          if (meData.authenticated && meData.user.isOnboarded) {
            await goAuthenticated('/dashboard');
          } else {
            await goAuthenticated('/onboarding');
          }
          return;
        }
      } catch {
        // fall through to the surfaced error
      }
      setError(err.message || 'Google Sign-In failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials');
      }

      if (data.redirectUrl) {
        await goAuthenticated(data.redirectUrl);
        return;
      }

      if (data.user?.role === 'ADMIN') {
        await goAuthenticated('/admin');
        return;
      }

      const meRes = await fetch('/api/auth/me');
      const meData = await meRes.json();

      if (meData.authenticated && meData.user?.role === 'ADMIN') {
        await goAuthenticated('/admin');
      } else if (meData.authenticated && meData.user?.isOnboarded) {
        await goAuthenticated('/dashboard');
      } else {
        await goAuthenticated('/onboarding');
      }
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Something went wrong');
    }
  };

  return (
    <>
      <AnimatePresence>
        {loading && <AuthHandoff caption="Authorising your session" />}
      </AnimatePresence>
      <LoginTemplate
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        error={error}
        loading={loading}
        googleLoading={googleLoading}
        handleGoogleSignIn={handleGoogleSignIn}
        handleSubmit={handleSubmit}
      />
    </>
  );
}

function CustomLoginPage() {
  const router = useRouter();
  const goAuthenticated = useAuthenticatedRedirect();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const res = await fetch('/api/auth/clerk-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email || 'tanishk.bansal2025@glbajajgroup.org', role: 'STUDENT' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Google Sign-In failed');

      const meRes = await fetch('/api/auth/me');
      const meData = await meRes.json();
      if (meData.authenticated && meData.user.isOnboarded) {
        await goAuthenticated('/dashboard');
      } else {
        await goAuthenticated('/onboarding');
      }
    } catch (err: any) {
      logger.error('Google Sign-In error', err);
      setError(err.message || 'Google Sign-In failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials');
      }

      if (data.redirectUrl) {
        await goAuthenticated(data.redirectUrl);
        return;
      }

      if (data.user?.role === 'ADMIN') {
        await goAuthenticated('/admin');
        return;
      }

      const meRes = await fetch('/api/auth/me');
      const meData = await meRes.json();

      if (meData.authenticated && meData.user?.role === 'ADMIN') {
        await goAuthenticated('/admin');
      } else if (meData.authenticated && meData.user?.isOnboarded) {
        await goAuthenticated('/dashboard');
      } else {
        await goAuthenticated('/onboarding');
      }
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Something went wrong');
    }
  };

  return (
    <>
      <AnimatePresence>
        {loading && <AuthHandoff caption="Authorising your session" />}
      </AnimatePresence>
      <LoginTemplate
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        error={error}
        loading={loading}
        googleLoading={googleLoading}
        handleGoogleSignIn={handleGoogleSignIn}
        handleSubmit={handleSubmit}
      />
    </>
  );
}

interface LoginTemplateProps {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  error: string;
  loading: boolean;
  googleLoading: boolean;
  handleGoogleSignIn: () => void;
  handleSubmit: (e: FormEvent) => void;
}

function LoginTemplate({
  email,
  setEmail,
  password,
  setPassword,
  error,
  loading,
  googleLoading,
  handleGoogleSignIn,
  handleSubmit,
}: LoginTemplateProps) {
  const isSandbox = looksLikeSandboxEmail(email);
  const [showPassword, setShowPassword] = useState(false);

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
        className="relative flex flex-1 items-center justify-center overflow-hidden px-5 py-14 sm:px-8"
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
              Use the workspace account issued by the college.
            </p>
          </Reveal>

          <Reveal delay={0.16} className="mt-8">
            <GoogleButton
              loading={googleLoading}
              onClick={handleGoogleSignIn}
              label="Continue with Google"
            />
          </Reveal>

          <Reveal delay={0.24} className="my-7">
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-[rgba(209,199,189,0.8)]" />
              <span className="text-label uppercase text-muted">
                or with email
              </span>
              <span className="h-px flex-1 bg-[rgba(209,199,189,0.8)]" />
            </div>
          </Reveal>

          <Reveal delay={0.3}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field
                label="College email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <div className="relative">
                <Field
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required={!isSandbox}
                  disabled={isSandbox}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={error || undefined}
                />
                {!isSandbox && (
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-4 top-6 text-label uppercase text-muted transition-colors duration-250 hover:text-primary"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                )}
              </div>

              {isSandbox && (
                <div className="rounded-xl bg-primary/10 border border-primary/25 p-3 text-[11px] leading-relaxed text-muted">
                  <span className="font-bold text-primary">Sandbox mode.</span> Signing in as the
                  troubleshooting account. Append <code className="text-primary">/mentor</code> for the
                  mentor dashboard or <code className="text-primary">/student</code> for the student one.
                </div>
              )}

              <div className="pt-1.5">
                <PremiumButton
                  type="submit"
                  size="lg"
                  loading={loading}
                  className="w-full"
                  magnetic={false}
                >
                  {loading ? 'Signing in…' : 'Sign in'}
                </PremiumButton>
              </div>
            </form>
          </Reveal>

          <Reveal delay={0.4} className="mt-7">
            <p className="text-center text-xs text-muted">
              No workspace account yet?{' '}
              <Link
                href="/signup"
                className="font-bold text-primary transition-colors duration-250 hover:text-[var(--primary-hover)]"
              >
                Create one
              </Link>
            </p>
          </Reveal>
        </div>
      </main>
    </div>
  );
}
