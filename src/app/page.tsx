'use client';

import { Suspense, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, m } from 'framer-motion';
import {
  ShieldAlert,
  Calendar,
  ArrowRight,
  Sparkles,
  Users,
  BookOpen,
  Trophy,
  Check,
  X,
  Minus,
  Lock,
  School,
  UserCheck,
  Layers,
  Cpu,
  ShieldCheck,
  TrendingUp,
  Flame,
  Award,
  Zap,
} from 'lucide-react';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Aurora from '@/components/motion/Aurora';
import ParticleField from '@/components/motion/ParticleField';
import SpotlightCard from '@/components/motion/SpotlightCard';
import Reveal, { RevealGroup, RevealItem } from '@/components/motion/Reveal';
import SplitText from '@/components/motion/SplitText';
import PremiumButton from '@/components/motion/PremiumButton';
import { useSession } from '@/lib/session';
import { TiltCard } from '@/components/motion/Magnetic';
import { EASE, SPRING } from '@/components/motion/tokens';
import { Container, Section } from '@/components/ui';

interface ArenaEvent {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string;
  bannerUrl: string | null;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
}

const DEFAULT_EVENTS: ArenaEvent[] = [
  {
    id: 'evt-hustle-2026',
    name: 'Hustle Carnival 2026',
    slug: 'hustle-carnival-2026',
    tagline: 'Ellusion Buildathon — Problem Statement ELU04: Student Skill & Team Finder',
    description:
      'The flagship buildathon challenge under Hustle Carnival 2026 at GL Bajaj Group of Institutions, Mathura. Solving problem statement ELU04 (Education & Student Networking) by Team Ghost. Form balanced squads, bridge skill gaps, and connect with faculty mentors.',
    bannerUrl: '/events/hustle-carnival.png',
    startDate: '2026-03-01T00:00:00.000Z',
    endDate: '2026-05-30T00:00:00.000Z',
    isActive: true,
  },
  {
    id: 'evt-sih-2026',
    name: 'SIH Internal 2026',
    slug: 'sih-internal-2026',
    tagline: 'GL Bajaj Smart India Hackathon — Internal Round',
    description:
      'The official internal round of Smart India Hackathon 2026 at GL Bajaj Group of Institutions, Mathura. Form balanced teams of 6 members with 1 female reservation, close skill gaps, and match with verified faculty mentors.',
    bannerUrl: '/Logo/GL-BAJAJ-LOGO-3.png',
    startDate: '2026-06-01T00:00:00.000Z',
    endDate: '2026-12-31T00:00:00.000Z',
    isActive: true,
  },
];

const PLATFORM_STEPS = [
  {
    step: '01',
    title: 'Explore Events',
    desc: 'Colleges and clubs host hackathons open for all students to discover and explore freely.',
    icon: School,
  },
  {
    step: '02',
    title: 'Open Registration',
    desc: 'Register openly with your personal or institutional Google ID to participate and form squads.',
    icon: Sparkles,
  },
  {
    step: '03',
    title: 'Build Profile',
    desc: 'Capture skills, tech stack, branch, year and interests across 3 quick progressive tiles.',
    icon: UserCheck,
  },
  {
    step: '04',
    title: 'Form a Team',
    desc: 'Discover peers, spot skill gaps with live banners, and satisfy 1-female seat rules automatically.',
    icon: Users,
  },
  {
    step: '05',
    title: 'Get a Mentor',
    desc: 'Leaders request verified faculty mentors by domain expertise with visible guidance loads.',
    icon: BookOpen,
  },
];

