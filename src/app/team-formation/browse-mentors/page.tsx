'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { AnimatePresence, m } from 'framer-motion';
import {
  ArrowUpRight,
  UserX,
  Search,
  ShieldAlert,
  UsersRound,
  ShieldCheck,
  Building2,
  Mail,
  Phone,
  Check,
  Copy,
} from 'lucide-react';
import { Container, EmptyState, MentorCardSkeleton } from '@/components/ui';
import Icon from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
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
  college?: string | null;
  expertise: string[];
  guidedTeamsCount: number;
  bio?: string;
  linkedinUrl?: string;
  avatarUrl?: string | null;
  email?: string | null;
  contact?: string | null;
  teams?: { id: string; teamCode: string; name: string }[];
}

const AVATAR_WASHES = [
  'from-[#AC9C8D] to-[#D1C7BD]',
  'from-[#D1C7BD] to-[#D9D9D9]',
  'from-[#D9D9D9] to-[#AC9C8D]',
  'from-[#EFE9E1] to-[#D1C7BD]',
];

function MentorAvatar({
  avatarUrl,
  name,
  className = 'size-16 sm:size-20',
}: {
  avatarUrl?: string | null;
  name: string;
  className?: string;
}) {
  const [imageError, setImageError] = useState(false);

  if (avatarUrl && !imageError && (avatarUrl.startsWith('data:image/') || avatarUrl.startsWith('http'))) {
    return (
      <Image
        unoptimized
        src={avatarUrl}
        alt={`${name}'s profile photo`}
        width={96}
        height={96}
        onError={() => setImageError(true)}
        className={`rounded-2xl object-cover shadow-sm shrink-0 border border-[rgba(209,199,189,0.7)] ${className}`}
      />
    );
  }

  const wash = AVATAR_WASHES[name.length % AVATAR_WASHES.length];
  const initials =
    name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'M';

  return (
    <span
      aria-label={`${name}'s profile photo`}
      className={`flex shrink-0 items-center justify-center rounded-2xl border border-[rgba(209,199,189,0.7)] bg-gradient-to-br ${wash} text-base sm:text-lg font-black text-foreground shadow-sm ${className}`}
    >
      {initials}
    </span>
  );
}

/** Circular guidance-count dial — draws its arc on mount. */
function GuidanceCount({ count }: { count: number }) {
  return (
    <div className="surface-sunken grid size-12 shrink-0 place-items-center rounded-2xl border border-[rgba(209,199,189,0.6)] text-center">
      <div>
        <UsersRound className="mx-auto size-3.5 text-primary" aria-hidden />
        <span className="mt-0.5 block text-[10px] font-black tabular-nums text-foreground">{count} {count === 1 ? 'team' : 'teams'}</span>
      </div>
    </div>
  );
}

interface MentorEligibility {
  role: string;
  canRequest: boolean;
  reason: string | null;
  existingMentorIds: string[];
}

interface MentorFilters {
  name: string;
  expertise: string;
}

