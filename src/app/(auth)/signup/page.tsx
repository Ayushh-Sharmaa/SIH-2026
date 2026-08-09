'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useClerk } from '@clerk/nextjs';
import { useAuthenticatedRedirect } from '@/lib/session';
import { AnimatePresence, m } from 'framer-motion';
import { looksLikeSandboxEmail } from '@/lib/sandboxShared';
import { ArrowRight } from 'lucide-react';
import Icon from '@/components/ui/Icon';
import { Container } from '@/components/ui';
import {
  Aurora,
  Field,
  PremiumButton,
  Reveal,
  SplitText,
  DURATION,
  EASE,
  SPRING,
} from '@/components/motion';
import { logger } from '@/lib/logger';
import { errorMessageIncludes, userFacingMessage } from '@/lib/errors';
const hasClerkKey = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
type Role = 'STUDENT' | 'MENTOR';

const ROLES: { value: Role; label: string; blurb: string }[] = [
  { value: 'STUDENT', label: 'Student', blurb: 'Form a team, pick a track, find a mentor.' },
  { value: 'MENTOR', label: 'Mentor', blurb: 'Guide teams through problem selection and review.' },
];

/** Full-screen hand-off shown while the profile is provisioned. */
function OnboardingHandoff() {
  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: DURATION.hover, ease: EASE.outExpo }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-[rgba(239,233,225,0.96)] p-6 backdrop-blur-xl"
      role="status"
      aria-live="polite"
    >
      <div className="w-full max-w-md space-y-5">
        <div className="flex items-center justify-between">
          <div className="h-3.5 w-24 rounded skeleton-shimmer" />
          <div className="h-3.5 w-16 rounded skeleton-shimmer" />
        </div>
        <div className="space-y-5 rounded-3xl border border-[rgba(209,199,189,0.7)] bg-[rgba(248,246,242,0.6)] p-8">
          <div className="h-5 w-40 rounded skeleton-shimmer" />
          <div className="h-3.5 w-full rounded skeleton-shimmer" />
          <div className="h-px w-full bg-[rgba(209,199,189,0.8)]" />
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-20 rounded skeleton-shimmer" />
              <div className="h-10 w-full rounded-xl skeleton-shimmer" />
            </div>
          ))}
          <div className="h-11 w-full rounded-xl skeleton-shimmer" />
        </div>
      </div>
      <p className="text-label uppercase text-muted">
        Preparing your onboarding
      </p>
    </m.div>
  );
}

function GoogleButton({ loading, onClick }: { loading: boolean; onClick: () => void }) {
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
      {loading ? 'Connecting to Google…' : 'Sign up with Google'}
    </m.button>
  );
}

export default function SignupPage() {
  if (hasClerkKey) {
    return <ClerkSignupPage />;
  }
  return <CustomSignupPage />;
}

function ClerkSignupPage() {
  const goAuthenticated = useAuthenticatedRedirect();
  const clerk = useClerk();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('STUDENT');
  const [registrationKey, setRegistrationKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignUp = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      if (!clerk?.client?.signUp) {
        throw new Error('Google Sign-Up is unavailable right now. Please sign up with your email.');
      }

      await clerk.client.signUp.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/api/auth/clerk-sync',
      });
    } catch (err) {
      logger.error('Google Sign-Up error', err);
      setError(userFacingMessage(err, 'Google Sign-Up failed. Please try again.'));
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          registrationKey: role === 'MENTOR' ? registrationKey : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      await goAuthenticated('/onboarding', data.user);
    } catch (err) {
      setLoading(false);
      if (errorMessageIncludes(err, 'already exists')) {
        setError('This email is already registered — sign in instead.');
      } else {
        setError(userFacingMessage(err, 'Something went wrong'));
      }
    }
  };

  return (
    <>
      <AnimatePresence>{loading && <OnboardingHandoff />}</AnimatePresence>
      <SignupTemplate
        name={name}
        setName={setName}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        role={role}
        setRole={setRole}
        registrationKey={registrationKey}
        setRegistrationKey={setRegistrationKey}
        error={error}
        loading={loading}
        googleLoading={googleLoading}
        handleGoogleSignUp={handleGoogleSignUp}
        handleSubmit={handleSubmit}
      />
    </>
  );
}

