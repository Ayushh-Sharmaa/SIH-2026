'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { ArrowUpRight, UserX, Search, MessageSquare, ShieldAlert } from 'lucide-react';
import { Container, EmptyState } from '@/components/ui';
import Icon from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useSession } from '@/lib/session';
import { useEscapeKey, useFocusTrap, useScrollLock } from '@/hooks/useFocusTrap';
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
import { logger } from '@/lib/logger';

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
        <m.circle
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

function RequestMentorshipModal({
  mentor,
  onClose,
  onSubmit,
}: {
  mentor: Mentor;
  onClose: () => void;
  onSubmit: (message: string) => Promise<void>;
}) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const panelRef = useFocusTrap<HTMLDivElement>(true);
  useScrollLock(true);
  useEscapeKey(true, onClose);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit(message);
    setLoading(false);
    onClose();
  };

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: DURATION.hover, ease: EASE.outExpo }}
      className="fixed inset-0 z-modal flex items-center justify-center p-4"
    >
      <div
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 bg-[rgb(50_45_41/0.34)] backdrop-blur-md"
      />
      <m.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="request-mentor-title"
        tabIndex={-1}
        initial={{ opacity: 0, y: 28, scale: 0.97, filter: 'blur(8px)' }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: 16, scale: 0.98, filter: 'blur(6px)' }}
        transition={{ duration: DURATION.card, ease: EASE.outExpo }}
        className="surface-overlay relative max-h-[88vh] w-full max-w-md overflow-y-auto rounded-container p-6 text-foreground shadow-[0_12px_40px_rgba(50,45,41,0.22)]"
      >
        <h3 id="request-mentor-title" className="text-feature text-foreground">
          Request Mentorship from {mentor.name}
        </h3>
        <p className="mt-2 text-xs text-muted leading-relaxed">
          Introduce your team and project concept. Explain what kind of guidance you are looking for.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-label uppercase text-muted">Message (Optional)</span>
            <textarea
              rows={4}
              placeholder="e.g. Hello Professor! We are working on SIH Problem Statement PS-MEDTECH. We have code ready for machine learning and would love your guidance on deployment and clinical validation."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-xl border border-[rgba(209,199,189,0.85)] bg-[rgba(248,246,242,0.75)] px-3.5 py-2 text-sm text-foreground outline-none transition-[border-color,box-shadow,background-color] duration-250 focus:border-primary focus:bg-[rgba(248,246,242,0.96)] focus:shadow-[0_0_0_4px_rgba(114,56,61,0.1)] resize-none"
            />
          </label>

          <div className="mt-6 flex justify-end gap-3">
            <PremiumButton variant="glass" size="sm" onClick={onClose} disabled={loading}>
              Cancel
            </PremiumButton>
            <PremiumButton type="submit" size="sm" loading={loading}>
              Send Request
            </PremiumButton>
          </div>
        </form>
      </m.div>
    </m.div>
  );
}

