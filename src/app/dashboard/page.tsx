'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import {
  ArrowUpRight,
  BadgeCheck,
  Clock,
  Code2,
  Crown,
  FlaskConical,
  Palette,
  PenLine,
  Terminal,
  type LucideIcon,
} from 'lucide-react';
import Icon from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import {
  Aurora,
  Counter,
  PremiumButton,
  Reveal,
  RevealGroup,
  RevealItem,
  SplitText,
  TiltCard,
  DURATION,
  EASE,
  SPRING,
} from '@/components/motion';

const AVATAR_PRESETS: Record<string, { icon: LucideIcon; wash: string }> = {
  hacker: { icon: Terminal, wash: 'from-[#AC9C8D] to-[#D1C7BD]' },
  developer: { icon: Code2, wash: 'from-[#D1C7BD] to-[#EFE9E1]' },
  designer: { icon: Palette, wash: 'from-[#D9D9D9] to-[#AC9C8D]' },
  scientist: { icon: FlaskConical, wash: 'from-[#EFE9E1] to-[#D1C7BD]' },
  manager: { icon: Crown, wash: 'from-[#AC9C8D] to-[#D9D9D9]' },
  writer: { icon: PenLine, wash: 'from-[#D1C7BD] to-[#D9D9D9]' },
};

function Avatar({
  avatarUrl,
  name,
  className = '',
}: {
  avatarUrl?: string | null;
  name: string;
  className?: string;
}) {
  if (avatarUrl?.startsWith('data:image/') || avatarUrl?.startsWith('http')) {
    return (
      <Image
        unoptimized
        src={avatarUrl}
        alt={`${name}'s profile`}
        width={128}
        height={128}
        className={`object-cover ${className}`}
      />
    );
  }

  const preset = AVATAR_PRESETS[avatarUrl || 'developer'] || AVATAR_PRESETS.developer;
  return (
    <span
      role="img"
      aria-label={`${name}'s profile`}
      className={`flex items-center justify-center bg-gradient-to-br text-body ${preset.wash} ${className}`}
    >
      {/* The wrapper already carries the accessible name, so the glyph itself
          stays decorative — otherwise it is announced twice. */}
      <Icon icon={preset.icon} size="md" />
    </span>
  );
}

function Label({ children }: { children: ReactNode }) {
  return (
    <span className="block text-label uppercase text-muted">
      {children}
    </span>
  );
}

const CHIP_TONES = {
  neutral: 'border-[rgba(209,199,189,0.7)] bg-[rgba(239,233,225,0.8)] text-body',
  accent: 'border-[rgba(172,156,141,0.55)] bg-[rgba(172,156,141,0.18)] text-foreground',
  primary: 'border-[rgba(114,56,61,0.22)] bg-[rgba(114,56,61,0.08)] text-primary',
} as const;

