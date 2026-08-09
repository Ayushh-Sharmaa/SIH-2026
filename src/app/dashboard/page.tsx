/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useCallback, useEffect, useState, type ReactNode, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, m } from 'framer-motion';
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
  Users,
  UserCheck,
  MailOpen,
  Calendar,
  Sparkles,
  UserX,
  X,
  Edit2,
  Trash2,
  Lock,
  Unlock,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import Icon from '@/components/ui/Icon';
import { Container, EmptyState, DashboardSkeleton } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ViewingAsBanner from '@/components/layout/ViewingAsBanner';
import { useEscapeKey, useFocusTrap, useScrollLock } from '@/hooks/useFocusTrap';
import {
  Aurora,
  Counter,
  PremiumButton,
  Reveal,
  RevealGroup,
  RevealItem,
  SpotlightCard,
  SplitText,
  TiltCard,
  DURATION,
  EASE,
  SPRING,
} from '@/components/motion';
import { logger } from '@/lib/logger';

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

const getStudentSkillBalance = (profile: { skills: string[]; softSkills: string[]; languages: string[] }) => {
  const allSelected = [...profile.skills, ...profile.softSkills, ...profile.languages];

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
        <SpotlightCard className="h-full rounded-2xl" intensity={0.14}>
          <div className="surface-raised h-full rounded-2xl px-4 py-3.5">
            <div className="truncate text-2xl font-extrabold capitalize tracking-tight text-foreground sm:text-[1.7rem]">
              {text ?? <Counter to={value ?? 0} duration={1.4} />}
            </div>
            <div className="mt-1 truncate text-label uppercase text-muted">
              {label}
            </div>
          </div>
        </SpotlightCard>
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
    <SpotlightCard className={`rounded-3xl ${className}`}>
      <div className={`surface-raised rounded-3xl p-6 sm:p-7`}>
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-feature text-foreground">{title}</h2>
          {action}
        </div>
        <div className="mb-5 h-px bg-gradient-to-r from-[rgba(172,156,141,0.55)] via-[rgba(209,199,189,0.35)] to-transparent" />
        {children}
      </div>
    </SpotlightCard>
  );
}



interface EditRoleModalProps {
  member: any;
  onClose: () => void;
  onSubmit: (role: string) => Promise<void>;
}

function EditRoleModal({ member, onClose, onSubmit }: EditRoleModalProps) {
  const [role, setRole] = useState(member.roleInTeam || 'Member');
  const [loading, setLoading] = useState(false);
  const panelRef = useFocusTrap<HTMLDivElement>(true);
  useScrollLock(true);
  useEscapeKey(true, onClose);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit(role);
    setLoading(false);
    onClose();
  };

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
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
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        className="surface-overlay relative w-full max-w-sm rounded-container p-6 text-foreground shadow-2xl"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(209,199,189,0.5)]">
          <h3 className="text-feature text-foreground">Edit Member Role</h3>
          <button onClick={onClose} aria-label="Close dialog">
            <X className="size-4 text-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <p className="text-xs text-muted">
            Assign a tech/collaboration role for <strong>{member.name}</strong> within the team.
          </p>

          <label className="block">
            <span className="mb-1.5 block text-label uppercase text-muted">Role Title</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-xl border border-[rgba(209,199,189,0.8)] bg-[rgba(248,246,242,0.65)] px-3.5 py-2 text-sm text-foreground outline-none focus:border-primary"
            >
              <option value="Member">Member</option>
              <option value="Lead Developer">Lead Developer</option>
              <option value="Frontend Developer">Frontend Developer</option>
              <option value="Backend Developer">Backend Developer</option>
              <option value="UI/UX Designer">UI/UX Designer</option>
              <option value="Researcher">Researcher</option>
              <option value="Presenter">Presenter</option>
            </select>
          </label>

          <div className="mt-6 flex justify-end gap-2">
            <PremiumButton variant="glass" size="sm" onClick={onClose} disabled={loading}>
              Cancel
            </PremiumButton>
            <PremiumButton type="submit" size="sm" loading={loading}>
              Save
            </PremiumButton>
          </div>
        </form>
      </m.div>
    </m.div>
  );
}

