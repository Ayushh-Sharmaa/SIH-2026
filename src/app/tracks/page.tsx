'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import Icon from '@/components/ui/Icon';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import {
  Aurora,
  Counter,
  PremiumButton,
  Reveal,
  SplitText,
  DURATION,
  EASE,
  SPRING,
} from '@/components/motion';

interface Track {
  id: string;
  name: string;
  problemStatementCode: string;
  description: string;
  category: string;
  organization?: string;
  sihUrl?: string;
}

const ALL = 'All themes';

function TracksSkeleton() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="h-10 w-96 max-w-full rounded-xl skeleton-shimmer" />
        <div className="mt-4 h-4 w-[28rem] max-w-full rounded skeleton-shimmer" />
        <div className="mt-10 flex flex-wrap gap-2">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-8 w-28 rounded-full skeleton-shimmer" />
          ))}
        </div>
        <div className="mt-8 space-y-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-24 rounded-2xl skeleton-shimmer" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function TracksPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(ALL);
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTracks() {
      try {
        const res = await fetch('/api/tracks');
        const data = await res.json();
        if (data.success) setTracks(data.tracks);
      } catch (err) {
        console.error('Fetch tracks failed:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchTracks();
  }, []);

  const categories = useMemo(
    () => [ALL, ...Array.from(new Set(tracks.map((t) => t.category))).sort()],
    [tracks]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tracks.filter((t) => {
      const matchesCategory = category === ALL || t.category === category;
      const matchesQuery =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.problemStatementCode.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [tracks, category, query]);

  if (loading) return <TracksSkeleton />;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />

      <main id="main" className="flex-1">
        {/* ── MASTHEAD: split editorial, not centred like other pages ── */}
        <section className="section-linen relative overflow-hidden">
          <Aurora variant="taupe" spotlight={false} />
          <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.4fr_1fr] lg:items-end lg:px-8">
            <div>
              <Reveal direction="none" blur={false}>
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
                  Reference index
                </span>
              </Reveal>
              <SplitText
                as="h1"
                text="Official SIH 2026 themes"
                className="mt-3 text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-5xl"
                delay={0.08}
              />
              <Reveal delay={0.3} className="mt-4 max-w-lg">
                <p className="text-sm leading-relaxed text-foreground/65">
                  Explore official Smart India Hackathon problem domains and reference themes.
                  Pick a direction early — the ministries release exact statements closer to the
                  event.
                </p>
              </Reveal>
            </div>

            <Reveal direction="left" delay={0.15}>
              <div className="surface-raised rounded-3xl p-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-extrabold tracking-tight text-foreground">
                    <Counter to={tracks.length} duration={1.4} />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
                    tracks listed
                  </span>
                </div>
                <div className="my-5 h-px bg-gradient-to-r from-[rgba(172,156,141,0.6)] to-transparent" />
                <p className="text-xs leading-relaxed text-foreground/65">
                  Official problem statements are not released yet. Tracks below follow the
                  official SIH theme taxonomy.
                </p>
                <div className="mt-5">
                  <PremiumButton variant="glass" size="sm" href="https://sih.gov.in/">
                    Official SIH portal <Icon icon={ArrowUpRight} size="xs" />
                  </PremiumButton>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── FILTER BAR ── */}
        <section className="sticky top-[70px] z-30 border-y border-[rgba(209,199,189,0.6)] bg-[rgba(239,233,225,0.82)] backdrop-blur-xl sm:top-[78px]">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:px-8">
            <div className="marquee-mask -mx-1 flex flex-1 gap-2 overflow-x-auto px-1 pb-1 lg:pb-0">
              {categories.map((c) => {
                const active = c === category;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={`relative shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors duration-250 ${
                      active ? 'text-[#FBF9F6]' : 'text-foreground/65 hover:text-primary'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="trackFilterPill"
                        transition={SPRING.snappy}
                        className="absolute inset-0 rounded-full bg-primary shadow-[0_4px_14px_rgba(114,56,61,0.28)]"
                      />
                    )}
                    <span className="relative z-10">{c}</span>
                  </button>
                );
              })}
            </div>

            <div className="relative shrink-0 lg:w-64">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search themes"
                aria-label="Search themes"
                className="w-full rounded-full border border-[rgba(209,199,189,0.8)] bg-[rgba(248,246,242,0.7)] py-1.5 pl-9 pr-3 text-xs text-foreground outline-none transition-[border-color,box-shadow] duration-250 focus:border-primary focus:shadow-[0_0_0_4px_rgba(114,56,61,0.10)]"
              />
              <svg
                aria-hidden
                className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="m21 21-4.35-4.35M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </section>

        {/* ── INDEX ROWS ── */}
        <section className="section-mist">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
            <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
              Showing {visible.length} of {tracks.length}
            </p>

            <motion.ol layout className="space-y-2.5">
              <AnimatePresence mode="popLayout" initial={false}>
                {visible.map((track, i) => {
                  const open = openId === track.id;
                  return (
                    <motion.li
                      key={track.id}
                      layout
                      initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, scale: 0.98, filter: 'blur(6px)' }}
                      transition={{
                        duration: DURATION.card,
                        ease: EASE.outExpo,
                        delay: Math.min(i * 0.025, 0.3),
                      }}
                      className="group overflow-hidden rounded-2xl border border-[rgba(209,199,189,0.7)] bg-[rgba(248,246,242,0.7)] transition-colors duration-250 hover:border-[rgba(114,56,61,0.28)]"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenId(open ? null : track.id)}
                        aria-expanded={open}
                        className="flex w-full items-center gap-4 px-5 py-4 text-left"
                      >
                        <span className="hidden w-10 shrink-0 font-mono text-xs font-bold text-muted sm:block">
                          {String(i + 1).padStart(2, '0')}
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold text-foreground transition-colors duration-250 group-hover:text-primary">
                            {track.name}
                          </span>
                          <span className="mt-0.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
                            {track.category}
                          </span>
                        </span>

                        <span className="hidden shrink-0 rounded-md border border-[rgba(172,156,141,0.5)] bg-[rgba(172,156,141,0.16)] px-2 py-0.5 font-mono text-[11px] font-bold text-foreground sm:block">
                          {track.problemStatementCode}
                        </span>

                        <motion.span
                          aria-hidden
                          animate={{ rotate: open ? 180 : 0 }}
                          transition={{ duration: DURATION.hover, ease: EASE.outExpo }}
                          className="shrink-0 text-muted"
                        >
                          <svg className="size-4" viewBox="0 0 24 24" fill="none">
                            <path
                              d="m6 9 6 6 6-6"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </motion.span>
                      </button>

                      <AnimatePresence initial={false}>
                        {open && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: DURATION.card, ease: EASE.outExpo }}
                            className="overflow-hidden"
                          >
                            <div className="border-t border-[rgba(209,199,189,0.6)] px-5 py-4 sm:pl-19">
                              <p className="max-w-3xl text-xs leading-relaxed text-foreground/70">
                                {track.description}
                              </p>
                              {(track.organization || track.sihUrl) && (
                                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px]">
                                  {track.organization && (
                                    <span className="text-muted">
                                      Ministry / Org:{' '}
                                      <strong className="font-bold text-foreground">
                                        {track.organization}
                                      </strong>
                                    </span>
                                  )}
                                  {track.sihUrl && (
                                    <a
                                      href={track.sihUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="font-bold text-primary hover:underline"
                                    >
                                      SIH portal <Icon icon={ArrowUpRight} size="xs" />
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </motion.ol>

            {visible.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="surface-sunken rounded-3xl px-6 py-16 text-center"
              >
                <p className="text-sm font-semibold text-foreground">No themes match that.</p>
                <p className="mt-1.5 text-xs text-foreground/60">
                  Try a different category or clear your search.
                </p>
                <div className="mt-5 flex justify-center">
                  <PremiumButton
                    variant="glass"
                    size="sm"
                    onClick={() => {
                      setCategory(ALL);
                      setQuery('');
                    }}
                  >
                    Reset filters
                  </PremiumButton>
                </div>
              </motion.div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
