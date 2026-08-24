'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { Search } from 'lucide-react';
import { Container, TeamCardSkeleton } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useEscapeKey, useFocusTrap, useScrollLock } from '@/hooks/useFocusTrap';
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
  TeamCard,
  type Team,
} from '@/components/directory';
import { QueryClient } from '@/lib/queryClient';
import { logger } from '@/lib/logger';

interface TeamFilters {
  search: string;
  domain: string;
  skill: string;
  leader: string;
  size: string;
  status: string;
}

interface TeamViewer {
  role: string;
  hasTeam: boolean;
  canJoin: boolean;
}

const EMPTY_FILTERS: TeamFilters = {
  search: '',
  domain: '',
  skill: '',
  leader: '',
  size: '',
  status: '',
};

function FilterLabel({ children }: { children: string }) {
  return (
    <span className="mb-1.5 block text-label uppercase text-muted font-bold">
      {children}
    </span>
  );
}

const CONTROL =
  'w-full rounded-xl border border-[rgba(209,199,189,0.8)] bg-[rgba(248,246,242,0.65)] px-3.5 py-2 text-sm text-foreground outline-none transition-[border-color,box-shadow,background-color] duration-200 focus:border-primary focus:bg-[rgba(248,246,242,0.95)] focus:shadow-[0_0_0_4px_rgba(114,56,61,0.10)]';