function TeamEditModal({ team, onClose, onSubmit }: { team: any; onClose: () => void; onSubmit: (details: any) => Promise<void> }) {
  const [name, setName] = useState(team.name || '');
  const [trackId, setTrackId] = useState(team.track?.id || '');
  const [whatsapp, setWhatsapp] = useState(team.whatsapp || '');
  const [mentorName, setMentorName] = useState(team.customMentorName || '');
  const [mentorDesignation, setMentorDesignation] = useState(team.customMentorDesignation || '');
  const [mentorMobile, setMentorMobile] = useState(team.customMentorMobile || '');
  const [mentorEmail, setMentorEmail] = useState(team.customMentorEmail || '');
  const [tracks, setTracks] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const panelRef = useFocusTrap<HTMLDivElement>(true);
  useScrollLock(true);
  useEscapeKey(true, onClose);
  useEffect(() => { fetch('/api/tracks').then((r) => r.json()).then((d) => d.success && setTracks(d.tracks)).catch(() => undefined); }, []);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setSaving(true);
    try { await onSubmit({ action: 'update_team_details', teamId: team.id, name, trackId, whatsapp, logoUrl: team.logoUrl || null, customMentorName: mentorName, customMentorDesignation: mentorDesignation, customMentorMobile: mentorMobile, customMentorEmail: mentorEmail }); onClose(); } finally { setSaving(false); }
  };
  const control = 'w-full rounded-xl border border-[rgba(209,199,189,0.8)] bg-[rgba(248,246,242,0.7)] px-3.5 py-2 text-sm text-foreground outline-none focus:border-primary';
  return <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-modal flex items-center justify-center p-4">
    <div aria-hidden onClick={onClose} className="absolute inset-0 bg-[rgb(50_45_41/0.34)] backdrop-blur-md" />
    <m.div ref={panelRef} role="dialog" aria-modal="true" tabIndex={-1} initial={{ opacity: 0, y: 20, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="surface-overlay relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl p-6 text-foreground sm:p-8">
      <div className="flex items-center justify-between"><div><span className="text-label uppercase text-primary">{team.teamCode}</span><h3 className="mt-1 text-feature font-extrabold">Edit team details</h3></div><button onClick={onClose} aria-label="Close"><X className="size-4 text-muted" /></button></div>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2"><label><Label>Team name</Label><input required value={name} onChange={(e) => setName(e.target.value)} className={`${control} mt-1.5`} /></label><label><Label>Problem statement</Label><select required value={trackId} onChange={(e) => setTrackId(e.target.value)} className={`${control} mt-1.5`}>{tracks.map((t) => <option key={t.id} value={t.id}>{t.problemStatementCode} — {t.name}</option>)}</select></label></div>
        <label><Label>Leader WhatsApp</Label><input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className={`${control} mt-1.5`} /></label>
        <div className="rounded-2xl border border-[rgba(209,199,189,0.7)] bg-[rgba(239,233,225,0.45)] p-4"><Label>External mentor (optional)</Label><div className="mt-3 grid gap-3 sm:grid-cols-2"><input placeholder="Name" value={mentorName} onChange={(e) => setMentorName(e.target.value)} className={control} /><input placeholder="Designation" value={mentorDesignation} onChange={(e) => setMentorDesignation(e.target.value)} className={control} /><input placeholder="Mobile" value={mentorMobile} onChange={(e) => setMentorMobile(e.target.value)} className={control} /><input type="email" placeholder="Email" value={mentorEmail} onChange={(e) => setMentorEmail(e.target.value)} className={control} /></div></div>
        <div className="flex justify-end gap-2 pt-2"><PremiumButton type="button" variant="glass" size="sm" onClick={onClose} disabled={saving}>Cancel</PremiumButton><PremiumButton type="submit" size="sm" loading={saving}>Save changes</PremiumButton></div>
      </form>
    </m.div>
  </m.div>;
}

export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Student dashboard tabs: 'team' or 'invitations'
  const [activeTab, setActiveTab] = useState<'team' | 'invitations'>('team');

  // Modal states
  const [editingRoleMember, setEditingRoleMember] = useState<any>(null);
  const [editingTeam, setEditingTeam] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error('Failed to fetch dashboard data');
      setData(await res.json());
    } catch (err) {
      logger.error('Dashboard fetch failed', err);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      fetchDashboard();
    });
    return () => cancelAnimationFrame(handle);
  }, [fetchDashboard]);

  // Mentor Request actions (Mentor perspective)
  const handleMentorRequestResponse = async (
    requestId: string,
    action: 'accept' | 'decline' | 'meeting_requested' | 'keep_pending'
  ) => {
    setActionLoading(requestId);

    // Optimistic UI Update: hide the request immediately
    //
    // This block referenced `data.mentorRequests`, which the dashboard API has
    // never returned — the payload field is `pendingRequests`, and that is what
    // every render site below reads. The guard was therefore always false, so
    // the optimistic update never ran and the row stayed on screen until the
    // refetch completed.
    const previousData = data;
    if (data && data.pendingRequests) {
      setData({
        ...data,
        pendingRequests: data.pendingRequests.filter((r: any) => r.id !== requestId),
      });
    }

    try {
      const res = await fetch(`/api/mentor-requests/${requestId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast(result.error || 'Failed to process request', 'error');
        // Rollback on failure
        setData(previousData);
      } else {
        toast(`Request status updated successfully.`, 'success');
        await fetchDashboard();
      }
    } catch (err) {
      logger.error('Mentor request response failed', err);
      toast('Something went wrong. Please try again.', 'error');
      // Rollback on failure
      setData(previousData);
    } finally {
      setActionLoading(null);
    }
  };

  // Join Request actions (Team Leader perspective)
  const handleJoinRequestResponse = async (
    requestId: string,
    action: 'accept' | 'decline' | 'on_hold' | 'meeting_requested'
  ) => {
    setActionLoading(requestId);
    try {
      const res = await fetch('/api/join-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast(result.error || 'Failed to process request', 'error');
      } else {
        toast(`Join request status updated: ${action}`, 'success');
        await fetchDashboard();
      }
    } catch (err) {
      logger.error('Respond join request failed', err);
      toast('Could not complete operation.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Team Invite actions (Student perspective)
  const handleTeamInviteResponse = async (
    inviteId: string,
    action: 'accept' | 'decline' | 'on_hold' | 'waitlist'
  ) => {
    setActionLoading(inviteId);
    try {
      const res = await fetch('/api/team-invites', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteId, action }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast(result.error || 'Failed to process invitation', 'error');
      } else {
        toast(`Invitation status updated: ${action}`, 'success');
        await fetchDashboard();
      }
    } catch (err) {
      logger.error('Respond team invite failed', err);
      toast('Could not complete invite response.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Edit recruitment status (Leader action)
  const handleRecruitmentToggle = async (teamId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'forming' ? 'locked' : 'forming';
    try {
      const res = await fetch('/api/teams', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_recruitment', teamId, status: nextStatus }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast(result.error || 'Failed to toggle recruitment', 'error');
      } else {
        toast(`Recruitment ${nextStatus === 'forming' ? 'opened' : 'closed'}.`, 'success');
        await fetchDashboard();
      }
    } catch (err) {
      logger.error('Recruitment toggle failed', err);
      toast('Something went wrong.', 'error');
    }
  };

  // Kick member (Leader action)
  const handleKickMember = async (targetUserId: string) => {
    if (!confirm('Are you sure you want to remove this member from the team?')) return;
    try {
      const res = await fetch('/api/teams/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'kick', targetUserId }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast(result.error || 'Failed to remove member.', 'error');
      } else {
        toast('Member removed successfully.', 'success');
        await fetchDashboard();
      }
    } catch (err) {
      logger.error('Kick member failed', err);
      toast('Something went wrong.', 'error');
    }
  };

  // Edit member role submission (Leader action)
  const handleEditRoleSubmit = async (newRole: string) => {
    if (!editingRoleMember) return;
    try {
      const res = await fetch('/api/teams', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_member_role',
          teamId: data.team.id,
          targetUserId: editingRoleMember.userId,
          newRole,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast(result.error || 'Failed to update member role.', 'error');
      } else {
        toast('Member role updated successfully.', 'success');
        await fetchDashboard();
      }
    } catch (err) {
      logger.error('Edit role failed', err);
      toast('Something went wrong.', 'error');
    }
  };

  const handleTeamDetailsSubmit = async (details: any) => {
    const res = await fetch('/api/teams', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(details) });
    const result = await res.json();
    if (!res.ok) { toast(result.error || 'Failed to update team details.', 'error'); throw new Error(result.error); }
    toast('Team details updated successfully.', 'success');
    await fetchDashboard();
  };

  const handleDeleteTeam = async () => {
    const currentTeam = data?.team;
    if (!currentTeam || !confirm(`Delete ${currentTeam.teamCode} (${currentTeam.name})? This will remove every member from the team and cannot be undone.`)) return;
    setActionLoading('delete-team');
    try {
      const res = await fetch('/api/teams', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ teamId: currentTeam.id }) });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to delete team.');
      toast('Team deleted. All members are available again.', 'success');
      await fetchDashboard();
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Failed to delete team.', 'error');
    } finally { setActionLoading(null); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
        <Navbar />
        <main className="flex-1">
          <DashboardSkeleton />
        </main>
        <Footer />
      </div>
    );
  }

  const isStudent = data?.role === 'STUDENT';
  const profile = data?.profile;
  const team = data?.team;
  const filledSeats = team?.members?.length ?? 0;
  const isLeader = team && team.leaderId === profile?.userId;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <ViewingAsBanner />
      <Navbar />

      <main id="main" className="flex-1">
        {/* Welcome Section */}
        <section className="relative overflow-hidden pb-14 pt-8 sm:pt-12">
          <Aurora variant="cool" spotlight />
          <div aria-hidden className="grid-lines absolute inset-0" />

          <Container width="wide" className="relative">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <m.div
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
              </m.div>

              <div className="min-w-0 flex-1">
                <m.div
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
                </m.div>

                <SplitText
                  as="h1"
                  text={`Welcome back, ${profile?.name || 'User'}`}
                  className="text-title text-foreground font-black"
                  delay={0.1}
                />

                <m.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.45, duration: 0.5 }}
                  className="mt-2 max-w-xl text-sm leading-relaxed text-body"
                >
                  {isStudent
                    ? 'Track your team formation status, review your profile, and explore matches.'
                    : 'Manage the hackathon teams you guide and respond to incoming mentorship requests.'}
                </m.p>
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
                    text={team ? String(team.status === 'forming' ? 'Open' : 'Closed') : 'No team'}
                    label="Recruitment"
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
          </Container>
        </section>

        {/* Dashboard Panels */}
        <section className="relative">
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(172,156,141,0.6)] to-transparent"
          />
          <div className="surface-sunken border-x-0">
            <Container width="wide" className="grid grid-cols-1 gap-6 py-12 lg:grid-cols-5">
              
              {/* Profile Sidebar */}
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

                          {/* Skill Balance Donut Chart */}
                          {(() => {
                            const balance = getStudentSkillBalance({
                              skills: profile?.skills || [],
                              softSkills: profile?.softSkills || [],
                              languages: profile?.languages || [],
                            });
                            if (balance.total === 0) return null;
                            return (
                              <div className="flex flex-col items-center gap-4 rounded-2xl border border-[rgba(209,199,189,0.7)] bg-[rgba(239,233,225,0.4)] p-4 sm:flex-row">
                                <div className="relative grid size-20 shrink-0 place-items-center">
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
                                    <span className="block text-base font-extrabold leading-none tracking-tight text-foreground">
                                      {balance.total}
                                    </span>
                                    <span className="mt-0.5 block text-[8px] uppercase tracking-wider text-muted">
                                      skills
                                    </span>
                                  </div>
                                </div>

                                <div className="w-full flex-1 space-y-1">
                                  <span className="block text-[10px] font-bold text-foreground uppercase tracking-wider">
                                    Domain Split
                                  </span>
                                  <div className="space-y-1 text-[11px]">
                                    {(
                                      [
                                        ['Engineering', 'Engineering & code', balance.engineering],
                                        ['Design', 'Design & UI/UX', balance.design],
                                        ['Communication', 'Communication & soft', balance.communication],
                                      ] as const
                                    ).map(([key, label, val]) => (
                                      <div key={key} className="flex items-center justify-between">
                                        <span className="flex items-center gap-1 text-muted">
                                          <span
                                            className="size-1.5 rounded-full"
                                            style={{ backgroundColor: DOMAIN_SWATCH[key] }}
                                          />
                                          {label}
                                        </span>
                                        <span className="font-bold text-foreground">
                                          {val.count} ({val.pct}%)
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            );
                          })()}

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
                        </>
                      )}
                    </div>
                  </Panel>
                </div>
              </Reveal>

              {/* Main Content Area */}
              <div className="space-y-6 lg:col-span-3">
                {isStudent ? (
                  <>
                    {/* Student Dashboard Tabs */}
                    <div className="flex gap-2 border-b border-[rgba(209,199,189,0.6)] pb-px mb-4">
                      <button
                        onClick={() => setActiveTab('team')}
                        className={`px-4 py-2 text-xs font-black uppercase tracking-wider transition-colors border-b-2 ${
                          activeTab === 'team'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted hover:text-foreground'
                        }`}
                      >
                        My Team
                      </button>
                      <button
                        onClick={() => setActiveTab('invitations')}
                        className={`px-4 py-2 text-xs font-black uppercase tracking-wider transition-colors border-b-2 flex items-center gap-1.5 ${
                          activeTab === 'invitations'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted hover:text-foreground'
                        }`}
                      >
                        Collaboration Hub
                        {data?.receivedInvites?.length > 0 && (
                          <span className="inline-block px-1.5 py-0.2 rounded-full bg-primary text-[8px] text-on-accent font-black">
                            {data.receivedInvites.length}
                          </span>
                        )}
                      </button>
                    </div>

                    <AnimatePresence mode="wait">
                      {activeTab === 'team' ? (
                        <m.div
                          key="team-tab"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-6"
                        >
                          {team ? (
                            <>
                              {/* Roster & Management */}
                              <Reveal direction="left">
                                <Panel
                                  title="My team"
                                  action={<Chip tone="primary">{team.status === 'forming' ? 'Open for Recruitment' : 'Recruitment Closed'}</Chip>}
                                >
                                  <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                      <div className="size-12 shrink-0 overflow-hidden rounded-2xl border border-[rgba(114,56,61,0.25)] bg-gradient-to-br from-[rgba(114,56,61,0.08)] to-[rgba(114,56,61,0.02)] flex items-center justify-center font-black text-primary text-sm">
                                        {team.logoUrl ? (
                                          <img src={team.logoUrl} alt="Logo" className="size-full object-cover" />
                                        ) : (
                                          team.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || 'NS'
                                        )}
                                      </div>
                                       <div>
                                         <div className="flex items-center gap-2">
                                           <h3 className="text-feature text-foreground font-extrabold">{team.name}</h3>
                                           <span className="rounded-md bg-[rgba(114,56,61,0.08)] px-2 py-0.5 text-[10px] font-black tracking-wider text-primary">{team.teamCode}</span>
                                         </div>
                                        <p className="mt-0.5 text-xs text-muted">
                                          Track{' '}
                                          <span className="font-bold text-primary">
                                            {team.track?.problemStatementCode || 'N/A'}
                                          </span>{' '}
                                          — {team.track?.name || 'N/A'}
                                        </p>
                                      </div>
                                    </div>

                                     {/* Team Leader controls */}
                                     {isLeader && (
                                       <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-muted font-bold uppercase">Recruitment Status:</span>
                                        <button
                                          onClick={() => handleRecruitmentToggle(team.id, team.status)}
                                          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-caption font-black transition-colors ${
                                            team.status === 'forming'
                                              ? 'border-primary bg-primary/10 text-primary hover:bg-primary/20'
                                              : 'border-[rgba(209,199,189,0.7)] bg-[rgba(239,233,225,0.6)] text-muted hover:text-foreground'
                                          }`}
                                        >
                                          {team.status === 'forming' ? (
                                            <>
                                              <Unlock className="size-3" /> Recruiting Open
                                            </>
                                          ) : (
                                            <>
                                              <Lock className="size-3" /> Recruiting Closed
                                            </>
                                          )}
                                         </button>
                                         <button onClick={() => setEditingTeam(true)} className="rounded-lg border border-[rgba(209,199,189,0.75)] p-2 text-muted transition-colors hover:border-primary hover:text-primary" aria-label="Edit team details" title="Edit team details"><Edit2 className="size-3.5" /></button>
                                         <button onClick={handleDeleteTeam} disabled={actionLoading === 'delete-team'} className="rounded-lg border border-[rgba(114,56,61,0.3)] p-2 text-primary transition-colors hover:bg-primary/10 disabled:opacity-50" aria-label="Delete team" title="Delete team"><Trash2 className="size-3.5" /></button>
                                       </div>
                                     )}
                                  </div>

                                  {/* Leader Team Roster List (Rich table view if leader, standard grid if member) */}
                                  <div className="mb-6">
                                    <div className="mb-3 flex items-center justify-between gap-4">
                                      <Label>Team roster</Label>
                                      <span className="text-caption font-semibold text-muted">
                                        {filledSeats} of 6 seats filled
                                      </span>
                                    </div>

                                    {isLeader ? (
                                      // Leader view with role changes and kicking
                                      <div className="space-y-2.5">
                                        {team.members.map((member: any) => (
                                          <div
                                            key={member.userId}
                                            className="flex items-center justify-between p-3.5 rounded-xl border border-[rgba(209,199,189,0.6)] bg-[rgba(248,246,242,0.75)] hover:border-primary/30 transition-all duration-200"
                                          >
                                            <div className="flex items-center gap-3 min-w-0">
                                              <Avatar
                                                avatarUrl={member.avatarUrl}
                                                name={member.name}
                                                className="size-9 rounded-lg shrink-0"
                                              />
                                              <div className="min-w-0">
                                                <span className="block text-xs font-bold text-foreground truncate">
                                                  {member.name}
                                                </span>
                                                <span className="block text-[10px] text-muted mt-0.5">
                                                  {member.branch} · {member.year}
                                                </span>
                                              </div>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                              <span className="rounded bg-[rgba(114,56,61,0.08)] border border-[rgba(114,56,61,0.2)] px-2 py-0.5 text-[9px] font-black text-primary">
                                                {member.userId === team.leaderId ? 'Leader' : (member.roleInTeam || 'Member')}
                                              </span>

                                              {/* Actions */}
                                              {member.userId !== team.leaderId && (
                                                <div className="flex items-center gap-1">
                                                  <button
                                                    onClick={() => setEditingRoleMember(member)}
                                                    className="p-1.5 rounded border border-[rgba(209,199,189,0.7)] text-muted hover:text-foreground hover:border-foreground"
                                                    aria-label="Edit role"
                                                  >
                                                    <Edit2 className="size-3" />
                                                  </button>
                                                  <button
                                                    onClick={() => handleKickMember(member.userId)}
                                                    className="p-1.5 rounded border border-[rgba(114,56,61,0.3)] text-primary hover:bg-primary/5"
                                                    aria-label="Remove member"
                                                  >
                                                    <X className="size-3" />
                                                  </button>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        ))}

                                        {/* Empty Seats */}
                                        {Array.from({ length: Math.max(0, 6 - filledSeats) }).map((_, idx) => (
                                          <div
                                            key={`empty-${idx}`}
                                            className="flex items-center justify-between p-3.5 rounded-xl border border-dashed border-[rgba(172,156,141,0.6)] bg-[rgba(239,233,225,0.45)] text-xs text-muted"
                                          >
                                            <span>Open Roster Seat</span>
                                            <PremiumButton href="/team-formation/find-teammates" size="sm" variant="glass">
                                              Invite
                                            </PremiumButton>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      // Standard Grid view for team member
                                      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                                        {Array.from({ length: 6 }, (_, index) => {
                                          const member = team.members[index];
                                          return member ? (
                                            <m.div
                                              key={member.userId}
                                              className="min-w-0 text-center"
                                              whileHover={{ y: -4, scale: 1.04 }}
                                            >
                                              <Avatar
                                                avatarUrl={member.avatarUrl}
                                                name={member.name}
                                                className="aspect-square w-full rounded-xl border border-[rgba(209,199,189,0.7)] text-xl"
                                              />
                                              <p className="mt-1.5 truncate text-caption font-semibold text-foreground">
                                                {member.name}
                                              </p>
                                              <span className="block text-[8px] uppercase tracking-wider text-primary font-bold">
                                                {member.userId === team.leaderId ? 'Leader' : (member.roleInTeam || 'Member')}
                                              </span>
                                            </m.div>
                                          ) : (
                                            <div
                                              key={`seat-${index}`}
                                              className="grid aspect-square place-items-center rounded-xl border border-dashed border-[rgba(172,156,141,0.6)] bg-[rgba(239,233,225,0.45)] text-lg text-muted"
                                            >
                                              +
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                </Panel>
                              </Reveal>

                              {/* Leader Incoming Join Requests & Sent Invites */}
                              {isLeader && (
                                <>
                                  {/* Team Join Requests */}
                                  <Reveal direction="left" delay={0.05}>
                                    <Panel
                                      title="Incoming Join Requests"
                                      action={
                                        team.joinRequests?.filter((r: any) => r.status === 'pending').length > 0 ? (
                                          <Chip tone="primary">
                                            {team.joinRequests.filter((r: any) => r.status === 'pending').length} waiting
                                          </Chip>
                                        ) : undefined
                                      }
                                    >
                                      {team.joinRequests && team.joinRequests.length > 0 ? (
                                        <div className="space-y-3.5">
                                          <AnimatePresence initial={false}>
                                            {team.joinRequests.map((req: any) => (
                                              <m.div
                                                key={req.id}
                                                layout
                                                initial={{ opacity: 0, y: 12 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="p-4 rounded-2xl border border-[rgba(209,199,189,0.65)] bg-[rgba(248,246,242,0.7)] space-y-3"
                                              >
                                                <div className="flex items-start justify-between gap-4">
                                                  <div className="flex items-center gap-3">
                                                    <Avatar
                                                      avatarUrl={req.student.avatarUrl}
                                                      name={req.student.name}
                                                      className="size-10 rounded-xl"
                                                    />
                                                    <div>
                                                      <span className="block text-xs font-bold text-foreground">
                                                        {req.student.name}
                                                      </span>
                                                      <span className="block text-[10px] text-muted">
                                                        {req.student.branch} · {req.student.year}
                                                      </span>
                                                    </div>
                                                  </div>

                                                  <span
                                                    className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase border ${
                                                      req.status === 'pending'
                                                        ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                                        : req.status === 'on_hold'
                                                        ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                                                        : req.status === 'meeting_requested'
                                                        ? 'bg-purple-500/10 text-purple-600 border-purple-500/20'
                                                        : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                                    }`}
                                                  >
                                                    {req.status.replace('_', ' ')}
                                                  </span>
                                                </div>

                                                {req.message && (
                                                  <p className="rounded-xl border-l-2 border-primary/35 bg-[rgba(239,233,225,0.7)] px-3 py-2 text-xs italic text-body">
                                                    &ldquo;{req.message}&rdquo;
                                                  </p>
                                                )}

                                                {req.status !== 'accepted' && req.status !== 'declined' && (
                                                  <div className="flex flex-wrap gap-2 pt-1 border-t border-[rgba(209,199,189,0.3)]">
                                                    <PremiumButton
                                                      size="sm"
                                                      disabled={actionLoading !== null}
                                                      onClick={() => handleJoinRequestResponse(req.id, 'accept')}
                                                    >
                                                      Accept
                                                    </PremiumButton>
                                                    <PremiumButton
                                                      size="sm"
                                                      variant="glass"
                                                      disabled={actionLoading !== null}
                                                      onClick={() => handleJoinRequestResponse(req.id, 'meeting_requested')}
                                                    >
                                                      Request Meeting
                                                    </PremiumButton>
                                                    <PremiumButton
                                                      size="sm"
                                                      variant="glass"
                                                      disabled={actionLoading !== null}
                                                      onClick={() => handleJoinRequestResponse(req.id, 'on_hold')}
                                                    >
                                                      Hold
                                                    </PremiumButton>
                                                    <PremiumButton
                                                      size="sm"
                                                      variant="glass"
                                                      disabled={actionLoading !== null}
                                                      onClick={() => handleJoinRequestResponse(req.id, 'decline')}
                                                    >
                                                      Decline
                                                    </PremiumButton>
                                                  </div>
                                                )}
                                              </m.div>
                                            ))}
                                          </AnimatePresence>
                                        </div>
                                      ) : (
                                        <p className="py-6 text-center text-xs text-muted">
                                          No incoming join requests.
                                        </p>
                                      )}
                                    </Panel>
                                  </Reveal>

                                  {/* Sent Invitations */}
                                  <Reveal direction="left" delay={0.08}>
                                    <Panel title="Sent Team Invitations">
                                      {team.invites && team.invites.length > 0 ? (
                                        <div className="space-y-3.5">
                                          {team.invites.map((inv: any) => (
                                            <div
                                              key={inv.id}
                                              className="flex items-center justify-between p-3.5 rounded-xl border border-[rgba(209,199,189,0.6)] bg-[rgba(248,246,242,0.7)]"
                                            >
                                              <div className="flex items-center gap-3">
                                                <Avatar
                                                  avatarUrl={inv.student.avatarUrl}
                                                  name={inv.student.name}
                                                  className="size-9 rounded-lg"
                                                />
                                                <div>
                                                  <span className="block text-xs font-bold text-foreground">
                                                    {inv.student.name}
                                                  </span>
                                                  <span className="block text-[10px] text-muted">
                                                    {inv.student.branch} · {inv.student.year}
                                                  </span>
                                                </div>
                                              </div>

                                              <span
                                                className={`rounded bg-[rgba(239,233,225,0.8)] border border-[rgba(209,199,189,0.7)] px-2 py-0.5 text-[9px] font-black uppercase text-muted`}
                                              >
                                                {inv.status}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="py-6 text-center text-xs text-muted">
                                          No team invitations sent.
                                        </p>
                                      )}
                                    </Panel>
                                  </Reveal>
                                </>
                              )}

                              {/* Assigned Mentor & Responses */}
                              <Reveal direction="left" delay={0.12}>
                                <div className="space-y-4">
                                  <div className="surface-raised flex flex-col items-start justify-between gap-4 rounded-3xl p-6 sm:flex-row sm:items-center">
                                    <div>
                                      <Label>Assigned mentor</Label>
                                      {team.mentor ? (
                                        <p className="mt-1 text-sm font-bold text-foreground flex items-center gap-1.5">
                                          <ShieldCheck className="size-4 text-emerald-600" />
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
                                    {!team.mentor && isLeader && (
                                      <PremiumButton size="sm" href="/team-formation/find-mentors">
                                        Find mentors
                                      </PremiumButton>
                                    )}
                                  </div>

                                  {/* Mentor Request responses history */}
                                  {team.mentorRequests && team.mentorRequests.length > 0 && (
                                    <Panel title="Mentor Requests Status">
                                      <div className="space-y-3">
                                        {team.mentorRequests.map((req: any) => (
                                          <div
                                            key={req.id}
                                            className="p-3.5 rounded-xl border border-[rgba(209,199,189,0.6)] bg-[rgba(248,246,242,0.7)] flex justify-between items-center"
                                          >
                                            <div>
                                              <span className="block text-xs font-bold text-foreground">
                                                {req.mentor.name}
                                              </span>
                                              <span className="block text-[10px] text-muted">
                                                {req.mentor.designation} at {req.mentor.organization}
                                              </span>
                                            </div>
                                            <span
                                              className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase border ${
                                                req.status === 'accepted'
                                                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                                  : req.status === 'declined'
                                                  ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                                                  : req.status === 'meeting_requested'
                                                  ? 'bg-purple-500/10 text-purple-600 border-purple-500/20'
                                                  : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                              }`}
                                            >
                                              {req.status.replace('_', ' ')}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </Panel>
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
                          )}
                        </m.div>
                      ) : (
                        <m.div
                          key="invitations-tab"
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-6"
                        >
                          {/* Received Team Invitations */}
                          <Panel title="Team Invitations">
                            {data?.receivedInvites && data.receivedInvites.length > 0 ? (
                              <div className="space-y-3.5">
                                <AnimatePresence initial={false}>
                                  {data.receivedInvites.map((inv: any) => (
                                    <m.div
                                      key={inv.id}
                                      layout
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, x: -20 }}
                                      className="p-4 rounded-2xl border border-[rgba(209,199,189,0.7)] bg-[rgba(248,246,242,0.7)] space-y-3.5"
                                    >
                                      <div>
                                        <div className="flex items-center justify-between gap-3">
                                          <span className="text-xs font-black text-foreground">
                                            Invite to join {inv.team.name}
                                          </span>
                                          <span
                                            className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase border ${
                                              inv.status === 'pending'
                                                ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                                : inv.status === 'on_hold'
                                                ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                                                : 'bg-purple-500/10 text-purple-600 border-purple-500/20'
                                            }`}
                                          >
                                            {inv.status}
                                          </span>
                                        </div>
                                        <span className="block text-[10px] text-muted mt-1 leading-relaxed">
                                          Problem Statement: <strong>{inv.team.track.problemStatementCode}</strong> — {inv.team.track.name}
                                        </span>
                                      </div>

                                      {inv.status !== 'accepted' && inv.status !== 'declined' && (
                                        <div className="flex flex-wrap gap-2 pt-1 border-t border-[rgba(209,199,189,0.3)]">
                                          <PremiumButton
                                            size="sm"
                                            disabled={actionLoading !== null}
                                            onClick={() => handleTeamInviteResponse(inv.id, 'accept')}
                                          >
                                            Accept
                                          </PremiumButton>
                                          <PremiumButton
                                            size="sm"
                                            variant="glass"
                                            disabled={actionLoading !== null}
                                            onClick={() => handleTeamInviteResponse(inv.id, 'on_hold')}
                                          >
                                            On Hold
                                          </PremiumButton>
                                          <PremiumButton
                                            size="sm"
                                            variant="glass"
                                            disabled={actionLoading !== null}
                                            onClick={() => handleTeamInviteResponse(inv.id, 'waitlist')}
                                          >
                                            Waitlist
                                          </PremiumButton>
                                          <PremiumButton
                                            size="sm"
                                            variant="glass"
                                            disabled={actionLoading !== null}
                                            onClick={() => handleTeamInviteResponse(inv.id, 'decline')}
                                          >
                                            Decline
                                          </PremiumButton>
                                        </div>
                                      )}
                                    </m.div>
                                  ))}
                                </AnimatePresence>
                              </div>
                            ) : (
                              <p className="py-8 text-center text-xs text-muted">
                                No active team invitations.
                              </p>
                            )}
                          </Panel>

                          {/* Sent Join Requests & Status approvals */}
                          <Panel title="My Join Requests">
                            {data?.sentRequests && data.sentRequests.length > 0 ? (
                              <div className="space-y-3">
                                {data.sentRequests.map((req: any) => (
                                  <div
                                    key={req.id}
                                    className="p-3.5 rounded-xl border border-[rgba(209,199,189,0.6)] bg-[rgba(248,246,242,0.7)] flex justify-between items-center"
                                  >
                                    <div>
                                      <span className="block text-xs font-bold text-foreground">
                                        Request to join: {req.team.name}
                                      </span>
                                      <span className="block text-[10px] text-muted mt-0.5">
                                        Track: {req.team.track.problemStatementCode}
                                      </span>
                                    </div>
                                    <span
                                      className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase border ${
                                        req.status === 'accepted'
                                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                          : req.status === 'declined'
                                          ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                                          : req.status === 'meeting_requested'
                                          ? 'bg-purple-500/10 text-purple-600 border-purple-500/20'
                                          : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                      }`}
                                    >
                                      {req.status.replace('_', ' ')}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="py-8 text-center text-xs text-muted">
                                You have not sent any team join requests yet.
                              </p>
                            )}
                          </Panel>
                        </m.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  // Faculty Mentor Dashboard View
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
                          <m.div
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
                        {(data?.teams || []).length > 0 ? (
                          <RevealGroup className="space-y-3" stagger={0.06} amount={0.1}>
                            {(data?.teams || []).map((t: any) => (
                              <RevealItem key={t.id}>
                                <m.div
                                  whileHover={{ y: -3 }}
                                  transition={SPRING.snappy}
                                  className="flex items-center justify-between gap-4 rounded-2xl border border-[rgba(209,199,189,0.65)] bg-[rgba(248,246,242,0.7)] p-4 transition-colors hover:border-[rgba(114,56,61,0.24)]"
                                >
                                  <div className="min-w-0">
                                    <span className="block truncate text-sm font-bold text-foreground">
                                      {t.name}
                                    </span>
                                    <span className="mt-0.5 block truncate text-xs text-muted">
                                      Track: {t.track?.name || 'N/A'}
                                    </span>
                                  </div>
                                  <Chip tone="accent">{t.memberCount} / 6</Chip>
                                </m.div>
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

                    {/* Mentor Requests List */}
                    <Reveal direction="left" delay={0.12}>
                      <Panel
                        title="Incoming Mentorship Requests"
                        action={
                          (data?.pendingRequests || []).length > 0 ? (
                            <Chip tone="primary">{(data?.pendingRequests || []).length} waiting</Chip>
                          ) : undefined
                        }
                      >
                        {(data?.pendingRequests || []).length > 0 ? (
                          <div className="space-y-4">
                            <AnimatePresence initial={false}>
                              {(data?.pendingRequests || []).map((req: any) => (
                                <m.div
                                  key={req.id}
                                  layout
                                  initial={{ opacity: 0, y: 12 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, x: -24 }}
                                  className="space-y-4 rounded-2xl border border-[rgba(209,199,189,0.65)] bg-[rgba(248,246,242,0.7)] p-4"
                                >
                                  <div>
                                    <div className="flex justify-between items-center gap-2">
                                      <span className="text-sm font-black text-foreground">
                                        {req.team.name}
                                      </span>
                                      <span
                                        className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase border ${
                                          req.status === 'pending'
                                            ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                            : req.status === 'meeting_requested'
                                            ? 'bg-purple-500/10 text-purple-600 border-purple-500/20'
                                            : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                                        }`}
                                      >
                                        {req.status.replace('_', ' ')}
                                      </span>
                                    </div>
                                    <span className="mt-0.5 block text-xs text-muted">
                                      Track: {req.team.track.name} ({req.team.track.problemStatementCode})
                                    </span>

                                    {/* Team Members List */}
                                    <div className="mt-3 flex items-center gap-1.5">
                                      <span className="text-[10px] text-muted uppercase font-bold">Roster:</span>
                                      <div className="flex -space-x-1.5">
                                        {req.team.members?.map((m: any, idx: number) => (
                                          <div key={idx} className="group relative">
                                            <Avatar
                                              avatarUrl={m.avatarUrl}
                                              name={m.name}
                                              className="size-6 rounded-full border border-white"
                                            />
                                            <span className="pointer-events-none absolute bottom-full left-1/2 z-10 -translate-x-1/2 translate-y-[-2px] whitespace-nowrap rounded bg-foreground px-1.5 py-0.5 text-[8px] text-background opacity-0 transition-opacity group-hover:opacity-100">
                                              {m.name} ({m.branch})
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    {req.message && (
                                      <p className="mt-3.5 rounded-xl border-l-2 border-primary/35 bg-[rgba(239,233,225,0.7)] px-3 py-2 text-xs italic leading-relaxed text-body">
                                        &ldquo;{req.message}&rdquo;
                                      </p>
                                    )}
                                  </div>

                                  <div className="flex flex-wrap gap-2 border-t border-[rgba(209,199,189,0.3)] pt-3">
                                    <PremiumButton
                                      size="sm"
                                      loading={actionLoading === req.id}
                                      disabled={actionLoading !== null}
                                      onClick={() => handleMentorRequestResponse(req.id, 'accept')}
                                    >
                                      Accept
                                    </PremiumButton>
                                    <PremiumButton
                                      size="sm"
                                      variant="glass"
                                      disabled={actionLoading !== null}
                                      onClick={() => handleMentorRequestResponse(req.id, 'meeting_requested')}
                                    >
                                      Request Meeting
                                    </PremiumButton>
                                    <PremiumButton
                                      size="sm"
                                      variant="glass"
                                      disabled={actionLoading !== null}
                                      onClick={() => handleMentorRequestResponse(req.id, 'keep_pending')}
                                    >
                                      Keep Pending
                                    </PremiumButton>
                                    <PremiumButton
                                      size="sm"
                                      variant="glass"
                                      disabled={actionLoading !== null}
                                      onClick={() => handleMentorRequestResponse(req.id, 'decline')}
                                    >
                                      Decline
                                    </PremiumButton>
                                  </div>
                                </m.div>
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

            </Container>
          </div>
        </section>
      </main>

      <Footer />

      {/* Edit Role Dialog */}
      <AnimatePresence>
        {editingRoleMember && (
          <EditRoleModal
            member={editingRoleMember}
            onClose={() => setEditingRoleMember(null)}
            onSubmit={handleEditRoleSubmit}
          />
        )}
        {editingTeam && team && (
          <TeamEditModal
            team={team}
            onClose={() => setEditingTeam(false)}
            onSubmit={handleTeamDetailsSubmit}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