function CustomSignupPage() {
  const goAuthenticated = useAuthenticatedRedirect();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('STUDENT');
  const [registrationKey, setRegistrationKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          registrationKey: role === 'MENTOR' ? registrationKey : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      await goAuthenticated('/onboarding', data.user);
    } catch (err) {
      setLoading(false);
      if (errorMessageIncludes(err, 'already exists')) {
        setError('This email is already registered — sign in instead.');
      } else {
        setError(userFacingMessage(err, 'Something went wrong'));
      }
    }
  };

  return (
    <>
      <AnimatePresence>{loading && <OnboardingHandoff />}</AnimatePresence>
      <SignupTemplate
        name={name}
        setName={setName}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        role={role}
        setRole={setRole}
        registrationKey={registrationKey}
        setRegistrationKey={setRegistrationKey}
        error={error}
        loading={loading}
        googleLoading={false}
        handleSubmit={handleSubmit}
      />
    </>
  );
}

interface SignupTemplateProps {
  name: string;
  setName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  role: Role;
  setRole: (v: Role) => void;
  registrationKey: string;
  setRegistrationKey: (v: string) => void;
  error: string;
  loading: boolean;
  googleLoading: boolean;
  handleGoogleSignUp?: () => void;
  handleSubmit: (e: FormEvent) => void;
}

