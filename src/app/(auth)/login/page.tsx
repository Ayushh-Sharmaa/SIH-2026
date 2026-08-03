'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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

      // Check if user is onboarded, otherwise redirect to onboarding
      const meRes = await fetch('/api/auth/me');
      const meData = await meRes.json();

      if (meData.authenticated && meData.user.isOnboarded) {
        router.push('/dashboard');
      } else {
        router.push('/onboarding');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
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
            Sign in to your account
          </h2>

          {error && (
            <div className="mb-4 rounded-lg bg-red-950/40 p-4 text-sm text-red-400 border border-red-900/30">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                College Email ID
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="username@glbajaj.org"
                className="mt-1 block w-full rounded-lg bg-background/50 border border-card-border px-4 py-2 text-foreground placeholder-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-sm transition-all"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 block w-full rounded-lg bg-background/50 border border-card-border px-4 py-2 text-foreground placeholder-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-sm transition-all"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full justify-center rounded-lg bg-primary hover:bg-primary-hover px-4 py-2 text-sm font-semibold text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted">Don't have an account? </span>
            <Link href="/signup" className="font-semibold text-primary hover:text-primary-hover transition-colors">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
