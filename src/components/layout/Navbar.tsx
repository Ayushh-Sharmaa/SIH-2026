'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function checkUser() {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.authenticated) {
        setUser(data.user);
      } else {
        setUser(null);
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

  return (
    <nav className="border-b border-card-border bg-card/60 backdrop-blur-md sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          <div className="flex items-center space-x-3">
            <Link href="/dashboard" className="flex flex-col">
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                SIH@GLBGOI
              </span>
              <span className="text-[9px] text-muted -mt-1">
                by NexaSphere
              </span>
            </Link>
          </div>

          <div className="hidden md:flex space-x-6">
            {navLinks.map((link) => {
              const isActive = pathname === link.path;
              return (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`text-sm font-semibold transition-colors ${
                    isActive ? 'text-primary border-b-2 border-primary pb-1' : 'text-muted hover:text-foreground'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center space-x-3">
            {user?.role === 'ADMIN' && (
              <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/30 p-1 rounded-xl">
                <Link
                  href="/admin"
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                    pathname === '/admin' ? 'bg-primary text-white' : 'text-primary hover:bg-primary/20'
                  }`}
                >
                  🛡️ Admin Console
                </Link>
                <Link
                  href="/dashboard?role=STUDENT"
                  className="px-2.5 py-1 text-xs font-semibold text-muted hover:text-foreground transition-all"
                  title="Preview Student View"
                >
                  🎓 Student
                </Link>
                <Link
                  href="/dashboard?role=MENTOR"
                  className="px-2.5 py-1 text-xs font-semibold text-muted hover:text-foreground transition-all"
                  title="Preview Mentor View"
                >
                  👨‍🏫 Mentor
                </Link>
              </div>
            )}

            {user && user.role !== 'ADMIN' && (
              <div className="hidden sm:flex items-center gap-3">
                <div className="flex flex-col text-right">
                  <span className="text-sm font-bold text-foreground">{user.name}</span>
                  <span className="text-[10px] text-muted capitalize">{user.role.toLowerCase()}</span>
                </div>
                <Link
                  href="/onboarding?edit=true"
                  className="rounded-lg bg-primary/10 border border-primary/20 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/20 transition-all"
                  title="Edit Profile"
                >
                  ✏️ Edit
                </Link>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="rounded-lg bg-card-border border border-card-border px-3.5 py-1.5 text-xs font-bold text-foreground hover:bg-background transition-all cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
