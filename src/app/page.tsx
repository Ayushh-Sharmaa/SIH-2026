'use client';

import { Suspense, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, m } from 'framer-motion';
import { ShieldAlert, Calendar, ArrowRight, Sparkles, Users, BookOpen, Trophy, School, UserCheck } from 'lucide-react';

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
      href="#events"
      aria-label="Scroll to events"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.6, duration: 0.8 }}
      className="group absolute inset-x-0 bottom-8 z-20 mx-auto flex w-fit flex-col items-center gap-2"
    >
      <span className="text-label uppercase text-muted transition-colors group-hover:text-primary">
        Scroll
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
        className="relative flex size-40 items-center justify-center surface-spatial"
      >
        <m.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Image
            src="/Logo/NexaSphere Icon without Background.png"
            alt="Arena by NexaSphere"
            width={92}
            height={92}
            className="object-contain"
            priority
          />
        </m.div>
      </m.div>
      {[
        { label: 'Teams', top: '4%', left: '50%', delay: 0.7 },
        { label: 'Mentors', top: '48%', left: '-2%', delay: 0.85 },
        { label: 'Events', top: '78%', left: '76%', delay: 1 },
      ].map((chip) => (
        <m.span
          key={chip.label}
          initial={{ opacity: 0, scale: 0.6, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: chip.delay, ease: EASE.outExpo }}
          style={{ top: chip.top, left: chip.left }}
          className="absolute -translate-x-1/2 px-3.5 py-1.5 text-label uppercase text-primary surface-glassmorphic"
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
        className="absolute right-[10%] top-[10%] flex items-center gap-1.5 rounded-full border border-[rgba(114,56,61,0.2)] bg-[rgba(255,255,255,0.75)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-primary shadow-[0_4px_16px_rgba(50,45,41,0.1)] backdrop-blur-md"
      >
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
          <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
        </span>
        Live
      </m.div>
    </div>
  );
}

const PLATFORM_FEATURES = [
  {
    icon: Users,
    title: 'Form the right team',
    desc: 'Browse students by track and skill, spot the gaps in your roster, and invite the people who close them.',
    href: '/team-formation/find-teammates',
    cta: 'Browse teammates',
  },
  {
    icon: BookOpen,
    title: 'Match with mentors',
    desc: 'Verified faculty mentors, filterable by domain. Send a request and track its status from your dashboard.',
    href: '/team-formation/find-mentors',
    cta: 'Browse mentors',
  },
  {
    icon: Trophy,
    title: 'Track every phase',
    desc: 'All official milestones in one timeline, from registration through to the grand finale.',
    href: '/tracks',
    cta: 'Explore tracks',
  },
];

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
            {/* Status chip */}
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
                {event.isActive ? 'Active' : 'Closed'}
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
  const [events, setEvents] = useState<ArenaEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch('/api/events')
      .then((r) => r.json())
      .then((d) => {
        if (active && d.success) setEvents(d.events);
      })
      .catch(() => {})
      .finally(() => { if (active) setEventsLoading(false); });
    return () => { active = false; };
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

              <m.span
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: EASE.outExpo }}
                className="inline-flex items-center gap-2 rounded-full border border-[rgba(114,56,61,0.2)] bg-[rgba(255,255,255,0.6)] px-3.5 py-1.5 text-label uppercase text-primary backdrop-blur-md"
              >
                <Sparkles className="size-3" />
                Arena · Powered by NexaSphere
              </m.span>

              <h1 className="mt-7 text-display text-foreground">
                <SplitText text="Your arena." as="span" mode="word" delay={0.15} />
                <br />
                <SplitText
                  text="Your build."
                  as="span"
                  mode="char"
                  delay={0.42}
                  gradientColors={['#72383d', '#ac9c8d']}
                />
              </h1>

              <m.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.75, ease: EASE.outExpo }}
                className="mt-7 max-w-[52ch] text-base leading-relaxed text-muted sm:text-lg"
              >
                Form balanced teams, close your skill gaps, and match with verified faculty
                mentors — across every hackathon that matters at GL Bajaj Group of Institutions,
                Mathura.
              </m.p>

              <m.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.92, ease: EASE.outExpo }}
                className="mt-9 flex flex-wrap items-center gap-3"
              >
                {status === 'authenticated' ? (
                  <PremiumButton href="/dashboard" size="lg">
                    Go to Dashboard
                    <svg viewBox="0 0 24 24" fill="none" className="size-4">
                      <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </PremiumButton>
                ) : (
                  <>
                    <PremiumButton href="/login" size="lg">
                      Create your account
                      <svg viewBox="0 0 24 24" fill="none" className="size-4">
                        <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </PremiumButton>
                    <PremiumButton href="#events" variant="glass" size="lg">
                      Browse events
                    </PremiumButton>
                  </>
                )}
              </m.div>

              <m.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 1.15 }}
                className="mt-6 text-xs text-muted"
              >
                GL Bajaj&rsquo;s multi-event hackathon platform. Select an event below to get started.
              </m.p>
            </div>

            <div className="lg:col-span-5">
              <HeroVisual />
            </div>
          </div>

          <ScrollHint />
        </section>

        {/* ─────────────── EVENTS ─────────────── */}
        <Section id="events" tone="mist" rhythm="spacious" pattern="dots">
          <Container width="wide">
            <Reveal className="max-w-2xl">
              <span className="text-label uppercase text-primary">Hackathon Events</span>
              <h2 className="mt-4 text-heading text-foreground">
                <SplitText
                  text="Choose your event and start competing."
                  as="span"
                  onScroll
                />
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted">
                Each event is a self-contained hackathon with its own teams, mentors, and
                timeline. Pick one to enter the arena.
              </p>
            </Reveal>

            <div className="mt-14">
              {eventsLoading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-64 rounded-3xl skeleton-shimmer" />
                  ))}
                </div>
              ) : events.length === 0 ? (
                <div className="flex flex-col items-center gap-4 py-16 text-center">
                  <div className="flex size-16 items-center justify-center rounded-2xl border border-[rgba(209,199,189,0.6)] bg-white/40">
                    <Calendar className="size-7 text-muted" />
                  </div>
                  <p className="text-sm text-muted">No active events at the moment. Check back soon.</p>
                </div>
              ) : (
                <RevealGroup stagger={0.1} className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {events.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </RevealGroup>
              )}
            </div>
          </Container>
        </Section>

        {/* ─────────────── PLATFORM FEATURES ─────────────── */}
        <Section tone="dune" rhythm="default">
          <Container width="wide">
            <Reveal className="max-w-2xl">
              <span className="text-label uppercase text-primary">Platform features</span>
              <h2 className="mt-4 text-heading text-foreground">
                Everything a hackathon demands, in one place.
              </h2>
            </Reveal>

            <RevealGroup stagger={0.1} className="mt-14 grid gap-6 md:grid-cols-3">
              {PLATFORM_FEATURES.map((item) => (
                <RevealItem key={item.title}>
                  <TiltCard className="h-full">
                    <SpotlightCard className="h-full rounded-3xl">
                      <Link
                        href={item.href}
                        className="surface-claymorphic group relative flex h-full flex-col gap-4 overflow-hidden p-5 sm:p-7 transition-shadow duration-400"
                      >
                        <span className="flex size-12 items-center justify-center rounded-2xl border border-[rgba(114,56,61,0.18)] bg-[rgba(114,56,61,0.07)] text-primary transition-transform duration-400 group-hover:scale-105">
                          <item.icon className="size-5" strokeWidth={1.75} />
                        </span>
                        <h3 className="text-feature text-foreground">{item.title}</h3>
                        <p className="text-sm leading-relaxed text-muted">{item.desc}</p>
                        <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-label uppercase text-primary">
                          {item.cta}
                          <svg viewBox="0 0 24 24" fill="none" className="size-3.5 transition-transform duration-300 group-hover:translate-x-1">
                            <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      </Link>
                    </SpotlightCard>
                  </TiltCard>
                </RevealItem>
              ))}
            </RevealGroup>
          </Container>
        </Section>

        {/* ─────────────── CTA ─────────────── */}
        <Section tone="ember" rhythm="spacious" className="overflow-hidden">
          <Aurora variant="rose" spotlight={false} />
          <Container width="narrow" className="relative text-center">
            <Reveal scale>
              <h2 className="text-heading text-foreground">
                Ready to build something
                <span className="text-gradient-luxe"> worth shipping?</span>
              </h2>
              <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-muted">
                Register, complete your profile, and start assembling the team that takes GL Bajaj
                all the way.
              </p>
              <div className="mt-9 flex flex-wrap justify-center gap-3">
                {status === 'authenticated' ? (
                  <PremiumButton href="/dashboard" size="lg">
                    Go to Dashboard
                  </PremiumButton>
                ) : (
                  <PremiumButton href="/login" size="lg">
                    Get started
                  </PremiumButton>
                )}
                <PremiumButton href="/events" variant="glass" size="lg">
                  Browse events
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