'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, m } from 'framer-motion';
import { ArrowUpRight, Users, BookOpen, GraduationCap, Calendar, Compass, ShieldCheck } from 'lucide-react';
import { Container, EmptyState, StudentCardSkeleton } from '@/components/ui';
import Icon from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import Image from 'next/image';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import {
  Aurora,
  Counter,
  PremiumButton,
  Reveal,
  SplitText,
  TiltCard,
  SpotlightCard,
  DURATION,
  EASE,
  SPRING,
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
  college: string;
  teamStatus: string;
  team: {
    id: string;
    teamCode: string;
    name: string;
    status: string;
    leaderId: string;
    mentor?: { userId: string; name: string; designation: string; organization: string } | null;
  } | null;
  interests: Array<{ code: string; name: string }>;
}

interface Track {
  id: string;
  problemStatementCode: string;
  name: string;
}

interface TeammateFilters {
  name: string;
  college: string;
  branch: string;
  year: string;
  skill: string;
  softSkill: string;
  language: string;
  trackId: string;
}

const EMPTY_TEAMMATE_FILTERS: TeammateFilters = {
  name: '',
  college: '',
  branch: '',
  year: '',
  skill: '',
  softSkill: '',
  language: '',
  trackId: '',
};

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

export default function FindTeammatesPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filters state
  const [name, setName] = useState('');
  const [college, setCollege] = useState('');
  const [branch, setBranch] = useState('');
  const [year, setYear] = useState('');
  const [skill, setSkill] = useState('');
  const [softSkill, setSoftSkill] = useState('');
  const [language, setLanguage] = useState('');
  const [trackId, setTrackId] = useState('');
  const [inviteState, setInviteState] = useState<Record<string, 'sending' | 'sent'>>({});
  const [currentPage, setCurrentPage] = useState(1);

  const fetchTeammates = useCallback(
    async (filters: TeammateFilters) => {
      setRefreshing(true);
      try {
        const queryParams = new URLSearchParams();
        if (filters.name) queryParams.append('name', filters.name);
        if (filters.college) queryParams.append('college', filters.college);
        if (filters.branch) queryParams.append('branch', filters.branch);
        if (filters.year) queryParams.append('year', filters.year);
        if (filters.skill) queryParams.append('skill', filters.skill);
        if (filters.softSkill) queryParams.append('softSkill', filters.softSkill);
        if (filters.language) queryParams.append('language', filters.language);
        if (filters.trackId) queryParams.append('trackId', filters.trackId);

        const res = await fetch(`/api/students?${queryParams.toString()}`);
        const data = await res.json();
        if (data.success) { setStudents(data.students); setCurrentPage(1); }
      } catch (err) {
        logger.error('Fetch teammates error', err);
        toast('Could not load students. Check your connection.', 'error');
      } finally {
        setRefreshing(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    async function initPage() {
      const loadTracks = async () => {
        try {
        const res = await fetch('/api/tracks');
        const data = await res.json();
        if (data.success) setTracks(data.tracks);
        } catch (err) {
          logger.error('Fetch tracks failed', err);
          toast('Could not load track filters. Please refresh.', 'error');
        }
      };
      await Promise.all([loadTracks(), fetchTeammates(EMPTY_TEAMMATE_FILTERS)]);
      setLoading(false);
    }
    initPage();
  }, [fetchTeammates, toast]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    fetchTeammates({ name, college, branch, year, skill, softSkill, language, trackId });
  };

  const itemsPerPage = 20;
  const totalPages = Math.max(1, Math.ceil(students.length / itemsPerPage));
  const paginatedTeammates = students.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleReset = () => {
    setName('');
    setCollege('');
    setBranch('');
    setYear('');
    setSkill('');
    setSoftSkill('');
    setLanguage('');
    setTrackId('');
    fetchTeammates(EMPTY_TEAMMATE_FILTERS);
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
      toast(`Invitation sent to ${student.name}.`, 'success');
    } catch (error: unknown) {
      setInviteState((previous) => {
        const next = { ...previous };
        delete next[student.userId];
        return next;
      });
      toast(error instanceof Error ? error.message : 'Could not send the invitation.', 'error');
    }
  };

  const activeFilters = [name, college, branch, year, skill, softSkill, language, trackId].filter(Boolean).length;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />

      <main id="main" className="flex-1">
        {/* Header Section */}
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
                text="Browse teammates"
                className="mt-3 text-title text-foreground"
                delay={0.08}
              />
              <Reveal delay={0.28} className="mt-3">
                <p className="max-w-xl text-sm leading-relaxed text-body">
                  Browse students looking for SIH teams. Browse collaborators by college, branch, year, skills and track interest.
                </p>
              </Reveal>
            </div>

            <Reveal direction="left" delay={0.2}>
              <div className="surface-raised flex items-center gap-5 rounded-2xl px-5 py-4">
                <div>
                  <div className="text-3xl font-extrabold tracking-tight text-foreground">
                    <m.span layout><Counter to={students.length} duration={1.2} /></m.span>
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

        {/* Filter Rail & Results */}
        <section className="surface-sunken">
          <Container width="wide" className="grid grid-cols-1 gap-6 py-10 lg:grid-cols-[280px_1fr]">
            {/* Filter rail */}
            <Reveal direction="right">
              <form
                onSubmit={handleSearch}
                className="surface-raised rounded-3xl p-6 lg:sticky lg:top-28"
              >
                <h2 className="text-feature text-foreground">Refine</h2>
                <div className="my-5 h-px bg-gradient-to-r from-[rgba(172,156,141,0.55)] to-transparent" />

                <div className="space-y-4">
                  <label className="block">
                    <FilterLabel>Student or Team ID</FilterLabel>
                    <input
                      type="text"
                      placeholder="Name, SIH100, or team name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={CONTROL}
                    />
                  </label>

                  <label className="block">
                    <FilterLabel>Tech skill</FilterLabel>
                    <input
                      type="text"
                      placeholder="e.g. React, Python"
                      value={skill}
                      onChange={(e) => setSkill(e.target.value)}
                      className={CONTROL}
                    />
                  </label>

                  <label className="block">
                    <FilterLabel>College</FilterLabel>
                    <input
                      type="text"
                      placeholder="e.g. GL Bajaj"
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      className={CONTROL}
                    />
                  </label>

                  <label className="block">
                    <FilterLabel>Department (Branch)</FilterLabel>
                    <input
                      type="text"
                      placeholder="e.g. CSE, IT"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className={CONTROL}
                    />
                  </label>

                  <label className="block">
                    <FilterLabel>Year</FilterLabel>
                    <select
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className={CONTROL}
                    >
                      <option value="">All years</option>
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                    </select>
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
                    className="flex-1"
                  >
                    Apply
                  </PremiumButton>
                  <PremiumButton
                    variant="glass"
                    size="sm"
                    onClick={handleReset}
                    className="flex-1"
                  >
                    Reset
                  </PremiumButton>
                </div>
              </form>
            </Reveal>

            {/* Results Grid */}
            <div>
              {loading ? (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 6 }, (_, i) => (
                    <StudentCardSkeleton key={i} />
                  ))}
                </div>
              ) : paginatedTeammates.length > 0 ? (
                <>
                  <m.div
                  layout
                  className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
                >
                  <AnimatePresence mode="popLayout" initial={false}>
                    {paginatedTeammates.map((student, i) => {
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
                            <SpotlightCard className="h-full rounded-3xl" intensity={0.08}>
                              <article className="surface-raised flex h-full flex-col justify-between rounded-3xl p-5 sm:p-6">
                                  <m.div
                                    whileTap={{ scale: 0.99 }}
                                    transition={SPRING.snappy}
                                    onClick={() => router.push(`/students/${student.userId}`)}
                                    className="space-y-4 cursor-pointer group/card"
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex items-center gap-3 min-w-0">
                                        <ProfileAvatar
                                          avatarUrl={student.avatarUrl}
                                          name={student.name}
                                        />
                                        <div className="min-w-0">
                                          <h3 className="truncate text-feature text-foreground group-hover/card:text-primary transition-colors duration-200 font-extrabold">
                                            {student.name}
                                          </h3>
                                          <span className="mt-0.5 block truncate text-caption text-muted flex items-center gap-1">
                                            <BookOpen className="size-3 shrink-0" />
                                            {student.branch} · {student.year}
                                          </span>
                                        </div>
                                      </div>
                                      <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase shrink-0 flex items-center gap-0.5 ${student.team ? 'border-[rgba(172,156,141,0.55)] bg-[rgba(172,156,141,0.18)] text-body' : 'bg-[rgba(114,56,61,0.08)] border-[rgba(114,56,61,0.2)] text-primary'}`}>
                                        <ShieldCheck className="size-2.5" /> {student.team ? 'Already in team' : 'Available'}
                                      </span>
                                    </div>

                                    {/* Track Interests (Header placement for high prominence) */}
                                    {student.interests && student.interests.length > 0 && (
                                      <div className="rounded-2xl border border-[rgba(114,56,61,0.2)] bg-gradient-to-br from-[rgba(114,56,61,0.06)] to-[rgba(114,56,61,0.01)] p-3 space-y-1.5">
                                        <span className="block text-[9px] font-black uppercase tracking-wider text-primary">
                                          Track Interests
                                        </span>
                                        <div className="flex flex-wrap gap-1">
                                          {student.interests.map((theme) => (
                                            <div
                                              key={theme.code}
                                              className="inline-flex items-center gap-1.5 rounded-lg border border-[rgba(114,56,61,0.18)] bg-white/80 px-2 py-0.5 text-[10px] font-bold text-primary shadow-sm"
                                            >
                                              <span className="font-extrabold tracking-wider bg-[rgba(114,56,61,0.09)] px-1.5 py-0.5 rounded text-[9px]">
                                                {theme.code}
                                              </span>
                                              <span className="max-w-[140px] truncate text-foreground/90 font-bold">
                                                {theme.name}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* College info */}
                                    <div className="text-[11px] text-muted flex items-center gap-1 border-t border-b border-[rgba(209,199,189,0.4)] py-1.5">
                                      <GraduationCap className="size-3.5 shrink-0 text-primary" />
                                      <span className="truncate">{student.college}</span>
                                    </div>

                                    {student.team && (
                                      <div className="rounded-xl border border-[rgba(114,56,61,0.18)] bg-[rgba(114,56,61,0.06)] px-3 py-2 text-xs">
                                        <span className="font-black text-primary">{student.team.teamCode}</span>
                                        <span className="text-body"> · {student.team.name}</span>
                                        {student.team.mentor && (
                                          <span className="mt-1 block text-caption text-muted">Mentor: {student.team.mentor.name}</span>
                                        )}
                                      </div>
                                    )}

                                    {/* Tech skills */}
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

                                    {/* Soft skills */}
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
                                  </m.div>

                                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[rgba(209,199,189,0.6)] pt-4">
                                    <PremiumButton
                                      size="sm"
                                      variant="glass"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(`/students/${student.userId}`);
                                      }}
                                    >
                                      View Profile
                                    </PremiumButton>

                                    <PremiumButton
                                      size="sm"
                                      variant={state === 'sent' || student.team ? 'glass' : 'primary'}
                                      loading={state === 'sending'}
                                      disabled={Boolean(state) || Boolean(student.team)}
                                      magnetic={false}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        sendInvite(student);
                                      }}
                                    >
                                      {student.team ? 'Already in team' : state === 'sent' ? 'Invite sent' : 'Invite'}
                                    </PremiumButton>
                                  </div>
                              </article>
                            </SpotlightCard>
                          </TiltCard>
                        </m.div>
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
                  icon={Users}
                  title="No teammate profiles match these filters."
                  description="Clear a filter or widen your search to discover more collaborators."
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
    </div>
  );
}
