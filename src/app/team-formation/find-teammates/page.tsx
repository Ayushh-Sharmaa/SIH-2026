'use client';

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { ArrowUpRight, Users } from 'lucide-react';
import { Container, EmptyState } from '@/components/ui';
import Icon from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import Image from 'next/image';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useEscapeKey, useFocusTrap, useScrollLock } from '@/hooks/useFocusTrap';
import {
  Aurora,
  Counter,
  PremiumButton,
  Reveal,
  SplitText,
  TiltCard,
  DURATION,
  EASE,
} from '@/components/motion';
import { logger } from '@/lib/logger';

interface Student {
  userId: string;
  name: string;
  year: string;
  branch: string;
  skills: string[];
  languages: string[];
  softSkills: string[];
  resumeUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  avatarUrl?: string | null;
}

interface Track {
  id: string;
  problemStatementCode: string;
  name: string;
}

const AVATAR_WASHES = [
  'from-[#AC9C8D] to-[#D1C7BD]',
  'from-[#D1C7BD] to-[#D9D9D9]',
  'from-[#D9D9D9] to-[#AC9C8D]',
  'from-[#EFE9E1] to-[#D1C7BD]',
];

const SOFT_SKILL_OPTIONS = [
  'PPT Making',
  'Public Speaking/Presenting',
  'Technical Writing',
  'UI/UX Design',
  'Video Editing',
  'Management',
];
const LANGUAGE_OPTIONS = ['English', 'Hindi'];

function ProfileAvatar({ avatarUrl, name }: { avatarUrl?: string | null; name: string }) {
  if (avatarUrl?.startsWith('data:image/') || avatarUrl?.startsWith('http')) {
    return (
      <Image
        unoptimized
        src={avatarUrl}
        alt={`${name}'s profile`}
        width={56}
        height={56}
        className="size-12 rounded-2xl object-cover"
      />
    );
  }

  const wash = AVATAR_WASHES[name.length % AVATAR_WASHES.length];
  return (
    <span
      aria-label={`${name}'s profile`}
      className={`flex size-12 shrink-0 items-center justify-center rounded-2xl border border-[rgba(209,199,189,0.7)] bg-gradient-to-br ${wash} text-sm font-black text-foreground`}
    >
      {name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()}
    </span>
  );
}

function FilterLabel({ children }: { children: string }) {
  return (
    <span className="mb-1.5 block text-label uppercase text-muted">
      {children}
    </span>
  );
}

const CONTROL =
  'w-full rounded-xl border border-[rgba(209,199,189,0.8)] bg-[rgba(248,246,242,0.65)] px-3.5 py-2 text-sm text-foreground outline-none transition-[border-color,box-shadow,background-color] duration-250 focus:border-primary focus:bg-[rgba(248,246,242,0.95)] focus:shadow-[0_0_0_4px_rgba(114,56,61,0.10)]';

const classifySkillDomain = (name: string): 'Engineering' | 'Design' | 'Communication' => {
  const n = name.toLowerCase();
  if (
    n.includes('figma') || n.includes('design') || n.includes('ux') ||
    n.includes('ui') || n.includes('adobe') || n.includes('canva') ||
    n.includes('wireframe') || n.includes('prototype') || n.includes('editing') ||
    n.includes('ppt')
  ) {
    return 'Design';
  }
  if (
    n.includes('speaking') || n.includes('writing') || n.includes('management') ||
    n.includes('english') || n.includes('hindi') || n.includes('sanskrit') ||
    n.includes('punjabi') || n.includes('tamil') || n.includes('telugu') ||
    n.includes('bengali') || n.includes('marathi') || n.includes('gujarati') ||
    n.includes('kannada') || n.includes('malayalam')
  ) {
    return 'Communication';
  }
  return 'Engineering';
};

const DOMAIN_SWATCH = {
  Engineering: '#72383D',
  Design: '#AC9C8D',
  Communication: '#322D29',
} as const;

const getStudentSkillBalance = (student: Student) => {
  const allSelected = [...student.skills, ...student.softSkills, ...student.languages];

  if (allSelected.length === 0) {
    return {
      total: 0,
      engineering: { count: 0, pct: 0 },
      design: { count: 0, pct: 0 },
      communication: { count: 0, pct: 0 },
    };
  }

  let eng = 0;
  let des = 0;
  let comm = 0;

  allSelected.forEach((item) => {
    const domain = classifySkillDomain(item);
    if (domain === 'Engineering') eng++;
    else if (domain === 'Design') des++;
    else comm++;
  });

  const total = allSelected.length;

  return {
    total,
    engineering: { count: eng, pct: Math.round((eng / total) * 100) },
    design: { count: des, pct: Math.round((des / total) * 100) },
    communication: { count: comm, pct: Math.round((comm / total) * 100) },
  };
};

