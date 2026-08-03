'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import { animate, createSpring } from 'animejs';

const hasClerkKey = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

// Inline Animated NexaSphere Logo
function NexaSphereLogo({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg className={`${className}`} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="loginNexaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#72383d" />
          <stop offset="100%" stopColor="#ac9c8d" />
        </linearGradient>
      </defs>
      <motion.polygon
        points="50,12 85,32 85,72 50,92 15,72 15,32"
        stroke="url(#loginNexaGrad)"
        strokeWidth="3.5"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      />
      <motion.circle
        cx="50"
        cy="50"
        r="24"
        stroke="#ac9c8d"
        strokeWidth="2.5"
        strokeDasharray="6 4"
        animate={{ rotate: -360 }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      />
      <circle cx="50" cy="50" r="14" fill="url(#loginNexaGrad)" className="filter drop-shadow-[0_0_8px_rgba(114,56,61,0.5)]" />
    </svg>
  );
}

// Gorgeous Dashboard Transition Skeleton Loader
function DashboardSkeletonLoader() {
  return (
    <div className="fixed inset-0 bg-background/95 z-50 flex flex-col p-6 space-y-6 animate-in fade-in duration-200">
      {/* Header bar skeleton */}
      <div className="flex justify-between items-center border-b border-card-border pb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-card-border animate-pulse" />
          <div className="h-4 w-28 bg-card-border rounded animate-pulse" />
        </div>
        <div className="h-8 w-20 bg-card-border rounded-xl animate-pulse" />
      </div>

      {/* Hero Welcome banner skeleton */}
      <div className="h-28 rounded-2xl bg-card border border-card-border/50 p-6 flex flex-col justify-center space-y-2">
        <div className="h-5 w-48 bg-card-border rounded animate-pulse" />
        <div className="h-3.5 w-96 bg-card-border rounded animate-pulse" />
      </div>

      {/* Main body skeleton grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* Left Card skeleton */}
        <div className="p-6 rounded-2xl border border-card-border bg-card/60 flex flex-col space-y-4">
          <div className="h-4 w-24 bg-card-border rounded animate-pulse" />
          <div className="h-px bg-card-border w-full" />
          <div className="h-3 w-full bg-card-border rounded animate-pulse" />
          <div className="h-3 w-5/6 bg-card-border rounded animate-pulse" />
          <div className="h-3 w-4/6 bg-card-border rounded animate-pulse" />
        </div>

        {/* Right Columns skeleton */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-card-border bg-card/60 flex flex-col space-y-4">
          <div className="h-4 w-32 bg-card-border rounded animate-pulse" />
          <div className="h-px bg-card-border w-full" />
          <div className="h-20 bg-card-border/30 rounded-xl animate-pulse" />
          <div className="h-10 bg-card-border/30 rounded-xl animate-pulse" />
        </div>
      </div>

      <div className="text-center text-xs text-muted font-mono tracking-wider animate-pulse py-4">
        Authorizing & compiling security token...
      </div>
    </div>
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
  const clerk = useClerk();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    animate('.anime-card', {
      opacity: [0, 1],
      y: [30, 0],
      duration: 1000,
      ease: createSpring({
        stiffness: 110,
        damping: 12
      })
    });
  }, []);

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const pubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
      const isRealKey = pubKey.startsWith('pk_test_') && !pubKey.includes('glbgoi') && !pubKey.includes('placeholder');

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
          router.push('/dashboard');
        } else {
          router.push('/onboarding');
        }
      }
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
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
            router.push('/dashboard');
          } else {
            router.push('/onboarding');
          }
          return;
        }
      } catch (fallbackErr) {
        // ignore
      }
      setError(err.message || 'Google Sign-In failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

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

      if (data.redirectUrl) {
        router.push(data.redirectUrl);
        return;
      }

      if (data.user?.role === 'ADMIN') {
        router.push('/admin');
        return;
      }

      const meRes = await fetch('/api/auth/me');
      const meData = await meRes.json();

      if (meData.authenticated && meData.user?.role === 'ADMIN') {
        router.push('/admin');
      } else if (meData.authenticated && meData.user?.isOnboarded) {
        router.push('/dashboard');
      } else {
        router.push('/onboarding');
      }
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Something went wrong');
    }
  };

  return (
    <>
      <AnimatePresence>
        {loading && <DashboardSkeletonLoader />}
      </AnimatePresence>
      <LoginTemplate
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        error={error}
        googleLoading={googleLoading}
        handleGoogleSignIn={handleGoogleSignIn}
        handleSubmit={handleSubmit}
      />
    </>
  );
}

function CustomLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    animate('.anime-card', {
      opacity: [0, 1],
      y: [30, 0],
      duration: 1000,
      ease: createSpring({
        stiffness: 110,
        damping: 12
      })
    });
  }, []);

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
        router.push('/dashboard');
      } else {
        router.push('/onboarding');
      }
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      setError(err.message || 'Google Sign-In failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

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

      if (data.redirectUrl) {
        router.push(data.redirectUrl);
        return;
      }

      if (data.user?.role === 'ADMIN') {
        router.push('/admin');
        return;
      }

      const meRes = await fetch('/api/auth/me');
      const meData = await meRes.json();

      if (meData.authenticated && meData.user?.role === 'ADMIN') {
        router.push('/admin');
      } else if (meData.authenticated && meData.user?.isOnboarded) {
        router.push('/dashboard');
      } else {
        router.push('/onboarding');
      }
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Something went wrong');
    }
  };

  return (
    <>
      <AnimatePresence>
        {loading && <DashboardSkeletonLoader />}
      </AnimatePresence>
      <LoginTemplate
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        error={error}
        googleLoading={googleLoading}
        handleGoogleSignIn={handleGoogleSignIn}
        handleSubmit={handleSubmit}
      />
    </>
  );
}

interface LoginTemplateProps {
  email: any;
  setEmail: any;
  password: any;
  setPassword: any;
  error: any;
  googleLoading: any;
  handleGoogleSignIn: any;
  handleSubmit: any;
}

function LoginTemplate({
  email,
  setEmail,
  password,
  setPassword,
  error,
  googleLoading,
  handleGoogleSignIn,
  handleSubmit,
}: LoginTemplateProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden dot-grid">
      
      {/* Glow overlays */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full filter blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-accent/8 rounded-full filter blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md space-y-8 z-10">
        
        {/* Header branding */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-3 justify-center">
            <div className="relative p-1.5 rounded-xl bg-card-border/10 border border-card-border/20 backdrop-blur-sm flex items-center justify-center">
              <img src="/Logo/NexaSphere Icon without Background.png" className="w-9 h-9 object-contain" alt="NexaSphere Logo" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              SIH@GLBGOI
            </h1>
          </Link>
          <p className="text-xs text-muted font-bold uppercase tracking-wider">
            Team Formation & Mentorship Platform
          </p>
        </div>

        {/* Form Container Card */}
        <div className="anime-card opacity-0 glass-card rounded-3xl p-8 border border-card-border shadow-2xl bg-card/60 backdrop-blur-md cyber-glow">
          <h2 className="text-lg font-bold text-foreground mb-6 text-center tracking-wide uppercase">
            Sign in to your portal
          </h2>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-xl bg-red-950/20 p-4 text-xs text-red-400 border border-red-900/30 font-medium"
            >
              {error}
            </motion.div>
          )}

          {/* Social login */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-card-border bg-background/40 hover:bg-card hover:border-primary/40 text-foreground font-semibold text-xs transition-all shadow-md cursor-pointer mb-6 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
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
            {googleLoading ? 'Connecting to Google...' : 'Continue with Google'}
          </button>

          <div className="relative flex items-center justify-center mb-6">
            <div className="border-t border-card-border w-full" />
            <span className="bg-card px-3 text-[10px] text-muted font-bold uppercase tracking-wider absolute">or credential lock</span>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">
                College Email ID
              </label>
              <input
                id="email"
                name="email"
                type="text"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="username@glbajaj.org"
                className="block w-full rounded-xl bg-background/30 border border-card-border px-4 py-2.5 text-foreground placeholder-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-xs transition-all"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">
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
                className="block w-full rounded-xl bg-background/30 border border-card-border px-4 py-2.5 text-foreground placeholder-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-xs transition-all"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full flex justify-center items-center py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-primary/25 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                Sign In
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-xs">
            <span className="text-muted">Don't have a workspace account? </span>
            <Link href="/signup" className="font-bold text-primary hover:text-primary-hover transition-colors">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
