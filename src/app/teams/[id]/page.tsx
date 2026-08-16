'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft,
  ArrowUpRight,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  Crown,
  FlaskConical,
  GraduationCap,
  Layers,
  MessageSquare,
  Palette,
  PenLine,
  ShieldCheck,
  Sparkles,
  Terminal,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react';
import Icon from '@/components/ui/Icon';
import { Container } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import {
  Aurora,
  PremiumButton,
  Reveal,
  RevealGroup,
  RevealItem,
  SpotlightCard,
  SPRING,
} from '@/components/motion';
import { logger } from '@/lib/logger';

interface Track {
  id: string;
  name: string;
  problemStatementCode: string;
  category: string;
  description: string;
}

interface Mentor {
  userId: string;
  name: string;
  designation: string;
  organization: string;
  expertise: string[];
  avatarUrl?: string | null;
  linkedinUrl?: string | null;
  email?: string | null;
  contact?: string | null;
}

interface TeamMember {
  userId: string;
  name: string;
  year: string;
  branch: string;
  section?: string | null;
  gender?: string | null;
  rollNo?: string | null;
  skills: string[];
  languages: string[];
  softSkills: string[];
  avatarUrl?: string | null;
  roleInTeam: string;
  college: string;
  email?: string | null;
  contact?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
}

interface TeamDetails {
  id: string;
  teamCode: string;
  name: string;
  status: string;
  leaderId: string;
  leaderName: string;
  leaderContact?: {
    name: string;
    email?: string | null;
    contact?: string | null;
  } | null;
  memberCount: number;
  femaleCount?: number;
  maleCount?: number;
  hasFemaleMember?: boolean;
  reservedSeatForFemale?: boolean;
  capacity: number;
  whatsapp?: string | null;
  logoUrl?: string | null;
  skillsCovered: string[];
  skillsNeeded: string[];
  trackId: string;
  secondaryTrackId?: string | null;
  track: Track;
  secondaryTrack?: Track | null;
  mentorId?: string | null;
  mentor?: Mentor | null;
  members: TeamMember[];
  isMentorOfTeam: boolean;
  isMemberOfTeam: boolean;
}

const AVATAR_PRESETS: Record<string, { icon: LucideIcon; wash: string }> = {
  hacker: { icon: Terminal, wash: 'from-[#AC9C8D] to-[#D1C7BD]' },
  developer: { icon: Code2, wash: 'from-[#D1C7BD] to-[#EFE9E1]' },
  designer: { icon: Palette, wash: 'from-[#D9D9D9] to-[#AC9C8D]' },
  scientist: { icon: FlaskConical, wash: 'from-[#EFE9E1] to-[#D1C7BD]' },
  manager: { icon: Crown, wash: 'from-[#AC9C8D] to-[#D9D9D9]' },
  writer: { icon: PenLine, wash: 'from-[#D1C7BD] to-[#D9D9D9]' },
};

function MemberAvatar({
  avatarUrl,
  name,
  className = 'size-14',
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
        alt={`${name}'s avatar`}
        width={64}
        height={64}
        className={`object-cover rounded-2xl ${className}`}
      />
    );
  }

  const preset = AVATAR_PRESETS[avatarUrl || 'developer'] || AVATAR_PRESETS.developer;
  return (
    <span
      role="img"
      aria-label={`${name}'s profile avatar`}
      className={`flex items-center justify-center bg-gradient-to-br text-body rounded-2xl ${preset.wash} ${className}`}
    >
      <Icon icon={preset.icon} size="md" />
    </span>
  );
}

