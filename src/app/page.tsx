'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Aurora from '@/components/motion/Aurora';
import Reveal, { RevealGroup, RevealItem } from '@/components/motion/Reveal';
import SplitText from '@/components/motion/SplitText';
import PremiumButton from '@/components/motion/PremiumButton';
import Counter from '@/components/motion/Counter';
import { TiltCard } from '@/components/motion/Magnetic';
import { EASE, SPRING } from '@/components/motion/tokens';
import { usePrefersReducedMotion } from '@/components/motion/useReducedMotion';
import { ALL_18_THEME_SETS, FAQS, SIH_MILESTONES } from '@/lib/content';
import MilestoneIcon from '@/components/MilestoneIcon';

const STATS = [
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
    <motion.a
      href="#highlights"
      aria-label="Scroll to content"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.6, duration: 0.8 }}
      className="group absolute inset-x-0 bottom-8 z-20 mx-auto flex w-fit flex-col items-center gap-2"
    >
      <span className="text-[9px] font-bold uppercase tracking-[0.24em] text-muted transition-colors group-hover:text-primary">
        Scroll
      </span>
      <span className="flex h-9 w-[22px] justify-center rounded-full border border-[rgba(172,156,141,0.6)] pt-2">
        <span className="scroll-hint-dot block size-1 rounded-full bg-primary" />
      </span>
    </motion.a>
  );
}

/** Floating glass panel that assembles as the hero scrolls. */
function HeroVisual() {
  const reduced = usePrefersReducedMotion();

  return (
    <div className="relative mx-auto flex aspect-square w-full max-w-[26rem] items-center justify-center">
      <div
        aria-hidden
        className="absolute inset-6 rounded-full bg-[radial-gradient(circle,rgba(172,156,141,0.4),transparent_66%)] blur-2xl"
      />

      {/* Orbit rings */}
      <motion.div
        aria-hidden
        className="absolute inset-2 rounded-full border border-dashed border-[rgba(172,156,141,0.55)]"
        animate={reduced ? undefined : { rotate: 360 }}
        transition={{ duration: 48, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        aria-hidden
        className="absolute inset-[18%] rounded-full border border-[rgba(114,56,61,0.22)]"
        animate={reduced ? undefined : { rotate: -360 }}
        transition={{ duration: 32, repeat: Infinity, ease: 'linear' }}
      />

      {/* Core crest */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.35, ease: EASE.outExpo }}
        className="relative flex size-40 items-center justify-center rounded-[2rem] border border-[rgba(209,199,189,0.7)] bg-[rgba(255,255,255,0.62)] shadow-[0_20px_60px_rgba(50,45,41,0.14)] backdrop-blur-xl"
      >
        <motion.div
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
        </motion.div>
      </motion.div>

      {/* Orbiting satellite chips */}
      {[
        { label: 'Teams', top: '4%', left: '50%', delay: 0.7 },
        { label: 'Mentors', top: '48%', left: '-2%', delay: 0.85 },
        { label: 'Tracks', top: '78%', left: '76%', delay: 1 },
      ].map((chip) => (
        <motion.span
          key={chip.label}
          initial={{ opacity: 0, scale: 0.6, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: chip.delay, ease: EASE.outExpo }}
          style={{ top: chip.top, left: chip.left }}
          className="absolute -translate-x-1/2 rounded-full border border-[rgba(209,199,189,0.8)] bg-[rgba(255,255,255,0.8)] px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-primary shadow-[0_6px_20px_rgba(50,45,41,0.1)] backdrop-blur-md"
        >
          <motion.span
            className="block"
            animate={reduced ? undefined : { y: [0, -5, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: chip.delay }}
          >
            {chip.label}
          </motion.span>
        </motion.span>
      ))}
    </div>
  );
}

function FaqItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(index === 0);

  return (
    <RevealItem>
      <div
        className={`gradient-border overflow-hidden rounded-2xl border transition-colors duration-300 ${
          open
            ? 'border-[rgba(114,56,61,0.28)] bg-[rgba(255,255,255,0.7)]'
            : 'border-[rgba(209,199,189,0.6)] bg-[rgba(255,255,255,0.42)] hover:border-[rgba(172,156,141,0.9)]'
        }`}
      >
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6 sm:py-5"
        >
          <span className="text-sm font-bold text-foreground sm:text-base">{q}</span>
          <motion.span
            animate={{ rotate: open ? 45 : 0 }}
            transition={{ duration: 0.3, ease: EASE.outExpo }}
            className="flex size-7 shrink-0 items-center justify-center rounded-full border border-[rgba(172,156,141,0.6)] text-primary"
          >
            <svg viewBox="0 0 24 24" fill="none" className="size-3.5">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
          </motion.span>
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: EASE.outExpo }}
              className="overflow-hidden"
            >
              <p className="px-5 pb-5 text-sm leading-relaxed text-muted sm:px-6 sm:pb-6">{a}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </RevealItem>
  );
}