function SignupTemplate({
  name,
  setName,
  email,
  setEmail,
  password,
  setPassword,
  role,
  setRole,
  registrationKey,
  setRegistrationKey,
  error,
  loading,
  googleLoading,
  handleGoogleSignUp,
  handleSubmit,
}: SignupTemplateProps) {
  const isSandbox = looksLikeSandboxEmail(email);
  const alreadyRegistered = error.includes('already registered');
  const activeRole = ROLES.find((r) => r.value === role)!;

  return (
    <div className="relative min-h-screen overflow-visible bg-background text-foreground">
      {/* ── TOP BAND: wide, centred masthead ── */}
      <section className="section-cream relative overflow-hidden">
        <Aurora variant="taupe" spotlight={false} />
        <div aria-hidden className="grid-lines absolute inset-0" />

        <Container width="narrow" className="relative pb-16 pt-12 text-center">
          <Reveal direction="none" blur={false}>
            <Link href="/" className="inline-flex items-center gap-2.5">
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

          <SplitText
            as="h1"
            text="Create your account."
            className="mt-8 text-title text-foreground"
            delay={0.1}
          />

          <Reveal delay={0.32} className="mt-4">
            <p className="mx-auto max-w-md text-sm leading-relaxed text-muted">
              One workspace account gets you team formation, the mentor directory, and the full
              problem-statement index.
            </p>
          </Reveal>
        </Container>
      </section>

      {/* ── FORM CARD: lifted, overlapping the band above ── */}
      <main id="main" className="section-mist relative">
        <Container width="form" className="relative pb-16">
          <Reveal scale delay={0.12} className="-mt-10">
            <div className="surface-raised rounded-3xl p-6 sm:p-9">
              {handleGoogleSignUp && (
                <>
                  <GoogleButton loading={googleLoading} onClick={handleGoogleSignUp} />

                  <div className="my-7 flex items-center gap-3">
                    <span className="h-px flex-1 bg-[rgba(209,199,189,0.8)]" />
                    <span className="text-label uppercase text-muted">
                      or with email
                    </span>
                    <span className="h-px flex-1 bg-[rgba(209,199,189,0.8)]" />
                  </div>
                </>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                {/* role segmented control */}
                <div>
                  <p className="mb-2 pl-1 text-label uppercase text-muted">
                    I am registering as
                  </p>
                  <div
                    role="radiogroup"
                    aria-label="Account type"
                    className="grid grid-cols-2 gap-1.5 rounded-2xl border border-[rgba(209,199,189,0.75)] bg-[rgba(239,233,225,0.6)] p-1.5"
                  >
                    {ROLES.map((r) => {
                      const active = r.value === role;
                      return (
                        <button
                          key={r.value}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => setRole(r.value)}
                          className={`relative rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-[0.1em] transition-colors duration-250 ${
                            active ? 'text-on-accent' : 'text-muted hover:text-primary'
                          }`}
                        >
                          {active && (
                            <m.span
                              layoutId="signupRolePill"
                              transition={SPRING.snappy}
                              className="absolute inset-0 rounded-xl bg-primary shadow-[0_4px_16px_rgba(114,56,61,0.28)]"
                            />
                          )}
                          <span className="relative z-10">{r.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <AnimatePresence mode="wait" initial={false}>
                    <m.p
                      key={activeRole.value}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: DURATION.hover, ease: EASE.outExpo }}
                      className="mt-2 pl-1 text-caption text-muted"
                    >
                      {activeRole.blurb}
                    </m.p>
                  </AnimatePresence>
                </div>

                <Field
                  label="Full name"
                  autoComplete="name"
                  required={!isSandbox}
                  disabled={isSandbox}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

                <Field
                  label="College email"
                  type="text"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  hint="Must be @glbajajgroup.org or @gmail.com"
                  error={error && !alreadyRegistered ? error : undefined}
                />

                <Field
                  label="Password"
                  type="password"
                  autoComplete="new-password"
                  required={!isSandbox}
                  disabled={isSandbox}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                {isSandbox && (
                  <div className="rounded-xl bg-primary/10 border border-primary/25 p-3 text-[11px] leading-relaxed text-muted">
                    <span className="font-bold text-primary">Sandbox mode.</span> Continuing as the
                    troubleshooting account - no name or password needed. Append{' '}
                    <code className="text-primary">/mentor</code> for the mentor dashboard or{' '}
                    <code className="text-primary">/student</code> for the student one.
                  </div>
                )}

                <AnimatePresence initial={false}>
                  {role === 'MENTOR' && (
                    <m.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: DURATION.card, ease: EASE.outExpo }}
                      className="overflow-hidden"
                    >
                      <Field
                        label="Mentor registration key (optional)"
                        value={registrationKey}
                        onChange={(e) => setRegistrationKey(e.target.value)}
                        hint="Leave blank to request manual admin approval."
                      />
                    </m.div>
                  )}
                </AnimatePresence>

                <AnimatePresence initial={false}>
                  {alreadyRegistered && (
                    <m.div
                      role="alert"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: DURATION.card, ease: EASE.outExpo }}
                      className="overflow-hidden"
                    >
                      <div className="rounded-xl border border-[rgba(114,56,61,0.28)] bg-[rgba(114,56,61,0.07)] px-4 py-3 text-xs font-semibold text-primary">
                        {error}{' '}
                        <Link href="/login" className="underline underline-offset-2">
                          Go to sign in <Icon icon={ArrowRight} size="xs" />
                        </Link>
                      </div>
                    </m.div>
                  )}
                </AnimatePresence>

                <div className="pt-1.5">
                  <PremiumButton
                    type="submit"
                    size="lg"
                    loading={loading}
                    className="w-full"
                    magnetic={false}
                  >
                    {loading ? 'Creating account…' : 'Create account'}
                  </PremiumButton>
                </div>
              </form>

              <p className="mt-7 text-center text-xs text-muted">
                Already have a workspace account?{' '}
                <Link
                  href="/login"
                  className="font-bold text-primary transition-colors duration-250 hover:text-[var(--primary-hover)]"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </Reveal>
        </Container>
      </main>
    </div>
  );
}