function TeamSkeletonView() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <Navbar />
      <main className="flex-1 py-12">
        <Container width="narrow" className="space-y-6">
          <div className="h-8 w-32 animate-pulse rounded-lg bg-[rgba(209,199,189,0.4)]" />
          <div className="h-48 w-full animate-pulse rounded-3xl bg-[rgba(248,246,242,0.8)] border border-[rgba(209,199,189,0.6)]" />
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="h-64 animate-pulse rounded-3xl bg-[rgba(248,246,242,0.8)] border border-[rgba(209,199,189,0.6)]" />
            <div className="h-64 animate-pulse rounded-3xl bg-[rgba(248,246,242,0.8)] border border-[rgba(209,199,189,0.6)]" />
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
}

export default function TeamDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [team, setTeam] = useState<TeamDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast(`${label} copied`, 'info');
    setTimeout(() => setCopiedField(null), 2000);
  };

  useEffect(() => {
    async function loadTeam() {
      try {
        const res = await fetch(`/api/teams/${params.id}`);
        const data = await res.json();
        if (data.success) {
          setTeam(data.team);
        } else {
          setError(data.error || 'Unable to load this team.');
          toast(data.error || 'Unable to load team details.', 'error');
        }
      } catch (err) {
        logger.error('Fetch team details error', err);
        setError('Unable to load this team. Please try again.');
        toast('Failed to load team details. Check your connection.', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadTeam();
  }, [params.id, toast]);

  if (loading) {
    return <TeamSkeletonView />;
  }

  if (error || !team) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
        <Navbar />
        <Container width="narrow" className="py-20 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl border border-[rgba(114,56,61,0.2)] bg-[rgba(114,56,61,0.08)] text-primary">
            <Users className="size-6" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Team Not Found</h2>
          <p className="mt-2 text-sm text-muted">{error || 'The requested team does not exist or you do not have permission.'}</p>
          <PremiumButton variant="glass" className="mt-6" onClick={() => router.back()}>
            Back Previous
          </PremiumButton>
        </Container>
        <Footer />
      </div>
    );
  }

  const isRecruitmentOpen = team.status === 'forming' && team.memberCount < 6;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <Navbar />

      <main className="flex-1">
        {/* Header Hero Section */}
        <section className="section-dune relative overflow-hidden pb-10">
          <Aurora variant="warm" spotlight={false} />
          <Container width="narrow" className="relative pt-8">
            <button
              onClick={() => router.back()}
              className="group mb-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted transition-colors hover:text-primary"
            >
              <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
              Back
            </button>

            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-[rgba(114,56,61,0.3)] bg-[rgba(114,56,61,0.08)] px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
                    {team.teamCode}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider border ${
                      isRecruitmentOpen
                        ? 'border-emerald-600/30 bg-emerald-500/10 text-emerald-700'
                        : 'border-[rgba(172,156,141,0.5)] bg-[rgba(172,156,141,0.15)] text-foreground'
                    }`}
                  >
                    {isRecruitmentOpen ? 'Recruitment Open' : 'Recruitment Closed'}
                  </span>
                  {team.mentor ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-blue-600/30 bg-blue-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-700">
                      <ShieldCheck className="size-3.5" /> Mentoring Active
                    </span>
                  ) : (
                    <span className="rounded-full border border-[rgba(209,199,189,0.7)] bg-white/40 px-3 py-1 text-xs font-bold uppercase tracking-wider text-muted">
                      No Mentor Assigned
                    </span>
                  )}
                </div>

                <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">
                  {team.name}
                </h1>

                <p className="text-sm font-semibold text-muted">
                  Led by <span className="text-foreground">{team.leaderName}</span> · {team.memberCount} / {team.capacity} Members
                </p>
              </div>

              {team.leaderContact && (
                <div className="mt-6 sm:mt-0 shrink-0 w-full sm:w-auto">
                  <div className="rounded-2xl border border-[rgba(209,199,189,0.7)] bg-[rgba(248,246,242,0.8)] p-4 shadow-sm space-y-2.5">
                    <span className="block text-[10px] font-black uppercase tracking-wider text-muted">
                      Team Leader Contact
                    </span>
                    <p className="text-sm font-bold text-foreground">{team.leaderContact.name}</p>

                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                      {team.leaderContact.email && (
                        <div className="flex items-center justify-between gap-3 rounded-xl border border-[rgba(209,199,189,0.6)] bg-white/80 px-3 py-1.5 text-xs">
                          <div className="min-w-0">
                            <span className="block text-[9px] uppercase tracking-wider text-muted font-bold">Email</span>
                            <span className="truncate font-semibold text-foreground block max-w-[160px]">{team.leaderContact.email}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy(team.leaderContact!.email!, 'Email')}
                            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[rgba(114,56,61,0.2)] bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary hover:bg-primary/20 transition-colors"
                          >
                            {copiedField === 'Email' ? (
                              <span className="flex items-center gap-1 text-emerald-700">
                                <Check className="size-3" /> Copied
                              </span>
                            ) : (
                              <>
                                <Copy className="size-3" /> Copy
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {team.leaderContact.contact && (
                        <div className="flex items-center justify-between gap-3 rounded-xl border border-[rgba(209,199,189,0.6)] bg-white/80 px-3 py-1.5 text-xs">
                          <div className="min-w-0">
                            <span className="block text-[9px] uppercase tracking-wider text-muted font-bold">Phone</span>
                            <span className="truncate font-semibold text-foreground block max-w-[140px]">{team.leaderContact.contact}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy(team.leaderContact!.contact!, 'Phone number')}
                            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[rgba(114,56,61,0.2)] bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary hover:bg-primary/20 transition-colors"
                          >
                            {copiedField === 'Phone number' ? (
                              <span className="flex items-center gap-1 text-emerald-700">
                                <Check className="size-3" /> Copied
                              </span>
                            ) : (
                              <>
                                <Copy className="size-3" /> Copy
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Container>
        </section>

        {/* Content Section */}
        <section className="relative border-t border-[rgba(209,199,189,0.55)]">
          <div className="surface-sunken">
            <Container width="narrow" className="py-12 space-y-8">
              {/* Overview Cards */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* SIH Theme Details */}
                <SpotlightCard className="rounded-3xl">
                  <div className="surface-raised rounded-3xl p-6 sm:p-7 space-y-5">
                    <div className="flex items-center gap-2">
                      <Layers className="size-5 text-primary" />
                      <h2 className="text-feature text-foreground">SIH Themes</h2>
                    </div>
                    <div className="h-px bg-gradient-to-r from-[rgba(172,156,141,0.55)] via-[rgba(209,199,189,0.35)] to-transparent" />

                    <div className="space-y-4">
                      <div>
                        <span className="block text-label uppercase text-muted text-xs">Primary Theme</span>
                        <div className="mt-1.5 rounded-2xl border border-[rgba(114,56,61,0.22)] bg-[rgba(114,56,61,0.05)] p-4">
                          <span className="inline-block rounded-md bg-primary px-2 py-0.5 text-[10px] font-bold text-on-accent uppercase">
                            {team.track.problemStatementCode}
                          </span>
                          <h3 className="mt-2 text-sm font-bold text-foreground">{team.track.name}</h3>
                          <p className="mt-1 text-xs text-muted leading-relaxed">{team.track.description}</p>
                          <span className="mt-2 inline-block text-[11px] font-semibold text-primary uppercase">
                            Domain: {team.track.category}
                          </span>
                        </div>
                      </div>

                      {team.secondaryTrack && (
                        <div>
                          <span className="block text-label uppercase text-muted text-xs">Secondary Theme</span>
                          <div className="mt-1.5 rounded-2xl border border-[rgba(209,199,189,0.6)] bg-white/40 p-4">
                            <span className="inline-block rounded-md bg-muted/20 px-2 py-0.5 text-[10px] font-bold text-foreground uppercase">
                              {team.secondaryTrack.problemStatementCode}
                            </span>
                            <h3 className="mt-2 text-sm font-bold text-foreground">{team.secondaryTrack.name}</h3>
                            <span className="mt-1 inline-block text-[11px] font-semibold text-muted uppercase">
                              Domain: {team.secondaryTrack.category}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </SpotlightCard>

                {/* Mentor & Team Status Card */}
                <SpotlightCard className="rounded-3xl">
                  <div className="surface-raised rounded-3xl p-6 sm:p-7 space-y-5">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="size-5 text-primary" />
                      <h2 className="text-feature text-foreground">Mentor &amp; Capacity</h2>
                    </div>
                    <div className="h-px bg-gradient-to-r from-[rgba(172,156,141,0.55)] via-[rgba(209,199,189,0.35)] to-transparent" />

                    <div className="space-y-4">
                      {/* Assigned Mentor Info */}
                      <div>
                        <span className="block text-label uppercase text-muted text-xs">Assigned Faculty Mentor</span>
                        {team.mentor ? (
                          <div className="mt-1.5 space-y-3 rounded-2xl border border-[rgba(209,199,189,0.6)] bg-white/50 p-4">
                            <div className="flex items-start gap-3.5">
                              <MemberAvatar avatarUrl={team.mentor.avatarUrl} name={team.mentor.name} className="size-12 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <h3 className="text-sm font-bold text-foreground truncate">{team.mentor.name}</h3>
                                <p className="text-xs text-muted truncate">{team.mentor.designation}</p>
                                <p className="text-[11px] font-semibold text-primary truncate">{team.mentor.organization}</p>
                              </div>
                            </div>
                            
                            {(team.mentor.email || team.mentor.contact) && (
                              <div className="pt-2 border-t border-[rgba(209,199,189,0.4)] grid gap-2 sm:grid-cols-2">
                                {team.mentor.email && (
                                  <div className="flex items-center justify-between gap-2 text-xs">
                                    <span className="truncate text-foreground font-semibold">{team.mentor.email}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleCopy(team.mentor!.email!, 'Email')}
                                      className="rounded border border-[rgba(114,56,61,0.2)] bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary hover:bg-primary/20"
                                    >
                                      Copy
                                    </button>
                                  </div>
                                )}
                                {team.mentor.contact && (
                                  <div className="flex items-center justify-between gap-2 text-xs">
                                    <span className="truncate text-foreground font-semibold">{team.mentor.contact}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleCopy(team.mentor!.contact!, 'Phone number')}
                                      className="rounded border border-[rgba(114,56,61,0.2)] bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary hover:bg-primary/20"
                                    >
                                      Copy
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="mt-1 text-xs italic text-muted">No faculty mentor has been assigned to this team yet.</p>
                        )}
                      </div>

                      {/* Skills Covered & Needed */}
                      <div>
                        <span className="block text-label uppercase text-muted text-xs mb-2">Team Skills Covered</span>
                        <div className="flex flex-wrap gap-1.5">
                          {team.skillsCovered.length > 0 ? (
                            team.skillsCovered.map((sk) => (
                              <span
                                key={sk}
                                className="rounded-md border border-[rgba(114,56,61,0.2)] bg-[rgba(114,56,61,0.08)] px-2.5 py-0.5 text-xs font-semibold text-primary"
                              >
                                {sk}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-muted">No skills calculated yet.</span>
                          )}
                        </div>
                      </div>

                      {team.skillsNeeded.length > 0 && (
                        <div>
                          <span className="block text-label uppercase text-muted text-xs mb-2">Looking For Skills</span>
                          <div className="flex flex-wrap gap-1.5">
                            {team.skillsNeeded.map((sk) => (
                              <span
                                key={sk}
                                className="rounded-md border border-[rgba(172,156,141,0.4)] bg-[rgba(172,156,141,0.15)] px-2.5 py-0.5 text-xs font-semibold text-foreground"
                              >
                                {sk}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </SpotlightCard>
              </div>

              {/* Team Members List */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-foreground">Team Members</h2>
                    <p className="text-xs text-muted">Click any member to view their complete student profile</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {team.femaleCount === 0 && team.memberCount >= 5 ? (
                      <span className="rounded-full bg-[rgba(180,50,50,0.1)] border border-[rgba(180,50,50,0.3)] px-3 py-1 text-xs font-bold text-[#A82B2B]">
                        1 Seat Reserved for Female (SIH Rule)
                      </span>
                    ) : team.femaleCount !== undefined && team.femaleCount > 0 ? (
                      <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-700">
                        {team.femaleCount} Female{team.femaleCount > 1 ? 's' : ''} · SIH Compliant
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-xs font-bold text-amber-800">
                        1+ Female Required
                      </span>
                    )}
                    <span className="rounded-full bg-[rgba(114,56,61,0.1)] px-3 py-1 text-xs font-bold text-primary">
                      {team.members.length} / {team.capacity} Members
                    </span>
                  </div>
                </div>

                <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" stagger={0.06} amount={0.1}>
                  {team.members.map((member) => {
                    const isLeader = member.userId === team.leaderId || member.roleInTeam === 'Leader';
                    return (
                      <RevealItem key={member.userId}>
                        <SpotlightCard className="h-full rounded-2xl">
                          <div
                            onClick={() => router.push(`/students/${member.userId}`)}
                            className="group surface-raised flex h-full cursor-pointer flex-col justify-between rounded-2xl p-5 border border-[rgba(209,199,189,0.65)] transition-all hover:border-[rgba(114,56,61,0.3)] hover:shadow-md"
                          >
                            <div className="space-y-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <MemberAvatar avatarUrl={member.avatarUrl} name={member.name} className="size-12 shrink-0" />
                                  <div className="min-w-0">
                                    <h3 className="text-base font-bold text-foreground truncate group-hover:text-primary transition-colors">
                                      {member.name}
                                    </h3>
                                    <p className="text-xs font-semibold text-muted">
                                      {member.branch} · {member.year}
                                    </p>
                                  </div>
                                </div>
                                {isLeader ? (
                                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-600/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-extrabold uppercase text-amber-700">
                                    <Crown className="size-3" /> Leader
                                  </span>
                                ) : (
                                  <span className="rounded-full border border-[rgba(209,199,189,0.6)] bg-white/50 px-2 py-0.5 text-[10px] font-bold uppercase text-muted">
                                    Member
                                  </span>
                                )}
                              </div>

                              <div className="space-y-1 text-xs text-body">
                                {member.section && (
                                  <p>
                                    <span className="text-muted font-bold">Section:</span> Section {member.section}
                                  </p>
                                )}
                                {member.college && (
                                  <p className="truncate">
                                    <span className="text-muted font-bold">College:</span> {member.college}
                                  </p>
                                )}
                              </div>

                              {member.skills.length > 0 && (
                                <div className="space-y-1">
                                  <span className="block text-[10px] uppercase font-bold text-muted">Key Skills</span>
                                  <div className="flex flex-wrap gap-1">
                                    {member.skills.slice(0, 4).map((sk) => (
                                      <span
                                        key={sk}
                                        className="rounded border border-[rgba(209,199,189,0.6)] bg-white/60 px-2 py-0.5 text-[10px] font-semibold text-foreground"
                                      >
                                        {sk}
                                      </span>
                                    ))}
                                    {member.skills.length > 4 && (
                                      <span className="text-[10px] text-muted self-center">
                                        +{member.skills.length - 4} more
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="mt-5 flex items-center justify-between border-t border-[rgba(209,199,189,0.35)] pt-3 text-xs font-bold text-primary group-hover:underline">
                              <span>View Profile</span>
                              <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                            </div>
                          </div>
                        </SpotlightCard>
                      </RevealItem>
                    );
                  })}
                </RevealGroup>
              </div>
            </Container>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