const COMPARISON_ROWS = [
  {
    feature: 'Colleges/Orgs can create & manage own events',
    devfolio: false,
    hackerearth: false,
    unstop: false,
    linkedin: false,
    arena: true,
  },
  {
    feature: 'Access-code based private events for students',
    devfolio: false,
    hackerearth: false,
    unstop: false,
    linkedin: false,
    arena: true,
  },
  {
    feature: 'Student skill profiles with tech stack & interests',
    devfolio: true,
    hackerearth: true,
    unstop: true,
    linkedin: true,
    arena: true,
  },
  {
    feature: 'Team formation within events (create/join teams)',
    devfolio: true,
    hackerearth: true,
    unstop: true,
    linkedin: false,
    arena: true,
  },
  {
    feature: 'Integrated mentorship system (faculty & experts)',
    devfolio: false,
    hackerearth: false,
    unstop: 'partial',
    linkedin: false,
    arena: true,
  },
  {
    feature: 'Role-wise dashboards (student, mentor, admin)',
    devfolio: false,
    hackerearth: false,
    unstop: false,
    linkedin: false,
    arena: true,
  },
  {
    feature: 'Event visibility controls (public vs private)',
    devfolio: false,
    hackerearth: false,
    unstop: false,
    linkedin: false,
    arena: true,
  },
  {
    feature: 'Campus & organization focused B2B platform',
    devfolio: false,
    hackerearth: false,
    unstop: 'partial',
    linkedin: false,
    arena: true,
  },
  {
    feature: 'Student to mentor connection & request tracking',
    devfolio: false,
    hackerearth: false,
    unstop: 'partial',
    linkedin: true,
    arena: true,
  },
];

function AuthWarningNotice() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  if (!error) return null;
  const message =
    error === 'domain_not_allowed'
      ? 'Access Restricted: Please sign in or register using a valid email account.'
      : 'Authentication Notice: Could not complete sign in. Please try again.';
  return (
    <m.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      role="alert"
      className="mb-6 flex items-start gap-3 rounded-2xl border border-[rgba(114,56,61,0.35)] bg-[rgba(114,56,61,0.08)] p-4 text-xs font-semibold text-primary shadow-sm"
    >
      <ShieldAlert className="size-4 shrink-0 mt-0.5 text-primary" />
      <div className="flex-1 space-y-1">
        <p className="font-bold text-foreground">Authentication Notice</p>
        <p className="text-primary leading-relaxed">{message}</p>
      </div>
    </m.div>
  );
}

function ScrollHint() {
  return (
    <m.a
      href="#problem-statement"
      aria-label="Scroll to details"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.6, duration: 0.8 }}
      className="group absolute inset-x-0 bottom-8 z-20 mx-auto flex w-fit flex-col items-center gap-2"
    >
      <span className="text-label uppercase text-muted transition-colors group-hover:text-primary">
        Explore
      </span>
      <span className="flex h-9 w-[22px] justify-center rounded-full border border-[rgba(172,156,141,0.6)] pt-2">
        <span className="scroll-hint-dot block size-1 rounded-full bg-primary" />
      </span>
    </m.a>
  );
}

function HeroVisual() {
  return (
    <div className="relative mx-auto flex aspect-square w-full max-w-[26rem] items-center justify-center">
      <div
        aria-hidden
        className="absolute inset-6 rounded-full bg-[radial-gradient(circle,rgba(172,156,141,0.45),transparent_66%)] blur-2xl"
      />
      <m.div
        aria-hidden
        className="absolute inset-2 rounded-full border border-dashed border-[rgba(172,156,141,0.55)]"
        animate={{ rotate: 360 }}
        transition={{ duration: 48, repeat: Infinity, ease: 'linear' }}
      />
      <m.div
        aria-hidden
        className="absolute inset-[18%] rounded-full border border-[rgba(114,56,61,0.22)]"
        animate={{ rotate: -360 }}
        transition={{ duration: 32, repeat: Infinity, ease: 'linear' }}
      />
      <m.div
        aria-hidden
        className="absolute inset-[34%] rounded-full border border-dotted border-[rgba(114,56,61,0.38)]"
        animate={{ rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
      />
      <m.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.35, ease: EASE.outExpo }}
        className="relative flex size-44 items-center justify-center surface-spatial p-4"
      >
        <m.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="relative size-full flex items-center justify-center"
        >
          <Image
            src="/Logo/nexasphere-logo.png"
            alt="Arena by NexaSphere"
            width={160}
            height={160}
            className="object-contain"
            priority
          />
        </m.div>
      </m.div>
      {[
        { label: 'Skill Match', top: '4%', left: '50%', delay: 0.7 },
        { label: 'Mentors', top: '48%', left: '-2%', delay: 0.85 },
        { label: 'Multi-Tenant', top: '78%', left: '76%', delay: 1 },
      ].map((chip) => (
        <m.span
          key={chip.label}
          initial={{ opacity: 0, scale: 0.6, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: chip.delay, ease: EASE.outExpo }}
          style={{ top: chip.top, left: chip.left }}
          className="absolute -translate-x-1/2 px-3.5 py-1.5 text-label uppercase text-primary surface-glassmorphic shadow-sm"
        >
          <m.span
            className="block"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: chip.delay }}
          >
            {chip.label}
          </m.span>
        </m.span>
      ))}
      <m.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 1.2, ease: EASE.outExpo }}
        aria-hidden
        className="absolute right-[8%] top-[8%] flex items-center gap-1.5 rounded-full border border-[rgba(114,56,61,0.2)] bg-[rgba(255,255,255,0.85)] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary shadow-[0_4px_16px_rgba(50,45,41,0.1)] backdrop-blur-md"
      >
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
          <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
        </span>
        ELU04 Live
      </m.div>
    </div>
  );
}

