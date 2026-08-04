'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import Icon from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
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

interface Mentor {
  userId: string;
  name: string;
  designation: string;
  organization: string;
  expertise: string[];
  capacity: number;
  currentLoad: number;
  bio?: string;
  linkedinUrl?: string;
  email: string;
}

/** Circular capacity dial — draws its arc on mount. */
function CapacityDial({ load, capacity }: { load: number; capacity: number }) {
  const pct = capacity > 0 ? Math.min(1, load / capacity) : 0;
  const r = 22;
  const circumference = 2 * Math.PI * r;

  return (
    <div className="relative grid size-16 shrink-0 place-items-center">
      <svg className="size-16 -rotate-90" viewBox="0 0 56 56" aria-hidden>
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke="rgba(209,199,189,0.7)"
          strokeWidth="4"
        />
        <motion.circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          whileInView={{ strokeDashoffset: circumference * (1 - pct) }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 1, ease: EASE.outExpo, delay: 0.15 }}
        />
      </svg>
      <span className="absolute text-caption font-black tracking-tight text-foreground">
        {load}/{capacity}
      </span>
    </div>
  );
}

export default function FindMentorsPage() {
  const { toast } = useToast();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [expertise, setExpertise] = useState('');
  const [requested, setRequested] = useState<Record<string, true>>({});

  const fetchMentors = useCallback(async (term?: string) => {
    const q = term ?? '';
    setSearching(true);
    try {
      const queryParams = new URLSearchParams();
      if (q) queryParams.append('expertise', q);

      const res = await fetch(`/api/mentors?${queryParams.toString()}`);
      const data = await res.json();
      if (data.success) setMentors(data.mentors);
    } catch (err) {
      // Logging alone left the user staring at an empty list with no idea the
      // request had failed.
      console.error('Fetch mentors failed:', err);
      toast('Could not load mentors. Check your connection and try again.', 'error');
    } finally {
      setSearching(false);
    }
    // `toast` is memoised in ToastProvider, so its identity is stable.
  }, [toast]);

  useEffect(() => {
    fetchMentors().finally(() => setLoading(false));
  }, [fetchMentors]);


  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    fetchMentors(expertise);
  };

  const handleReset = () => {
    setExpertise('');
    fetchMentors('');
  };

  const openSlots = mentors.reduce(
    (sum, m) => sum + Math.max(0, m.capacity - m.currentLoad),
    0
  );

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />

      <main id="main" className="flex-1">
        {/* ── HEADER: centred, distinct from the left-aligned teammates band ── */}
        <section className="section-mist relative overflow-hidden">
          <Aurora variant="taupe" spotlight />
          <div aria-hidden className="grid-lines absolute inset-0" />

          <div className="relative mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
            <Reveal direction="none" blur={false}>
              <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(172,156,141,0.6)] bg-[rgba(248,246,242,0.7)] px-3.5 py-1.5 text-label uppercase text-primary backdrop-blur-md">
                Mentor directory
              </span>
            </Reveal>

            <SplitText
              as="h1"
              text="Find your mentor."
              className="mt-5 text-title text-foreground"
              delay={0.1}
            />

            <Reveal delay={0.32} className="mt-4">
              <p className="mx-auto max-w-xl text-sm leading-relaxed text-body">
                Verified GL Bajaj faculty and industry leaders who guide problem selection, review
                your architecture, and prepare you for jury evaluation.
              </p>
            </Reveal>

            {/* search — inline pill, unlike the teammates rail */}
            <Reveal delay={0.42} className="mt-8">
              <form
                onSubmit={handleSearch}
                className="mx-auto flex max-w-xl flex-col gap-2.5 sm:flex-row"
              >
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={expertise}
                    onChange={(e) => setExpertise(e.target.value)}
                    placeholder="Search expertise — e.g. Machine Learning, Cloud"
                    aria-label="Search mentor expertise"
                    className="w-full rounded-full border border-[rgba(209,199,189,0.85)] bg-[rgba(248,246,242,0.75)] py-3 pl-11 pr-4 text-sm text-foreground outline-none backdrop-blur-md transition-[border-color,box-shadow,background-color] duration-250 focus:border-primary focus:bg-[rgba(248,246,242,0.96)] focus:shadow-[0_0_0_4px_rgba(114,56,61,0.10)]"
                  />
                  <svg
                    aria-hidden
                    className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted"
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
                <div className="flex gap-2">
                  <PremiumButton type="submit" loading={searching} className="flex-1 sm:flex-none">
                    Search
                  </PremiumButton>
                  {expertise && (
                    <PremiumButton variant="ghost" onClick={handleReset}>
                      Clear
                    </PremiumButton>
                  )}
                </div>
              </form>
            </Reveal>

            <Reveal delay={0.52} className="mt-8">
              <div className="flex items-center justify-center gap-8">
                <div>
                  <div className="text-2xl font-extrabold tracking-tight text-foreground">
                    <Counter to={mentors.length} duration={1.2} />
                  </div>
                  <div className="text-label uppercase text-muted">
                    mentors
                  </div>
                </div>
                <div className="h-8 w-px bg-[rgba(172,156,141,0.5)]" />
                <div>
                  <div className="text-2xl font-extrabold tracking-tight text-foreground">
                    <Counter to={openSlots} duration={1.2} />
                  </div>
                  <div className="text-label uppercase text-muted">
                    open slots
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── ROSTER: wide rows, not a card grid ── */}
        <section className="section-dune">
          <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className="h-40 rounded-3xl skeleton-shimmer" />
                ))}
              </div>
            ) : mentors.length > 0 ? (
              <motion.div layout className="space-y-4">
                <AnimatePresence mode="popLayout" initial={false}>
                  {mentors.map((mentor, i) => {
                    const full = mentor.currentLoad >= mentor.capacity;
                    const sent = requested[mentor.userId];
                    return (
                      <motion.article
                        key={mentor.userId}
                        layout
                        initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, scale: 0.97, filter: 'blur(8px)' }}
                        transition={{
                          duration: DURATION.reveal,
                          ease: EASE.outExpo,
                          delay: Math.min(i * 0.05, 0.35),
                        }}
                        whileHover={{ y: -4 }}
                        className="surface-raised overflow-hidden rounded-3xl transition-colors duration-250"
                      >
                        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:p-7">
                          <CapacityDial load={mentor.currentLoad} capacity={mentor.capacity} />

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                              <h2 className="text-feature text-foreground">
                                {mentor.name}
                              </h2>
                              <span className="text-xs text-muted">
                                {mentor.designation} at {mentor.organization}
                              </span>
                            </div>

                            <p className="mt-2 max-w-2xl text-xs leading-relaxed text-body">
                              {mentor.bio || 'No biography details provided.'}
                            </p>

                            <div className="mt-3.5 flex flex-wrap gap-1.5">
                              {mentor.expertise.map((exp) => (
                                <span
                                  key={exp}
                                  className="rounded-md border border-[rgba(172,156,141,0.55)] bg-[rgba(172,156,141,0.18)] px-2 py-0.5 text-caption font-semibold text-foreground"
                                >
                                  {exp}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex shrink-0 flex-row items-center gap-3 sm:flex-col sm:items-end sm:justify-center">
                            <PremiumButton
                              size="sm"
                              variant={sent ? 'glass' : 'primary'}
                              disabled={full || Boolean(sent)}
                              magnetic={false}
                              onClick={() => {
                                setRequested((p) => ({ ...p, [mentor.userId]: true }));
                                toast(
                                  `Request to guide your team sent to ${mentor.name}. The full request flow ships in Phase 2.`,
                                  'success',
                                );
                              }}
                            >
                              {full ? 'At capacity' : sent ? 'Request sent' : 'Request'}
                            </PremiumButton>

                            {mentor.linkedinUrl && (
                              <motion.a
                                href={mentor.linkedinUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                whileHover={{ y: -2 }}
                                transition={SPRING.snappy}
                                className="text-caption font-bold text-body transition-colors duration-250 hover:text-primary"
                              >
                                LinkedIn <Icon icon={ArrowUpRight} size="xs" />
                              </motion.a>
                            )}
                          </div>
                        </div>

                        <div
                          aria-hidden
                          className="h-0.5 w-full bg-gradient-to-r from-[rgba(172,156,141,0.55)] via-[rgba(114,56,61,0.25)] to-transparent"
                        />
                      </motion.article>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            ) : (
              <div className="surface-sunken rounded-3xl px-6 py-20 text-center">
                <p className="text-base font-extrabold tracking-tight text-foreground">
                  No verified mentors match these criteria.
                </p>
                <p className="mt-1.5 text-sm text-muted">
                  Try a broader expertise term, or clear the search to see everyone.
                </p>
                <div className="mt-6 flex justify-center">
                  <PremiumButton variant="glass" size="sm" onClick={handleReset}>
                    Show all mentors
                  </PremiumButton>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />

    </div>
  );
}
