'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, m } from 'framer-motion';
import { ArrowUpRight, Users, BookOpen, GraduationCap, Calendar, Compass, ShieldCheck } from 'lucide-react';
import { Container, EmptyState } from '@/components/ui';
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
  interests: string[];
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

  const fetchTeammates = useCallback(
    async (filters?: {
      name: string;
      college: string;
      branch: string;
      year: string;
      skill: string;
      softSkill: string;
      language: string;
      trackId: string;
    }) => {
      const f = filters ?? { name, college, branch, year, skill, softSkill, language, trackId };
      setRefreshing(true);
      try {
        const queryParams = new URLSearchParams();
        if (f.name) queryParams.append('name', f.name);
        if (f.college) queryParams.append('college', f.college);
        if (f.branch) queryParams.append('branch', f.branch);
        if (f.year) queryParams.append('year', f.year);
        if (f.skill) queryParams.append('skill', f.skill);
        if (f.softSkill) queryParams.append('softSkill', f.softSkill);
        if (f.language) queryParams.append('language', f.language);
        if (f.trackId) queryParams.append('trackId', f.trackId);

        const res = await fetch(`/api/students?${queryParams.toString()}`);
        const data = await res.json();
        if (data.success) setStudents(data.students);
      } catch (err) {
        logger.error('Fetch teammates error', err);
        toast('Could not load students. Check your connection.', 'error');
      } finally {
        setRefreshing(false);
      }
    },
    [name, college, branch, year, skill, softSkill, language, trackId, toast]
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
      await fetchTeammates({
        name: '',
        college: '',
        branch: '',
        year: '',
        skill: '',
        softSkill: '',
        language: '',
        trackId: '',
      });
      setLoading(false);
    }
    initPage();
  }, []);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    fetchTeammates();
  };

  const handleReset = () => {
    setName('');
    setCollege('');
    setBranch('');
    setYear('');
    setSkill('');
    setSoftSkill('');
    setLanguage('');
    setTrackId('');
    fetchTeammates({
      name: '',
      college: '',
      branch: '',
      year: '',
      skill: '',
      softSkill: '',
      language: '',
      trackId: '',
    });
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
                text="Find teammates"
                className="mt-3 text-title text-foreground"
                delay={0.08}
              />
              <Reveal delay={0.28} className="mt-3">
                <p className="max-w-xl text-sm leading-relaxed text-body">
                  Browse students looking for SIH teams. Find collaborators by college, branch, year, skills and track interest.
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
                    <FilterLabel>Student Name</FilterLabel>
                    <input
                      type="text"
                      placeholder="Search name"
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
                            <SpotlightCard className="h-full rounded-3xl" intensity={0.08}>
                              <article className="surface-raised flex h-full flex-col justify-between rounded-3xl p-5 sm:p-6">
                                <div
                                  onClick={() => router.push(`/profile/${student.userId}`)}
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
                                    <span className="rounded-full bg-[rgba(114,56,61,0.08)] border border-[rgba(114,56,61,0.2)] px-2 py-0.5 text-[9px] font-black uppercase text-primary shrink-0 flex items-center gap-0.5">
                                      <ShieldCheck className="size-2.5" /> Available
                                    </span>
                                  </div>

                                  {/* College info */}
                                  <div className="text-[11px] text-muted flex items-center gap-1 border-t border-b border-[rgba(209,199,189,0.4)] py-1.5">
                                    <GraduationCap className="size-3.5 shrink-0 text-primary" />
                                    <span className="truncate">{student.college}</span>
                                  </div>

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

                                  {/* Interests (trackInterest) */}
                                  {student.interests && student.interests.length > 0 && (
                                    <div>
                                      <FilterLabel>Track Interests</FilterLabel>
                                      <div className="flex flex-wrap gap-1.5">
                                        {student.interests.map((theme) => (
                                          <span
                                            key={theme}
                                            className="rounded-md border border-[rgba(209,199,189,0.7)] bg-[rgba(239,233,225,0.4)] px-2 py-0.5 text-caption font-semibold text-muted flex items-center gap-1"
                                          >
                                            <Compass className="size-3 text-primary shrink-0" />
                                            <span className="max-w-[120px] truncate">{theme}</span>
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}

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
                            </SpotlightCard>
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