function EventCard({ event }: { event: ArenaEvent }) {
  const startYear = event.startDate ? new Date(event.startDate).getFullYear() : null;
  const endYear = event.endDate ? new Date(event.endDate).getFullYear() : null;
  const dateRange =
    startYear && endYear && startYear !== endYear
      ? `${startYear} – ${endYear}`
      : startYear
        ? String(startYear)
        : null;

  return (
    <RevealItem>
      <TiltCard className="h-full">
        <SpotlightCard className="h-full rounded-3xl">
          <Link
            href={`/events/${event.slug}`}
            className="surface-claymorphic group relative flex h-full flex-col gap-5 overflow-hidden p-6 sm:p-8 transition-shadow duration-400"
          >
            <div className="flex items-center justify-between">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-caption font-bold ${
                  event.isActive
                    ? 'border-[rgba(114,56,61,0.24)] bg-[rgba(114,56,61,0.09)] text-primary'
                    : 'border-[rgba(209,199,189,0.75)] bg-[rgba(239,233,225,0.75)] text-muted'
                }`}
              >
                <span
                  className={`size-1.5 rounded-full ${event.isActive ? 'bg-primary animate-pulse' : 'bg-muted'}`}
                />
                {event.isActive ? 'Active Arena' : 'Closed'}
              </span>
              {dateRange && (
                <span className="flex items-center gap-1 text-caption text-muted">
                  <Calendar className="size-3" />
                  {dateRange}
                </span>
              )}
            </div>

            {/* Logo + Header */}
            <div className="flex items-start gap-4">
              {event.bannerUrl && (
                <div className="relative flex size-14 shrink-0 items-center justify-center rounded-2xl border border-[rgba(209,199,189,0.7)] bg-white/80 p-2 shadow-sm transition-transform duration-300 group-hover:scale-105">
                  <Image
                    src={event.bannerUrl}
                    alt={`${event.name} logo`}
                    width={48}
                    height={48}
                    className="size-full object-contain"
                  />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="text-heading text-foreground font-extrabold tracking-tight">
                  {event.name}
                </h3>
                {event.tagline && (
                  <p className="mt-1 text-xs font-semibold text-primary line-clamp-1">{event.tagline}</p>
                )}
              </div>
            </div>

            <div className="flex-1">
              <p className="text-sm leading-relaxed text-muted line-clamp-3">
                {event.description}
              </p>
            </div>

            <span className="inline-flex items-center gap-2 text-label uppercase text-primary transition-all duration-300 group-hover:gap-3">
              Explore Event Details
              <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          </Link>
        </SpotlightCard>
      </TiltCard>
    </RevealItem>
  );
}

export default function ArenaHome() {
  const { status } = useSession();
  const [events, setEvents] = useState<ArenaEvent[]>(DEFAULT_EVENTS);
  const [eventsLoading, setEventsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch('/api/events')
      .then((r) => r.json())
      .then((d) => {
        if (active && d.success && Array.isArray(d.events) && d.events.length > 0) {
          setEvents(d.events);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setEventsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <Navbar overlay />

      <main id="main" className="flex-1">
        {/* ─────────────── HERO ─────────────── */}
        <section className="atmos-dawn relative flex min-h-[100svh] items-center overflow-hidden pb-section-compact pt-[calc(var(--nav-h)+2.5rem)]">
          <Aurora variant="warm" spotlight />
          <ParticleField className="z-decor" />
          <div aria-hidden className="pointer-events-none absolute inset-0 z-decor grid-lines" />

          <div className="relative z-content mx-auto grid w-full max-w-wide grid-cols-1 items-center gap-14 px-gutter lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-7">
              <Suspense fallback={null}>
                <AuthWarningNotice />
              </Suspense>

              <m.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: EASE.outExpo }}
                className="flex flex-wrap items-center gap-2"
              >
                <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(114,56,61,0.25)] bg-[rgba(255,255,255,0.7)] px-3.5 py-1.5 text-label uppercase text-primary backdrop-blur-md font-bold">
                  <Flame className="size-3 text-primary" />
                  Hustle Carnival 2026 · Ellusion Buildathon
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(209,199,189,0.8)] bg-white/40 px-3 py-1.5 text-label uppercase text-muted">
                  <Award className="size-3 text-primary" />
                  Problem Statement ELU04
                </span>
              </m.div>

              <h1 className="mt-6 text-display text-foreground font-extrabold tracking-tight">
                <SplitText text="Student Skill &" as="span" mode="word" delay={0.15} />
                <br />
                <SplitText
                  text="Team Finder."
                  as="span"
                  mode="char"
                  delay={0.35}
                  gradientColors={['#72383d', '#ac9c8d']}
                />
              </h1>

              <m.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.65, ease: EASE.outExpo }}
                className="mt-6 max-w-[54ch] text-base leading-relaxed text-body sm:text-lg"
              >
                <strong>Arena</strong> is the multi-tenant hackathon and student networking platform
                built by <strong>Team Ghost</strong> (NexaSphere) for GL Bajaj Group of Institutions, Mathura.
                Colleges list public or private events, students find complementary teammates by skill, and leaders connect with verified faculty mentors.
              </m.p>

              {/* Empirical Proof Metric Bar */}
              <m.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8, ease: EASE.outExpo }}
                className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4 max-w-xl"
              >
                <div className="rounded-2xl border border-[rgba(209,199,189,0.6)] bg-white/50 p-3 shadow-sm backdrop-blur-sm">
                  <p className="text-xl font-black text-primary">&gt;99%</p>
                  <p className="text-[11px] font-medium text-muted uppercase tracking-wider">Discovery Payload Cut</p>
                </div>
                <div className="rounded-2xl border border-[rgba(209,199,189,0.6)] bg-white/50 p-3 shadow-sm backdrop-blur-sm">
                  <p className="text-xl font-black text-foreground">&lt;100 ms</p>
                  <p className="text-[11px] font-medium text-muted uppercase tracking-wider">Bootstrap Target</p>
                </div>
                <div className="rounded-2xl border border-[rgba(209,199,189,0.6)] bg-white/50 p-3 shadow-sm backdrop-blur-sm">
                  <p className="text-xl font-black text-primary">69 / 69</p>
                  <p className="text-[11px] font-medium text-muted uppercase tracking-wider">Unit Tests Pass</p>
                </div>
                <div className="rounded-2xl border border-[rgba(209,199,189,0.6)] bg-white/50 p-3 shadow-sm backdrop-blur-sm">
                  <p className="text-xl font-black text-foreground">WCAG AA</p>
                  <p className="text-[11px] font-medium text-muted uppercase tracking-wider">Contrast Audited</p>
                </div>
              </m.div>

              <m.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.95, ease: EASE.outExpo }}
                className="mt-8 flex flex-wrap items-center gap-3"
              >
                {status === 'authenticated' ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <PremiumButton href="/dashboard" size="lg">
                      Enter Dashboard
                      <ArrowRight className="size-4" />
                    </PremiumButton>
                    <PremiumButton href="/events" variant="glass" size="lg">
                      Browse Events
                    </PremiumButton>
                  </div>
                ) : (
                  <>
                    <PremiumButton href="/login" size="lg">
                      Get Started Free
                      <ArrowRight className="size-4" />
                    </PremiumButton>
                    <PremiumButton href="/events" variant="glass" size="lg">
                      Browse Events
                    </PremiumButton>
                    <PremiumButton href="#flow" variant="glass" size="lg">
                      How Arena Works
                    </PremiumButton>
                  </>
                )}
              </m.div>

              <m.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 1.1 }}
                className="mt-5 text-xs text-muted"
              >
                Education & Student Networking &bull; Team Ghost &bull; GL Bajaj Group of Institutions, Mathura
              </m.p>
            </div>

            <div className="lg:col-span-5">
              <HeroVisual />
            </div>
          </div>

          <ScrollHint />
        </section>

        {/* ─────────────── PROBLEM STATEMENT & PROPOSED SOLUTION SPOTLIGHT ─────────────── */}
        <Section id="problem-statement" tone="mist" rhythm="spacious" pattern="dots">
          <Container width="wide">
            <Reveal className="max-w-3xl">
              <span className="text-label uppercase text-primary font-bold tracking-widest">
                Arena: Proposed Solution &bull; ELU04
              </span>
              <h2 className="mt-3 text-heading text-foreground font-extrabold">
                Built specifically for Student Skill & Team Finder.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted">
                Standard hackathon portals act as static directories. Arena transforms campus team formation with org-first isolation, automatic skill-gap discovery, compliance with mandatory female seat rules, and verified faculty mentor matching.
              </p>
            </Reveal>

            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: School,
                  title: 'Multi-Tenant B2B Isolation',
                  desc: 'Colleges list public or private hackathons. Each institution is strictly partitioned by custom college access codes.',
                },
                {
                  icon: Sparkles,
                  title: 'Live Skill-Gap Banners',
                  desc: 'Teams immediately see who they still need on their roster (e.g. "Missing: Frontend Dev, UI/UX") to build winning squads.',
                },
                {
                  icon: ShieldCheck,
                  title: 'Rule-Aware Seat Reservation',
                  desc: 'Automatically enforces hackathon regulations — including locking the 6th seat exclusively for a female member when a team has 5 members and 0 females.',
                },
                {
                  icon: Lock,
                  title: 'Privacy by Design (DPDP Act)',
                  desc: 'Student roll numbers and personal phone numbers stay masked in public discovery to prevent spam and identity exposure.',
                },
                {
                  icon: BookOpen,
                  title: 'Integrated Mentor Layer',
                  desc: 'Goes beyond a basic team finder. Verified faculty mentors join by domain expertise, and leaders track mentorship load transparently.',
                },
                {
                  icon: Layers,
                  title: '3-Tile Progressive Profiles',
                  desc: 'Fast onboarding in 3 quick tiles: Academic Identity, Technical & Soft Skills, and Problem Statement Track Interests.',
                },
              ].map((card) => (
                <RevealItem key={card.title}>
                  <TiltCard className="h-full">
                    <SpotlightCard className="h-full rounded-3xl">
                      <div className="surface-claymorphic flex h-full flex-col gap-4 p-6 sm:p-7">
                        <span className="flex size-11 items-center justify-center rounded-2xl border border-[rgba(114,56,61,0.2)] bg-[rgba(114,56,61,0.08)] text-primary">
                          <card.icon className="size-5" strokeWidth={1.75} />
                        </span>
                        <h3 className="text-feature text-foreground font-bold">{card.title}</h3>
                        <p className="text-sm leading-relaxed text-muted">{card.desc}</p>
                      </div>
                    </SpotlightCard>
                  </TiltCard>
                </RevealItem>
              ))}
            </div>
          </Container>
        </Section>

        {/* ─────────────── 5-STEP PLATFORM FLOW ─────────────── */}
        <Section id="flow" tone="dune" rhythm="spacious">
          <Container width="wide">
            <Reveal className="max-w-2xl">
              <span className="text-label uppercase text-primary font-bold">Platform Flow</span>
              <h2 className="mt-3 text-heading text-foreground font-extrabold">
                From Campus Event to Winning Team in 5 Steps.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                A seamless pipeline designed for colleges, team leaders, students, and faculty mentors.
              </p>
            </Reveal>

            <RevealGroup stagger={0.08} className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
              {PLATFORM_STEPS.map((s) => (
                <RevealItem key={s.step}>
                  <div className="surface-raised flex h-full flex-col rounded-3xl border border-[rgba(209,199,189,0.7)] p-6 transition-all duration-300 hover:border-primary/40 hover:shadow-md">
                    <div className="flex items-center justify-between pb-4 border-b border-[rgba(209,199,189,0.4)]">
                      <span className="text-xs font-black text-primary font-mono">{s.step}</span>
                      <s.icon className="size-4.5 text-muted" strokeWidth={1.75} />
                    </div>
                    <h4 className="mt-4 text-base font-bold text-foreground">{s.title}</h4>
                    <p className="mt-2 text-xs leading-relaxed text-muted">{s.desc}</p>
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>
          </Container>
        </Section>

        {/* ─────────────── EVENTS DIRECTORY ─────────────── */}
        <Section id="events" tone="mist" rhythm="spacious" pattern="dots">
          <Container width="wide">
            <Reveal className="max-w-2xl">
              <span className="text-label uppercase text-primary font-bold">Campus Competitions</span>
              <h2 className="mt-3 text-heading text-foreground font-extrabold">
                <SplitText text="Active Arenas at GL Bajaj Group of Institutions." as="span" onScroll />
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Each event is an isolated campus arena with its own teams, problem statement tracks, and faculty mentors.
              </p>
            </Reveal>

            <div className="mt-12">
              {eventsLoading ? (
                <div className="grid gap-6 md:grid-cols-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-64 rounded-3xl skeleton-shimmer" />
                  ))}
                </div>
              ) : (
                <RevealGroup stagger={0.1} className="grid gap-6 md:grid-cols-2">
                  {events.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </RevealGroup>
              )}
            </div>
          </Container>
        </Section>

        {/* ─────────────── EXISTING SOLUTIONS VS ARENA MATRIX ─────────────── */}
        <Section tone="quarry" rhythm="spacious" className="overflow-hidden">
          <Container width="wide">
            <Reveal className="max-w-3xl">
              <span className="text-label uppercase text-primary font-bold">Competitive Advantage</span>
              <h2 className="mt-3 text-heading text-foreground font-extrabold">
                Existing Solutions vs. Our Platform (Arena).
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                See why generic recruitment boards and hackathon aggregates fail campus environments, and how Arena provides the complete institutional layer.
              </p>
            </Reveal>

            <div className="mt-12 overflow-x-auto rounded-3xl border border-[rgba(209,199,189,0.7)] bg-white/60 p-2 shadow-sm backdrop-blur-md">
              <table className="w-full min-w-[720px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-[rgba(209,199,189,0.6)] text-xs font-bold uppercase tracking-wider text-muted">
                    <th className="py-4 px-6 text-foreground">Feature / Parameter</th>
                    <th className="py-4 px-4 text-center">Devfolio</th>
                    <th className="py-4 px-4 text-center">HackerEarth</th>
                    <th className="py-4 px-4 text-center">Unstop</th>
                    <th className="py-4 px-4 text-center">LinkedIn</th>
                    <th className="py-4 px-6 text-center bg-primary/10 text-primary font-extrabold rounded-t-2xl">
                      Arena (Our Platform)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(209,199,189,0.4)] text-sm">
                  {COMPARISON_ROWS.map((row, idx) => (
                    <tr key={idx} className="transition-colors hover:bg-white/40">
                      <td className="py-3.5 px-6 font-medium text-foreground text-xs sm:text-sm">
                        {row.feature}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {row.devfolio === true ? (
                          <Check className="size-4 text-emerald-600 inline" />
                        ) : (
                          <X className="size-4 text-rose-500 inline" />
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {row.hackerearth === true ? (
                          <Check className="size-4 text-emerald-600 inline" />
                        ) : (
                          <X className="size-4 text-rose-500 inline" />
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {row.unstop === true ? (
                          <Check className="size-4 text-emerald-600 inline" />
                        ) : row.unstop === 'partial' ? (
                          <span className="text-[11px] font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-full">
                            Partial
                          </span>
                        ) : (
                          <X className="size-4 text-rose-500 inline" />
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {row.linkedin === true ? (
                          <Check className="size-4 text-emerald-600 inline" />
                        ) : (
                          <X className="size-4 text-rose-500 inline" />
                        )}
                      </td>
                      <td className="py-3.5 px-6 text-center bg-primary/5 font-bold text-primary">
                        <Check className="size-5 text-primary inline stroke-[2.5]" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Container>
        </Section>

        {/* ─────────────── TECHNICAL ARCHITECTURE & ROADMAP ─────────────── */}
        <Section tone="dune" rhythm="spacious">
          <Container width="wide">
            <Reveal className="max-w-2xl">
              <span className="text-label uppercase text-primary font-bold">System Architecture</span>
              <h2 className="mt-3 text-heading text-foreground font-extrabold">
                Engineered for High-Performance & Security.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Role-aware execution pipeline tested with 69 unit tests and production benchmarks.
              </p>
            </Reveal>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              <div className="surface-raised rounded-3xl border border-[rgba(209,199,189,0.7)] p-6 sm:p-7">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-[rgba(114,56,61,0.08)] text-primary mb-5">
                  <Cpu className="size-5.5" strokeWidth={1.75} />
                </div>
                <h3 className="text-feature font-bold text-foreground">Client Layer</h3>
                <ul className="mt-4 space-y-2.5 text-xs text-body leading-relaxed">
                  <li className="flex items-center gap-2">
                    <Check className="size-3.5 text-primary shrink-0" />
                    Next.js 16 App Router &amp; React 19
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-3.5 text-primary shrink-0" />
                    Role-Aware Staged Dashboards (&lt;100ms)
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-3.5 text-primary shrink-0" />
                    GSAP Motion &amp; Lenis Smooth Scrolling
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-3.5 text-primary shrink-0" />
                    In-flight Request Deduplication Client
                  </li>
                </ul>
              </div>

              <div className="surface-raised rounded-3xl border border-[rgba(209,199,189,0.7)] p-6 sm:p-7">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-[rgba(114,56,61,0.08)] text-primary mb-5">
                  <ShieldCheck className="size-5.5" strokeWidth={1.75} />
                </div>
                <h3 className="text-feature font-bold text-foreground">API &amp; Security Layer</h3>
                <ul className="mt-4 space-y-2.5 text-xs text-body leading-relaxed">
                  <li className="flex items-center gap-2">
                    <Check className="size-3.5 text-primary shrink-0" />
                    Rate-Limited REST Endpoints (120 req/min)
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-3.5 text-primary shrink-0" />
                    401 / 403 Role Authorization Gateways
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-3.5 text-primary shrink-0" />
                    Binary Avatar Streaming (&gt;99% Payload Cut)
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-3.5 text-primary shrink-0" />
                    DPDP Act Privacy: Masked Roll Numbers &amp; Phones
                  </li>
                </ul>
              </div>

              <div className="surface-raised rounded-3xl border border-[rgba(209,199,189,0.7)] p-6 sm:p-7">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-[rgba(114,56,61,0.08)] text-primary mb-5">
                  <Layers className="size-5.5" strokeWidth={1.75} />
                </div>
                <h3 className="text-feature font-bold text-foreground">Data &amp; Database Layer</h3>
                <ul className="mt-4 space-y-2.5 text-xs text-body leading-relaxed">
                  <li className="flex items-center gap-2">
                    <Check className="size-3.5 text-primary shrink-0" />
                    Prisma ORM 6.19 with Supabase PostgreSQL
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-3.5 text-primary shrink-0" />
                    1 Compound Join Query per Search Route
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-3.5 text-primary shrink-0" />
                    Strict Bounded 24-Row Pagination
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-3.5 text-primary shrink-0" />
                    Immutable Team Code Reservation Ledger
                  </li>
                </ul>
              </div>
            </div>

            {/* AI Roadmap Banner */}
            <div className="mt-8 rounded-2xl border border-[rgba(114,56,61,0.25)] bg-[rgba(114,56,61,0.06)] p-5 sm:p-6 text-sm text-foreground flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-on-accent shrink-0">
                  <Zap className="size-4" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground">Next Release Roadmap: Claude-Powered Intelligence</h4>
                  <p className="text-xs text-muted mt-0.5">Automated skill-gap matchmaking, team synergy scoring, and AI profile-assistant agents.</p>
                </div>
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary border border-primary/30 px-3 py-1 rounded-full whitespace-nowrap bg-white/50">
                In Pipeline
              </span>
            </div>
          </Container>
        </Section>

        {/* ─────────────── IMPACT & FEASIBILITY ─────────────── */}
        <Section tone="mist" rhythm="spacious">
          <Container width="wide">
            <Reveal className="max-w-2xl">
              <span className="text-label uppercase text-primary font-bold">Impact &amp; Viability</span>
              <h2 className="mt-3 text-heading text-foreground font-extrabold">
                Measurable Impact Across Campus.
              </h2>
            </Reveal>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              <div className="surface-claymorphic rounded-3xl p-6 sm:p-7">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Social Impact</span>
                <h4 className="mt-2 text-lg font-bold text-foreground">Equitable Opportunities</h4>
                <ul className="mt-4 space-y-2.5 text-xs text-muted leading-relaxed">
                  <li>&bull; Every student finds a team by merit and technical skill, not luck or popularity.</li>
                  <li>&bull; Ends the chaotic WhatsApp &amp; hallway "who do I ask?" hunt.</li>
                  <li>&bull; Built-in female seat reservation champions campus gender diversity.</li>
                  <li>&bull; First-year and non-CS students connect with experienced seniors seamlessly.</li>
                </ul>
              </div>

              <div className="surface-claymorphic rounded-3xl p-6 sm:p-7">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Institutional Impact</span>
                <h4 className="mt-2 text-lg font-bold text-foreground">Zero-Overhead College Ops</h4>
                <ul className="mt-4 space-y-2.5 text-xs text-muted leading-relaxed">
                  <li>&bull; Single unified administrative console for all college hackathons and fests.</li>
                  <li>&bull; Real-time visibility into team formation completeness and student participation.</li>
                  <li>&bull; Faculty mentorship capacity tracking prevents professor burnout.</li>
                  <li>&bull; Exportable rosters formatted directly for official hackathon submission.</li>
                </ul>
              </div>

              <div className="surface-claymorphic rounded-3xl p-6 sm:p-7">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Macro &amp; Economic</span>
                <h4 className="mt-2 text-lg font-bold text-foreground">Scalable B2B Model</h4>
                <ul className="mt-4 space-y-2.5 text-xs text-muted leading-relaxed">
                  <li>&bull; Replaces error-prone Google Sheets and disconnected chat groups.</li>
                  <li>&bull; Multi-tenant architecture allows rapid replication across partner colleges.</li>
                  <li>&bull; Directly supports UN Sustainable Development Goal 4 (Quality Education).</li>
                  <li>&bull; Lays the foundation for an inter-college cross-campus skill graph.</li>
                </ul>
              </div>
            </div>

            {/* Go-To-Market Roadmap */}
            <div className="mt-10 rounded-3xl border border-[rgba(209,199,189,0.7)] bg-white/40 p-6 sm:p-8">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Go-To-Market Execution</span>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-[rgba(209,199,189,0.5)] bg-white/70 p-4">
                  <p className="text-xs font-bold text-primary uppercase">Stage 1: Pilot</p>
                  <p className="text-base font-bold text-foreground mt-1">GL Bajaj Mathura</p>
                  <p className="text-xs text-muted mt-1">Full rollout for Hustle Carnival 2026 &amp; SIH internal round.</p>
                </div>
                <div className="rounded-2xl border border-[rgba(209,199,189,0.5)] bg-white/70 p-4">
                  <p className="text-xs font-bold text-primary uppercase">Stage 2: Scale</p>
                  <p className="text-base font-bold text-foreground mt-1">Partner Colleges</p>
                  <p className="text-xs text-muted mt-1">B2B access-code onboarding for affiliated technical institutions.</p>
                </div>
                <div className="rounded-2xl border border-[rgba(209,199,189,0.5)] bg-white/70 p-4">
                  <p className="text-xs font-bold text-primary uppercase">Stage 3: Expand</p>
                  <p className="text-base font-bold text-foreground mt-1">Campus Fests &amp; Clubs</p>
                  <p className="text-xs text-muted mt-1">Self-serve event creation for department hackathons and coding clubs.</p>
                </div>
              </div>
            </div>
          </Container>
        </Section>

        {/* ─────────────── CTA ─────────────── */}
        <Section tone="ember" rhythm="spacious" className="overflow-hidden">
          <Aurora variant="rose" spotlight={false} />
          <Container width="narrow" className="relative text-center">
            <Reveal scale>
              <h2 className="text-heading text-foreground font-extrabold">
                Ready to find your team and
                <span className="text-gradient-luxe"> enter the arena?</span>
              </h2>
              <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-muted">
                Register, set up your 3-tile skill profile, and join the flagship Hustle Carnival 2026 buildathon and campus hackathons.
              </p>
              <div className="mt-9 flex flex-wrap justify-center gap-3">
                {status === 'authenticated' ? (
                  <PremiumButton href="/dashboard" size="lg">
                    Go to Dashboard
                  </PremiumButton>
                ) : (
                  <PremiumButton href="/login" size="lg">
                    Get Started Free
                  </PremiumButton>
                )}
                <PremiumButton href="/events" variant="glass" size="lg">
                  Browse Events
                </PremiumButton>
                <PremiumButton href="/team-formation/browse-teammates" variant="glass" size="lg">
                  Browse Teammates
                </PremiumButton>
              </div>
            </Reveal>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}