const EMPTY_MENTOR_FILTERS: MentorFilters = { name: '', expertise: '' };

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
        <div className="flex items-center gap-3.5">
          <MentorAvatar avatarUrl={mentor.avatarUrl} name={mentor.name} className="size-12" />
          <div className="min-w-0">
            <h3 id="request-mentor-title" className="text-feature text-foreground font-extrabold truncate">
              Request Mentorship
            </h3>
            <p className="text-xs text-muted truncate">
              from {mentor.name} ({mentor.designation || 'Faculty Mentor'})
            </p>
          </div>
        </div>

        <p className="mt-3 text-xs text-muted leading-relaxed">
          Introduce your team and project concept. Explain what kind of technical or architectural guidance you are looking for.
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
  const router = useRouter();
  const { toast } = useToast();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [eligibility, setEligibility] = useState<MentorEligibility | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast(`${label} copied`, 'info');
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Search filter inputs
  const [name, setName] = useState('');
  const [expertise, setExpertise] = useState('');

  // Modals state
  const [activeRequestMentor, setActiveRequestMentor] = useState<Mentor | null>(null);
  const [requested, setRequested] = useState<Record<string, 'sending' | 'sent'>>({});
  const [currentPage, setCurrentPage] = useState(1);

  const fetchMentors = useCallback(
    async (filters: MentorFilters) => {
      setSearching(true);
      try {
        const queryParams = new URLSearchParams();
        if (filters.name) queryParams.append('name', filters.name);
        if (filters.expertise) queryParams.append('expertise', filters.expertise);

        const res = await fetch(`/api/mentors?${queryParams.toString()}`, { cache: 'no-store' });
        const data = await res.json();
        if (data.success) {
          setMentors(data.mentors);
          setEligibility(data.eligibility);
          setCurrentPage(1);
        }
      } catch (err) {
        logger.error('Fetch mentors failed', err);
        toast('Could not load mentors. Check your connection.', 'error');
      } finally {
        setSearching(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      fetchMentors(EMPTY_MENTOR_FILTERS).finally(() => setLoading(false));
    });
    return () => cancelAnimationFrame(handle);
  }, [fetchMentors]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    fetchMentors({ name, expertise });
  };

  const itemsPerPage = 20;
  const totalPages = Math.max(1, Math.ceil(mentors.length / itemsPerPage));
  const paginatedMentors = mentors.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleReset = () => {
    setName('');
    setExpertise('');
    fetchMentors(EMPTY_MENTOR_FILTERS);
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

  const activeMentorships = mentors.reduce((sum, mentor) => sum + mentor.guidedTeamsCount, 0);

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
              text="Browse mentors."
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
                    placeholder="Mentor name or Team ID (SIH100)..."
                    aria-label="Search mentor name or team ID"
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
                    <Counter to={activeMentorships} duration={1.2} />
                  </div>
                  <div className="text-label uppercase text-muted">
                    active teams
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
                  <MentorCardSkeleton key={i} />
                ))}
              </div>
            ) : paginatedMentors.length > 0 ? (
              <>
                <m.div layout className="space-y-5">
                <AnimatePresence mode="popLayout" initial={false}>
                  {paginatedMentors.map((mentor, i) => {
                    const state = requested[mentor.userId] ??
                      (eligibility?.existingMentorIds.includes(mentor.userId) ? 'sent' : undefined);
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
                        className="surface-raised overflow-hidden rounded-3xl border border-[rgba(209,199,189,0.7)] shadow-sm transition-all duration-250 hover:shadow-md"
                      >
                        <div className="flex flex-col gap-5 p-5 sm:p-7 md:flex-row md:items-start">
                          {/* Mentor Photo & Stats Badge Column */}
                          <div className="flex shrink-0 items-center gap-3.5 sm:gap-4 md:flex-col md:items-center">
                            <div
                              onClick={() => router.push(`/mentors/${mentor.userId}`)}
                              className="cursor-pointer transition-transform hover:scale-105"
                            >
                              <MentorAvatar
                                avatarUrl={mentor.avatarUrl}
                                name={mentor.name}
                                className="size-16 sm:size-20"
                              />
                            </div>
                            <GuidanceCount count={mentor.guidedTeamsCount} />
                          </div>

                          {/* Mentor Information */}
                          <div className="min-w-0 flex-1 space-y-2.5">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                              <h2
                                onClick={() => router.push(`/mentors/${mentor.userId}`)}
                                className="text-lg sm:text-xl font-extrabold text-foreground cursor-pointer hover:text-primary transition-colors truncate"
                              >
                                {mentor.name}
                              </h2>
                              <span className="inline-flex items-center gap-1 rounded-full border border-blue-600/30 bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-blue-700">
                                <ShieldCheck className="size-3" /> Faculty Mentor
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                              <span className="font-semibold text-foreground">
                                {mentor.designation || 'Faculty Member'}
                              </span>
                              <span>·</span>
                              <span className="flex items-center gap-1">
                                <Building2 className="size-3.5" />
                                {mentor.organization || mentor.college || 'GL Bajaj Group of Institutions'}
                              </span>
                            </div>

                            {/* Contact Badges if Available */}
                            {(mentor.email || mentor.contact) && (
                              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                                {mentor.email && (
                                  <div className="inline-flex items-center gap-1.5 rounded-lg border border-[rgba(209,199,189,0.6)] bg-white/60 px-2 py-1 text-[11px] text-body">
                                    <Mail className="size-3 text-muted shrink-0" />
                                    <span className="truncate max-w-[200px] font-medium">{mentor.email}</span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCopy(mentor.email!, `Email for ${mentor.name}`);
                                      }}
                                      className="text-primary hover:text-primary/80 transition-colors ml-0.5"
                                      title="Copy email"
                                    >
                                      {copiedField === `Email for ${mentor.name}` ? (
                                        <Check className="size-3 text-emerald-700" />
                                      ) : (
                                        <Copy className="size-3" />
                                      )}
                                    </button>
                                  </div>
                                )}
                                {mentor.contact && (
                                  <div className="inline-flex items-center gap-1.5 rounded-lg border border-[rgba(209,199,189,0.6)] bg-white/60 px-2 py-1 text-[11px] text-body">
                                    <Phone className="size-3 text-muted shrink-0" />
                                    <span className="font-medium">{mentor.contact}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            <p className="text-xs leading-relaxed text-body line-clamp-3">
                              {mentor.bio || 'Experienced faculty mentor available to guide student hackathon teams on technical design, system architecture, and jury presentation.'}
                            </p>

                            {/* Areas of Expertise */}
                            {mentor.expertise && mentor.expertise.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {mentor.expertise.map((exp) => (
                                  <span
                                    key={exp}
                                    className="rounded-md border border-[rgba(114,56,61,0.2)] bg-[rgba(114,56,61,0.06)] px-2.5 py-0.5 text-caption font-semibold text-primary"
                                  >
                                    {exp}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Teams currently guided */}
                            {mentor.teams && mentor.teams.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-caption text-muted">
                                <span className="font-bold uppercase tracking-wider text-[10px]">Mentored Teams:</span>
                                {mentor.teams.map((team) => (
                                  <span
                                    key={team.id}
                                    onClick={() => router.push(`/teams/${team.id}`)}
                                    className="cursor-pointer rounded-md border border-[rgba(172,156,141,0.4)] bg-[rgba(172,156,141,0.12)] px-2 py-0.5 font-bold text-foreground hover:border-primary hover:text-primary transition-colors"
                                  >
                                    {team.teamCode}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Actions Column */}
                          <div className="flex shrink-0 flex-row items-center gap-2.5 sm:flex-col sm:items-end sm:justify-start pt-2 md:pt-0">
                            <PremiumButton
                              size="sm"
                              variant="glass"
                              onClick={() => router.push(`/mentors/${mentor.userId}`)}
                              className="w-full sm:w-auto"
                            >
                              View Profile
                            </PremiumButton>

                            {!eligibility?.canRequest ? (
                              <span className="text-[11px] text-muted flex items-center gap-1">
                                <ShieldAlert className="size-3.5 text-muted shrink-0" /> {eligibility?.reason ?? 'Checking eligibility'}
                              </span>
                            ) : (
                              <PremiumButton
                                size="sm"
                                variant={state === 'sent' ? 'glass' : 'primary'}
                                disabled={Boolean(state)}
                                magnetic={false}
                                onClick={() => setActiveRequestMentor(mentor)}
                                className="w-full sm:w-auto"
                              >
                                {state === 'sent' ? 'Request sent' : 'Request'}
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

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    className="rounded-xl border border-[rgba(114,56,61,0.2)] bg-[rgba(248,246,242,0.7)] px-4 py-2 text-caption font-bold text-primary transition-all duration-200 hover:bg-[rgba(114,56,61,0.08)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`size-10 rounded-xl font-bold transition-all duration-200 flex items-center justify-center ${
                        currentPage === page
                          ? 'bg-primary text-on-accent shadow-[0_4px_12px_rgba(114,56,61,0.25)]'
                          : 'border border-[rgba(114,56,61,0.2)] bg-[rgba(248,246,242,0.7)] text-muted hover:border-primary hover:text-primary'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    className="rounded-xl border border-[rgba(114,56,61,0.2)] bg-[rgba(248,246,242,0.7)] px-4 py-2 text-caption font-bold text-primary transition-all duration-200 hover:bg-[rgba(114,56,61,0.08)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
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
