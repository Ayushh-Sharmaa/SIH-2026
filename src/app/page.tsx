'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, m, useScroll, useTransform } from 'framer-motion';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Aurora from '@/components/motion/Aurora';
import ParticleField from '@/components/motion/ParticleField';
import SpotlightCard from '@/components/motion/SpotlightCard';
import Reveal, { RevealGroup, RevealItem } from '@/components/motion/Reveal';
import SplitText from '@/components/motion/SplitText';
import PremiumButton from '@/components/motion/PremiumButton';
import { useSession } from '@/lib/session';
import Counter from '@/components/motion/Counter';
import { TiltCard } from '@/components/motion/Magnetic';
import { EASE, SPRING } from '@/components/motion/tokens';
import { usePrefersReducedMotion } from '@/components/motion/useReducedMotion';
import { ALL_18_THEME_SETS, FAQS, SIH_MILESTONES } from '@/lib/content';
import { FaqStructuredData } from '@/components/seo/StructuredData';
import { Container, Section } from '@/components/ui';
import MilestoneIcon from '@/components/MilestoneIcon';

const TOP_STATS = [
  { value: 18, suffix: '', label: 'Official Themes' },
  { value: 11, suffix: '', label: 'Timeline Phases' },
  { value: 6, suffix: '', label: 'Members per Team' },
  { value: 36, suffix: 'h', label: 'Grand Finale' },
];

const HIGHLIGHTS = [
  {
    title: 'Form the right team',
    desc: 'Browse students by track and skill, spot the gaps in your roster, and invite the people who close them.',
    href: '/team-formation/find-teammates',
    cta: 'Find teammates',
    path: 'M17 20h5v-2a3 3 0 0 0-5.36-1.9M17 20H7m10 0v-2c0-.7-.12-1.36-.36-1.9m0 0A5 5 0 0 0 7.36 16.1M7 20H2v-2a3 3 0 0 1 5.36-1.9M7 20v-2c0-.7.12-1.36.36-1.9m0 0a5 5 0 0 1 9.28 0M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM7 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z',
  },
  {
    title: 'Match with mentors',
    desc: 'Verified faculty mentors, filterable by domain. Send a request and track its status from your dashboard.',
    href: '/team-formation/find-mentors',
    cta: 'Find mentors',
    path: 'M12 14l9-5-9-5-9 5 9 5Zm0 0 6.16-3.42a12.08 12.08 0 0 1 .66 6.48A11.95 11.95 0 0 0 12 20.05a11.95 11.95 0 0 0-6.82-3A12.08 12.08 0 0 1 5.84 10.6L12 14Z',
  },
  {
    title: 'Track every phase',
    desc: 'All eleven official SIH milestones in one timeline, from SPOC registration through to the grand finale.',
    href: '/tracks',
    cta: 'Explore tracks',
    path: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
  },
];

