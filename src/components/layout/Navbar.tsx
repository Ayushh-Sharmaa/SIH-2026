'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { animate } from 'animejs';

// Inline Animated NexaSphere Logo
function NexaSphereLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={`${className}`} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="navNexaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#72383d" />
          <stop offset="100%" stopColor="#ac9c8d" />
        </linearGradient>
      </defs>
      <motion.polygon
        points="50,12 85,32 85,72 50,92 15,72 15,32"
        stroke="url(#navNexaGrad)"
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
      <circle cx="50" cy="50" r="14" fill="url(#navNexaGrad)" className="filter drop-shadow-[0_0_8px_rgba(114,56,61,0.5)]" />
    </svg>
  );
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkUser() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.authenticated) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Check user failed:', err);
      } finally {
        setLoading(false);
      }
    }
    checkUser();
  }, [pathname]);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        router.push('/login');
      }
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Tracks', path: '/tracks' },
    { name: 'Find Teammates', path: '/team-formation/find-teammates' },
    { name: 'Find Mentors', path: '/team-formation/find-mentors' },
  ];

  // AnimeJS interactive spring scaling on Hover
  const handleScaleHoverEnter = (e: React.MouseEvent<HTMLElement>) => {
    animate(e.currentTarget, {
      scale: 1.03,
      duration: 250,
      ease: 'outQuad'
    });
  };

  const handleScaleHoverLeave = (e: React.MouseEvent<HTMLElement>) => {
    animate(e.currentTarget, {
      scale: 1,
      duration: 250,
      ease: 'outQuad'
    });
  };

  return (
    <nav className="border-b border-card-border bg-card/40 backdrop-blur-md sticky top-0 z-50 transition-all">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          
          {/* Logo brand section */}
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="relative p-1 rounded-xl bg-card-border/10 border border-card-border/20 backdrop-blur-sm flex items-center justify-center">
              <img src="/Logo/NexaSphere Icon without Background.png" className="w-8 h-8 object-contain" alt="NexaSphere Logo" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-base font-extrabold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent group-hover:neon-text-glow transition-all">
                SIH@GLBGOI
              </span>
              <span className="text-[8px] text-muted tracking-wider uppercase font-semibold -mt-1">
                by NexaSphere
              </span>
            </div>
          </Link>

          {/* Navigation links */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              const isActive = pathname === link.path;
              return (
                <Link
                  key={link.path}
                  href={link.path}
                  onMouseEnter={handleScaleHoverEnter}
                  onMouseLeave={handleScaleHoverLeave}
                  className={`text-xs font-bold uppercase tracking-wider relative py-1.5 transition-all ${
                    isActive ? 'text-primary' : 'text-muted hover:text-foreground'
                  }`}
                >
                  {link.name}
                  {isActive && (
                    <motion.div
                      layoutId="navIndicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Auth operations */}
          <div className="flex items-center space-x-4">
            {loading ? (
              <div className="flex items-center gap-3 animate-pulse">
                <div className="flex flex-col items-end gap-1.5">
                  <div className="h-3 w-16 bg-card-border rounded" />
                  <div className="h-2 w-10 bg-card-border rounded" />
                </div>
                <div className="h-8 w-8 bg-card-border rounded-full" />
              </div>
            ) : user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-foreground leading-none">{user.name}</span>
                  <span className="text-[9px] text-muted capitalize mt-1 font-semibold tracking-wide">
                    {user.role.toLowerCase()}
                  </span>
                </div>
                <Link
                  href="/onboarding?edit=true"
                  onMouseEnter={handleScaleHoverEnter}
                  onMouseLeave={handleScaleHoverLeave}
                  className="rounded-lg bg-primary/10 border border-primary/20 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-primary hover:bg-primary/20 transition-all"
                  title="Edit Profile"
                >
                  Edit Profile
                </Link>
                <button
                  onClick={handleLogout}
                  onMouseEnter={handleScaleHoverEnter}
                  onMouseLeave={handleScaleHoverLeave}
                  className="rounded-lg bg-card-border border border-card-border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-foreground hover:bg-background transition-all cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  onMouseEnter={handleScaleHoverEnter}
                  onMouseLeave={handleScaleHoverLeave}
                  className="rounded-lg border border-card-border bg-card/60 px-3.5 py-1.5 text-xs font-bold text-foreground hover:bg-card-border transition-all"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}
