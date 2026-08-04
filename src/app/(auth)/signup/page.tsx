'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';
import { looksLikeSandboxEmail } from '@/lib/sandboxShared';

export default function SignupPage() {
  const router = useRouter();
  const clerk = useClerk();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'STUDENT' | 'MENTOR'>('STUDENT');
  const [registrationKey, setRegistrationKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignUp = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      if (clerk && (clerk as any).authenticateWithRedirect) {
        await (clerk as any).authenticateWithRedirect({
          strategy: 'oauth_google',
          redirectUrl: '/api/auth/clerk-sync',
          redirectUrlComplete: '/onboarding',
        });
        return;
      }

      if (clerk?.client?.signUp) {
        await clerk.client.signUp.authenticateWithRedirect({
          strategy: 'oauth_google',
          redirectUrl: '/api/auth/clerk-sync',
          redirectUrlComplete: '/onboarding',
        });
        return;
      }

      setError('Real Google Sign-In requires Clerk API Keys. Please add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY in Vercel Project Settings.');
    } catch (err: any) {
      console.error('Google Sign-Up error:', err);
      setError(err.message || 'Google Sign-Up failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const isSandbox = looksLikeSandboxEmail(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // The sandbox account needs only the email; skip the normal field checks
    if (!isSandbox && (!name || !password)) {
      setError('Please fill in your full name and a password.');
      return;
    }

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

      router.push(data.redirectUrl || '/onboarding');
    } catch (err: any) {
      if (err.message?.includes('already exists')) {
        setError('This email is already registered! Please sign in using your email and password above or click "Sign in" below.');
      } else {
        setError(err.message || 'Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glowing effects */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/20 rounded-full filter blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-accent/15 rounded-full filter blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md space-y-8 z-10">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            SIH@GLBGOI
          </h1>
          <p className="mt-2 text-sm text-muted">
            Team Formation & Mentorship Portal
          </p>
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary mt-1 border border-primary/20">
            Powered by NexaSphere
          </span>
        </div>

        <div className="glass-card rounded-2xl p-8 shadow-2xl border border-card-border">
          <h2 className="text-xl font-bold text-foreground mb-6 text-center">
            Create a new account
          </h2>

          {error && (
            <div className="mb-4 rounded-lg bg-red-950/40 p-4 text-sm text-red-400 border border-red-900/30">
              {error}
              {error.includes('already registered') && (
                <div className="mt-2">
                  <Link href="/login" className="font-bold underline text-primary hover:text-primary-hover">
                    Go to Sign In →
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Google Sign-Up Button */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-card-border bg-card/60 hover:bg-card hover:border-primary/40 text-foreground font-semibold text-sm transition-all duration-200 shadow-md cursor-pointer mb-6 disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
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
            {googleLoading ? 'Connecting to Google...' : 'Sign up with Google'}
          </button>

          <div className="relative flex items-center justify-center mb-6">
            <div className="border-t border-card-border w-full" />
            <span className="bg-card px-3 text-xs text-muted font-medium uppercase tracking-wider absolute">or</span>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                disabled={isSandbox}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="mt-1 block w-full rounded-lg bg-background/50 border border-card-border px-4 py-2 text-foreground placeholder-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-sm transition-all"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                College Email ID
              </label>
              <input
                id="email"
                name="email"
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="username@glbajaj.org"
                className="mt-1 block w-full rounded-lg bg-background/50 border border-card-border px-4 py-2 text-foreground placeholder-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-sm transition-all"
              />
              <span className="text-[10px] text-muted mt-1 block">
                Must be an official workspace ID (@glbajaj.org or @glbajajgroup.org)
              </span>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                disabled={isSandbox}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isSandbox ? 'Sandbox access - no password needed' : '••••••••'}
                className="mt-1 block w-full rounded-lg bg-background/50 border border-card-border px-4 py-2 text-foreground placeholder-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-sm transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                I am registering as a
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole('STUDENT')}
                  className={`py-2 px-4 text-sm font-semibold rounded-lg border transition-all cursor-pointer ${
                    role === 'STUDENT'
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'bg-background/30 border-card-border text-muted hover:text-foreground'
                  }`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setRole('MENTOR')}
                  className={`py-2 px-4 text-sm font-semibold rounded-lg border transition-all cursor-pointer ${
                    role === 'MENTOR'
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'bg-background/30 border-card-border text-muted hover:text-foreground'
                  }`}
                >
                  Mentor
                </button>
              </div>
            </div>

            {role === 'MENTOR' && (
              <div className="transition-all duration-300">
                <label htmlFor="registrationKey" className="block text-sm font-medium text-foreground">
                  Mentor Registration Key <span className="text-xs text-muted">(Optional)</span>
                </label>
                <input
                  id="registrationKey"
                  name="registrationKey"
                  type="text"
                  value={registrationKey}
                  onChange={(e) => setRegistrationKey(e.target.value)}
                  placeholder="GLB-MENTOR-XXXX-XXXX"
                  className="mt-1 block w-full rounded-lg bg-background/50 border border-card-border px-4 py-2 text-foreground placeholder-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-sm transition-all"
                />
                <span className="text-[10px] text-muted mt-1 block">
                  Use key for instant verification. Leave blank if registering for manual admin approval.
                </span>
              </div>
            )}

            {isSandbox && (
              <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 text-xs text-muted">
                <span className="font-semibold text-primary">Sandbox mode.</span> Continuing as the
                troubleshooting account - no name or password needed. Add{' '}
                <code className="text-primary">/mentor</code> to the address for the mentor
                dashboard, or <code className="text-primary">/student</code> for the student one.
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full justify-center rounded-lg bg-primary hover:bg-primary-hover px-4 py-2 text-sm font-semibold text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Sign up'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted">Already have an account? </span>
            <Link href="/login" className="font-semibold text-primary hover:text-primary-hover transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