export default function FindMentorsPage() {
  const { toast } = useToast();
  const { user } = useSession();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  // Search filter inputs
  const [name, setName] = useState('');
  const [expertise, setExpertise] = useState('');

  // Modals state
  const [activeRequestMentor, setActiveRequestMentor] = useState<Mentor | null>(null);
  const [requested, setRequested] = useState<Record<string, 'sending' | 'sent'>>({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [dashboardData, setDashboardData] = useState<any>(null);

  // Fetch student profile & team info
  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await fetch('/api/dashboard');
        const data = await res.json();
        if (data.success) {
          setDashboardData(data);
        }
      } catch (err) {
        logger.error('Failed to load dashboard profile', err);
      }
    }
    if (user && user.role === 'STUDENT') {
      loadDashboard();
    }
  }, [user]);

  const fetchMentors = useCallback(
    async (filters?: { name: string; expertise: string }) => {
      const f = filters ?? { name, expertise };
      setSearching(true);
      try {
        const queryParams = new URLSearchParams();
        if (f.name) queryParams.append('name', f.name);
        if (f.expertise) queryParams.append('expertise', f.expertise);

        const res = await fetch(`/api/mentors?${queryParams.toString()}`);
        const data = await res.json();
        if (data.success) setMentors(data.mentors);
      } catch (err) {
        logger.error('Fetch mentors failed', err);
        toast('Could not load mentors. Check your connection.', 'error');
      } finally {
        setSearching(false);
      }
    },
    [name, expertise, toast]
  );

  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      fetchMentors({ name: '', expertise: '' }).finally(() => setLoading(false));
    });
    return () => cancelAnimationFrame(handle);
  }, []);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    fetchMentors();
  };

  const handleReset = () => {
    setName('');
    setExpertise('');
    fetchMentors({ name: '', expertise: '' });
  };

  const submitMentorRequest = async (message: string) => {
    if (!activeRequestMentor) return;
    const mentor = activeRequestMentor;
    setRequested((p) => ({ ...p, [mentor.userId]: 'sending' }));

    try {
      const res = await fetch('/api/mentor-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mentorId: mentor.userId, message }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to request mentor.');
      }

      setRequested((p) => ({ ...p, [mentor.userId]: 'sent' }));
      toast(`Mentorship request sent to ${mentor.name}!`, 'success');
    } catch (err: unknown) {
      setRequested((p) => {
        const next = { ...p };
        delete next[mentor.userId];
        return next;
      });
      toast(err instanceof Error ? err.message : 'Failed to submit request.', 'error');
    }
  };

  const openSlots = mentors.reduce(
    (sum, m) => sum + Math.max(0, m.capacity - m.currentLoad),
    0
  );

  const team = dashboardData?.team;
  const isLeader = team && team.leaderId === dashboardData?.profile?.userId;
  const hasMentor = team && team.mentorId !== null;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />

      <main id="main" className="flex-1">
        {/* Header */}
        <section className="section-mist relative overflow-hidden">
          <Aurora variant="taupe" spotlight />
          <div aria-hidden className="grid-lines absolute inset-0" />

          <Container width="narrow" className="relative py-16 text-center">
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

            {/* Double Search Bar */}
            <Reveal delay={0.42} className="mt-8">
              <form
                onSubmit={handleSearch}
                className="mx-auto flex flex-col gap-3 max-w-xl sm:flex-row items-center"
              >
                <div className="relative flex-1 w-full">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Search mentor name..."
                    aria-label="Search mentor name"
                    className="w-full rounded-full border border-[rgba(209,199,189,0.85)] bg-[rgba(248,246,242,0.75)] py-2.5 pl-11 pr-4 text-sm text-foreground outline-none transition-[border-color,box-shadow,background-color] duration-250 focus:border-primary focus:bg-[rgba(248,246,242,0.96)] focus:shadow-[0_0_0_4px_rgba(114,56,61,0.10)]"
                  />
                  <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
                </div>
                <div className="relative flex-1 w-full">
                  <input
                    type="text"
                    value={expertise}
                    onChange={(e) => setExpertise(e.target.value)}
                    placeholder="Expertise: ML, Cloud..."
                    aria-label="Search mentor expertise"
                    className="w-full rounded-full border border-[rgba(209,199,189,0.85)] bg-[rgba(248,246,242,0.75)] py-2.5 pl-11 pr-4 text-sm text-foreground outline-none transition-[border-color,box-shadow,background-color] duration-250 focus:border-primary focus:bg-[rgba(248,246,242,0.96)] focus:shadow-[0_0_0_4px_rgba(114,56,61,0.10)]"
                  />
                  <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <PremiumButton type="submit" loading={searching} className="flex-1 sm:flex-none">
                    Search
                  </PremiumButton>
                  {(name || expertise) && (
                    <PremiumButton variant="glass" onClick={handleReset} className="flex-1 sm:flex-none">
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
          </Container>
        </section>

        {/* Mentor Cards */}
        <section className="section-dune">
          <Container width="content" className="py-12">
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className="h-40 rounded-3xl skeleton-shimmer" />
                ))}
              </div>
            ) : mentors.length > 0 ? (
              <m.div layout className="space-y-4">
                <AnimatePresence mode="popLayout" initial={false}>
                  {mentors.map((mentor, i) => {
                    const full = mentor.currentLoad >= mentor.capacity;
                    const state = requested[mentor.userId];
                    return (
                      <m.article
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
                        <div className="flex flex-col gap-6 p-5 sm:p-7 sm:flex-row">
                          <CapacityDial load={mentor.currentLoad} capacity={mentor.capacity} />

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                              <h2 className="text-feature text-foreground font-extrabold">
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
                            {hasMentor ? (
                              <span className="text-xs text-muted flex items-center gap-1">
                                <ShieldAlert className="size-3.5" /> Mentor assigned
                              </span>
                            ) : !team ? (
                              <span className="text-xs text-muted flex items-center gap-1">
                                <ShieldAlert className="size-3.5" /> Join a team first
                              </span>
                            ) : !isLeader ? (
                              <span className="text-xs text-muted flex items-center gap-1">
                                <ShieldAlert className="size-3.5" /> Leader action only
                              </span>
                            ) : (
                              <PremiumButton
                                size="sm"
                                variant={state === 'sent' ? 'glass' : 'primary'}
                                disabled={full || Boolean(state)}
                                magnetic={false}
                                onClick={() => setActiveRequestMentor(mentor)}
                              >
                                {full ? 'At capacity' : state === 'sent' ? 'Request sent' : 'Request'}
                              </PremiumButton>
                            )}

                            {mentor.linkedinUrl && (
                              <m.a
                                href={mentor.linkedinUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                whileHover={{ y: -2 }}
                                transition={SPRING.snappy}
                                className="text-caption font-bold text-body transition-colors duration-250 hover:text-primary flex items-center gap-0.5"
                              >
                                LinkedIn <Icon icon={ArrowUpRight} size="xs" />
                              </m.a>
                            )}
                          </div>
                        </div>

                        <div
                          aria-hidden
                          className="h-0.5 w-full bg-gradient-to-r from-[rgba(172,156,141,0.55)] via-[rgba(114,56,61,0.25)] to-transparent"
                        />
                      </m.article>
                    );
                  })}
                </AnimatePresence>
              </m.div>
            ) : (
              <EmptyState
                icon={UserX}
                title="No verified mentors match these criteria."
                description="Try a broader expertise term, or clear the search to see everyone."
                action={
                  <PremiumButton variant="glass" size="sm" onClick={handleReset}>
                    Show all mentors
                  </PremiumButton>
                }
                className="max-w-2xl mx-auto w-full"
              />
            )}
          </Container>
        </section>
      </main>

      <Footer />

      {/* Request Mentor Modal */}
      <AnimatePresence>
        {activeRequestMentor && (
          <RequestMentorshipModal
            mentor={activeRequestMentor}
            onClose={() => setActiveRequestMentor(null)}
            onSubmit={submitMentorRequest}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