function Chip({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: keyof typeof CHIP_TONES;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-control border px-2 py-0.5 text-label normal-case ${CHIP_TONES[tone]}`}
    >
      {children}
    </span>
  );
}

function DeckStat({
  value,
  label,
  text,
}: {
  value?: number;
  label: string;
  text?: string;
}) {
  return (
    <RevealItem className="min-w-0">
      <TiltCard intensity={5} className="h-full">
        <div className="surface-raised h-full rounded-2xl px-4 py-3.5">
          <div className="truncate text-2xl font-extrabold capitalize tracking-tight text-foreground sm:text-[1.7rem]">
            {text ?? <Counter to={value ?? 0} duration={1.4} />}
          </div>
          <div className="mt-1 truncate text-label uppercase text-muted">
            {label}
          </div>
        </div>
      </TiltCard>
    </RevealItem>
  );
}

function Panel({
  title,
  action,
  children,
  className = '',
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`surface-raised rounded-3xl p-6 sm:p-7 ${className}`}>
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-feature text-foreground">{title}</h2>
        {action}
      </div>
      <div className="mb-5 h-px bg-gradient-to-r from-[rgba(172,156,141,0.55)] via-[rgba(209,199,189,0.35)] to-transparent" />
      {children}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex items-center gap-5">
          <div className="size-20 rounded-2xl skeleton-shimmer" />
          <div className="flex-1 space-y-3">
            <div className="h-6 w-64 max-w-full rounded-lg skeleton-shimmer" />
            <div className="h-3.5 w-80 max-w-full rounded skeleton-shimmer" />
          </div>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl skeleton-shimmer" />
          ))}
        </div>
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="h-96 rounded-3xl skeleton-shimmer lg:col-span-2" />
          <div className="space-y-6 lg:col-span-3">
            <div className="h-56 rounded-3xl skeleton-shimmer" />
            <div className="h-40 rounded-3xl skeleton-shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error('Failed to fetch dashboard data');
      setData(await res.json());
    } catch (err) {
      console.error(err);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Routed through the shared toast system, which owns stacking, dismissal and
  // the announcement role. The local `notice` state is kept as the trigger so
  // every existing setNotice call site keeps working unchanged.
  useEffect(() => {
    if (!notice) return;
    toast(notice, 'error');
    setNotice(null);
  }, [notice, toast]);

  const handleRequestResponse = async (requestId: string, action: 'accept' | 'decline') => {
    setActionLoading(requestId);
    try {
      const res = await fetch(`/api/mentor-requests/${requestId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const result = await res.json();
      if (!res.ok) {
        setNotice(result.error || 'Failed to process request');
      } else {
        await fetchDashboard();
      }
    } catch (err) {
      console.error(err);
      setNotice('Something went wrong. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <DashboardSkeleton />;

  const isStudent = data?.role === 'STUDENT';
  const profile = data?.profile;
  const team = data?.team;
  const filledSeats = team?.members?.length ?? 0;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />

      <main id="main" className="flex-1">
        {/* ── COMMAND DECK ── */}
        <section className="relative overflow-hidden pb-14 pt-8 sm:pt-12">
          <Aurora variant="cool" spotlight />
          <div aria-hidden className="grid-lines absolute inset-0" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                transition={{ duration: DURATION.hero, ease: EASE.outExpo }}
                className="relative shrink-0"
              >
                <div className="surface-raised grid size-20 place-items-center overflow-hidden rounded-2xl p-1 sm:size-24">
                  <Avatar
                    avatarUrl={profile?.avatarUrl}
                    name={profile?.name || 'User'}
                    className="size-full rounded-xl text-3xl"
                  />
                </div>
                <span className="absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-full border border-[rgba(239,233,225,0.9)] bg-primary text-caption font-black text-on-accent">
                  {isStudent ? 'S' : 'M'}
                </span>
              </motion.div>

              <div className="min-w-0 flex-1">
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: DURATION.reveal, ease: EASE.outExpo }}
                  className="mb-2 flex flex-wrap items-center gap-2"
                >
                  <Chip tone="primary">{isStudent ? 'Student' : 'Faculty mentor'}</Chip>
                  {!isStudent && (
                    <Chip tone={profile?.verified ? 'accent' : 'neutral'}>
                      {profile?.verified ? 'Verified' : 'Awaiting verification'}
                    </Chip>
                  )}
                </motion.div>

                <SplitText
                  as="h1"
                  text={`Welcome back, ${profile?.name || 'User'}`}
                  className="text-title text-foreground"
                  delay={0.1}
                />

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.45, duration: 0.5 }}
                  className="mt-2 max-w-xl text-sm leading-relaxed text-body"
                >
                  {isStudent
                    ? 'Track your team formation status, review your profile, and explore matches.'
                    : 'Manage the hackathon teams you guide and respond to incoming mentorship requests.'}
                </motion.p>
              </div>

              <div className="shrink-0">
                <PremiumButton
                  variant="glass"
                  size="sm"
                  onClick={() => router.push('/onboarding?edit=true')}
                >
                  Edit profile
                </PremiumButton>
              </div>
            </div>

            <RevealGroup
              className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-4"
              stagger={0.07}
              amount={0.2}
            >
              {isStudent ? (
                <>
                  <DeckStat value={filledSeats} label="Team members" />
                  <DeckStat value={Math.max(0, 6 - filledSeats)} label="Open seats" />
                  <DeckStat
                    text={team ? (team.mentor ? 'Yes' : 'No') : '—'}
                    label="Mentor assigned"
                  />
                  <DeckStat
                    text={team ? String(team.status).toLowerCase() : 'No team'}
                    label="Team status"
                  />
                </>
              ) : (
                <>
                  <DeckStat value={profile?.currentLoad ?? 0} label="Teams mentored" />
                  <DeckStat value={profile?.capacity ?? 0} label="Total capacity" />
                  <DeckStat value={data?.pendingRequests?.length ?? 0} label="Pending requests" />
                  <DeckStat
                    value={Math.max(0, (profile?.capacity ?? 0) - (profile?.currentLoad ?? 0))}
                    label="Slots free"
                  />
                </>
              )}
            </RevealGroup>
          </div>
        </section>

        {/* ── WORKSPACE ── */}
        <section className="relative">
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(172,156,141,0.6)] to-transparent"
          />
          <div className="surface-sunken border-x-0">
            <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-12 sm:px-6 lg:grid-cols-5 lg:px-8">
              {/* LEFT RAIL */}
              <Reveal direction="right" className="lg:col-span-2">
                <div className="lg:sticky lg:top-28">
                  <Panel title="My profile">
                    <div className="space-y-5">
                      <div>
                        <Label>Email ID</Label>
                        <span className="text-sm font-semibold text-foreground">
                          {profile?.email || 'N/A'}
                        </span>
                      </div>

                      {isStudent ? (
                        <>
                          <div>
                            <Label>Academic info</Label>
                            <span className="text-sm font-semibold text-foreground">
                              {profile?.branch} ({profile?.year})
                            </span>
                          </div>

                          <div>
                            <Label>Languages</Label>
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {profile?.languages?.map((l: string) => (
                                <Chip key={l}>{l}</Chip>
                              ))}
                            </div>
                          </div>

                          <div>
                            <Label>Technical skills</Label>
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {profile?.skills?.map((s: string) => (
                                <Chip key={s} tone="primary">
                                  {s}
                                </Chip>
                              ))}
                            </div>
                          </div>

                          <div>
                            <Label>Soft skills</Label>
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {profile?.softSkills?.map((s: string) => (
                                <Chip key={s} tone="accent">
                                  {s}
                                </Chip>
                              ))}
                            </div>
                          </div>

                          <div>
                            <Label>Profiles &amp; links</Label>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {[
                                { url: profile?.githubUrl, label: 'GitHub' },
                                { url: profile?.linkedinUrl, label: 'LinkedIn' },
                                { url: profile?.resumeUrl, label: 'Résumé' },
                              ]
                                .filter((l) => l.url)
                                .map((l) => (
                                  <motion.a
                                    key={l.label}
                                    href={l.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    whileHover={{ y: -2 }}
                                    transition={SPRING.snappy}
                                    className="group inline-flex items-center gap-1.5 rounded-lg border border-[rgba(209,199,189,0.7)] bg-[rgba(248,246,242,0.75)] px-3 py-1.5 text-xs font-bold text-foreground transition-colors hover:border-[rgba(114,56,61,0.28)] hover:text-primary"
                                  >
                                    {l.label}
                                    <span className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
                                      <Icon icon={ArrowUpRight} size="xs" />
                                    </span>
                                  </motion.a>
                                ))}
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <Label>Designation</Label>
                            <span className="text-sm font-semibold text-foreground">
                              {profile?.designation} at {profile?.organization}
                            </span>
                          </div>

                          <div>
                            <Label>Expertise</Label>
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {profile?.expertise?.map((e: string) => (
                                <Chip key={e} tone="accent">
                                  {e}
                                </Chip>
                              ))}
                            </div>
                          </div>

                          <div>
                            <Label>Biography</Label>
                            <p className="mt-1.5 rounded-xl border border-[rgba(209,199,189,0.6)] bg-[rgba(239,233,225,0.6)] p-3 text-xs leading-relaxed text-body">
                              {profile?.bio || 'No bio provided.'}
                            </p>
                          </div>

                          <div>
                            <Label>Verification status</Label>
                            <div className="mt-1.5">
                              <Chip tone={profile?.verified ? 'primary' : 'neutral'}>
                                {profile?.verified ? (
                                  <>
                                    <Icon icon={BadgeCheck} size="xs" />
                                    Verified mentor
                                  </>
                                ) : (
                                  <>
                                    <Icon icon={Clock} size="xs" />
                                    Awaiting verification
                                  </>
                                )}
                              </Chip>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </Panel>
                </div>
              </Reveal>

              {/* RIGHT COLUMN */}
              <div className="space-y-6 lg:col-span-3">
                {isStudent ? (
                  team ? (
                    <>
                      <Reveal direction="left">
                        <Panel
                          title="My team"
                          action={<Chip tone="primary">{String(team.status).toLowerCase()}</Chip>}
                        >
                          <div className="mb-6">
                            <h3 className="text-feature text-foreground">{team.name}</h3>
                            <p className="mt-1 text-xs text-muted">
                              Track{' '}
                              <span className="font-bold text-primary">
                                {team.track.problemStatementCode}
                              </span>{' '}
                              — {team.track.name}
                            </p>
                          </div>

                          <div className="mb-6">
                            <div className="mb-3 flex items-center justify-between gap-4">
                              <Label>Team roster</Label>
                              <span className="text-caption font-semibold text-muted">
                                {filledSeats} of 6 seats filled
                              </span>
                            </div>

                            <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-[rgba(209,199,189,0.55)]">
                              <motion.div
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: filledSeats / 6 }}
                                transition={{ duration: 0.9, ease: EASE.outExpo, delay: 0.2 }}
                                style={{ transformOrigin: 'left' }}
                                className="h-full rounded-full bg-gradient-to-r from-[#AC9C8D] to-primary"
                              />
                            </div>

                            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                              {Array.from({ length: 6 }, (_, index) => {
                                const member = team.members[index];
                                return member ? (
                                  <motion.div
                                    key={member.userId}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                      delay: 0.1 + index * 0.05,
                                      duration: DURATION.card,
                                      ease: EASE.outExpo,
                                    }}
                                    whileHover={{ y: -4, scale: 1.04 }}
                                    className="min-w-0"
                                  >
                                    <Avatar
                                      avatarUrl={member.avatarUrl}
                                      name={member.name}
                                      className="aspect-square w-full rounded-xl border border-[rgba(209,199,189,0.7)] text-xl shadow-[0_4px_16px_rgba(50,45,41,0.08)]"
                                    />
                                    <p className="mt-1.5 truncate text-center text-caption font-semibold text-foreground">
                                      {member.name}
                                    </p>
                                    {member.userId === team.leaderId && (
                                      <p className="text-center text-label uppercase text-primary">
                                        Leader
                                      </p>
                                    )}
                                  </motion.div>
                                ) : (
                                  <div
                                    key={`open-seat-${index}`}
                                    aria-label="Open team seat"
                                    className="grid aspect-square place-items-center rounded-xl border border-dashed border-[rgba(172,156,141,0.6)] bg-[rgba(239,233,225,0.45)] text-lg text-muted"
                                  >
                                    +
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {team.leaderContact && (
                            <details className="group overflow-hidden rounded-2xl border border-[rgba(172,156,141,0.5)] bg-[rgba(239,233,225,0.6)]">
                              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3.5">
                                <div className="min-w-0">
                                  <Label>Team leader</Label>
                                  <span className="text-sm font-bold text-foreground">
                                    {team.leaderContact.name}
                                  </span>
                                </div>
                                <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-bold text-primary">
                                  Contact
                                  <svg
                                    className="size-3.5 transition-transform duration-300 group-open:rotate-180"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    aria-hidden
                                  >
                                    <path
                                      d="m6 9 6 6 6-6"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                </span>
                              </summary>

                              <div className="space-y-3 border-t border-[rgba(209,199,189,0.6)] px-4 py-4">
                                <div>
                                  <Label>Email address</Label>
                                  <div className="mt-1.5 flex items-center justify-between gap-2 rounded-lg border border-[rgba(209,199,189,0.7)] bg-[rgba(248,246,242,0.8)] px-3 py-2">
                                    <a
                                      href={`mailto:${team.leaderContact.email}`}
                                      className="truncate text-xs font-semibold text-primary hover:underline"
                                    >
                                      {team.leaderContact.email || 'leader@glbajaj.org'}
                                    </a>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(
                                          team.leaderContact.email || ''
                                        );
                                        setCopied(true);
                                        window.setTimeout(() => setCopied(false), 1600);
                                      }}
                                      className="shrink-0 rounded-md border border-[rgba(114,56,61,0.2)] bg-[rgba(114,56,61,0.08)] px-2 py-1 text-caption font-bold text-primary transition-colors hover:bg-[rgba(114,56,61,0.16)]"
                                    >
                                      {copied ? 'Copied' : 'Copy'}
                                    </button>
                                  </div>
                                </div>

                                <div>
                                  <Label>Phone / WhatsApp</Label>
                                  <div className="mt-1.5 flex flex-wrap items-center gap-3 rounded-lg border border-[rgba(209,199,189,0.7)] bg-[rgba(248,246,242,0.8)] px-3 py-2">
                                    <a
                                      href={`tel:${team.leaderContact.whatsapp || ''}`}
                                      className="text-xs font-semibold text-foreground hover:text-primary"
                                    >
                                      {team.leaderContact.whatsapp || 'Not provided'}
                                    </a>
                                    {team.leaderContact.whatsapp && (
                                      <a
                                        href={`https://wa.me/${team.leaderContact.whatsapp.replace(/\D/g, '')}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs font-bold text-primary hover:underline"
                                      >
                                        Open WhatsApp <Icon icon={ArrowUpRight} size="xs" />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </details>
                          )}
                        </Panel>
                      </Reveal>

                      <Reveal direction="left" delay={0.08}>
                        <div className="surface-raised flex flex-col items-start justify-between gap-4 rounded-3xl p-6 sm:flex-row sm:items-center">
                          <div>
                            <Label>Assigned mentor</Label>
                            {team.mentor ? (
                              <p className="mt-1 text-sm font-bold text-foreground">
                                {team.mentor.name}{' '}
                                <span className="font-medium text-muted">
                                  ({team.mentor.designation})
                                </span>
                              </p>
                            ) : (
                              <p className="mt-1 text-sm font-semibold text-body">
                                No mentor assigned yet.
                              </p>
                            )}
                          </div>
                          {!team.mentor && (
                            <PremiumButton size="sm" href="/team-formation/find-mentors">
                              Find mentors
                            </PremiumButton>
                          )}
                        </div>
                      </Reveal>
                    </>
                  ) : (
                    <Reveal direction="left" scale>
                      <div className="surface-raised relative overflow-hidden rounded-3xl p-8 text-center sm:p-12">
                        <Aurora variant="rose" spotlight={false} />
                        <div className="relative">
                          <div className="mx-auto grid size-14 place-items-center rounded-2xl border border-[rgba(114,56,61,0.2)] bg-[rgba(114,56,61,0.08)] text-primary">
                            <svg className="size-6" viewBox="0 0 24 24" fill="none" aria-hidden>
                              <path
                                d="M17 20h5v-2a3 3 0 0 0-5.36-1.87M17 20H7m10 0v-2c0-.66-.13-1.29-.36-1.87m0 0a5 5 0 0 0-9.28 0M7 20H2v-2a3 3 0 0 1 5.36-1.87M7 20v-2c0-.66.13-1.29.36-1.87m0 0a5 5 0 1 1 9.28 0M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                                stroke="currentColor"
                                strokeWidth="1.7"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                          <h2 className="mt-5 text-feature text-foreground">
                            You don&apos;t have a team yet
                          </h2>
                          <p className="mx-auto mt-2.5 max-w-sm text-sm leading-relaxed text-body">
                            To participate in SIH@GLBGOI you must either join an existing forming
                            team or start a new one as a leader.
                          </p>
                          <div className="mt-7 flex flex-wrap justify-center gap-3">
                            <PremiumButton href="/team-formation/create-team">
                              Create a team
                            </PremiumButton>
                            <PremiumButton variant="glass" href="/team-formation/find-teammates">
                              Find teammates
                            </PremiumButton>
                          </div>
                        </div>
                      </div>
                    </Reveal>
                  )
                ) : (
                  <>
                    <Reveal direction="left">
                      <Panel title="Mentoring capacity">
                        <div className="mb-3 flex items-baseline justify-between gap-4">
                          <span className="text-3xl font-extrabold tracking-tight text-foreground">
                            <Counter to={profile?.currentLoad ?? 0} duration={1.2} />
                            <span className="text-lg font-bold text-muted">
                              {' '}
                              / {profile?.capacity ?? 0}
                            </span>
                          </span>
                          <span className="text-label uppercase text-muted">
                            teams
                          </span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full border border-[rgba(209,199,189,0.7)] bg-[rgba(217,217,217,0.6)]">
                          <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{
                              scaleX: profile?.capacity
                                ? Math.min(1, (profile.currentLoad ?? 0) / profile.capacity)
                                : 0,
                            }}
                            transition={{ duration: 1, ease: EASE.outExpo, delay: 0.25 }}
                            style={{ transformOrigin: 'left' }}
                            className="h-full rounded-full bg-gradient-to-r from-[#AC9C8D] via-[#8A444A] to-primary"
                          />
                        </div>
                      </Panel>
                    </Reveal>

                    <Reveal direction="left" delay={0.06}>
                      <Panel title="Teams I guide">
                        {data.teams.length > 0 ? (
                          <RevealGroup className="space-y-3" stagger={0.06} amount={0.1}>
                            {data.teams.map((t: any) => (
                              <RevealItem key={t.id}>
                                <motion.div
                                  whileHover={{ y: -3 }}
                                  transition={SPRING.snappy}
                                  className="flex items-center justify-between gap-4 rounded-2xl border border-[rgba(209,199,189,0.65)] bg-[rgba(248,246,242,0.7)] p-4 transition-colors hover:border-[rgba(114,56,61,0.24)]"
                                >
                                  <div className="min-w-0">
                                    <span className="block truncate text-sm font-bold text-foreground">
                                      {t.name}
                                    </span>
                                    <span className="mt-0.5 block truncate text-xs text-muted">
                                      Track: {t.track.name}
                                    </span>
                                  </div>
                                  <Chip tone="accent">{t.memberCount} / 6</Chip>
                                </motion.div>
                              </RevealItem>
                            ))}
                          </RevealGroup>
                        ) : (
                          <p className="py-8 text-center text-sm text-muted">
                            You are not mentoring any teams yet.
                          </p>
                        )}
                      </Panel>
                    </Reveal>

                    <Reveal direction="left" delay={0.12}>
                      <Panel
                        title="Pending team requests"
                        action={
                          data.pendingRequests.length > 0 ? (
                            <Chip tone="primary">{data.pendingRequests.length} waiting</Chip>
                          ) : undefined
                        }
                      >
                        {data.pendingRequests.length > 0 ? (
                          <div className="space-y-3">
                            <AnimatePresence initial={false}>
                              {data.pendingRequests.map((req: any) => (
                                <motion.div
                                  key={req.id}
                                  layout
                                  initial={{ opacity: 0, y: 12 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, x: -24, filter: 'blur(6px)' }}
                                  transition={{ duration: DURATION.card, ease: EASE.outExpo }}
                                  className="space-y-4 rounded-2xl border border-[rgba(209,199,189,0.65)] bg-[rgba(248,246,242,0.7)] p-4"
                                >
                                  <div>
                                    <span className="text-sm font-bold text-foreground">
                                      {req.team.name}
                                    </span>
                                    <span className="mt-0.5 block text-xs text-muted">
                                      Track: {req.team.track.name}
                                    </span>
                                    {req.message && (
                                      <p className="mt-2.5 rounded-xl border-l-2 border-[rgba(114,56,61,0.35)] bg-[rgba(239,233,225,0.7)] px-3 py-2 text-xs italic leading-relaxed text-body">
                                        {req.message}
                                      </p>
                                    )}
                                  </div>

                                  <div className="flex flex-wrap gap-2">
                                    <PremiumButton
                                      size="sm"
                                      loading={actionLoading === req.id}
                                      disabled={actionLoading !== null}
                                      onClick={() => handleRequestResponse(req.id, 'accept')}
                                    >
                                      Accept
                                    </PremiumButton>
                                    <PremiumButton
                                      size="sm"
                                      variant="glass"
                                      disabled={actionLoading !== null}
                                      onClick={() => handleRequestResponse(req.id, 'decline')}
                                    >
                                      Decline
                                    </PremiumButton>
                                  </div>
                                </motion.div>
                              ))}
                            </AnimatePresence>
                          </div>
                        ) : (
                          <p className="py-8 text-center text-sm text-muted">
                            No incoming team requests.
                          </p>
                        )}
                      </Panel>
                    </Reveal>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
