'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';
import { m } from 'framer-motion';
import {
  ShieldAlert,
  Building2,
  KeyRound,
  Mail,
  Lock,
  ArrowRight,
  GraduationCap,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

import {
  Aurora,
  Reveal,
  SplitText,
  DURATION,
  EASE,
} from '@/components/motion';
import { logger } from '@/lib/logger';
import { userFacingMessage } from '@/lib/errors';
import { useSession } from '@/lib/session';

const HIGHLIGHTS = [
  { title: 'Find teammates by skill', copy: 'Filter by stack, soft skills and language across any college.' },
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
      className="flex w-full items-center justify-center gap-3 rounded-xl border border-[rgba(209,199,189,0.85)] bg-[rgba(248,246,242,0.85)] px-4 py-3 text-sm font-bold text-foreground shadow-[0_2px_10px_rgba(50,45,41,0.05)] transition-colors duration-250 hover:border-[rgba(114,56,61,0.35)] hover:bg-[rgba(248,246,242,1)] disabled:cursor-not-allowed disabled:opacity-55"
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams?.get('error');

  const clerk = useClerk();
  const clerkUser = clerk.user;
  const clerkSignOut = clerk.signOut;

  const { establish } = useSession();

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'instant' | 'password'>('instant');

  // Institution / College code states (Optional)
  const [college, setCollege] = useState('');
  const [collegeCode, setCollegeCode] = useState('');

  // Password login states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    // Restore saved college info from localStorage if present
    if (typeof window !== 'undefined') {
      const savedCollege = localStorage.getItem('arena_user_college');
      const savedCode = localStorage.getItem('arena_college_code');
      if (savedCollege) setCollege(savedCollege);
      if (savedCode) setCollegeCode(savedCode);
    }
  }, []);

  const persistCollegePreferences = () => {
    if (typeof window !== 'undefined') {
      if (college.trim()) {
        localStorage.setItem('arena_user_college', college.trim());
      }
      if (collegeCode.trim()) {
        localStorage.setItem('arena_college_code', collegeCode.trim());
      }
    }
  };

  useEffect(() => {
    if (urlError === 'domain_not_allowed') {
      setError('Access note: Sign in using your email or Google account to continue.');
    } else if (urlError === 'oauth_failed') {
      setError('Google sign-in could not be completed. Please try again or use direct login.');
    } else if (urlError === 'account_suspended') {
      setError('Your account access has been suspended. Please contact the administrator.');
    } else if (urlError === 'rate_limited') {
      setError('Too many sign-in attempts. Please wait a moment and try again.');
    } else if (urlError) {
      setError('An error occurred during sign-in. Please try again.');
    }
  }, [urlError]);

  // If app session expired but Clerk still holds an active session, reset it to re-sync
  useEffect(() => {
    if (clerkUser) {
      clerkSignOut();
    }
  }, [clerkUser, clerkSignOut]);

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    persistCollegePreferences();

    try {
      if (clerk.client?.signIn) {
        await clerk.client.signIn.authenticateWithRedirect({
          strategy: 'oauth_google',
          redirectUrl: '/sso-callback',
          redirectUrlComplete: '/api/auth/clerk-sync',
          continueSignUp: true,
        });
        return;
      }

      if (clerk.client?.signUp) {
        await clerk.client.signUp.authenticateWithRedirect({
          strategy: 'oauth_google',
          redirectUrl: '/sso-callback',
          redirectUrlComplete: '/api/auth/clerk-sync',
        });
        return;
      }

      throw new Error('Authentication service is initializing. Please click again.');
    } catch (err) {
      logger.error('Google Sign-In error', err);
      setError(userFacingMessage(err, 'Google Sign-In failed. Please try again or use direct sign in.'));
      setLoading(false);
    }
  };

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide your email and password.');
      return;
    }

    setError('');
    setLoading(true);
    persistCollegePreferences();

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          college: college.trim() || undefined,
          collegeCode: collegeCode.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to sign in. Please verify your details.');
        setLoading(false);
        return;
      }

      if (data.user) {
        establish(data.user);
      }

      setSuccessMsg('Authenticated! Redirecting to portal…');
      router.push(data.redirectUrl || '/dashboard');
    } catch (err) {
      logger.error('Password sign in error', err);
      setError('Could not connect to authentication server. Please try again.');
      setLoading(false);
    }
  };

  const handleDemoSignIn = async (role: 'student' | 'mentor' | 'admin') => {
    setError('');
    setLoading(true);
    persistCollegePreferences();

    try {
      const emailMap = {
        student: 'sandbox.student@arena.local',
        mentor: 'sandbox.mentor@arena.local',
        admin: 'sandbox.admin@arena.local',
      };

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailMap[role],
          password: 'SandboxDemoPassword123!',
          college: college.trim() || 'GL Bajaj Group of Institutions, Mathura',
          collegeCode: collegeCode.trim() || 'GLB2026',
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (data.user) establish(data.user);
        router.push(data.redirectUrl || '/dashboard');
      } else {
        setError(data.error || 'Failed to start demo session.');
        setLoading(false);
      }
    } catch {
      setError('Failed to initialize demo access.');
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
              alt="NexaSphere Arena"
              className="size-10 object-contain"
            />
            <span className="text-sm font-extrabold uppercase tracking-[0.18em] text-foreground">
              Arena &bull; NexaSphere
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
          <div className="relative flex items-center gap-2 text-label uppercase text-muted">
            <Building2 className="size-3.5 text-primary" strokeWidth={1.75} />
            <span>Open to all colleges and universities nationwide</span>
          </div>
        </Reveal>
      </aside>

      {/* ── FORM COLUMN ── */}
      <main
        id="main"
        className="relative flex flex-1 items-center justify-center overflow-visible px-5 py-12 sm:px-8"
      >
        <Aurora variant="warm" spotlight />

        <div className="relative w-full max-w-md">
          {/* compact brand lockup for small screens */}
          <Reveal direction="none" blur={false} className="mb-6 lg:hidden">
            <Link href="/" className="flex items-center justify-center gap-2.5">
              <img
                src="/Logo/NexaSphere Icon without Background.png"
                alt="NexaSphere Arena"
                className="size-9 object-contain"
              />
              <span className="text-sm font-extrabold uppercase tracking-[0.18em] text-foreground">
                Arena &bull; NexaSphere
              </span>
            </Link>
          </Reveal>

          <Reveal delay={0.06}>
            <p className="text-label uppercase text-primary font-bold">
              Welcome to the Arena
            </p>
            <h1 className="mt-1.5 text-title text-foreground">
              Sign In
            </h1>
            <p className="mt-1.5 text-xs text-muted leading-relaxed">
              Open platform for all participants, institutions, and mentors. Sign in with your personal or institutional Google account.
            </p>
          </Reveal>

          {/* Warning / Error Alert Banner */}
          {error && (
            <Reveal delay={0.1}>
              <div
                role="alert"
                className="mt-5 flex items-start gap-3 rounded-2xl border border-[rgba(114,56,61,0.35)] bg-[rgba(114,56,61,0.08)] p-3.5 text-xs font-semibold text-primary shadow-sm"
              >
                <ShieldAlert className="size-4 shrink-0 mt-0.5 text-primary" strokeWidth={1.75} />
                <div className="flex-1 space-y-1">
                  <p className="font-bold text-foreground">Sign-in Notice</p>
                  <p className="text-primary leading-relaxed">{error}</p>
                </div>
              </div>
            </Reveal>
          )}

          {successMsg && (
            <Reveal delay={0.1}>
              <div
                role="status"
                className="mt-5 flex items-center gap-2 rounded-2xl border border-[rgba(52,168,83,0.35)] bg-[rgba(52,168,83,0.08)] p-3.5 text-xs font-semibold text-emerald-800 shadow-sm"
              >
                <CheckCircle2 className="size-4 text-emerald-600" strokeWidth={1.75} />
                <span>{successMsg}</span>
              </div>
            </Reveal>
          )}

          {/* Optional Institution / College Code Customizer */}
          <Reveal delay={0.12} className="mt-5">
            <div className="rounded-2xl border border-[rgba(209,199,189,0.7)] bg-[rgba(248,246,242,0.8)] p-3.5 shadow-sm space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted">
                  <Building2 className="size-3.5 text-primary" strokeWidth={1.75} />
                  Institution / College (Optional)
                </span>
                <span className="text-[10px] uppercase font-bold text-muted bg-[rgba(209,199,189,0.35)] px-2 py-0.5 rounded-full">
                  Any College
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label htmlFor="college-name-input" className="sr-only">College or University Name</label>
                  <input
                    id="college-name-input"
                    type="text"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    placeholder="e.g. GL Bajaj, IIT, NIT, or College Name"
                    className="w-full rounded-xl border border-[rgba(209,199,189,0.7)] bg-white/70 px-3 py-2 text-xs text-foreground placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="sm:col-span-1">
                  <label htmlFor="college-code-input" className="sr-only">College Code</label>
                  <input
                    id="college-code-input"
                    type="text"
                    value={collegeCode}
                    onChange={(e) => setCollegeCode(e.target.value)}
                    placeholder="Code (e.g. GLB2026)"
                    className="w-full rounded-xl border border-[rgba(209,199,189,0.7)] bg-white/70 px-3 py-2 text-xs text-foreground placeholder:text-muted/60 uppercase focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          </Reveal>

          {/* Mode Selector Tabs */}
          <div className="mt-5 flex rounded-xl border border-[rgba(209,199,189,0.6)] bg-[rgba(248,246,242,0.6)] p-1">
            <button
              type="button"
              onClick={() => setActiveTab('instant')}
              className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${
                activeTab === 'instant'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              Google / One-Click
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('password')}
              className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${
                activeTab === 'password'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              Email &amp; Password
            </button>
          </div>

          {/* Tab 1: Google + Instant Demo Access */}
          {activeTab === 'instant' && (
            <Reveal delay={0.16} className="mt-4 space-y-4">
              <GoogleButton
                loading={loading}
                onClick={handleGoogleSignIn}
              />

              <div className="relative flex items-center justify-center">
                <span className="absolute inset-x-0 h-px bg-[rgba(209,199,189,0.6)]" />
                <span className="relative bg-background px-3 text-[10px] font-bold uppercase tracking-wider text-muted">
                  Quick Sandbox Demo
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleDemoSignIn('student')}
                  className="flex flex-col items-center justify-center rounded-xl border border-[rgba(209,199,189,0.6)] bg-white/50 p-2.5 text-center transition-all hover:border-primary hover:bg-white"
                >
                  <GraduationCap className="size-4 text-primary mb-1" strokeWidth={1.75} />
                  <span className="text-[11px] font-bold text-foreground">Student</span>
                  <span className="text-[9px] text-muted">Instant Access</span>
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleDemoSignIn('mentor')}
                  className="flex flex-col items-center justify-center rounded-xl border border-[rgba(209,199,189,0.6)] bg-white/50 p-2.5 text-center transition-all hover:border-primary hover:bg-white"
                >
                  <Sparkles className="size-4 text-primary mb-1" strokeWidth={1.75} />
                  <span className="text-[11px] font-bold text-foreground">Mentor</span>
                  <span className="text-[9px] text-muted">Faculty View</span>
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleDemoSignIn('admin')}
                  className="flex flex-col items-center justify-center rounded-xl border border-[rgba(209,199,189,0.6)] bg-white/50 p-2.5 text-center transition-all hover:border-primary hover:bg-white"
                >
                  <KeyRound className="size-4 text-primary mb-1" strokeWidth={1.75} />
                  <span className="text-[11px] font-bold text-foreground">Admin</span>
                  <span className="text-[9px] text-muted">Command Center</span>
                </button>
              </div>
            </Reveal>
          )}

          {/* Tab 2: Direct Email & Password (with seamless auto-registration) */}
          {activeTab === 'password' && (
            <Reveal delay={0.16} className="mt-4">
              <form onSubmit={handlePasswordSignIn} className="space-y-3">
                <div>
                  <label htmlFor="email-input" className="block text-[11px] font-bold uppercase tracking-wider text-muted mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted" strokeWidth={1.75} />
                    <input
                      id="email-input"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@example.com or any college email"
                      className="w-full rounded-xl border border-[rgba(209,199,189,0.85)] bg-[rgba(248,246,242,0.7)] pl-10 pr-4 py-2.5 text-xs text-foreground placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password-input" className="block text-[11px] font-bold uppercase tracking-wider text-muted mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted" strokeWidth={1.75} />
                    <input
                      id="password-input"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full rounded-xl border border-[rgba(209,199,189,0.85)] bg-[rgba(248,246,242,0.7)] pl-10 pr-4 py-2.5 text-xs text-foreground placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <m.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.985 }}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-on-accent shadow-[0_2px_12px_rgba(114,56,61,0.25)] transition-all hover:opacity-95 disabled:opacity-50"
                >
                  {loading ? 'Authenticating…' : 'Sign In / Register'}
                  <ArrowRight className="size-4" strokeWidth={1.75} />
                </m.button>
              </form>
            </Reveal>
          )}

          <Reveal delay={0.24} className="mt-6 text-center space-y-3">
            <p className="text-[11px] text-muted">
              Any email can log in. New users are enrolled automatically with instant profile access.
            </p>
            <div className="pt-3 border-t border-[rgba(209,199,189,0.55)]">
              <p className="text-xs text-muted">
                Need a mentor or team lead account?{' '}
                <Link href="/signup" className="font-bold text-primary hover:underline">
                  Create dedicated account
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
