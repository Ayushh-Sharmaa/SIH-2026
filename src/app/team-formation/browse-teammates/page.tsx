'use client';

import { useCallback, useEffect, useState, useRef, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, m } from 'framer-motion';
import {
  ArrowUpRight,
  Users,
  Search,
  BookOpen,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  Layers,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
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
import { QueryClient } from '@/lib/queryClient';
import { logger } from '@/lib/logger';

interface Student {
  userId: string;
  name: string;
  year: string;
  branch: string;
  skills: string[];
  languages: string[];
  softSkills: string[];
  avatarUrl?: string | null;
  college: string;
  teamStatus: string;
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
const POPULAR_SUGGESTIONS = ['React', 'Python', 'Machine Learning', 'Next.js', 'Figma', 'Node.js', 'Spring Boot'];

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
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [name, setName] = useState('');
  const [college, setCollege] = useState('');
  const [branch, setBranch] = useState('');
  const [year, setYear] = useState('');
  const [skill, setSkill] = useState('');
  const [softSkill, setSoftSkill] = useState('');
  const [language, setLanguage] = useState('');
  const [trackId, setTrackId] = useState('');
  const [inviteState, setInviteState] = useState<Record<string, 'sending' | 'sent'>>({});

  const abortControllerRef = useRef<AbortController | null>(null);
  const latestRequestIdRef = useRef(0);

  // Load Tracks (cached server/client side)
  useEffect(() => {
    async function loadTracks() {
      try {
        const data = await QueryClient.fetch<{ success: boolean; tracks: Track[] }>(
          'sih_theme_list',
          async () => {
            const res = await fetch('/api/tracks');
            return res.json();
          },
          { ttlMs: 300_000 }
        );
        if (data?.success) setTracks(data.tracks);
      } catch (err) {
        logger.error('Fetch tracks failed', err);
      }
    }
    loadTracks();
  }, []);

  const executeSearch = useCallback(
    async (filters: TeammateFilters, page = 1) => {
      const requestId = ++latestRequestIdRef.current;

      // Abort previous in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setLoading(true);
      setHasSearched(true);
      setSearchError(null);

      // Normalized structured cache key incorporating all active filters
      const normalizedFilters = {
        name: filters.name?.trim().toLowerCase() || '',
        college: filters.college?.trim().toLowerCase() || '',
        branch: filters.branch?.trim().toLowerCase() || '',
        year: filters.year?.trim() || '',
        skill: filters.skill?.trim().toLowerCase() || '',
        softSkill: filters.softSkill?.trim() || '',
        language: filters.language?.trim() || '',
        trackId: filters.trackId?.trim() || '',
      };

      const cacheKey = `teammates:${JSON.stringify(normalizedFilters)}:${page}`;

      try {
        const queryParams = new URLSearchParams();
        if (filters.name?.trim()) queryParams.append('name', filters.name.trim());
        if (filters.college?.trim()) queryParams.append('college', filters.college.trim());
        if (filters.branch?.trim()) queryParams.append('branch', filters.branch.trim());
        if (filters.year?.trim() && filters.year !== 'All years') queryParams.append('year', filters.year.trim());
        if (filters.skill?.trim()) queryParams.append('skill', filters.skill.trim());
        if (filters.softSkill?.trim() && filters.softSkill !== 'All soft skills') queryParams.append('softSkill', filters.softSkill.trim());
        if (filters.language?.trim() && filters.language !== 'All languages') queryParams.append('language', filters.language.trim());
        if (filters.trackId?.trim()) queryParams.append('trackId', filters.trackId.trim());
        queryParams.append('page', String(page));

        const data = await QueryClient.fetch<{
          success: boolean;
          students: Student[];
          pagination?: { total: number; totalPages: number };
          error?: string;
        }>(
          cacheKey,
          async () => {
            const res = await fetch(`/api/students?${queryParams.toString()}`, {
              signal: abortControllerRef.current?.signal,
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Failed to retrieve teammates.');
            return json;
          },
          { ttlMs: 15_000 }
        );

        // Stale response protection: only the latest in-flight request can update UI state
        if (requestId !== latestRequestIdRef.current) return;

        if (data.success && data.students) {
          setStudents(data.students);
          setTotalCount(data.pagination?.total ?? data.students.length);
          setTotalPages(data.pagination?.totalPages ?? 1);
          setCurrentPage(page);
          setSearchError(null);
        } else {
          throw new Error(data.error || 'Failed to retrieve teammates.');
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
        if (requestId !== latestRequestIdRef.current) return;
        logger.error('Search teammates error', err);
        setSearchError(err instanceof Error ? err.message : 'Could not load students. Check your connection.');
        toast(err instanceof Error ? err.message : 'Could not load students. Check your connection.', 'error');
      } finally {
        if (requestId === latestRequestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [toast]
  );

  // Debounced search when user types or changes filters
  useEffect(() => {
    const timer = setTimeout(() => {
      executeSearch({ name, college, branch, year, skill, softSkill, language, trackId }, 1);
    }, 300);

    return () => clearTimeout(timer);
  }, [name, college, branch, year, skill, softSkill, language, trackId, executeSearch]);

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    executeSearch({ name, college, branch, year, skill, softSkill, language, trackId }, 1);
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
    executeSearch(EMPTY_TEAMMATE_FILTERS, 1);
  };

  const handleSuggestionClick = (keyword: string) => {
    setSkill(keyword);
    executeSearch({ ...EMPTY_TEAMMATE_FILTERS, skill: keyword }, 1);
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

  const activeFiltersCount = [name, college, branch, year, skill, softSkill, language, trackId].filter(Boolean).length;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground flex flex-col justify-between">
      <Navbar />

      <main className="relative flex-1 py-10">
        <Aurora />
        <Container>
          {/* Header */}
          <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <Reveal>
              <span className="text-label uppercase tracking-widest text-primary font-bold">Talent Directory</span>
              <h1 className="text-display text-foreground mt-1">
                <SplitText text="Browse teammates" />
              </h1>
              <p className="mt-2 text-body text-muted max-w-xl text-base">
                Discover collaborating students for Smart India Hackathon. Search by technical skills, theme interests, branch, and fluency.
              </p>
            </Reveal>

            {hasSearched && (
              <div className="flex gap-4">
                <div className="surface-raised rounded-2xl p-4 border border-[rgba(209,199,189,0.7)] text-center min-w-[110px]">
                  <div className="text-2xl font-black text-foreground">
                    <Counter to={totalCount} duration={1.2} />
                  </div>
                  <div className="text-label uppercase text-muted mt-0.5">Profiles Found</div>
                </div>
                <div className="surface-raised rounded-2xl p-4 border border-[rgba(209,199,189,0.7)] text-center min-w-[110px]">
                  <div className="text-2xl font-black text-primary">
                    <Counter to={activeFiltersCount} duration={1.2} />
                  </div>
                  <div className="text-label uppercase text-muted mt-0.5">Active Filters</div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Left Search / Refine Panel */}
            <div className="lg:col-span-4">
              <div className="surface-raised rounded-3xl border border-[rgba(209,199,189,0.7)] p-6 shadow-e2 lg:sticky lg:top-24">
                <div className="flex items-center justify-between border-b border-[rgba(209,199,189,0.6)] pb-4 mb-5">
                  <div className="flex items-center gap-2 font-bold text-foreground">
                    <Search className="size-4 text-primary" />
                    <span>Search & Refine</span>
                  </div>
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={handleReset}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      <RotateCcw className="size-3" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>

                <form onSubmit={handleSearchSubmit} className="space-y-4">
                  {/* Name or ID */}
                  <div>
                    <FilterLabel>Student Name or Keyword</FilterLabel>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Tanishk, Bansal..."
                      className={CONTROL}
                    />
                  </div>

                  {/* Technical Skill */}
                  <div>
                    <FilterLabel>Technical Skill</FilterLabel>
                    <input
                      type="text"
                      value={skill}
                      onChange={(e) => setSkill(e.target.value)}
                      placeholder="e.g. React, Python, Flutter..."
                      className={CONTROL}
                    />
                  </div>

                  {/* SIH Theme Filter */}
                  <div>
                    <FilterLabel>Theme Interest</FilterLabel>
                    <select
                      value={trackId}
                      onChange={(e) => setTrackId(e.target.value)}
                      className={CONTROL}
                    >
                      <option value="">All Themes</option>
                      {tracks.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.problemStatementCode})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Branch */}
                  <div>
                    <FilterLabel>Department / Branch</FilterLabel>
                    <input
                      type="text"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      placeholder="e.g. CSE, IT, AI/ML..."
                      className={CONTROL}
                    />
                  </div>

                  {/* Year */}
                  <div>
                    <FilterLabel>Year of Study</FilterLabel>
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
                  </div>

                  {/* Soft Skill */}
                  <div>
                    <FilterLabel>Soft Skill</FilterLabel>
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
                  </div>

                  {/* Spoken Language */}
                  <div>
                    <FilterLabel>Spoken Language</FilterLabel>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className={CONTROL}
                    >
                      <option value="">All languages</option>
                      {LANGUAGE_OPTIONS.map((lang) => (
                        <option key={lang} value={lang}>
                          {lang}
                        </option>
                      ))}
                    </select>
                  </div>

                  <PremiumButton
                    type="submit"
                    className="w-full justify-center bg-primary text-on-accent mt-4"
                  >
                    <span>Search Teammates</span>
                    <Search className="size-4" />
                  </PremiumButton>
                </form>
              </div>
            </div>

            {/* Right Results Area */}
            <div className="lg:col-span-8">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <StudentCardSkeleton key={i} />
                  ))}
                </div>
              ) : !hasSearched ? (
                /* Initial Engaging Search Prompt State */
                <div className="surface-raised rounded-3xl border border-[rgba(209,199,189,0.7)] p-10 text-center shadow-e1">
                  <div className="size-16 rounded-3xl bg-[rgba(114,56,61,0.1)] border border-[rgba(114,56,61,0.2)] flex items-center justify-center text-primary mx-auto mb-5">
                    <Sparkles className="size-8" />
                  </div>
                  <h2 className="text-heading text-foreground font-bold mb-2">Find your teammates</h2>
                  <p className="text-body text-muted max-w-md mx-auto text-sm mb-6 leading-relaxed">
                    Search students by technical skills, SIH theme interests, academic branch, or spoken languages using the refine panel on the left.
                  </p>

                  <div className="pt-4 border-t border-[rgba(209,199,189,0.5)]">
                    <p className="text-label uppercase text-muted font-bold mb-3">Popular Searches</p>
                    <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg mx-auto">
                      {POPULAR_SUGGESTIONS.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => handleSuggestionClick(tag)}
                          className="px-3 py-1.5 rounded-full border border-[rgba(209,199,189,0.8)] bg-[rgba(248,246,242,0.8)] text-xs font-semibold text-body hover:border-primary hover:text-primary transition-all duration-200"
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : searchError ? (
                <div className="surface-raised rounded-3xl border border-[rgba(114,56,61,0.3)] bg-[rgba(114,56,61,0.04)] p-12 text-center shadow-e1">
                  <div className="size-14 rounded-2xl bg-[rgba(114,56,61,0.1)] flex items-center justify-center text-primary mx-auto mb-4">
                    <AlertCircle className="size-7" />
                  </div>
                  <h3 className="text-feature text-foreground font-bold">Search Request Failed</h3>
                  <p className="text-body text-muted text-xs mt-2 max-w-md mx-auto">
                    {searchError}
                  </p>
                  <div className="mt-5 flex items-center justify-center gap-3">
                    <PremiumButton
                      size="sm"
                      onClick={() => executeSearch({ name, college, branch, year, skill, softSkill, language, trackId }, currentPage)}
                      className="bg-primary text-on-accent"
                    >
                      <RefreshCw className="size-3.5" />
                      <span>Retry Search</span>
                    </PremiumButton>
                    <button
                      onClick={handleReset}
                      className="px-4 py-2 rounded-xl border border-[rgba(209,199,189,0.7)] text-xs font-semibold text-body hover:bg-white"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              ) : students.length === 0 ? (
                <div className="surface-raised rounded-3xl border border-[rgba(209,199,189,0.7)] p-12 text-center shadow-e1">
                  <div className="size-14 rounded-2xl bg-[rgba(209,199,189,0.3)] flex items-center justify-center text-muted mx-auto mb-4">
                    <Users className="size-7" />
                  </div>
                  <h3 className="text-feature text-foreground font-bold">No matching teammates found</h3>
                  <p className="text-body text-muted text-xs mt-2 max-w-md mx-auto">
                    Try broadening your filters or searching for related skills like JavaScript, Python, or Web Development.
                  </p>
                  <button
                    onClick={handleReset}
                    className="mt-5 px-5 py-2 rounded-xl bg-primary text-on-accent text-xs font-semibold"
                  >
                    Clear All Filters
                  </button>
                </div>
              ) : (
                /* Results Grid with Modular Teammate Cards */
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {students.map((student) => (
                      <SpotlightCard key={student.userId} className="rounded-3xl h-full" intensity={0.14}>
                        <div className="surface-raised h-full rounded-3xl p-6 border border-[rgba(209,199,189,0.7)] flex flex-col justify-between shadow-e2 transition-all hover:shadow-e4">
                          <div>
                            {/* Identity Section */}
                            <div className="flex items-start justify-between gap-2.5 mb-4">
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="shrink-0">
                                  <ProfileAvatar avatarUrl={student.avatarUrl} name={student.name} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h3 className="text-feature font-bold text-foreground truncate">
                                    {student.name}
                                  </h3>
                                  <p className="text-xs text-muted flex items-center gap-1 mt-0.5 truncate">
                                    <GraduationCap className="size-3.5 shrink-0" />
                                    <span className="truncate">{student.branch || 'Student'} • {student.year || 'General'}</span>
                                  </p>
                                </div>
                              </div>

                              <span className="shrink-0 self-start inline-flex items-center gap-1 rounded-full border border-[rgba(172,156,141,0.5)] bg-[rgba(248,246,242,0.8)] px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                                <ShieldCheck className="size-3" />
                                <span>Available</span>
                              </span>
                            </div>

                            {/* Theme Section */}
                            {student.interests && student.interests.length > 0 && (
                              <div className="mb-4 rounded-2xl border border-[rgba(209,199,189,0.6)] bg-[rgba(248,246,242,0.6)] p-3">
                                <div className="text-[10px] uppercase font-bold tracking-wider text-muted flex items-center gap-1 mb-1.5">
                                  <Layers className="size-3 text-primary" />
                                  <span>Theme Interests</span>
                                </div>
                                <div className="space-y-1">
                                  {student.interests.slice(0, 2).map((interest, idx) => (
                                    <div key={idx} className="text-xs text-foreground font-medium truncate">
                                      <span className="font-semibold text-primary">{interest.code}</span> — {interest.name}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Technical Skills Section */}
                            {student.skills && student.skills.length > 0 && (
                              <div className="mb-3">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-muted block mb-1.5">
                                  Technical Skills
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {student.skills.slice(0, 5).map((sk) => (
                                    <span
                                      key={sk}
                                      className="rounded-lg border border-[rgba(114,56,61,0.25)] bg-[rgba(114,56,61,0.07)] px-2 py-0.5 text-[11px] font-medium text-primary"
                                    >
                                      {sk}
                                    </span>
                                  ))}
                                  {student.skills.length > 5 && (
                                    <span className="rounded-lg border border-[rgba(209,199,189,0.7)] px-2 py-0.5 text-[11px] text-muted">
                                      +{student.skills.length - 5}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Soft Skills & Languages */}
                            {(student.softSkills?.length > 0 || student.languages?.length > 0) && (
                              <div className="mb-4">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-muted block mb-1.5">
                                  Soft Skills & Languages
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {student.softSkills?.slice(0, 2).map((ss) => (
                                    <span
                                      key={ss}
                                      className="rounded-lg border border-[rgba(209,199,189,0.7)] bg-[rgba(239,233,225,0.7)] px-2 py-0.5 text-[11px] text-body"
                                    >
                                      {ss}
                                    </span>
                                  ))}
                                  {student.languages?.slice(0, 2).map((lang) => (
                                    <span
                                      key={lang}
                                      className="rounded-lg border border-[rgba(209,199,189,0.7)] bg-[rgba(239,233,225,0.7)] px-2 py-0.5 text-[11px] text-body"
                                    >
                                      {lang}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Action Footer */}
                          <div className="pt-4 border-t border-[rgba(209,199,189,0.5)] flex items-center justify-between gap-3">
                            <Link
                              href={`/students/${student.userId}`}
                              className="text-xs font-semibold text-muted hover:text-foreground flex items-center gap-1 transition-colors"
                            >
                              <span>View Profile</span>
                              <ArrowUpRight className="size-3" />
                            </Link>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                sendInvite(student);
                              }}
                              disabled={inviteState[student.userId] === 'sent' || inviteState[student.userId] === 'sending'}
                              className="px-3.5 py-1.5 rounded-xl bg-primary text-on-accent text-xs font-semibold shadow-sm hover:opacity-90 disabled:opacity-50 transition-all"
                            >
                              {inviteState[student.userId] === 'sent'
                                ? 'Invited ✓'
                                : inviteState[student.userId] === 'sending'
                                ? 'Sending…'
                                : 'Invite to Team'}
                            </button>
                          </div>
                        </div>
                      </SpotlightCard>
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-3 pt-6">
                      <button
                        onClick={() => executeSearch({ name, college, branch, year, skill, softSkill, language, trackId }, currentPage - 1)}
                        disabled={currentPage <= 1}
                        className="px-3 py-1.5 rounded-xl border border-[rgba(209,199,189,0.7)] text-xs font-semibold text-body disabled:opacity-40 flex items-center gap-1 hover:bg-[rgba(209,199,189,0.2)]"
                      >
                        <ChevronLeft className="size-4" />
                        <span>Previous</span>
                      </button>

                      <span className="text-xs font-semibold text-muted">
                        Page {currentPage} of {totalPages}
                      </span>

                      <button
                        onClick={() => executeSearch({ name, college, branch, year, skill, softSkill, language, trackId }, currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className="px-3 py-1.5 rounded-xl border border-[rgba(209,199,189,0.7)] text-xs font-semibold text-body disabled:opacity-40 flex items-center gap-1 hover:bg-[rgba(209,199,189,0.2)]"
                      >
                        <span>Next</span>
                        <ChevronRight className="size-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
