'use client';

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, m } from 'framer-motion';
import { ArrowUpRight, Users, User, Briefcase, Plus, Search, Filter, ShieldAlert } from 'lucide-react';
import { Container, EmptyState, TeamCardSkeleton } from '@/components/ui';
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
  SpotlightCard,
  DURATION,
  EASE,
  SPRING,
} from '@/components/motion';
import { logger } from '@/lib/logger';

interface TeamMember {
  userId: string;
  name: string;
  branch: string;
  year: string;
  avatarUrl?: string | null;
  roleInTeam: string;
}

interface Team {
  id: string;
  teamCode: string;
  name: string;
  leaderId: string;
  memberCount: number;
  status: string; // 'forming' | 'locked'
  skillsCovered: string[];
  skillsNeeded: string[];
  whatsapp?: string | null;
  logoUrl?: string | null;
  track: {
    id: string;
    problemStatementCode: string;
    name: string;
    category: string;
  };
  members: TeamMember[];
}

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

const AVATAR_WASHES = [
  'from-[#AC9C8D] to-[#D1C7BD]',
  'from-[#D1C7BD] to-[#D9D9D9]',
  'from-[#D9D9D9] to-[#AC9C8D]',
  'from-[#EFE9E1] to-[#D1C7BD]',
];

function ProfileAvatar({ avatarUrl, name, size = 10 }: { avatarUrl?: string | null; name: string; size?: number }) {
  const sizeClass = `size-${size}`;
  if (avatarUrl?.startsWith('data:image/') || avatarUrl?.startsWith('http')) {
    return (
      <Image
        unoptimized
        src={avatarUrl}
        alt={`${name}'s profile`}
        width={40}
        height={40}
        className={`${sizeClass} rounded-xl object-cover`}
      />
    );
  }

  const wash = AVATAR_WASHES[name.length % AVATAR_WASHES.length];
  return (
    <span
      aria-label={`${name}'s profile`}
      className={`flex ${sizeClass} shrink-0 items-center justify-center rounded-xl border border-[rgba(209,199,189,0.7)] bg-gradient-to-br ${wash} text-[10px] font-black text-foreground`}
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
        <h3 id="join-team-title" className="text-feature text-foreground">
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filter state
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

  const fetchTeams = useCallback(
    async (filters: TeamFilters) => {
      setRefreshing(true);
      try {
        const queryParams = new URLSearchParams();
        if (filters.search) queryParams.append('search', filters.search);
        if (filters.domain) queryParams.append('domain', filters.domain);
        if (filters.skill) queryParams.append('skill', filters.skill);
        if (filters.leader) queryParams.append('leader', filters.leader);
        if (filters.size) queryParams.append('size', filters.size);
        if (filters.status) queryParams.append('status', filters.status);

        const res = await fetch(`/api/teams?${queryParams.toString()}`);
        const data = await res.json();
        if (data.success) {
          setTeams(data.teams);
          setViewer(data.viewer);
          setCurrentPage(1);
        }
      } catch (err) {
        logger.error('Fetch teams error', err);
        toast('Could not load teams. Check your connection.', 'error');
      } finally {
        setRefreshing(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      fetchTeams(EMPTY_FILTERS).finally(() => {
        setLoading(false);
      });
    });
    return () => cancelAnimationFrame(handle);
  }, [fetchTeams]);

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    fetchTeams({ search, domain, skill, leader, size, status });
  };

  const itemsPerPage = 20;
  const totalPages = Math.max(1, Math.ceil(teams.length / itemsPerPage));
  const paginatedTeams = teams.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleReset = () => {
    setSearch('');
    setDomain('');
    setSkill('');
    setLeader('');
    setSize('');
    setStatus('');
    fetchTeams(EMPTY_FILTERS);
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

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />

      <main id="main" className="flex-1">
        {/* Header Block */}
        <section className="section-dune relative overflow-hidden">
          <Aurora variant="warm" spotlight={false} />
          <Container width="wide" className="relative flex flex-col gap-6 py-12 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Reveal direction="none" blur={false}>
                <span className="text-label uppercase text-primary">
                  Team directory
                </span>
              </Reveal>
              <SplitText
                as="h1"
                text="Find teams"
                className="mt-3 text-title text-foreground"
                delay={0.08}
              />
              <Reveal delay={0.28} className="mt-3">
                <p className="max-w-xl text-sm leading-relaxed text-body">
                  Explore hackathon teams looking for new members. Apply to join or invite teammates to your project.
                </p>
              </Reveal>
            </div>

            <Reveal direction="left" delay={0.2}>
              <div className="surface-raised flex items-center gap-5 rounded-2xl px-5 py-4">
                <div>
                  <div className="text-3xl font-extrabold tracking-tight text-foreground">
                    <Counter to={teams.length} duration={1.2} />
                  </div>
                  <div className="text-label uppercase text-muted">
                    teams shown
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

        {/* Workspace: Filters & List */}
        <section className="surface-sunken">
          <Container width="wide" className="grid grid-cols-1 gap-6 py-10 lg:grid-cols-[280px_1fr]">
            {/* Filters panel */}
            <Reveal direction="right">
              <form
                onSubmit={handleSearchSubmit}
                className="surface-raised rounded-3xl p-6 lg:sticky lg:top-28"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-feature text-foreground">Refine</h2>
                  <Icon icon={Filter} className="text-muted" size="sm" />
                </div>
                <div className="my-5 h-px bg-gradient-to-r from-[rgba(172,156,141,0.55)] to-transparent" />

                <div className="space-y-4">
                  <label className="block">
                    <FilterLabel>Search keyword</FilterLabel>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Name, track, technology..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className={`${CONTROL} pr-9`}
                      />
                      <Search className="absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted pointer-events-none" />
                    </div>
                  </label>

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

            {/* Results list */}
            <div>
              {loading ? (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {Array.from({ length: 4 }, (_, i) => (
                    <TeamCardSkeleton key={i} />
                  ))}
                </div>
              ) : paginatedTeams.length > 0 ? (
                <>
                  <m.div
                  layout
                  className="grid grid-cols-1 gap-6 md:grid-cols-2"
                >
                  <AnimatePresence mode="popLayout" initial={false}>
                    {paginatedTeams.map((team, i) => {
                      const isClosed = team.status !== 'forming' || team.memberCount >= 6;
                      const leader = team.members.find((m) => m.userId === team.leaderId);
                      const state = submittingRequest[team.id];

                      return (
                        <m.div
                          key={team.id}
                          layout
                          initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
                          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                          exit={{ opacity: 0, scale: 0.96, filter: 'blur(8px)' }}
                          transition={{
                            duration: DURATION.card,
                            ease: EASE.outExpo,
                            delay: Math.min(i * 0.04, 0.4),
                          }}
                        >
                          <TiltCard intensity={4} className="h-full">
                            <SpotlightCard className="h-full rounded-3xl" intensity={0.1}>
                              <article className="surface-raised flex h-full flex-col justify-between rounded-3xl p-6">
                                <div>
                                  {/* Title & Status */}
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div className="size-11 shrink-0 overflow-hidden rounded-xl border border-[rgba(114,56,61,0.25)] bg-gradient-to-br from-[rgba(114,56,61,0.08)] to-[rgba(114,56,61,0.02)] flex items-center justify-center font-black text-primary text-xs">
                                        {team.logoUrl ? (
                                          <img src={team.logoUrl} alt="Logo" className="size-full object-cover" />
                                        ) : (
                                          team.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || 'NS'
                                        )}
                                      </div>
                                      <div className="min-w-0">
                                        <h3 className="truncate text-feature text-foreground font-extrabold">
                                          {team.name}
                                        </h3>
                                        <span className="mt-0.5 block text-[10px] font-black uppercase tracking-[0.16em] text-primary">
                                          {team.teamCode}
                                        </span>
                                        <p className="mt-0.5 flex items-center gap-1.5 text-caption text-primary">
                                          <Briefcase className="size-3 shrink-0" />
                                          <span className="font-bold">{team.track.problemStatementCode}</span>
                                          <span className="truncate">· {team.track.category}</span>
                                        </p>
                                      </div>
                                    </div>
                                    <span
                                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                                        isClosed
                                          ? 'bg-[rgba(172,156,141,0.22)] text-muted'
                                          : 'bg-[rgba(114,56,61,0.08)] text-primary border border-[rgba(114,56,61,0.2)]'
                                      }`}
                                    >
                                      {isClosed ? 'Closed' : 'Open'}
                                    </span>
                                  </div>

                                  <div className="my-4 h-px bg-[rgba(209,199,189,0.5)]" />

                                  {/* Leader Info */}
                                  <div className="flex items-center gap-3">
                                    {leader ? (
                                      <>
                                        <ProfileAvatar
                                          avatarUrl={leader.avatarUrl}
                                          name={leader.name}
                                          size={7}
                                        />
                                        <div className="min-w-0">
                                          <span className="block text-caption font-bold text-foreground truncate">
                                            {leader.name}
                                          </span>
                                          <span className="block text-[9px] text-muted uppercase tracking-wider mt-0.5">
                                            Team Leader
                                          </span>
                                        </div>
                                      </>
                                    ) : (
                                      <span className="text-caption text-muted">No leader assigned</span>
                                    )}
                                  </div>

                                  {/* Member Slots dials */}
                                  <div className="mt-5">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-muted">
                                      Team Roster ({team.memberCount} / 6)
                                    </span>
                                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                      {Array.from({ length: 6 }).map((_, idx) => {
                                        const mem = team.members[idx];
                                        return mem ? (
                                          <m.div
                                            key={mem.userId}
                                            whileHover={{ y: -2 }}
                                            className="group relative"
                                          >
                                            <ProfileAvatar
                                              avatarUrl={mem.avatarUrl}
                                              name={mem.name}
                                              size={8}
                                            />
                                            {/* Tooltip */}
                                            <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded bg-foreground px-2 py-1 text-[9px] font-black text-background opacity-0 transition-opacity duration-250 group-hover:opacity-100 whitespace-nowrap">
                                              {mem.name} ({mem.roleInTeam || 'Member'})
                                            </span>
                                          </m.div>
                                        ) : (
                                          <div
                                            key={`empty-${idx}`}
                                            className="size-8 rounded-lg border border-dashed border-[rgba(172,156,141,0.65)] bg-[rgba(172,156,141,0.06)] flex items-center justify-center text-[10px] text-muted font-bold"
                                            title="Empty slot"
                                          >
                                            +
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  {/* Skills cover */}
                                  {team.skillsCovered.length > 0 && (
                                    <div className="mt-5">
                                      <span className="text-[10px] font-black uppercase tracking-wider text-muted">
                                        Skills covered
                                      </span>
                                      <div className="mt-2.5 flex flex-wrap gap-1">
                                        {team.skillsCovered.map((s) => (
                                          <span
                                            key={s}
                                            className="rounded-md border border-[rgba(172,156,141,0.55)] bg-[rgba(172,156,141,0.18)] px-2 py-0.5 text-caption font-semibold text-foreground"
                                          >
                                            {s}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Join Actions */}
                                <div className="mt-6 border-t border-[rgba(209,199,189,0.6)] pt-4 flex items-center justify-between">
                                  <span className="text-[10px] text-muted truncate max-w-[140px]">
                                    Project: {team.track.name}
                                  </span>

                                  {userHasTeam ? (
                                    <span className="text-xs font-semibold text-muted flex items-center gap-1">
                                      <ShieldAlert className="size-3.5" /> Already in a team
                                    </span>
                                  ) : (
                                    <PremiumButton
                                      size="sm"
                                      variant={state === 'sent' ? 'glass' : 'primary'}
                                      loading={state === 'sending'}
                                      disabled={isClosed || Boolean(state)}
                                      onClick={() => setActiveRequestTeam(team)}
                                    >
                                      {isClosed ? 'Full' : state === 'sent' ? 'Request Sent' : 'Join Team'}
                                    </PremiumButton>
                                  )}
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
                  title="No hackathon teams match these filters."
                  description="Adjust your search term or domain category to discover more teams."
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