export default function Home() {
  const [activeSet, setActiveSet] = useState(0);
  const [activePhase, setActivePhase] = useState(0);
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
        <section
          ref={heroRef}
          className="relative flex min-h-[100svh] items-center overflow-hidden pt-28 pb-24"
        >
          <Aurora variant="warm" spotlight />
          <div aria-hidden className="absolute inset-0 grid-lines" />

          <motion.div
            style={reduced ? undefined : { y: heroY, opacity: heroFade }}
            className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-14 px-6 lg:grid-cols-12 lg:gap-8 lg:px-8"
          >
            <div className="lg:col-span-7">
              <motion.span
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: EASE.outExpo }}
                className="inline-flex items-center gap-2 rounded-full border border-[rgba(114,56,61,0.2)] bg-[rgba(255,255,255,0.6)] px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-primary backdrop-blur-md"
              >
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
                </span>
                Internal Hackathon Portal · 2026
              </motion.span>

              <h1 className="mt-7 text-[2.75rem] font-extrabold leading-[1.02] tracking-[-0.03em] text-foreground sm:text-6xl xl:text-7xl">
                <SplitText text="Great teams" as="span" mode="word" delay={0.15} />
                <br />
                <span className="text-gradient-luxe">
                  <SplitText text="start here." as="span" mode="word" delay={0.42} />
                </span>
              </h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.75, ease: EASE.outExpo }}
                className="mt-7 max-w-[52ch] text-base leading-relaxed text-muted sm:text-lg"
              >
                Form balanced teams, close your skill gaps, and match with verified faculty
                mentors — the official Smart India Hackathon portal of GL Bajaj Group of
                Institutions, Mathura.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.92, ease: EASE.outExpo }}
                className="mt-9 flex flex-wrap items-center gap-3"
              >
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
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 1.15 }}
                className="mt-6 text-xs text-muted"
              >
                Official problem statements are released closer to the event. All 18 themes are
                already configured here.
              </motion.p>
            </div>

            <div className="lg:col-span-5">
              <HeroVisual />
            </div>
          </motion.div>

          <ScrollHint />
        </section>

        {/* ─────────────── MARQUEE ─────────────── */}
        <section className="relative overflow-hidden border-y border-[rgba(209,199,189,0.6)] bg-[rgba(217,217,217,0.34)] py-5">
          <div className="marquee-root marquee-mask">
            <div className="marquee-track" style={{ ['--marquee-duration' as string]: '52s' }}>
              {[0, 1].map((copy) => (
                <div key={copy} className="flex shrink-0 items-center" aria-hidden={copy === 1}>
                  {marqueeItems.map((name) => (
                    <span key={`${copy}-${name}`} className="flex items-center whitespace-nowrap">
                      <span className="px-6 text-xs font-bold uppercase tracking-[0.14em] text-muted">
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
        <section id="highlights" className="section-mist relative py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <Reveal className="max-w-2xl">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                What you get
              </span>
              <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.02em] text-foreground sm:text-4xl">
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
                    <a
                      href={item.href}
                      className="surface-raised group relative flex h-full flex-col gap-4 overflow-hidden rounded-3xl p-7 transition-shadow duration-400 hover:shadow-[0_22px_60px_rgba(50,45,41,0.13)]"
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
                      <h3 className="text-lg font-extrabold tracking-tight text-foreground">
                        {item.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-muted">{item.desc}</p>
                      <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-xs font-bold uppercase tracking-[0.12em] text-primary">
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
                  </TiltCard>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </section>

        {/* ─────────────── STATS ─────────────── */}
        <section className="section-dune relative overflow-hidden py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <RevealGroup stagger={0.08} className="grid grid-cols-2 gap-y-12 lg:grid-cols-4">
              {STATS.map((stat) => (
                <RevealItem key={stat.label} className="text-center">
                  <p className="text-4xl font-extrabold tracking-[-0.03em] text-primary sm:text-5xl">
                    <Counter to={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="mt-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
                    {stat.label}
                  </p>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </section>

        {/* ─────────────── TIMELINE ─────────────── */}
        <section className="section-linen relative py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <Reveal className="max-w-2xl">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                Milestone roadmap
              </span>
              <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.02em] text-foreground sm:text-4xl">
                The road to the Grand Finale
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted">
                Eleven official phases, from SPOC registration in June through to the 36-hour
                national finale in December.
              </p>
            </Reveal>

            <div className="mt-14 grid gap-8 lg:grid-cols-12">
              <Reveal direction="right" className="lg:col-span-5">
                <div className="flex max-h-[30rem] flex-col gap-1.5 overflow-y-auto pr-2">
                  {SIH_MILESTONES.map((m, i) => {
                    const isActive = i === activePhase;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setActivePhase(i)}
                        aria-current={isActive}
                        className="relative flex items-center gap-3.5 rounded-xl px-4 py-3 text-left transition-colors duration-250"
                      >
                        {isActive && (
                          <motion.span
                            layoutId="phasePill"
                            transition={SPRING.snappy}
                            className="absolute inset-0 rounded-xl border border-[rgba(114,56,61,0.24)] bg-[rgba(255,255,255,0.75)] shadow-[0_6px_20px_rgba(50,45,41,0.08)]"
                          />
                        )}
                        <span
                          className={`relative z-10 flex size-8 shrink-0 items-center justify-center rounded-lg border text-[10px] font-bold transition-colors duration-250 ${
                            isActive
                              ? 'border-[rgba(114,56,61,0.3)] bg-[rgba(114,56,61,0.1)] text-primary'
                              : 'border-[rgba(209,199,189,0.7)] bg-white/40 text-muted'
                          }`}
                        >
                          {String(m.id).padStart(2, '0')}
                        </span>
                        <span className="relative z-10 flex min-w-0 flex-col">
                          <span
                            className={`truncate text-sm font-bold transition-colors duration-250 ${
                              isActive ? 'text-foreground' : 'text-muted'
                            }`}
                          >
                            {m.title}
                          </span>
                          <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted/80">
                            {m.period}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Reveal>

              <Reveal direction="left" delay={0.1} className="lg:col-span-7">
                <div className="surface-raised relative min-h-[19rem] overflow-hidden rounded-3xl p-8">
                  <AnimatePresence mode="wait">
                    <motion.div
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
                          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                            {phase.phase}
                          </span>
                          <h3 className="text-xl font-extrabold tracking-tight text-foreground">
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
                        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                          Phase {phase.id} / {SIH_MILESTONES.length}
                        </span>
                      </div>

                      <div className="mt-4 h-1 overflow-hidden rounded-full bg-[rgba(172,156,141,0.25)]">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-[#ac9c8d]"
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: (activePhase + 1) / SIH_MILESTONES.length }}
                          transition={{ duration: 0.6, ease: EASE.outExpo }}
                          style={{ transformOrigin: 'left' }}
                        />
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ─────────────── THEMES ─────────────── */}
        <section className="relative overflow-hidden bg-[rgba(239,233,225,0.9)] py-24 sm:py-32">
          <Aurora variant="taupe" spotlight={false} />

          <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
            <Reveal className="max-w-2xl">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                Themes &amp; domains
              </span>
              <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.02em] text-foreground sm:text-4xl">
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
                      className={`group relative flex items-center justify-between gap-3 overflow-hidden rounded-2xl border px-5 py-4 text-left transition-all duration-300 ${
                        isActive
                          ? 'border-[rgba(114,56,61,0.28)] bg-[rgba(255,255,255,0.78)] shadow-[0_8px_28px_rgba(50,45,41,0.09)]'
                          : 'border-[rgba(209,199,189,0.6)] bg-[rgba(255,255,255,0.34)] hover:border-[rgba(172,156,141,0.9)] hover:bg-[rgba(255,255,255,0.6)]'
                      }`}
                    >
                      <span
                        className={`truncate text-sm font-bold transition-colors ${
                          isActive ? 'text-foreground' : 'text-muted'
                        }`}
                      >
                        {set.title}
                      </span>
                      <span
                        className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] transition-colors ${
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
                  <motion.div
                    key={activeSet}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
                    variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
                    className="grid gap-5 sm:grid-cols-3"
                  >
                    {ALL_18_THEME_SETS[activeSet].themes.map((theme, i) => (
                      <motion.article
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
                          <div className="surface-taupe flex h-full min-h-[13rem] flex-col justify-between overflow-hidden rounded-2xl p-6 backdrop-blur-md">
                            <div>
                              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                                Theme {String(i + 1).padStart(2, '0')}
                              </span>
                              <h3 className="mt-2.5 text-sm font-extrabold leading-snug text-foreground">
                                {theme.name}
                              </h3>
                            </div>
                            <p className="mt-4 line-clamp-4 text-xs leading-relaxed text-foreground/65">
                              {theme.desc}
                            </p>
                          </div>
                        </TiltCard>
                      </motion.article>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </section>

        {/* ─────────────── FAQ ─────────────── */}
        <section className="relative bg-[rgba(217,217,217,0.38)] py-24 sm:py-32">
          <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-12 lg:px-8">
            <Reveal className="lg:col-span-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                Questions
              </span>
              <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.02em] text-foreground sm:text-4xl">
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
          </div>
        </section>

        {/* ─────────────── CTA ─────────────── */}
        <section className="relative overflow-hidden py-24 sm:py-32">
          <Aurora variant="rose" spotlight={false} />
          <div className="relative mx-auto max-w-3xl px-6 text-center">
            <Reveal scale>
              <h2 className="text-3xl font-extrabold tracking-[-0.025em] text-foreground sm:text-5xl">
                Ready to build something
                <span className="text-gradient-luxe"> worth shipping?</span>
              </h2>
              <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-muted">
                Register, complete your profile, and start assembling the team that takes GL Bajaj
                to the Grand Finale.
              </p>
              <div className="mt-9 flex flex-wrap justify-center gap-3">
                <PremiumButton href="/signup" size="lg">
                  Get started
                </PremiumButton>
                <PremiumButton href="/tracks" variant="glass" size="lg">
                  Browse tracks
                </PremiumButton>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