function ScrollHint() {
  return (
    <m.a
      href="#highlights"
      aria-label="Scroll to content"
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

/** Floating glass panel that assembles as the hero scrolls. */
function HeroVisual() {
  const reduced = usePrefersReducedMotion();

  return (
    <div className="relative mx-auto flex aspect-square w-full max-w-[26rem] items-center justify-center">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="absolute inset-6 rounded-full bg-[radial-gradient(circle,rgba(172,156,141,0.45),transparent_66%)] blur-2xl"
      />

      {/* Outer orbit ring — slow clockwise */}
      <m.div
        aria-hidden
        className="absolute inset-2 rounded-full border border-dashed border-[rgba(172,156,141,0.55)]"
        animate={reduced ? undefined : { rotate: 360 }}
        transition={{ duration: 48, repeat: Infinity, ease: 'linear' }}
      />
      {/* Middle orbit ring — counter-clockwise */}
      <m.div
        aria-hidden
        className="absolute inset-[18%] rounded-full border border-[rgba(114,56,61,0.22)]"
        animate={reduced ? undefined : { rotate: -360 }}
        transition={{ duration: 32, repeat: Infinity, ease: 'linear' }}
      />
      {/* Inner orbit ring — fast clockwise, accent tinted */}
      <m.div
        aria-hidden
        className="absolute inset-[34%] rounded-full border border-dotted border-[rgba(114,56,61,0.38)]"
        animate={reduced ? undefined : { rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
      />

      {/* Core crest card */}
      <m.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.35, ease: EASE.outExpo }}
        className="relative flex size-40 items-center justify-center surface-spatial"
      >
        <m.div
          animate={reduced ? undefined : { y: [0, -8, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Image
            src="/Logo/GL-BAJAJ-LOGO-3.png"
            alt="GL Bajaj Group of Institutions crest"
            width={92}
            height={92}
            className="object-contain"
            priority
          />
        </m.div>
      </m.div>

      {/* Orbiting satellite chips */}
      {[
        { label: 'Teams', top: '4%', left: '50%', delay: 0.7 },
        { label: 'Mentors', top: '48%', left: '-2%', delay: 0.85 },
        { label: 'Tracks', top: '78%', left: '76%', delay: 1 },
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
            animate={reduced ? undefined : { y: [0, -5, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: chip.delay }}
          >
            {chip.label}
          </m.span>
        </m.span>
      ))}

      {/* Live pulse indicator — top-right of the orbit area */}
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

function FaqItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(index === 0);

  return (
    <RevealItem>
      <div
        className={`overflow-hidden transition-colors duration-300 surface-minimalist`}
      >
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6 sm:py-5"
        >
          <span className="text-sm font-bold text-foreground sm:text-base">{q}</span>
          <m.span
            animate={{ rotate: open ? 45 : 0 }}
            transition={{ duration: 0.3, ease: EASE.outExpo }}
            className="flex size-7 shrink-0 items-center justify-center rounded-full border border-[rgba(172,156,141,0.6)] text-primary"
          >
            <svg viewBox="0 0 24 24" fill="none" className="size-3.5">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
          </m.span>
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <m.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: EASE.outExpo }}
              className="overflow-hidden"
            >
              <p className="px-5 pb-5 text-sm leading-relaxed text-muted sm:px-6 sm:pb-6">{a}</p>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </RevealItem>
  );
}

export default function Home() {
  const { status } = useSession();
  const [activeSet, setActiveSet] = useState(0);
  const [activePhase, setActivePhase] = useState(0);
  const [liveStats, setLiveStats] = useState<{
    totalParticipants: number;
    teamsCount: number;
    maleParticipants: number;
    femaleParticipants: number;
    allFemaleTeams: number;
  } | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/statistics');
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (active) {
          setLiveStats(data);
          setStatsLoading(false);
        }
      } catch {
        if (active) {
          setStatsError(true);
          setStatsLoading(false);
        }
      }
    };
    fetchStats();
    return () => {
      active = false;
    };
  }, []);

  const bottomStats = [
    { value: liveStats?.totalParticipants ?? 0, suffix: '', label: 'Total Participants Registered' },
    { value: liveStats?.teamsCount ?? 0, suffix: '', label: 'Teams Registered' },
    { value: liveStats?.maleParticipants ?? 0, suffix: '', label: 'Male Participants' },
    { value: liveStats?.femaleParticipants ?? 0, suffix: '', label: 'Female Participants' },
    { value: liveStats?.allFemaleTeams ?? 0, suffix: '', label: 'All-Female Teams' },
  ];
  const heroRef = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const heroFade = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  const phase = SIH_MILESTONES[activePhase];
  const marqueeItems = ALL_18_THEME_SETS.flatMap((s) => s.themes.map((t) => t.name));

  return (
    <>
      <Navbar overlay />

      <main id="main" className="flex-1">
        {/* ─────────────── HERO ─────────────── */}
        {/* Stays a raw <section> rather than <Section>: it needs a ref for the
            scroll-parallax transform, and its own full-viewport sizing.
            Top padding is derived from --nav-h so it clears the fixed bar by a
            fixed margin instead of the previous magic pt-28 / pb-24 pair. */}
        <section
          ref={heroRef}
          className="atmos-dawn relative flex min-h-[100svh] items-center overflow-hidden pb-section-compact pt-[calc(var(--nav-h)+2.5rem)]"
        >
          <Aurora variant="warm" spotlight />
          {/* GPU particle network — composites at multiply so it blends into the warm canvas */}
          <ParticleField className="z-decor" />
          <div aria-hidden className="pointer-events-none absolute inset-0 z-decor grid-lines" />

          <m.div
            style={reduced ? undefined : { y: heroY, opacity: heroFade }}
            className="relative z-content mx-auto grid w-full max-w-wide grid-cols-1 items-center gap-14 px-gutter lg:grid-cols-12 lg:gap-8"
          >
            <div className="lg:col-span-7">
              <m.span
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: EASE.outExpo }}
                className="inline-flex items-center gap-2 rounded-full border border-[rgba(114,56,61,0.2)] bg-[rgba(255,255,255,0.6)] px-3.5 py-1.5 text-label uppercase text-primary backdrop-blur-md"
              >
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
                </span>
                Internal Hackathon Portal · 2026
              </m.span>

              <h1 className="mt-7 text-display text-foreground">
                {/* Word mode: large confident motion — whole word feel */}
                <SplitText text="Great teams" as="span" mode="word" delay={0.15} />
                <br />
                {/* Char mode: per-character 3D reveal with sweeping color gradient */}
                <SplitText
                  text="start here."
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
                mentors — the official Smart India Hackathon portal of GL Bajaj Group of
                Institutions, Mathura.
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
                      <path
                        d="M5 12h14m-6-6 6 6-6 6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </PremiumButton>
                ) : (
                  <>
                    <PremiumButton href="/signup" size="lg">
                      Create your account
                      <svg viewBox="0 0 24 24" fill="none" className="size-4">
                        <path
                          d="M5 12h14m-6-6 6 6-6 6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </PremiumButton>
                    <PremiumButton href="/login" variant="glass" size="lg">
                      Enter portal
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
                Official problem statements are released closer to the event. All 18 themes are
                already configured here.
              </m.p>
            </div>

            <div className="lg:col-span-5">
              <HeroVisual />
            </div>
          </m.div>

          <ScrollHint />
        </section>

        {/* ─────────────── MARQUEE ─────────────── */}
        {/* A deliberate hairline band between two tall sections. Kept as a raw
            <section> because it is a full-bleed rule, not a content section —
            giving it Section's rhythm would defeat the purpose. */}
        <section
          aria-label="Official SIH theme names"
          className="relative overflow-hidden border-y border-line bg-pearl/35 py-5"
        >
          <div className="marquee-root marquee-mask">
            <div className="marquee-track" style={{ ['--marquee-duration' as string]: '52s' }}>
              {[0, 1].map((copy) => (
                <div key={copy} className="flex shrink-0 items-center" aria-hidden={copy === 1}>
                  {marqueeItems.map((name) => (
                    <span key={`${copy}-${name}`} className="flex items-center whitespace-nowrap">
                      <span className="px-6 text-label uppercase text-muted">
                        {name}
                      </span>
                      <span className="size-1 rounded-full bg-[rgba(172,156,141,0.7)]" />
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─────────────── HIGHLIGHTS ─────────────── */}
        <Section id="highlights" tone="mist" rhythm="spacious" pattern="dots">
          <Container width="wide">
            <Reveal className="max-w-2xl">
              <span className="text-label uppercase text-primary">
                What you get
              </span>
              <h2 className="mt-4 text-heading text-foreground">
                <SplitText
                  text="Everything the internal round demands, in one place."
                  as="span"
                  onScroll
                />
              </h2>
            </Reveal>

            <RevealGroup stagger={0.1} className="mt-14 grid gap-6 md:grid-cols-3">
              {HIGHLIGHTS.map((item) => (
                <RevealItem key={item.title}>
                  <TiltCard className="h-full">
                    {/* SpotlightCard adds a cursor-tracked radial highlight over the card surface */}
                    <SpotlightCard className="h-full rounded-3xl">
                      <a
                        href={item.href}
                        className="surface-claymorphic group relative flex h-full flex-col gap-4 overflow-hidden p-5 sm:p-7 transition-shadow duration-400"
                      >
                        <span className="flex size-12 items-center justify-center rounded-2xl border border-[rgba(114,56,61,0.18)] bg-[rgba(114,56,61,0.07)] text-primary transition-transform duration-400 group-hover:scale-105">
                          <svg viewBox="0 0 24 24" fill="none" className="size-5">
                            <path
                              d={item.path}
                              stroke="currentColor"
                              strokeWidth="1.7"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                        <h3 className="text-feature text-foreground">
                          {item.title}
                        </h3>
                        <p className="text-sm leading-relaxed text-muted">{item.desc}</p>
                        <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-label uppercase text-primary">
                          {item.cta}
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            className="size-3.5 transition-transform duration-300 group-hover:translate-x-1"
                          >
                            <path
                              d="M5 12h14m-6-6 6 6-6 6"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                      </a>
                    </SpotlightCard>
                  </TiltCard>
                </RevealItem>
              ))}
            </RevealGroup>
          </Container>
        </Section>

        {/* ─────────────── STATS ─────────────── */}
        {/* Compact against the spacious sections either side — the rhythm change
            is what stops the page reading as one long uniform column. */}
        <Section tone="dune" rhythm="compact" className="overflow-hidden">
          <Container width="wide" className="space-y-12">
            {/* Top Row: 4 Stats */}
            <RevealGroup
              stagger={0.08}
              className="flex flex-wrap justify-center gap-x-12 gap-y-8 md:gap-x-16"
            >
              {TOP_STATS.map((stat) => (
                <RevealItem key={stat.label} className="w-[45%] sm:w-[20%] text-center min-w-[140px]">
                  <p className="text-4xl font-extrabold tracking-[-0.03em] text-primary sm:text-5xl">
                    <Counter to={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="mt-2.5 text-[10px] font-black uppercase tracking-wider text-muted">
                    {stat.label}
                  </p>
                </RevealItem>
              ))}
            </RevealGroup>

            {/* Separator Line */}
            <div className="surface-maximalist max-w-4xl mx-auto my-6" />

            {/* Bottom Row: 5 Live Stats */}
            <RevealGroup
              stagger={0.08}
              className="flex flex-wrap justify-center gap-x-10 gap-y-8 md:gap-x-14"
            >
              {bottomStats.map((stat) => (
                <RevealItem key={stat.label} className="w-[45%] sm:w-[16%] text-center min-w-[130px]">
                  <p className="text-4xl font-extrabold tracking-[-0.03em] text-primary sm:text-5xl flex items-center justify-center min-h-[2.5rem] sm:min-h-[3rem]">
                    {statsLoading ? (
                      <span className="h-9 w-16 rounded-xl bg-primary/8 animate-pulse inline-block" />
                    ) : statsError ? (
                      <span>N/A</span>
                    ) : (
                      <Counter to={stat.value} suffix={stat.suffix} />
                    )}
                  </p>
                  <p className="mt-2.5 text-[10px] font-black uppercase tracking-wider text-muted">
                    {stat.label}
                  </p>
                </RevealItem>
              ))}
            </RevealGroup>
          </Container>
        </Section>

        {/* ─────────────── TIMELINE ─────────────── */}
        <Section tone="linen" rhythm="default" pattern="grid">
          <Container width="wide">
            <Reveal className="max-w-2xl">
              <span className="text-label uppercase text-primary">
                Milestone roadmap
              </span>
              <h2 className="mt-4 text-heading text-foreground">
                The road to the Grand Finale
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted">
                Eleven official phases, from SPOC registration in June through to the 36-hour
                national finale in December.
              </p>
            </Reveal>

            <div className="mt-14 grid gap-8 lg:grid-cols-12">
              <Reveal direction="right" className="lg:col-span-5">
                <div className="flex max-h-[30rem] flex-col gap-1.5 overflow-y-auto pr-2" data-lenis-prevent>
                  {SIH_MILESTONES.map((milestone, i) => {
                    const isActive = i === activePhase;
                    return (
                      <button
                        key={milestone.id}
                        onClick={() => setActivePhase(i)}
                        aria-current={isActive}
                        className="relative flex items-center gap-3.5 rounded-xl px-4 py-3 text-left transition-colors duration-250"
                      >
                        {isActive && (
                          <m.span
                            layoutId="phasePill"
                            transition={SPRING.snappy}
                            className="absolute inset-0 surface-skeuomorphic"
                          />
                        )}
                        <span
                          className={`relative z-10 flex size-8 shrink-0 items-center justify-center rounded-lg border text-caption font-bold transition-colors duration-250 ${
                            isActive
                              ? 'border-[rgba(114,56,61,0.3)] bg-[rgba(114,56,61,0.1)] text-primary'
                              : 'border-[rgba(209,199,189,0.7)] bg-white/40 text-muted'
                          }`}
                        >
                          {String(milestone.id).padStart(2, '0')}
                        </span>
                        <span className="relative z-10 flex min-w-0 flex-col">
                          <span
                            className={`truncate text-sm font-bold transition-colors duration-250 ${
                              isActive ? 'text-foreground' : 'text-muted'
                            }`}
                          >
                            {milestone.title}
                          </span>
                          <span className="text-label uppercase text-muted">
                            {milestone.period}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Reveal>

              <Reveal direction="left" delay={0.1} className="lg:col-span-7">
                <div className="surface-liquid-glass relative min-h-[19rem] overflow-hidden p-5 sm:p-8">
                  <AnimatePresence mode="wait">
                    <m.div
                      key={phase.id}
                      initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, y: -12, filter: 'blur(6px)' }}
                      transition={{ duration: 0.4, ease: EASE.outExpo }}
                    >
                      <div className="flex items-center gap-3.5">
                        <span className="flex size-12 items-center justify-center rounded-2xl border border-[rgba(114,56,61,0.18)] bg-[rgba(114,56,61,0.07)] text-primary">
                          <MilestoneIcon id={phase.id} className="size-5" />
                        </span>
                        <div>
                          <span className="text-label uppercase text-primary">
                            {phase.phase}
                          </span>
                          <h3 className="text-feature text-foreground">
                            {phase.title}
                          </h3>
                        </div>
                      </div>

                      <p className="mt-6 text-sm leading-relaxed text-muted">{phase.desc}</p>

                      <div className="surface-sunken mt-7 flex items-center justify-between rounded-xl px-4 py-3">
                        <span className="text-xs text-muted">
                          Expected&nbsp;
                          <strong className="font-bold text-foreground">{phase.period}</strong>
                        </span>
                        <span className="text-label uppercase text-primary">
                          Phase {phase.id} / {SIH_MILESTONES.length}
                        </span>
                      </div>

                      <div className="mt-4 h-1 overflow-hidden rounded-full bg-[rgba(172,156,141,0.25)]">
                        <m.div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-[#ac9c8d]"
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: (activePhase + 1) / SIH_MILESTONES.length }}
                          transition={{ duration: 0.6, ease: EASE.outExpo }}
                          style={{ transformOrigin: 'left' }}
                        />
                      </div>
                    </m.div>
                  </AnimatePresence>
                </div>
              </Reveal>
            </div>
          </Container>
        </Section>

        {/* ─────────────── THEMES ─────────────── */}
        <Section tone="vellum" rhythm="spacious" className="overflow-hidden">
          <Aurora variant="taupe" spotlight={false} />

          <Container width="wide" className="relative">
            <Reveal className="max-w-2xl">
              <span className="text-label uppercase text-primary">
                Themes &amp; domains
              </span>
              <h2 className="mt-4 text-heading text-foreground">
                All 18 official SIH tracks
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted">
                Ministry-defined themes spanning health, agriculture, space, security, and more.
                Pick a direction before the statements drop.
              </p>
            </Reveal>

            <div className="mt-14 grid gap-8 lg:grid-cols-12">
              <div className="flex flex-col gap-2 lg:col-span-4">
                {ALL_18_THEME_SETS.map((set, i) => {
                  const isActive = i === activeSet;
                  return (
                    <button
                      key={set.id}
                      onClick={() => setActiveSet(i)}
                      aria-current={isActive}
                      className={`group relative flex items-center justify-between gap-3 overflow-hidden text-left transition-all duration-300 surface-brutalist`}
                    >
                      <span
                        className={`truncate text-sm font-bold transition-colors ${
                          isActive ? 'text-foreground' : 'text-muted'
                        }`}
                      >
                        {set.title}
                      </span>
                      <span
                        className={`shrink-0 rounded-full border px-2.5 py-1 text-label uppercase transition-colors ${
                          isActive
                            ? 'border-[rgba(114,56,61,0.3)] bg-[rgba(114,56,61,0.1)] text-primary'
                            : 'border-[rgba(209,199,189,0.8)] text-muted'
                        }`}
                      >
                        Set {String(set.id).padStart(2, '0')}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="lg:col-span-8">
                <AnimatePresence mode="wait">
                  <m.div
                    key={activeSet}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
                    variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
                    className="grid gap-5 sm:grid-cols-3"
                  >
                    {ALL_18_THEME_SETS[activeSet].themes.map((theme, i) => (
                      <m.article
                        key={theme.name}
                        variants={{
                          hidden: { opacity: 0, y: 24, filter: 'blur(8px)' },
                          visible: {
                            opacity: 1,
                            y: 0,
                            filter: 'blur(0px)',
                            transition: { duration: 0.5, ease: EASE.outExpo },
                          },
                        }}
                      >
                        <TiltCard className="h-full" intensity={5}>
                          <SpotlightCard className="h-full rounded-2xl">
                            <div className="surface-liquid-glass flex h-full min-h-[13rem] flex-col justify-between overflow-hidden p-5 sm:p-6">
                              <div>
                                <span className="font-mono text-label uppercase text-primary">
                                  Theme {String(i + 1).padStart(2, '0')}
                                </span>
                                <h3 className="mt-2.5 text-feature text-foreground">
                                  {theme.name}
                                </h3>
                              </div>
                              <p className="mt-4 line-clamp-4 text-xs leading-relaxed text-body">
                                {theme.desc}
                              </p>
                            </div>
                          </SpotlightCard>
                        </TiltCard>
                      </m.article>
                    ))}
                  </m.div>
                </AnimatePresence>
              </div>
            </div>
          </Container>
        </Section>

        {/* ─────────────── FAQ ─────────────── */}
        {/* Generated from the same FAQS constant the section renders below, so
            the rich result can never drift from the visible content. */}
        <FaqStructuredData />
        <Section tone="slate" rhythm="default">
          <Container width="wide" className="grid gap-12 lg:grid-cols-12">
            <Reveal className="lg:col-span-4">
              <span className="text-label uppercase text-primary">
                Questions
              </span>
              <h2 className="mt-4 text-heading text-foreground">
                Before you register
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted">
                Still unsure about something? Reach out to the SIH cell at GL Bajaj and we will
                get back to you.
              </p>
            </Reveal>

            <RevealGroup stagger={0.07} className="flex flex-col gap-3 lg:col-span-8">
              {FAQS.map((faq, i) => (
                <FaqItem key={faq.q} q={faq.q} a={faq.a} index={i} />
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
                to the Grand Finale.
              </p>
              <div className="mt-9 flex flex-wrap justify-center gap-3">
                {status === 'authenticated' ? (
                  <PremiumButton href="/dashboard" size="lg">
                    Go to Dashboard
                  </PremiumButton>
                ) : (
                  <PremiumButton href="/signup" size="lg">
                    Get started
                  </PremiumButton>
                )}
                <PremiumButton href="/tracks" variant="glass" size="lg">
                  Browse tracks
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