function Overlay({
  onClose,
  labelledBy,
  children,
}: {
  onClose: () => void;
  labelledBy: string;
  children: ReactNode;
}) {
  const panelRef = useFocusTrap<HTMLDivElement>(true);
  useScrollLock(true);
  useEscapeKey(true, onClose);

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
        aria-labelledby={labelledBy}
        tabIndex={-1}
        initial={{ opacity: 0, y: 28, scale: 0.97, filter: 'blur(8px)' }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: 16, scale: 0.98, filter: 'blur(6px)' }}
        transition={{ duration: DURATION.card, ease: EASE.outExpo }}
        className="surface-overlay relative max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-container p-6 text-foreground"
      >
        {children}
      </m.div>
    </m.div>
  );
}

export default function FindTeammatesPage() {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [skill, setSkill] = useState('');
  const [softSkill, setSoftSkill] = useState('');
  const [language, setLanguage] = useState('');
  const [trackId, setTrackId] = useState('');
  const [inviteState, setInviteState] = useState<Record<string, 'sending' | 'sent'>>({});
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const fetchTeammates = useCallback(
    async (filters?: { skill: string; softSkill: string; language: string; trackId: string }) => {
      const f = filters ?? { skill, softSkill, language, trackId };
      setRefreshing(true);
      try {
        const queryParams = new URLSearchParams();
        if (f.skill) queryParams.append('skill', f.skill);
        if (f.softSkill) queryParams.append('softSkill', f.softSkill);
        if (f.language) queryParams.append('language', f.language);
        if (f.trackId) queryParams.append('trackId', f.trackId);

        const res = await fetch(`/api/students?${queryParams.toString()}`);
        const data = await res.json();
        if (data.success) setStudents(data.students);
      } catch (err) {
        logger.error('Fetch teammates error', err);
        toast('Could not load students. Check your connection and try again.', 'error');
      } finally {
        setRefreshing(false);
      }
    },
    // `toast` is memoised in ToastProvider, so its identity is stable.
    [skill, softSkill, language, trackId, toast]
  );

  useEffect(() => {
    async function initPage() {
      try {
        const res = await fetch('/api/tracks');
        const data = await res.json();
        if (data.success) setTracks(data.tracks);
      } catch (err) {
        logger.error('Fetch tracks failed', err);
        toast('Could not load track filters. Please refresh.', 'error');
      }
      await fetchTeammates({ skill: '', softSkill: '', language: '', trackId: '' });
      setLoading(false);
    }
    initPage();
    // Runs once on mount; later fetches are user-driven.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    fetchTeammates();
  };

  const handleReset = () => {
    setSkill('');
    setSoftSkill('');
    setLanguage('');
    setTrackId('');
    fetchTeammates({ skill: '', softSkill: '', language: '', trackId: '' });
  };

  const sendInvite = async (student: Student) => {
    setInviteState((previous) => ({ ...previous, [student.userId]: 'sending' }));

    try {
      const response = await fetch('/api/team-invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: student.userId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not send the invitation.');

      setInviteState((previous) => ({ ...previous, [student.userId]: 'sent' }));
      toast(
        `Invitation sent to ${student.name}. They can accept it from their notifications.`,
        'success',
      );
    } catch (error: unknown) {
      setInviteState((previous) => {
        const next = { ...previous };
        delete next[student.userId];
        return next;
      });
      toast(
        error instanceof Error ? error.message : 'Could not send the invitation.',
        'error',
      );
    }
  };

  const activeFilters = [skill, softSkill, language, trackId].filter(Boolean).length;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />

      <main id="main" className="flex-1">
        {/* ── HEADER BAND ── */}
        <section className="section-dune relative overflow-hidden">
          <Aurora variant="warm" spotlight={false} />
          <Container width="wide" className="relative flex flex-col gap-6 py-12 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Reveal direction="none" blur={false}>
                <span className="text-label uppercase text-primary">
                  Talent directory
                </span>
              </Reveal>
              <SplitText
                as="h1"
                text="Find teammates"
                className="mt-3 text-title text-foreground"
                delay={0.08}
              />
              <Reveal delay={0.28} className="mt-3">
                <p className="max-w-xl text-sm leading-relaxed text-body">
                  Browse students looking for SIH teams and filter by technical skill, soft skill,
                  language fluency, and track interest.
                </p>
              </Reveal>
            </div>

            <Reveal direction="left" delay={0.2}>
              <div className="surface-raised flex items-center gap-5 rounded-2xl px-5 py-4">
                <div>
                  <div className="text-3xl font-extrabold tracking-tight text-foreground">
                    <Counter to={students.length} duration={1.2} />
                  </div>
                  <div className="text-label uppercase text-muted">
                    profiles shown
                  </div>
                </div>
                <div className="h-10 w-px bg-[rgba(172,156,141,0.5)]" />
                <div>
                  <div className="text-3xl font-extrabold tracking-tight text-foreground">
                    {activeFilters}
                  </div>
                  <div className="text-label uppercase text-muted">
                    filters active
                  </div>
                </div>
              </div>
            </Reveal>
          </Container>
        </section>

        {/* ── WORKSPACE: filter rail + results ── */}
        <section className="surface-sunken">
          <Container width="wide" className="grid grid-cols-1 gap-6 py-10 lg:grid-cols-[280px_1fr]">
            {/* filter rail */}
            <Reveal direction="right">
              <form
                onSubmit={handleSearch}
                className="surface-raised rounded-3xl p-6 lg:sticky lg:top-28"
              >
                <h2 className="text-feature text-foreground">
                  Refine
                </h2>
                <div className="my-5 h-px bg-gradient-to-r from-[rgba(172,156,141,0.55)] to-transparent" />

                <div className="space-y-4">
                  <label className="block">
                    <FilterLabel>Tech skill</FilterLabel>
                    <input
                      type="text"
                      placeholder="e.g. React"
                      value={skill}
                      onChange={(e) => setSkill(e.target.value)}
                      className={CONTROL}
                    />
                  </label>

                  <label className="block">
                    <FilterLabel>Soft skill</FilterLabel>
                    <select
                      value={softSkill}
                      onChange={(e) => setSoftSkill(e.target.value)}
                      className={CONTROL}
                    >
                      <option value="">All soft skills</option>
                      {SOFT_SKILL_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <FilterLabel>Language</FilterLabel>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className={CONTROL}
                    >
                      <option value="">All languages</option>
                      {LANGUAGE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <FilterLabel>Problem statement</FilterLabel>
                    <select
                      value={trackId}
                      onChange={(e) => setTrackId(e.target.value)}
                      className={CONTROL}
                    >
                      <option value="">All tracks</option>
                      {tracks.map((track) => (
                        <option key={track.id} value={track.id}>
                          {track.problemStatementCode}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="mt-6 flex gap-2">
                  <PremiumButton
                    type="submit"
                    size="sm"
                    loading={refreshing}
                    magnetic={false}
                    className="flex-1"
                  >
                    Apply
                  </PremiumButton>
                  <PremiumButton
                    variant="glass"
                    size="sm"
                    magnetic={false}
                    onClick={handleReset}
                    className="flex-1"
                  >
                    Reset
                  </PremiumButton>
                </div>
              </form>
            </Reveal>

            {/* results */}
            <div>
              {loading ? (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 6 }, (_, i) => (
                    <div key={i} className="h-64 rounded-3xl skeleton-shimmer" />
                  ))}
                </div>
              ) : students.length > 0 ? (
                <m.div
                  layout
                  className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
                >
                  <AnimatePresence mode="popLayout" initial={false}>
                    {students.map((student, i) => {
                      const state = inviteState[student.userId];
                      return (
                        <m.div
                          key={student.userId}
                          layout
                          initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
                          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                          exit={{ opacity: 0, scale: 0.96, filter: 'blur(8px)' }}
                          transition={{
                            duration: DURATION.card,
                            ease: EASE.outExpo,
                            delay: Math.min(i * 0.03, 0.3),
                          }}
                        >
                          <TiltCard intensity={5} className="h-full">
                            <article className="surface-raised flex h-full flex-col justify-between rounded-3xl p-5 sm:p-6">
                              <div
                                onClick={() => setSelectedStudent(student)}
                                className="space-y-4 cursor-pointer group/card"
                              >
                                <div className="flex items-center gap-3">
                                  <ProfileAvatar
                                    avatarUrl={student.avatarUrl}
                                    name={student.name}
                                  />
                                  <div className="min-w-0">
                                    <h3 className="truncate text-feature text-foreground group-hover/card:text-primary transition-colors duration-200">
                                      {student.name}
                                    </h3>
                                    <span className="mt-0.5 block truncate text-caption text-muted">
                                      {student.branch} · {student.year}
                                    </span>
                                  </div>
                                </div>

                                <div>
                                  <FilterLabel>Tech skills</FilterLabel>
                                  <div className="flex flex-wrap gap-1.5">
                                    {student.skills.map((sk) => (
                                      <span
                                        key={sk}
                                        className="rounded-md border border-[rgba(114,56,61,0.22)] bg-[rgba(114,56,61,0.08)] px-2 py-0.5 text-caption font-semibold text-primary"
                                      >
                                        {sk}
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <FilterLabel>Soft skills &amp; language</FilterLabel>
                                  <div className="flex flex-wrap gap-1.5">
                                    {student.softSkills.map((sk) => (
                                      <span
                                        key={sk}
                                        className="rounded-md border border-[rgba(172,156,141,0.55)] bg-[rgba(172,156,141,0.18)] px-2 py-0.5 text-caption font-semibold text-foreground"
                                      >
                                        {sk}
                                      </span>
                                    ))}
                                    {student.languages.map((ln) => (
                                      <span
                                        key={ln}
                                        className="rounded-md border border-[rgba(209,199,189,0.7)] bg-[rgba(239,233,225,0.8)] px-2 py-0.5 text-caption font-semibold text-body"
                                      >
                                        {ln}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[rgba(209,199,189,0.6)] pt-4">
                                <div className="flex flex-wrap gap-1.5">
                                  {[
                                    { url: student.githubUrl, label: 'GitHub' },
                                    { url: student.linkedinUrl, label: 'LinkedIn' },
                                    { url: student.resumeUrl, label: 'Résumé' },
                                  ]
                                    .filter((l) => l.url)
                                    .map((l) => (
                                      <a
                                        key={l.label}
                                        href={l.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="rounded-md border border-[rgba(209,199,189,0.75)] bg-[rgba(239,233,225,0.7)] px-2 py-1 text-caption font-bold text-foreground transition-colors duration-250 hover:border-[rgba(114,56,61,0.3)] hover:text-primary"
                                      >
                                        {l.label} <Icon icon={ArrowUpRight} size="xs" />
                                      </a>
                                    ))}
                                </div>

                                <PremiumButton
                                  size="sm"
                                  variant={state === 'sent' ? 'glass' : 'primary'}
                                  loading={state === 'sending'}
                                  disabled={Boolean(state)}
                                  magnetic={false}
                                  onClick={() => sendInvite(student)}
                                >
                                  {state === 'sent' ? 'Invite sent' : 'Invite'}
                                </PremiumButton>
                              </div>
                            </article>
                          </TiltCard>
                        </m.div>
                      );
                    })}
                  </AnimatePresence>
                </m.div>
              ) : (
                <EmptyState
                  icon={Users}
                  title="No teammate profiles match these filters."
                  description="Clear a filter or widen your skill search to discover more collaborators."
                  action={
                    <PremiumButton variant="glass" size="sm" onClick={handleReset}>
                      Reset filters
                    </PremiumButton>
                  }
                  className="max-w-2xl mx-auto w-full"
                />
              )}
            </div>
          </Container>
        </section>
      </main>

      <Footer />

      {/* Teammate Detail Overlay */}
      <AnimatePresence>
        {selectedStudent && (
          <Overlay onClose={() => setSelectedStudent(null)} labelledBy="student-detail-dialog">
            <div className="flex items-start justify-between gap-4 border-b border-[rgba(209,199,189,0.7)] pb-4">
              <div className="flex items-center gap-3 min-w-0">
                <ProfileAvatar
                  avatarUrl={selectedStudent.avatarUrl}
                  name={selectedStudent.name}
                />
                <div className="min-w-0">
                  <h2 id="student-detail-dialog" className="text-feature text-foreground truncate">
                    {selectedStudent.name}
                  </h2>
                  <p className="mt-0.5 text-xs font-semibold text-primary truncate">
                    {selectedStudent.branch} · {selectedStudent.year}
                  </p>
                </div>
              </div>
              <PremiumButton
                variant="ghost"
                size="sm"
                magnetic={false}
                onClick={() => setSelectedStudent(null)}
              >
                Close
              </PremiumButton>
            </div>

            {/* Overall Skill Donut Balance */}
            {(() => {
              const balance = getStudentSkillBalance(selectedStudent);
              if (balance.total === 0) return null;
              return (
                <div className="mt-5 flex flex-col items-center gap-6 rounded-2xl border border-[rgba(209,199,189,0.8)] bg-[rgba(239,233,225,0.45)] p-4 sm:flex-row">
                  <div className="relative grid size-28 shrink-0 place-items-center">
                    <svg className="size-full -rotate-90" viewBox="0 0 36 36" aria-hidden>
                      <circle
                        cx="18"
                        cy="18"
                        r="15.915"
                        fill="transparent"
                        stroke="rgba(209,199,189,0.3)"
                        strokeWidth="3.2"
                      />
                      {(
                        [
                          ['Engineering', balance.engineering.pct, 0],
                          ['Design', balance.design.pct, balance.engineering.pct],
                          [
                            'Communication',
                            balance.communication.pct,
                            balance.engineering.pct + balance.design.pct,
                          ],
                        ] as const
                      ).map(
                        ([domain, pct, offset]) =>
                          pct > 0 && (
                            <circle
                              key={domain}
                              cx="18"
                              cy="18"
                              r="15.915"
                              fill="transparent"
                              stroke={DOMAIN_SWATCH[domain]}
                              strokeWidth="3.4"
                              strokeDasharray={`${pct} ${100 - pct}`}
                              strokeDashoffset={`-${offset}`}
                            />
                          )
                      )}
                    </svg>
                    <div className="pointer-events-none absolute text-center">
                      <span className="block text-xl font-extrabold leading-none tracking-tight text-foreground">
                        {balance.total}
                      </span>
                      <span className="mt-0.5 block text-[9px] uppercase tracking-wider text-muted">
                        skills
                      </span>
                    </div>
                  </div>

                  <div className="w-full flex-1 space-y-2">
                    <span className="block text-xs font-bold text-foreground">
                      Skill Domain Breakdown
                    </span>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {(
                        [
                          ['Engineering', 'Engineering', balance.engineering],
                          ['Design', 'Design & UI/UX', balance.design],
                          ['Communication', 'Communication', balance.communication],
                        ] as const
                      ).map(([key, label, val]) => (
                        <div
                          key={key}
                          className="rounded-lg border border-[rgba(209,199,189,0.5)] bg-white/30 p-2"
                        >
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted">
                            <span
                              className="size-2 rounded-full"
                              style={{ backgroundColor: DOMAIN_SWATCH[key] }}
                            />
                            {label}
                          </div>
                          <div className="mt-1 text-xs font-black text-foreground">
                            {val.count} ({val.pct}%)
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="mt-5 space-y-4">
              {selectedStudent.skills.length > 0 && (
                <div>
                  <h4 className="text-label uppercase text-muted">Tech Skills</h4>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {selectedStudent.skills.map((sk) => (
                      <span
                        key={sk}
                        className="rounded-md border border-[rgba(114,56,61,0.22)] bg-[rgba(114,56,61,0.08)] px-2 py-0.5 text-caption font-semibold text-primary"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(selectedStudent.softSkills.length > 0 || selectedStudent.languages.length > 0) && (
                <div>
                  <h4 className="text-label uppercase text-muted">Soft Skills &amp; Languages</h4>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {selectedStudent.softSkills.map((sk) => (
                      <span
                        key={sk}
                        className="rounded-md border border-[rgba(172,156,141,0.55)] bg-[rgba(172,156,141,0.18)] px-2 py-0.5 text-caption font-semibold text-foreground"
                      >
                        {sk}
                      </span>
                    ))}
                    {selectedStudent.languages.map((ln) => (
                      <span
                        key={ln}
                        className="rounded-md border border-[rgba(209,199,189,0.7)] bg-[rgba(239,233,225,0.8)] px-2 py-0.5 text-caption font-semibold text-body"
                      >
                        {ln}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[rgba(209,199,189,0.6)] pt-4">
              <div className="flex flex-wrap gap-3">
                {selectedStudent.githubUrl && (
                  <a
                    href={selectedStudent.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                  >
                    GitHub <ArrowUpRight className="size-3.5" />
                  </a>
                )}
                {selectedStudent.linkedinUrl && (
                  <a
                    href={selectedStudent.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                  >
                    LinkedIn <ArrowUpRight className="size-3.5" />
                  </a>
                )}
                {selectedStudent.resumeUrl && (
                  <a
                    href={selectedStudent.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                  >
                    Résumé <ArrowUpRight className="size-3.5" />
                  </a>
                )}
              </div>

              {(() => {
                const state = inviteState[selectedStudent.userId];
                return (
                  <PremiumButton
                    size="sm"
                    variant={state === 'sent' ? 'glass' : 'primary'}
                    loading={state === 'sending'}
                    disabled={Boolean(state)}
                    magnetic={false}
                    onClick={() => sendInvite(selectedStudent)}
                  >
                    {state === 'sent' ? 'Invite sent' : 'Invite'}
                  </PremiumButton>
                );
              })()}
            </div>
          </Overlay>
        )}
      </AnimatePresence>
    </div>
  );
}
