'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { AnimatePresence, m, useMotionValueEvent, useScroll } from 'framer-motion';
import { Bell, Check, Inbox, AlertCircle, Calendar, MessageSquare } from 'lucide-react';
import { EASE, SPRING } from '@/components/motion/tokens';
import Magnetic from '@/components/motion/Magnetic';
import { useSession } from '@/lib/session';

const NAV_LINKS = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Find Teams', path: '/team-formation/find-teams' },
  { name: 'Find Teammates', path: '/team-formation/find-teammates' },
  { name: 'Find Teams', path: '/team-formation/find-teams' },
  { name: 'Find Mentors', path: '/team-formation/find-mentors' },
  { name: 'Tracks', path: '/tracks' },
];

interface Notification {
  id: string;
  dbId?: string;
  type: string;
  title: string;
  message: string;
  messageText?: string | null;
  read: boolean;
  createdAt: string;
}

function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error('Fetch notifications error', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      const handle = requestAnimationFrame(() => {
        fetchNotifications();
      });
      return () => cancelAnimationFrame(handle);
    }
  }, [open, fetchNotifications]);

  // Click outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const markAsRead = async (id?: string) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
      });
      if (res.ok) {
        if (id) {
          setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
          );
        } else {
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        }
      }
    } catch (err) {
      console.error('Mark read error', err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative" ref={menuRef}>
      <Magnetic strength={5} as="span">
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="relative grid size-9 place-items-center rounded-xl border border-[rgba(209,199,189,0.6)] bg-white/40 text-foreground transition-colors duration-250 hover:bg-white/80"
          aria-label="View notifications"
        >
          <Bell className="size-4.5" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <m.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={SPRING.snappy}
                className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-[9px] font-black text-on-accent"
              >
                {unreadCount}
              </m.span>
            )}
          </AnimatePresence>
        </button>
      </Magnetic>

      <AnimatePresence>
        {open && (
          <m.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.28, ease: EASE.outExpo }}
            className="absolute right-0 mt-2.5 w-80 sm:w-96 rounded-2xl border border-[rgba(209,199,189,0.75)] bg-[rgba(248,246,242,0.94)] p-4 shadow-[0_12px_36px_rgba(50,45,41,0.14)] backdrop-blur-xl z-50 text-foreground"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(209,199,189,0.5)]">
              <span className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <Inbox className="size-3.5 text-primary" /> Notifications
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAsRead()}
                  className="text-[10px] font-bold text-primary hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="mt-3 max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {loading ? (
                <div className="py-8 text-center text-xs text-muted">
                  <div className="inline-block size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span className="ml-2">Loading...</span>
                </div>
              ) : notifications.length > 0 ? (
                <m.div className="space-y-2">
                  {notifications.map((n) => {
                    const isSystemLog = !!n.dbId; // If it has a DB ID, it's a read-only notification log
                    return (
                      <m.div
                        key={n.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-3 rounded-xl border transition-colors flex gap-3 items-start ${
                          n.read
                            ? 'border-[rgba(209,199,189,0.4)] bg-[rgba(239,233,225,0.35)]'
                            : 'border-[rgba(114,56,61,0.22)] bg-[rgba(114,56,61,0.04)]'
                        }`}
                      >
                        {/* Status Icons */}
                        <span className="mt-0.5 shrink-0">
                          {n.type === 'team_invite_received' || n.type === 'team_invite' ? (
                            <Calendar className="size-3.5 text-primary" />
                          ) : n.type === 'join_request_received' || n.type === 'join_request' ? (
                            <MessageSquare className="size-3.5 text-foreground" />
                          ) : (
                            <AlertCircle className="size-3.5 text-muted" />
                          )}
                        </span>

                        <div className="flex-1 min-w-0">
                          <span className="block text-[11px] font-black text-foreground truncate">
                            {n.title}
                          </span>
                          <span className="block text-[10px] text-body leading-relaxed mt-0.5 break-words">
                            {n.message}
                          </span>
                          {n.messageText && (
                            <span className="block text-[9px] italic text-muted mt-1 border-l border-primary/30 pl-1.5">
                              &ldquo;{n.messageText}&rdquo;
                            </span>
                          )}
                          <span className="block text-[8px] text-muted mt-1.5">
                            {new Date(n.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {/* Read/Read Action */}
                        {!n.read && isSystemLog && (
                          <button
                            onClick={() => markAsRead(n.id)}
                            className="shrink-0 rounded-md border border-[rgba(114,56,61,0.2)] bg-[rgba(114,56,61,0.08)] p-1 text-primary hover:bg-[rgba(114,56,61,0.16)]"
                            aria-label="Mark read"
                          >
                            <Check className="size-3" />
                          </button>
                        )}
                      </m.div>
                    );
                  })}
                </m.div>
              ) : (
                <div className="py-8 text-center text-xs text-muted">
                  No notifications.
                </div>
              )}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Navbar({ overlay = false }: { overlay?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();

  const { user, status, clear } = useSession();
  const loading = status === 'loading';

  const visibleLinks = NAV_LINKS.filter((link) => {
    if (user?.role === 'MENTOR') {
      return link.path === '/dashboard' || link.path === '/tracks';
    }
    if (user?.role === 'ADMIN') {
      return link.path === '/dashboard';
    }
    return true;
  });

  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    setScrolled(latest > 12);
    if (menuOpen) return;
    setHidden(latest > previous && latest > 140);
  });

  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      setMenuOpen(false);
    });
    return () => cancelAnimationFrame(handle);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const [signingOut, setSigningOut] = useState(false);

  const handleLogout = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      // If Clerk is active, drop its session before hitting our own logout.
      // This prevents the "You're already signed in" error on the next attempt
      // to sign in with Google via Clerk.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (typeof window !== 'undefined' && (window as any).Clerk) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (window as any).Clerk.signOut();
      }

      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
      });
      if (!response.ok) {
        setSigningOut(false);
        return;
      }
      clear();
      window.location.href = '/login';
    } catch {
      setSigningOut(false);
    }
  };

  return (
    <>
      {!overlay && <div aria-hidden className="h-[var(--nav-h)]" />}
      <m.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: hidden ? -110 : 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: EASE.outExpo }}
        className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4"
      >
        <nav
          className={`mx-auto flex h-16 max-w-wide items-center justify-between rounded-2xl border px-3 backdrop-blur-xl transition-[background-color,box-shadow,border-color] duration-500 sm:px-5 ${
            scrolled
              ? 'border-[rgba(209,199,189,0.6)] bg-[rgba(248,246,242,0.86)] shadow-[0_8px_32px_rgba(50,45,41,0.10)]'
              : 'border-[rgba(209,199,189,0.32)] bg-[rgba(248,246,242,0.55)] shadow-[0_2px_18px_rgba(50,45,41,0.05)]'
          }`}
        >
          <Link href="/" className="group flex items-center gap-2 sm:gap-3">
            <span className="relative flex size-9 items-center justify-center rounded-xl border border-[rgba(209,199,189,0.5)] bg-white/50 p-1 transition-transform duration-300 group-hover:scale-105">
              <Image
                src="/Logo/GL-BAJAJ-LOGO-3.png"
                alt="GL Bajaj"
                width={28}
                height={28}
                className="object-contain"
                priority
              />
            </span>
            <span className="hidden h-6 w-px bg-[rgba(209,199,189,0.7)] sm:block" />
            <span className="relative hidden size-9 items-center justify-center rounded-xl border border-[rgba(209,199,189,0.5)] bg-white/50 p-1 transition-transform duration-300 group-hover:scale-105 sm:flex">
              <Image
                src="/Logo/NexaSphere Icon without Background.png"
                alt="NexaSphere"
                width={28}
                height={28}
                className="object-contain"
              />
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-gradient-luxe text-sm font-extrabold tracking-tight">
                SIH@GLBGOI
              </span>
              <span className="mt-1 text-label uppercase text-muted">
                by NexaSphere
              </span>
            </span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {visibleLinks.map((link) => {
              const isActive = pathname === link.path;
              return (
                <Link
                  key={link.path}
                  href={link.path}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative rounded-lg px-3 py-2 text-label uppercase transition-colors duration-250 ${
                    isActive ? 'text-primary' : 'text-muted hover:text-foreground'
                  }`}
                >
                  {isActive && (
                    <m.span
                      layoutId="navPill"
                      className="absolute inset-0 rounded-lg bg-[rgba(172,156,141,0.22)]"
                      transition={SPRING.snappy}
                    />
                  )}
                  <span className="relative z-10">{link.name}</span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            {loading ? (
              <div className="flex items-center gap-2.5">
                <div className="hidden flex-col items-end gap-1.5 sm:flex">
                  <span className="skeleton-shimmer block h-2.5 w-20" />
                  <span className="skeleton-shimmer block h-2 w-12" />
                </div>
                <span className="skeleton-shimmer block size-8 rounded-full" />
              </div>
            ) : user ? (
              <div className="flex items-center gap-2.5">
                {/* Notifications Bell */}
                <NotificationsMenu />

                <span className="hidden flex-col text-right leading-none sm:flex">
                  <span className="text-xs font-bold text-foreground">{user.name}</span>
                  <span className="mt-1 text-label uppercase text-muted">
                    {user.role.toLowerCase()}
                  </span>
                </span>
                <Magnetic strength={6} as="span" className="hidden sm:inline-flex">
                  <Link
                    href={user.isOnboarded ? "/dashboard" : "/onboarding"}
                    className="rounded-lg border border-[rgba(114,56,61,0.22)] bg-[rgba(114,56,61,0.08)] px-3 py-2 text-label uppercase text-primary transition-colors duration-250 hover:bg-[rgba(114,56,61,0.16)]"
                  >
                    {user.isOnboarded ? "Dashboard" : "Profile"}
                  </Link>
                </Magnetic>
                <Magnetic strength={6} as="span" className="inline-flex">
                  <button
                    onClick={handleLogout}
                    disabled={signingOut}
                    aria-busy={signingOut}
                    className="rounded-lg border border-[rgba(209,199,189,0.7)] bg-white/40 px-3 py-2 text-label uppercase text-foreground transition-colors duration-250 hover:bg-white/80 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {signingOut ? 'Signing out' : 'Sign Out'}
                  </button>
                </Magnetic>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Magnetic strength={6} as="span" className="hidden sm:inline-flex">
                  <Link
                    href="/login"
                    className="rounded-lg border border-[rgba(209,199,189,0.7)] bg-white/40 px-4 py-2 text-xs font-bold text-foreground transition-colors duration-250 hover:bg-white/80"
                  >
                    Sign In
                  </Link>
                </Magnetic>
                <Magnetic strength={6} as="span" className="inline-flex">
                  <Link
                    href="/signup"
                    className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-on-accent shadow-[0_2px_12px_rgba(114,56,61,0.22)] transition-shadow duration-250 hover:shadow-[0_8px_22px_rgba(114,56,61,0.3)]"
                  >
                    Get Started
                  </Link>
                </Magnetic>
              </div>
            )}

            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              className="ml-1 flex size-9 flex-col items-center justify-center gap-[5px] rounded-lg border border-[rgba(209,199,189,0.6)] bg-white/40 md:hidden"
            >
              <m.span
                animate={menuOpen ? { rotate: 45, y: 3.5 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.3, ease: EASE.outExpo }}
                className="block h-[1.5px] w-4 rounded-full bg-foreground"
              />
              <m.span
                animate={menuOpen ? { rotate: -45, y: -3.5 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.3, ease: EASE.outExpo }}
                className="block h-[1.5px] w-4 rounded-full bg-foreground"
              />
            </button>
          </div>
        </nav>
      </m.header>

      <AnimatePresence>
        {menuOpen && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-[rgba(239,233,225,0.92)] backdrop-blur-2xl md:hidden overflow-y-auto"
          >
            <m.ul
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.06, delayChildren: 0.12 } } }}
              className="flex min-h-full flex-col items-start justify-center gap-2 px-8 py-20"
            >
              {visibleLinks.map((link) => (
                <m.li
                  key={link.path}
                  variants={{
                    hidden: { opacity: 0, y: 24, filter: 'blur(6px)' },
                    visible: {
                      opacity: 1,
                      y: 0,
                      filter: 'blur(0px)',
                      transition: { duration: 0.5, ease: EASE.outExpo },
                    },
                  }}
                  className="w-full"
                >
                  <Link
                    href={link.path}
                    className={`block border-b border-[rgba(209,199,189,0.5)] py-4 text-2xl font-extrabold tracking-tight transition-colors ${
                      pathname === link.path ? 'text-primary' : 'text-foreground'
                    }`}
                  >
                    {link.name}
                  </Link>
                </m.li>
              ))}
              {!user && (
                <m.li
                  variants={{
                    hidden: { opacity: 0, y: 24 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE.outExpo } },
                  }}
                  className="mt-6 flex w-full gap-3"
                >
                  <Link
                    href="/login"
                    className="flex-1 rounded-xl border border-[rgba(209,199,189,0.8)] bg-white/60 py-3 text-center text-sm font-bold"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="flex-1 rounded-xl bg-primary py-3 text-center text-sm font-bold text-on-accent"
                  >
                    Get Started
                  </Link>
                </m.li>
              )}
            </m.ul>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}
