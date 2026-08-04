'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Reveal, { RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { EASE } from '@/components/motion/tokens';

const LINK_GROUPS = [
  {
    title: 'Platform',
    links: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Problem Tracks', href: '/tracks' },
      { label: 'Find Teammates', href: '/team-formation/find-teammates' },
      { label: 'Find Mentors', href: '/team-formation/find-mentors' },
    ],
  },
  {
    title: 'Get Started',
    links: [
      { label: 'Create Account', href: '/signup' },
      { label: 'Sign In', href: '/login' },
      { label: 'Build a Team', href: '/team-formation/create-team' },
    ],
  },
];

const SOCIALS = [
  {
    label: 'Website',
    href: 'https://www.glbajajgroup.org',
    path: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 0c2.5 2.7 3.8 6.3 3.8 10S14.5 19.3 12 22m0-20C9.5 4.7 8.2 8.3 8.2 12S9.5 19.3 12 22M2.5 9h19M2.5 15h19',
  },
  {
    label: 'Email',
    href: 'mailto:sih@glbitm.ac.in',
    path: 'M3 7.5A2.5 2.5 0 0 1 5.5 5h13A2.5 2.5 0 0 1 21 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 16.5v-9Zm0 .5 9 6 9-6',
  },
];

export default function Footer() {
  return (
    <footer className="relative mt-auto overflow-hidden border-t border-[rgba(209,199,189,0.6)] bg-gradient-to-b from-[rgba(217,217,217,0.35)] to-[rgba(239,233,225,0.95)]">
      {/* Floating glow anchored to the footer's top edge */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-56 w-[52rem] max-w-full -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(172,156,141,0.32),transparent_68%)] blur-2xl"
      />

      <div className="relative mx-auto max-w-7xl px-6 pb-10 pt-16 lg:px-8">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <Reveal direction="up">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-2xl border border-[rgba(209,199,189,0.6)] bg-white/60 p-1.5">
                <Image
                  src="/Logo/GL-BAJAJ-LOGO-3.png"
                  alt="GL Bajaj Group of Institutions"
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </span>
              <span className="flex flex-col leading-none">
                <span className="text-gradient-luxe text-lg font-extrabold tracking-tight">
                  SIH@GLBGOI
                </span>
                <span className="mt-1.5 text-label uppercase text-muted">
                  Powered by NexaSphere
                </span>
              </span>
            </div>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted">
              The official Smart India Hackathon internal portal of GL Bajaj Group of
              Institutions, Mathura — where teams form, mentors connect, and ideas take flight.
            </p>
            <div className="mt-6 flex gap-2.5">
              {SOCIALS.map((s) => (
                <motion.a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  target="_blank"
                  rel="noreferrer"
                  whileHover={{ y: -3, scale: 1.06 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.25, ease: EASE.outExpo }}
                  className="flex size-10 items-center justify-center rounded-xl border border-[rgba(209,199,189,0.7)] bg-white/50 text-muted transition-colors duration-250 hover:border-[rgba(114,56,61,0.3)] hover:text-primary"
                >
                  <svg viewBox="0 0 24 24" fill="none" className="size-[18px]">
                    <path
                      d={s.path}
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </motion.a>
              ))}
            </div>
          </Reveal>

          {LINK_GROUPS.map((group, i) => (
            <RevealGroup key={group.title} delay={0.08 * (i + 1)} stagger={0.05}>
              <RevealItem>
                <h2 className="text-label uppercase text-body">
                  {group.title}
                </h2>
              </RevealItem>
              <ul className="mt-5 space-y-3">
                {group.links.map((link) => (
                  <RevealItem key={link.href} as="li">
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-1.5 text-sm text-muted transition-colors duration-250 hover:text-primary"
                    >
                      <span className="relative">
                        {link.label}
                        <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-primary transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-full" />
                      </span>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="size-3 -translate-x-1 opacity-0 transition-all duration-250 group-hover:translate-x-0 group-hover:opacity-100"
                      >
                        <path
                          d="M5 12h14m-6-6 6 6-6 6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </Link>
                  </RevealItem>
                ))}
              </ul>
            </RevealGroup>
          ))}
        </div>

        <Reveal direction="up" delay={0.1} className="mt-14">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-[rgba(172,156,141,0.55)] to-transparent" />
          <div className="flex flex-col items-center justify-between gap-3 pt-6 sm:flex-row">
            <p className="text-xs text-muted">
              © {new Date().getFullYear()} GL Bajaj Group of Institutions, Mathura.
            </p>
            <p className="text-label uppercase text-muted">
              Crafted by NexaSphere
            </p>
          </div>
        </Reveal>
      </div>
    </footer>
  );
}