function JoinRequestModal({
  team,
  onClose,
  onSubmit,
}: {
  team: Team;
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
        aria-labelledby="join-team-title"
        tabIndex={-1}
        initial={{ opacity: 0, y: 28, scale: 0.97, filter: 'blur(8px)' }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: 16, scale: 0.98, filter: 'blur(6px)' }}
        transition={{ duration: DURATION.card, ease: EASE.outExpo }}
        className="surface-overlay relative max-h-[88vh] w-full max-w-md overflow-y-auto rounded-container p-6 text-foreground shadow-[0_12px_40px_rgba(50,45,41,0.22)]"
      >
        <h3 id="join-team-title" className="text-feature font-bold text-foreground">
          Join {team.name}
        </h3>
        <p className="mt-2 text-xs text-muted leading-relaxed">
          Introduce yourself to the team leader. Highlight your tech stack and how you can contribute.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label className="block">
            <FilterLabel>Message (Optional)</FilterLabel>
            <textarea
              rows={4}
              placeholder="e.g. Hi! I'm a frontend developer skilled in React, Tailwind and Framer Motion. I would love to build your client-side UI."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className={`${CONTROL} resize-none`}
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

export default function FindTeamsPage() {
  const { toast } = useToast();

  const [teams, setTeams] = useState<Team[]>([]);
  const [viewer, setViewer] = useState<TeamViewer | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState<{ total: number; totalPages: number; page: number }>({
    total: 0,
    totalPages: 1,
    page: 1,
  });

  // Search & Filter state
  const [hasSearched, setHasSearched] = useState(false);
  const [search, setSearch] = useState('');
  const [domain, setDomain] = useState('');
  const [skill, setSkill] = useState('');
  const [leader, setLeader] = useState('');
  const [size, setSize] = useState('');
  const [status, setStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals state
  const [activeRequestTeam, setActiveRequestTeam] = useState<Team | null>(null);
  const [submittingRequest, setSubmittingRequest] = useState<Record<string, 'sending' | 'sent'>>({});
  const abortRef = useRef<AbortController | null>(null);

  const fetchTeams = useCallback(
    async (filters: TeamFilters, page = 1) => {
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();
      const signal = abortRef.current.signal;

      setRefreshing(true);
      setHasSearched(true);
      try {
        const queryParams = new URLSearchParams();
        if (filters.search) queryParams.append('search', filters.search);
        if (filters.domain) queryParams.append('domain', filters.domain);
        if (filters.skill) queryParams.append('skill', filters.skill);
        if (filters.leader) queryParams.append('leader', filters.leader);
        if (filters.size) queryParams.append('size', filters.size);
        if (filters.status) queryParams.append('status', filters.status);
        queryParams.append('page', String(page));

        const cacheKey = `teams:${(filters.search || '').trim().toLowerCase()}:${(filters.domain || '').trim().toLowerCase()}:${(filters.skill || '').trim().toLowerCase()}:${(filters.leader || '').trim().toLowerCase()}:${filters.size || ''}:${(filters.status || '').trim().toLowerCase()}:${page}`;
        const data = await QueryClient.fetch<any>(
          cacheKey,
          async () => {
            const res = await fetch(`/api/teams?${queryParams.toString()}`, { signal });
            return res.json();
          },
          { ttlMs: 30_000 }
        );

        if (data?.success) {
          setTeams(data.teams || []);
          setViewer(data.viewer || null);
          setPagination(data.pagination || { total: data.teams?.length || 0, totalPages: 1, page });
          setCurrentPage(page);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
        logger.error('Fetch teams error', err);
        toast('Could not load teams. Check your connection.', 'error');
      } finally {
        setRefreshing(false);
      }
    },
    [toast]
  );

  // 300ms Debounced search on active filters
  useEffect(() => {
    const isFilterActive = Boolean(
      (search && search.trim().length >= 2) ||
      domain ||
      skill ||
      leader ||
      size ||
      status
    );

    if (!isFilterActive) {
      if (hasSearched && !search && !domain && !skill && !leader && !size && !status) {
        setTeams([]);
        setHasSearched(false);
        setLoading(false);
        setPagination({ total: 0, totalPages: 1, page: 1 });
      } else {
        setLoading(false);
      }
      return;
    }

    const handler = setTimeout(() => {
      fetchTeams({ search, domain, skill, leader, size, status }, currentPage).finally(() => {
        setLoading(false);
      });
    }, 300);

    return () => clearTimeout(handler);
  }, [search, domain, skill, leader, size, status, currentPage, fetchTeams, hasSearched]);

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    fetchTeams({ search, domain, skill, leader, size, status }, 1);
  };

  const totalPages = Math.max(1, pagination.totalPages);

  const handleReset = () => {
    setSearch('');
    setDomain('');
    setSkill('');
    setLeader('');
    setSize('');
    setStatus('');
    setTeams([]);
    setHasSearched(false);
    setPagination({ total: 0, totalPages: 1, page: 1 });
    setCurrentPage(1);
  };

  const handleSuggestionClick = (field: 'domain' | 'skill' | 'status', value: string) => {
    if (field === 'domain') setDomain(value);
    if (field === 'skill') setSkill(value);
    if (field === 'status') setStatus(value);
    fetchTeams({
      ...EMPTY_FILTERS,
      [field]: value,
    }, 1);
  };

  const submitJoinRequest = async (message: string) => {
    if (!activeRequestTeam) return;
    const team = activeRequestTeam;
    setSubmittingRequest((prev) => ({ ...prev, [team.id]: 'sending' }));

    try {
      const res = await fetch('/api/join-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId: team.id, message }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send request.');
      }

      setSubmittingRequest((prev) => ({ ...prev, [team.id]: 'sent' }));
      toast(`Successfully requested to join "${team.name}"!`, 'success');
    } catch (err: unknown) {
      setSubmittingRequest((prev) => {
        const next = { ...prev };
        delete next[team.id];
        return next;
      });
      toast(err instanceof Error ? err.message : 'Failed to submit join request.', 'error');
    }
  };

  const activeFilters = [search, domain, skill, leader, size, status].filter(Boolean).length;
  const userHasTeam = viewer?.hasTeam ?? false;

  const suggestions = [
    { label: 'Health / MedTech', onClick: () => handleSuggestionClick('domain', 'Health') },
    { label: 'Agriculture / IoT', onClick: () => handleSuggestionClick('domain', 'Agriculture') },
    { label: 'Python', onClick: () => handleSuggestionClick('skill', 'Python') },
    { label: 'React', onClick: () => handleSuggestionClick('skill', 'React') },
    { label: 'Open (forming)', onClick: () => handleSuggestionClick('status', 'open') },
    { label: 'Security / DevTools', onClick: () => handleSuggestionClick('domain', 'Security') },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />

      <main id="main" className="flex-1">
        {/* Unified Directory Hero */}
        <DirectoryHero
          eyebrow="Team directory"
          title="Browse teams"
          description="Explore hackathon teams looking for new members. Apply to join or invite teammates to your project."
          totalCount={pagination.total || teams.length}
          totalCountLabel="teams shown"
          activeFiltersCount={activeFilters}
          activeFiltersLabel="filters active"
        />

        {/* Directory Workspace: Search-First Deck & Results */}
        <section className="surface-sunken border-t border-[rgba(209,199,189,0.5)] py-10">
          <Container width="wide" className="space-y-8">
            {/* Primary Search Command Deck */}
            <DirectorySearchDeck
              heading="Search & Refine Teams"
              subheading="Filter forming teams by domain categories, technical skills, leader name, or team size"
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search team name, problem statement, or track keyword (e.g. Smart Vehicles, MedTech)..."
              onSubmit={handleSearchSubmit}
              onReset={handleReset}
              hasActiveFilters={activeFilters > 0}
              activeFiltersCount={activeFilters}
              isSearching={refreshing}
              suggestions={suggestions}
            >
              {/* Responsive Filter Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                <label className="block">
                  <FilterLabel>Tech Skill Needed</FilterLabel>
                  <input
                    type="text"
                    placeholder="e.g. Python, Figma"
                    value={skill}
                    onChange={(e) => setSkill(e.target.value)}
                    className={CONTROL}
                  />
                </label>

                <label className="block">
                  <FilterLabel>Team Leader</FilterLabel>
                  <input
                    type="text"
                    placeholder="Leader's name"
                    value={leader}
                    onChange={(e) => setLeader(e.target.value)}
                    className={CONTROL}
                  />
                </label>

                <label className="block">
                  <FilterLabel>Domain (Category)</FilterLabel>
                  <select
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className={CONTROL}
                  >
                    <option value="">All Categories</option>
                    <option value="Health">Health / MedTech</option>
                    <option value="Agriculture">Agriculture / IoT</option>
                    <option value="Education">EdTech</option>
                    <option value="Smart Vehicle">Smart Vehicles</option>
                    <option value="Security">Security / DevTools</option>
                    <option value="Clean Water">Water Management</option>
                    <option value="Miscellaneous">Miscellaneous</option>
                  </select>
                </label>

                <label className="block">
                  <FilterLabel>Team Size</FilterLabel>
                  <select
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className={CONTROL}
                  >
                    <option value="">Any Size</option>
                    <option value="1">1 Member</option>
                    <option value="2">2 Members</option>
                    <option value="3">3 Members</option>
                    <option value="4">4 Members</option>
                    <option value="5">5 Members</option>
                  </select>
                </label>

                <label className="block">
                  <FilterLabel>Recruitment</FilterLabel>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className={CONTROL}
                  >
                    <option value="">All status</option>
                    <option value="open">Open (forming)</option>
                    <option value="closed">Closed / Full</option>
                  </select>
                </label>
              </div>
            </DirectorySearchDeck>

            {/* Results Section */}
            <div>
              {loading ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }, (_, i) => (
                    <TeamCardSkeleton key={i} />
                  ))}
                </div>
              ) : !hasSearched ? (
                /* Unsearched Discovery Prompt */
                <DirectoryEmptyState
                  variant="unsearched"
                  title="Find your hackathon team"
                  description="Search forming teams by ministry theme, required technical skills, leader name, or team title using the search command deck above."
                  action={
                    <PremiumButton
                      size="sm"
                      onClick={() => fetchTeams(EMPTY_FILTERS, 1)}
                      className="bg-primary text-on-accent"
                    >
                      <Search className="size-3.5" />
                      <span>Browse All Forming Teams</span>
                    </PremiumButton>
                  }
                  suggestions={suggestions.slice(0, 4)}
                />
              ) : teams.length === 0 ? (
                /* 0-Match Empty State */
                <DirectoryEmptyState
                  variant="no-results"
                  title="No teams match these filters"
                  description="Try adjusting your search keywords, clearing domain filters, or searching for open forming teams."
                  onReset={handleReset}
                />
              ) : (
                /* Results Grid */
                <div>
                  <DirectoryResultsBar
                    count={pagination.total || teams.length}
                    itemLabel="teams"
                    isSearching={refreshing}
                    hasActiveFilters={activeFilters > 0}
                  />

                  <m.div
                    layout
                    className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
                  >
                    <AnimatePresence mode="popLayout" initial={false}>
                      {teams.map((team, i) => (
                        <m.div
                          key={team.id}
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
                          <TeamCard
                            team={team}
                            userHasTeam={userHasTeam}
                            requestState={submittingRequest[team.id]}
                            onRequestJoin={setActiveRequestTeam}
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
                      fetchTeams({ search, domain, skill, leader, size, status }, prev);
                    }}
                    onNext={() => {
                      const next = currentPage + 1;
                      setCurrentPage(next);
                      fetchTeams({ search, domain, skill, leader, size, status }, next);
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

      {/* Join Request Message Modal */}
      <AnimatePresence>
        {activeRequestTeam && (
          <JoinRequestModal
            team={activeRequestTeam}
            onClose={() => setActiveRequestTeam(null)}
            onSubmit={submitJoinRequest}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
