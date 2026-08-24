'use client';

import { useCallback, useEffect, useState, useRef, type FormEvent } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { Search } from 'lucide-react';
import { Container, StudentCardSkeleton } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import {
  PremiumButton,
  DURATION,
  EASE,
} from '@/components/motion';
import {
  DirectoryHero,
  DirectorySearchDeck,
  DirectoryResultsBar,
  DirectoryPagination,
  DirectoryEmptyState,
  TeammateCard,
  type Student,
} from '@/components/directory';
import { QueryClient } from '@/lib/queryClient';
import { logger } from '@/lib/logger';

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

const SOFT_SKILL_OPTIONS = [
  'PPT Making',
  'Public Speaking/Presenting',
  'Technical Writing',
  'UI/UX Design',
  'Video Editing',
  'Management',
];
const LANGUAGE_OPTIONS = ['English', 'Hindi'];
const POPULAR_SUGGESTIONS = [
  'React',
  'Python',
  'Machine Learning',
  'Next.js',
  'Figma',
  'Node.js',
  'Spring Boot',
];

function FilterLabel({ children }: { children: string }) {
  return (
    <span className="mb-1.5 block text-label font-bold uppercase text-muted">
      {children}
    </span>
  );
}

const CONTROL =
  'w-full rounded-xl border border-[rgba(209,199,189,0.8)] bg-[rgba(248,246,242,0.65)] px-3.5 py-2 text-sm text-foreground outline-none transition-[border-color,box-shadow,background-color] duration-200 focus:border-primary focus:bg-[rgba(248,246,242,0.95)] focus:shadow-[0_0_0_4px_rgba(114,56,61,0.10)]';

