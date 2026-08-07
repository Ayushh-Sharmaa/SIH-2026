'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, m } from 'framer-motion';
import { ArrowUpRight, Search, Shield, Users } from 'lucide-react';
import { Container, EmptyState } from '@/components/ui';
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
  TiltCard,
  DURATION,
  EASE,
} from '@/components/motion';
import { logger } from '@/lib/logger';

interface Team {
  id: string;
  name: string;
  memberCount: number;
  skillsCovered: string[];
  skillsNeeded: string[];
  track: {
    id: string;
    name: string;
    problemStatementCode: string;
  };
  hasRequested: boolean;
  hasBeenInvited: boolean;
}

interface Track {
  id: string;
  problemStatementCode: string;
  name: string;
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

export default function FindTeamsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [hasTeam, setHasTeam] = useState(false);

  const [name, setName] = useState('');
  const [skill, setSkill] = useState('');
  const [trackId, setTrackId] = useState('');

  // Manage join request dialog overlay
  const [pitchingTeam, setPitchingTeam] = useState<Team | null>(null);
  const [pitchMessage, setPitchMessage] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestedMap, setRequestedMap] = useState<Record<string, boolean>>({});

  const fetchTeams = useCallback(
    async (filters?: { name: string; skill: string; trackId: string }) => {
      const f = filters ?? { name, skill, trackId };
      setRefreshing(true);
      try {
        const queryParams = new URLSearchParams();
        if (f.name) queryParams.append('name', f.name);
        if (f.skill) queryParams.append('skill', f.skill);
        if (f.trackId) queryParams.append('trackId', f.trackId);

        const res = await fetch(`/api/teams/search?${queryParams.toString()}`);
        const data = await res.json();
        if (data.success) {
          setTeams(data.teams);
          // Sync requests map
          const newMap: Record<string, boolean> = {};
          data.teams.forEach((t: Team) => {
            if (t.hasRequested) {
              newMap[t.id] = true;
            }
          });
          setRequestedMap(newMap);
        }
      } catch (err) {
        logger.error('Fetch teams error', err);
        toast('Could not load teams. Check your connection and try again.', 'error');
      } finally {
        setRefreshing(false);
      }
    },
    [name, skill, trackId, toast]
  );

  useEffect(() => {
    async function initPage() {
      try {
        // Fetch track list
        const resTracks = await fetch('/api/tracks');
        const dataTracks = await resTracks.json();
        if (dataTracks.success) setTracks(dataTracks.tracks);

        // Fetch student dashboard info to know if they have a team
        const resDash = await fetch('/api/dashboard');
        const dataDash = await resDash.json();
        if (dataDash.success) {
          setUserRole(dataDash.role);
          setHasTeam(!!dataDash.team);
        }
      } catch (err) {
        logger.error('Find teams init failed', err);
      }
      await fetchTeams({ name: '', skill: '', trackId: '' });
      setLoading(false);
    }
    initPage();
  }, [fetchTeams]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    fetchTeams();
  };

  const handleReset = () => {
    setName('');
    setSkill('');
    setTrackId('');
    fetchTeams({ name: '', skill: '', trackId: '' });
  };

  const handleJoinRequestSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!pitchingTeam) return;

    setSubmittingRequest(true);
    try {
      const response = await fetch('/api/join-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: pitchingTeam.id,
          message: pitchMessage,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not send join request.');

      toast(`Successfully requested to join ${pitchingTeam.name}!`, 'success');
      setRequestedMap(p => ({ ...p, [pitchingTeam.id]: true }));
      setPitchingTeam(null);
      setPitchMessage('');
    } catch (error: any) {
      toast(error.message || 'Something went wrong. Please try again.', 'error');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const activeFilters = [name, skill, trackId].filter(Boolean).length;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />

      <main id="main" className="flex-1">
        {/* ── HEADER BAND ── */}
        <section className="section-dune relative overflow-hidden">
          <Aurora variant="warm" spotlight={false} />
          <div aria-hidden className="grid-lines absolute inset-0" />
          <Container width="wide" className="relative flex flex-col gap-6 py-12 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Reveal direction="none" blur={false}>
                <span className="text-label uppercase text-primary">
                  Teams Directory
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
                  Browse forming teams looking for members, review their tracks, skills they cover, and skills they need.
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
                    teams forming
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
                    <FilterLabel>Team name</FilterLabel>
                    <input
                      type="text"
                      placeholder="e.g. Nexus"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={CONTROL}
                    />
                  </label>

                  <label className="block">
                    <FilterLabel>Skills needed</FilterLabel>
                    <input
                      type="text"
                      placeholder="e.g. Python, UI/UX"
                      value={skill}
                      onChange={(e) => setSkill(e.target.value)}
                      className={CONTROL}
                    />
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
              ) : teams.length > 0 ? (
                <m.div
                  layout
                  className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
                >
                  <AnimatePresence mode="popLayout" initial={false}>
                    {teams.map((team, i) => {
                      const requested = requestedMap[team.id];
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
                            delay: Math.min(i * 0.03, 0.3),
                          }}
                        >
                          <TiltCard intensity={5} className="h-full">
                            <article className="surface-raised flex h-full flex-col justify-between rounded-3xl p-5 sm:p-6">
                              <div className="space-y-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <h3 className="text-feature text-foreground truncate font-extrabold">
                                      {team.name}
                                    </h3>
                                    <span className="mt-0.5 block text-caption text-primary font-bold">
                                      {team.track.problemStatementCode}
                                    </span>
                                    <span className="mt-0.5 block text-xs text-muted truncate">
                                      {team.track.name}
                                    </span>
                                  </div>
                                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[rgba(114,56,61,0.08)] px-2.5 py-1 text-xs font-bold text-primary">
                                    <Users size={12} />
                                    {team.memberCount}/6
                                  </span>
                                </div>

                                <div>
                                  <FilterLabel>Skills covered</FilterLabel>
                                  <div className="flex flex-wrap gap-1">
                                    {team.skillsCovered.length > 0 ? (
                                      team.skillsCovered.map((sk) => (
                                        <span
                                          key={sk}
                                          className="rounded bg-[rgba(239,233,225,0.8)] border border-[rgba(209,199,189,0.7)] px-1.5 py-0.5 text-[10px] font-semibold text-body"
                                        >
                                          {sk}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-xs text-muted">None listed</span>
                                    )}
                                  </div>
                                </div>

                                <div>
                                  <FilterLabel>Skills needed</FilterLabel>
                                  <div className="flex flex-wrap gap-1">
                                    {team.skillsNeeded.length > 0 ? (
                                      team.skillsNeeded.map((sk) => (
                                        <span
                                          key={sk}
                                          className="rounded border border-[rgba(114,56,61,0.22)] bg-[rgba(114,56,61,0.08)] px-1.5 py-0.5 text-[10px] font-semibold text-primary"
                                        >
                                          {sk}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-xs text-muted">None needed</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="mt-6 border-t border-[rgba(209,199,189,0.6)] pt-4 flex justify-end">
                                {userRole !== 'STUDENT' ? (
                                  <span className="text-xs text-muted italic">Available to students only</span>
                                ) : hasTeam ? (
                                  <span className="text-xs text-muted italic">You are already in a team</span>
                                ) : requested ? (
                                  <PremiumButton size="sm" variant="glass" disabled className="w-full">
                                    Request Pending
                                  </PremiumButton>
                                ) : team.hasBeenInvited ? (
                                  <PremiumButton size="sm" variant="glass" disabled className="w-full">
                                    Invited (Check Dashboard)
                                  </PremiumButton>
                                ) : (
                                  <PremiumButton
                                    size="sm"
                                    onClick={() => {
                                      setPitchingTeam(team);
                                      setPitchMessage('');
                                    }}
                                    className="w-full"
                                  >
                                    Request to Join
                                  </PremiumButton>
                                )}
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
                  icon={Search}
                  title="No teams found"
                  description="Try adjusting your keywords or filters to discover active teams."
                  action={activeFilters > 0 ? { label: 'Reset filters', onClick: handleReset } : undefined}
                />
              )}
            </div>
          </Container>
        </section>
      </main>

      {/* ── JOIN REQUEST PITCH DIALOG ── */}
      <AnimatePresence>
        {pitchingTeam && (
          <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
            <m.div
              initial={{ opacity: 0 }}
              aria-hidden
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPitchingTeam(null)}
              className="absolute inset-0 bg-[rgb(50_45_41/0.34)] backdrop-blur-md"
            />
            <m.div
              initial={{ opacity: 0, y: 28, scale: 0.97, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: 16, scale: 0.98, filter: 'blur(6px)' }}
              transition={{ duration: DURATION.card, ease: EASE.outExpo }}
              className="surface-overlay relative max-h-[88vh] w-full max-w-md overflow-y-auto rounded-container p-6 text-foreground shadow-2xl"
            >
              <h2 className="text-xl font-extrabold text-foreground">
                Join {pitchingTeam.name}
              </h2>
              <p className="mt-2 text-xs text-muted leading-relaxed">
                Send an optional pitch message to the team leader explaining why you would be a great addition to the team.
              </p>

              <form onSubmit={handleJoinRequestSubmit} className="mt-6 space-y-4">
                <div>
                  <FilterLabel>Pitch message</FilterLabel>
                  <textarea
                    rows={4}
                    placeholder="e.g. Hey, I'm a full stack developer and have experience with React and Node.js. I'd love to help you build the prototype!"
                    value={pitchMessage}
                    onChange={(e) => setPitchMessage(e.target.value)}
                    className="w-full rounded-xl border border-[rgba(209,199,189,0.8)] bg-[rgba(248,246,242,0.65)] px-3.5 py-2 text-sm text-foreground outline-none transition-[border-color,box-shadow,background-color] duration-250 focus:border-primary focus:bg-[rgba(248,246,242,0.95)] focus:shadow-[0_0_0_4px_rgba(114,56,61,0.10)]"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-4 border-t border-[rgba(209,199,189,0.4)]">
                  <PremiumButton
                    variant="glass"
                    size="sm"
                    onClick={() => setPitchingTeam(null)}
                    disabled={submittingRequest}
                  >
                    Cancel
                  </PremiumButton>
                  <PremiumButton
                    type="submit"
                    size="sm"
                    loading={submittingRequest}
                  >
                    Send Request
                  </PremiumButton>
                </div>
              </form>
            </m.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