export default function FindTeammatesPage() {
  const { toast } = useToast();
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

  // Load Tracks (cached in QueryClient under 'sih_theme_list')
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
    const isFilterActive = Boolean(
      (name && name.trim().length >= 2) ||
      college ||
      branch ||
      year ||
      skill ||
      softSkill ||
      language ||
      trackId
    );

    if (!isFilterActive) {
      if (hasSearched && !name && !college && !branch && !year && !skill && !softSkill && !language && !trackId) {
        setStudents([]);
        setHasSearched(false);
        setLoading(false);
        setTotalCount(0);
        setTotalPages(1);
      } else {
        setLoading(false);
      }
      return;
    }

    const timer = setTimeout(() => {
      executeSearch({ name, college, branch, year, skill, softSkill, language, trackId }, currentPage);
    }, 300);

    return () => clearTimeout(timer);
  }, [name, college, branch, year, skill, softSkill, language, trackId, executeSearch, currentPage, hasSearched]);

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
    setStudents([]);
    setHasSearched(false);
    setTotalCount(0);
    setTotalPages(1);
    setCurrentPage(1);
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

  const suggestions = POPULAR_SUGGESTIONS.map((tag) => ({
    label: tag,
    onClick: () => handleSuggestionClick(tag),
  }));

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />

      <main id="main" className="flex-1">
        {/* Unified Directory Hero */}
        <DirectoryHero
          eyebrow="Talent directory"
          title="Browse teammates"
          description="Discover collaborating students for Smart India Hackathon. Search by technical skills, theme interests, branch, and fluency."
          totalCount={totalCount || students.length}
          totalCountLabel="profiles found"
          activeFiltersCount={activeFiltersCount}
          activeFiltersLabel="active filters"
        />

        {/* Directory Workspace: Search-First Deck & Results */}
        <section className="surface-sunken border-t border-[rgba(209,199,189,0.5)] py-10">
          <Container width="wide" className="space-y-8">
            {/* Primary Search Command Deck */}
            <DirectorySearchDeck
              heading="Search & Refine Teammates"
              subheading="Filter available students by technical abilities, SIH ministry themes, academic branch, or soft skills"
              searchValue={name}
              onSearchChange={setName}
              searchPlaceholder="Search student name, skills, or keyword (e.g. Tanishk, React, Python)..."
              onSubmit={handleSearchSubmit}
              onReset={handleReset}
              hasActiveFilters={activeFiltersCount > 0}
              activeFiltersCount={activeFiltersCount}
              isSearching={loading}
              suggestions={suggestions}
            >
              {/* Responsive Filter Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <label className="block">
                  <FilterLabel>Technical Skill</FilterLabel>
                  <input
                    type="text"
                    value={skill}
                    onChange={(e) => setSkill(e.target.value)}
                    placeholder="e.g. React, Flutter"
                    className={CONTROL}
                  />
                </label>

                <label className="block">
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
                </label>

                <label className="block">
                  <FilterLabel>Department / Branch</FilterLabel>
                  <input
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="e.g. CSE, IT, AI/ML"
                    className={CONTROL}
                  />
                </label>

                <label className="block">
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
                </label>

                <label className="block">
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
                </label>

                <label className="block">
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
                </label>
              </div>
            </DirectorySearchDeck>

            {/* Results Section */}
            <div>
              {loading ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <StudentCardSkeleton key={i} />
                  ))}
                </div>
              ) : !hasSearched ? (
                /* Unsearched Discovery Prompt */
                <DirectoryEmptyState
                  variant="unsearched"
                  title="Find your teammates"
                  description="Search students by technical skills, SIH theme interests, academic branch, or spoken languages using the search command deck above."
                  action={
                    <PremiumButton
                      size="sm"
                      onClick={() => executeSearch(EMPTY_TEAMMATE_FILTERS, 1)}
                      className="bg-primary text-on-accent"
                    >
                      <Search className="size-3.5" />
                      <span>Browse All Available Teammates</span>
                    </PremiumButton>
                  }
                  suggestions={suggestions.slice(0, 4)}
                />
              ) : searchError ? (
                /* Error State */
                <DirectoryEmptyState
                  variant="error"
                  errorMessage={searchError}
                  onRetry={() => executeSearch({ name, college, branch, year, skill, softSkill, language, trackId }, currentPage)}
                  onReset={handleReset}
                />
              ) : students.length === 0 ? (
                /* 0-Match Empty State */
                <DirectoryEmptyState
                  variant="no-results"
                  title="No matching teammates found"
                  description="Try broadening your filters or searching for related skills like JavaScript, Python, or Web Development."
                  onReset={handleReset}
                />
              ) : (
                /* Results Grid */
                <div>
                  <DirectoryResultsBar
                    count={totalCount || students.length}
                    itemLabel="teammates"
                    isSearching={loading}
                    hasActiveFilters={activeFiltersCount > 0}
                  />

                  <m.div
                    layout
                    className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
                  >
                    <AnimatePresence mode="popLayout" initial={false}>
                      {students.map((student, i) => (
                        <m.div
                          key={student.userId}
                          layout
                          initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
                          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                          exit={{ opacity: 0, scale: 0.97, filter: 'blur(6px)' }}
                          transition={{
                            duration: DURATION.card,
                            ease: EASE.outExpo,
                            delay: Math.min(i * 0.03, 0.3),
                          }}
                        >
                          <TeammateCard
                            student={student}
                            inviteState={inviteState[student.userId]}
                            onSendInvite={sendInvite}
                          />
                        </m.div>
                      ))}
                    </AnimatePresence>
                  </m.div>

                  {/* Bounded Cursor/Page Navigation */}
                  <DirectoryPagination
                    hasPrevious={currentPage > 1}
                    hasNext={currentPage < totalPages}
                    onPrevious={() => {
                      const prev = Math.max(1, currentPage - 1);
                      setCurrentPage(prev);
                      executeSearch({ name, college, branch, year, skill, softSkill, language, trackId }, prev);
                    }}
                    onNext={() => {
                      const next = currentPage + 1;
                      setCurrentPage(next);
                      executeSearch({ name, college, branch, year, skill, softSkill, language, trackId }, next);
                    }}
                    itemSummary={totalPages > 1 ? `Page ${currentPage} of ${totalPages}` : undefined}
                  />
                </div>
              )}
            </div>
          </Container>
        </section>
      </main>

      <Footer />
    </div>
  );
}
