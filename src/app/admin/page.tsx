'use client';

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, m } from 'framer-motion';
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Layers,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import Icon from '@/components/ui/Icon';
import EmptyState from '@/components/ui/EmptyState';
import { Container } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { useEscapeKey, useFocusTrap, useScrollLock } from '@/hooks/useFocusTrap';
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
import { logger } from '@/lib/logger';
import { userFacingMessage } from '@/lib/errors';

type TabKey = 'access' | 'portal_access' | 'teams' | 'students' | 'ps_tracks' | 'mentors';

const TABS: { key: TabKey; label: string; blurb: string }[] = [
  { key: 'access', label: 'Admin access', blurb: 'Grant or revoke console permissions' },
  { key: 'portal_access', label: 'Portal access', blurb: 'Whitelist external emails (@gmail.com, etc.) for Student or Mentor access' },
  { key: 'teams', label: 'Teams', blurb: 'Roster, status and disband controls' },
  { key: 'students', label: 'Students', blurb: 'Directory with multi-attribute filters' },
  { key: 'ps_tracks', label: 'Participation', blurb: 'Theme-by-theme team distribution' },
  { key: 'mentors', label: 'Mentors', blurb: 'Faculty guidance and verification' },
];

const SUPER_ADMIN = 'tanishk.bansal2025@glbajajgroup.org';

const CONTROL =
  'w-full rounded-xl border border-[rgba(209,199,189,0.8)] bg-[rgba(248,246,242,0.65)] px-3.5 py-2 text-xs text-foreground outline-none transition-[border-color,box-shadow,background-color] duration-250 focus:border-primary focus:bg-[rgba(248,246,242,0.95)] focus:shadow-[0_0_0_4px_rgba(114,56,61,0.10)]';

const TONES = {
  neutral: 'border-[rgba(209,199,189,0.75)] bg-[rgba(239,233,225,0.75)] text-body',
  accent: 'border-[rgba(172,156,141,0.6)] bg-[rgba(172,156,141,0.2)] text-foreground',
  primary: 'border-[rgba(114,56,61,0.24)] bg-[rgba(114,56,61,0.09)] text-primary',
} as const;

function Chip({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: keyof typeof TONES;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-caption font-bold ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}

function Panel({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="surface-raised rounded-3xl p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-feature text-foreground">
            {title}
          </h2>
          {description && (
            <p className="mt-1 max-w-xl text-xs leading-relaxed text-muted">
              {description}
            </p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Overlay({
  onClose,
  labelledBy,
  children,
}: {
  onClose: () => void;
  labelledBy: string;
  children: ReactNode;
}) {
  const panelRef = useFocusTrap<HTMLDivElement>(true);
  useScrollLock(true);
  useEscapeKey(true, onClose);

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
        aria-labelledby={labelledBy}
        tabIndex={-1}
        initial={{ opacity: 0, y: 28, scale: 0.97, filter: 'blur(8px)' }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: 16, scale: 0.98, filter: 'blur(6px)' }}
        transition={{ duration: DURATION.card, ease: EASE.outExpo }}
        className="surface-overlay relative max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-container p-6"
      >
        {children}
      </m.div>
    </m.div>
  );
}

interface AdminStats {
  totalStudents: number;
  totalTeams: number;
  fullTeams: number;
  formingTeams: number;
  allFemaleTeams: number;
  totalMentors: number;
  verifiedMentors: number;
  totalAuthorizedAdmins: number;
  totalWhitelistedUsers?: number;
  whitelistedStudents?: number;
  whitelistedMentors?: number;
}

interface WhitelistedEmailData {
  email: string;
  role: 'STUDENT' | 'MENTOR';
  note: string | null;
  addedBy: string | null;
  createdAt: string;
}

interface StudentData {
  id: string;
  userId: string;
  name: string;
  email: string;
  rollNo: string;
  section: string;
  branch: string;
  year: string;
  gender: string;
  isDemo: boolean;
  teamName: string | null;
  teamCode: string | null;
  teamId: string | null;
  teamStatus: string;
  skills: string[];
  softSkills: string[];
  languages: string[];
  resumeUrl: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  avatarUrl: string | null;
  isBanned: boolean;
  verified: boolean;
}

interface TeamData {
  id: string;
  teamCode: string;
  name: string;
  status: string;
  memberCount: number;
  maxCapacity: number;
  trackId: string;
  trackCode: string;
  trackName: string;
  leaderName: string;
  leaderEmail: string;
  members: StudentData[];
  femaleCount: number;
  maleCount: number;
  isAllFemale: boolean;
  skillsCovered: string[];
  skillsNeeded: string[];
}

interface PSStat {
  id: string;
  code: string;
  name: string;
  category: string;
  organization: string;
  description: string;
  teamCount: number;
  teams: {
    id: string;
    name: string;
    leaderName: string;
    memberCount: number;
    status: string;
    isAllFemale: boolean;
  }[];
}

interface MentorData {
  id: string;
  userId: string;
  name: string;
  email: string;
  designation: string;
  organization: string;
  guidedTeamsCount: number;
  verified: boolean;
  isDemo: boolean;
  isBanned: boolean;
  expertise: string[];
}

interface ConfirmState {
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('access');
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [adminEmails, setAdminEmails] = useState<string[]>([]);
  const [whitelistedEmails, setWhitelistedEmails] = useState<WhitelistedEmailData[]>([]);
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [mentors, setMentors] = useState<MentorData[]>([]);
  const [problemStatementStats, setProblemStatementStats] = useState<PSStat[]>([]);

  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<TeamData | null>(null);

  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [granting, setGranting] = useState(false);

  const [newWhitelistEmail, setNewWhitelistEmail] = useState('');
  const [newWhitelistRole, setNewWhitelistRole] = useState<'STUDENT' | 'MENTOR'>('STUDENT');
  const [newWhitelistNote, setNewWhitelistNote] = useState('');
  const [grantingPortal, setGrantingPortal] = useState(false);

  const [portalSearch, setPortalSearch] = useState('');
  const [portalRoleFilter, setPortalRoleFilter] = useState<'ALL' | 'STUDENT' | 'MENTOR'>('ALL');

  const [studentSearch, setStudentSearch] = useState('');
  const [studentYearFilter, setStudentYearFilter] = useState('ALL');
  const [studentBranchFilter, setStudentBranchFilter] = useState('ALL');
  const [studentSectionFilter, setStudentSectionFilter] = useState('ALL');
  const [studentGenderFilter, setStudentGenderFilter] = useState('ALL');
  const [studentStatusFilter, setStudentStatusFilter] = useState('ALL');

  const [teamSearch, setTeamSearch] = useState('');
  const [teamStatusFilter, setTeamStatusFilter] = useState('ALL');
  const [teamTrackFilter, setTeamTrackFilter] = useState('ALL');
  const [allFemaleFilter, setAllFemaleFilter] = useState(false);

  const [psSearch, setPsSearch] = useState('');
  const [expandedTrackIds, setExpandedTrackIds] = useState<Record<string, boolean>>({});

  const toggleTrackExpand = (id: string) => {
    setExpandedTrackIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAllTracks = () => {
    const all: Record<string, boolean> = {};
    problemStatementStats.forEach((tr) => {
      all[tr.id] = true;
    });
    setExpandedTrackIds(all);
  };

  const collapseAllTracks = () => {
    setExpandedTrackIds({});
  };

  const fetchAdminData = useCallback(async (isInitial = false) => {
    if (isInitial) {
      setLoading(true);
    }
    try {
      const res = await fetch('/api/admin/data', { cache: 'no-store' });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          toast(data.error || 'Admin permissions required.', 'error');
          router.push('/login');
          return;
        }
        throw new Error(data.error || 'Failed to fetch admin data.');
      }

      setStats(data.stats);
      setAdminEmails(data.adminEmails || []);
      setWhitelistedEmails(data.whitelistedEmails || []);
      setTeams(data.teams || []);
      setStudents(data.students || []);
      setMentors(data.mentors || []);
      setProblemStatementStats(data.problemStatementStats || []);
    } catch (err) {
      logger.error('Admin fetch error', err);
      toast(userFacingMessage(err, 'Error loading admin dashboard.'), 'error');
    } finally {
      if (isInitial) {
        setLoading(false);
      }
    }
  }, [router, toast]);

  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      fetchAdminData(true);
    });
    return () => cancelAnimationFrame(handle);
  }, [fetchAdminData]);

  const handleGrantAdminAccess = async (e: FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail) return;

    setGranting(true);

    try {
      const res = await fetch('/api/admin/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', email: newAdminEmail }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to grant admin access');

      setAdminEmails(data.adminEmails);
      setNewAdminEmail('');
      toast(data.message, 'success');
      fetchAdminData(false);
    } catch (err) {
      toast(userFacingMessage(err, 'Could not grant admin access. Please try again.'), 'error');
    } finally {
      setGranting(false);
    }
  };

  const revokeAdminAccess = async (emailToRevoke: string) => {
    try {
      const res = await fetch('/api/admin/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove', email: emailToRevoke }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to revoke access');

      setAdminEmails(data.adminEmails);
      toast(`Revoked admin access from ${emailToRevoke}`, 'success');
      fetchAdminData(false);
    } catch (err) {
      toast(userFacingMessage(err, 'Could not revoke access. Please try again.'), 'error');
    }
  };

  const handleGrantPortalAccess = async (e: FormEvent) => {
    e.preventDefault();
    if (!newWhitelistEmail) return;

    setGrantingPortal(true);
    const targetEmail = newWhitelistEmail.trim().toLowerCase();
    const assignedRole = newWhitelistRole;
    const note = newWhitelistNote.trim() || undefined;

    // Optimistic update
    setWhitelistedEmails((prev) => {
      const filtered = prev.filter((p) => p.email.toLowerCase() !== targetEmail);
      return [
        {
          email: targetEmail,
          role: assignedRole,
          note: note || null,
          addedBy: 'Admin',
          createdAt: new Date().toISOString(),
        },
        ...filtered,
      ];
    });

    try {
      const res = await fetch('/api/admin/portal-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', email: targetEmail, role: assignedRole, note }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to grant portal access');

      setWhitelistedEmails(data.whitelistedEmails);
      setNewWhitelistEmail('');
      setNewWhitelistNote('');
      toast(data.message || `Granted ${assignedRole} portal access to ${targetEmail}`, 'success');
      fetchAdminData(false);
    } catch (err) {
      toast(userFacingMessage(err, 'Could not grant portal access. Please try again.'), 'error');
      fetchAdminData(false);
    } finally {
      setGrantingPortal(false);
    }
  };

  const handleRevokePortalAccess = async (emailToRevoke: string) => {
    const targetEmail = emailToRevoke.trim().toLowerCase();
    // Optimistic update
    setWhitelistedEmails((prev) => prev.filter((p) => p.email.toLowerCase() !== targetEmail));

    try {
      const res = await fetch('/api/admin/portal-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove', email: targetEmail }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to revoke portal access');

      setWhitelistedEmails(data.whitelistedEmails);
      toast(`Revoked portal access from ${targetEmail}`, 'success');
      fetchAdminData(false);
    } catch (err) {
      toast(userFacingMessage(err, 'Could not revoke portal access. Please try again.'), 'error');
      fetchAdminData(false);
    }
  };

  const handleTogglePortalRole = async (emailToToggle: string, currentRole: 'STUDENT' | 'MENTOR') => {
    const targetEmail = emailToToggle.trim().toLowerCase();
    const newRole: 'STUDENT' | 'MENTOR' = currentRole === 'STUDENT' ? 'MENTOR' : 'STUDENT';

    // Optimistic update
    setWhitelistedEmails((prev) =>
      prev.map((p) => (p.email.toLowerCase() === targetEmail ? { ...p, role: newRole } : p))
    );

    try {
      const res = await fetch('/api/admin/portal-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_role', email: targetEmail, role: newRole }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to update portal role');

      setWhitelistedEmails(data.whitelistedEmails);
      toast(`Updated portal role for ${targetEmail} to ${newRole}`, 'success');
      fetchAdminData(false);
    } catch (err) {
      toast(userFacingMessage(err, 'Could not update role. Please try again.'), 'error');
      fetchAdminData(false);
    }
  };

  const handleApproveMentor = async (mentorId: string) => {
    // Optimistic update
    setMentors((prev) =>
      prev.map((m) => (m.userId === mentorId ? { ...m, verified: true } : m))
    );
    setStats((prev) =>
      prev ? { ...prev, verifiedMentors: (prev.verifiedMentors || 0) + 1 } : prev
    );

    try {
      const res = await fetch('/api/admin/mentor/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mentorId }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to approve mentor');

      toast(data.message || 'Mentor approved successfully.', 'success');
      fetchAdminData(false);
    } catch (err) {
      toast(userFacingMessage(err, 'Could not approve mentor. Please try again.'), 'error');
      fetchAdminData(false);
    }
  };

  const handleDeleteMentor = async (mentorId: string) => {
    // Optimistic update
    setMentors((prev) => prev.filter((m) => m.userId !== mentorId));
    setStats((prev) =>
      prev ? { ...prev, totalMentors: Math.max(0, (prev.totalMentors || 1) - 1) } : prev
    );

    try {
      const res = await fetch('/api/admin/mentor/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mentorId }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to delete mentor');

      toast(data.message || 'Mentor profile removed successfully.', 'success');
      fetchAdminData(false);
    } catch (err) {
      toast(userFacingMessage(err, 'Could not delete mentor profile. Please try again.'), 'error');
      fetchAdminData(false);
    }
  };

  const toggleStudentAccess = async (
    studentEmail: string,
    action: 'ban' | 'restore' | 'delete'
  ) => {
    // Optimistic update
    if (action === 'delete') {
      setStudents((prev) =>
        prev.filter((s) => s.email.toLowerCase() !== studentEmail.toLowerCase())
      );
      setStats((prev) =>
        prev ? { ...prev, totalStudents: Math.max(0, (prev.totalStudents || 1) - 1) } : prev
      );
    } else if (action === 'ban') {
      setStudents((prev) =>
        prev.map((s) =>
          s.email.toLowerCase() === studentEmail.toLowerCase() ? { ...s, isBanned: true } : s
        )
      );
    } else if (action === 'restore') {
      setStudents((prev) =>
        prev.map((s) =>
          s.email.toLowerCase() === studentEmail.toLowerCase() ? { ...s, isBanned: false } : s
        )
      );
    }
    setSelectedStudent(null);

    try {
      const res = await fetch('/api/admin/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: studentEmail, action }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to update student access');

      toast(data.message, 'success');
      fetchAdminData(false);
    } catch (err) {
      toast(userFacingMessage(err, 'Could not update student access. Please try again.'), 'error');
      fetchAdminData(false);
    }
  };

  const handleUpdateTeamStatus = async (teamId: string, status: string) => {
    // Optimistic update
    setTeams((prev) =>
      prev.map((t) => (t.id === teamId ? { ...t, status } : t))
    );

    try {
      const res = await fetch('/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, action: 'update_status', status }),
      });
      if (!res.ok) throw new Error('Failed to update team status');
      toast(`Team status set to ${status}.`, 'success');
      fetchAdminData(false);
    } catch (err) {
      toast(userFacingMessage(err, 'Could not update team status. Please try again.'), 'error');
      fetchAdminData(false);
    }
  };

  const disbandTeam = async (teamId: string) => {
    // Optimistic update
    setTeams((prev) => prev.filter((t) => t.id !== teamId));
    setStudents((prev) =>
      prev.map((s) =>
        s.teamId === teamId ? { ...s, teamId: null, teamCode: null, teamStatus: 'OPEN' } : s
      )
    );
    setStats((prev) =>
      prev ? { ...prev, totalTeams: Math.max(0, (prev.totalTeams || 1) - 1) } : prev
    );
    setSelectedTeam(null);

    try {
      const res = await fetch('/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, action: 'delete' }),
      });
      if (!res.ok) throw new Error('Failed to disband team');
      toast('Team disbanded. Members returned to looking-for-team.', 'success');
      fetchAdminData(false);
    } catch (err) {
      toast(userFacingMessage(err, 'Could not disband the team. Please try again.'), 'error');
      fetchAdminData(false);
    }
  };

  const handleSignOut = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof window !== 'undefined' && (window as any).Clerk) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (window as any).Clerk.signOut();
    }
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  const handleViewAs = async (role: 'STUDENT' | 'MENTOR') => {
    try {
      const res = await fetch('/api/admin/view-as', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to switch dashboard');
      router.push(data.redirectUrl || '/dashboard');
    } catch (err) {
      toast(userFacingMessage(err, 'Could not switch dashboard view. Please try again.'), 'error');
    }
  };

  const filteredStudents = students.filter((s) => {
    const q = studentSearch.toLowerCase();
    const matchesSearch =
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.rollNo.toLowerCase().includes(q) ||
      s.branch.toLowerCase().includes(q) ||
      s.teamCode?.toLowerCase().includes(q);

    const matchesYear = studentYearFilter === 'ALL' || s.year === studentYearFilter;
    const matchesBranch = studentBranchFilter === 'ALL' || s.branch === studentBranchFilter;
    const matchesSection = studentSectionFilter === 'ALL' || s.section === studentSectionFilter;
    const matchesGender =
      studentGenderFilter === 'ALL' ||
      s.gender?.toLowerCase() === studentGenderFilter.toLowerCase();
    const matchesStatus =
      studentStatusFilter === 'ALL' ||
      (studentStatusFilter === 'BANNED' ? s.isBanned : !s.isBanned);

    return (
      matchesSearch && matchesYear && matchesBranch && matchesSection && matchesGender && matchesStatus
    );
  });

  const filteredTeams = teams.filter((t) => {
    const q = teamSearch.toLowerCase();
    const matchesSearch =
      t.name.toLowerCase().includes(q) ||
      t.teamCode.toLowerCase().includes(q) ||
      t.trackName.toLowerCase().includes(q) ||
      t.leaderName.toLowerCase().includes(q) ||
      t.members.some((m) => m.name.toLowerCase().includes(q));

    const matchesStatus = teamStatusFilter === 'ALL' || t.status === teamStatusFilter;
    const matchesTrack =
      teamTrackFilter === 'ALL' || t.trackId === teamTrackFilter || t.trackCode === teamTrackFilter;
    const matchesAllFemale = !allFemaleFilter || t.isAllFemale;

    return matchesSearch && matchesStatus && matchesTrack && matchesAllFemale;
  });

  const filteredPSTracks = problemStatementStats.filter((tr) => {
    const q = psSearch.toLowerCase();
    return (
      tr.code.toLowerCase().includes(q) ||
      tr.name.toLowerCase().includes(q) ||
      tr.category.toLowerCase().includes(q)
    );
  });

  const filteredWhitelistedEmails = whitelistedEmails.filter((w) => {
    const q = portalSearch.toLowerCase();
    const matchesSearch =
      w.email.toLowerCase().includes(q) ||
      (w.note && w.note.toLowerCase().includes(q)) ||
      (w.addedBy && w.addedBy.toLowerCase().includes(q));

    const matchesRole = portalRoleFilter === 'ALL' || w.role === portalRoleFilter;
    return matchesSearch && matchesRole;
  });

  const resetStudentFilters = () => {
    setStudentSearch('');
    setStudentYearFilter('ALL');
    setStudentBranchFilter('ALL');
    setStudentSectionFilter('ALL');
    setStudentGenderFilter('ALL');
    setStudentStatusFilter('ALL');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <Container width="wide" className="space-y-6 py-12">
          <div className="h-32 rounded-3xl skeleton-shimmer" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="h-28 rounded-2xl skeleton-shimmer" />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-[230px_1fr]">
            <div className="h-72 rounded-3xl skeleton-shimmer" />
            <div className="h-72 rounded-3xl skeleton-shimmer" />
          </div>
        </Container>
      </div>
    );
  }

  const METRICS: { tab: TabKey; label: string; value: number; foot: string }[] = [
    {
      tab: 'students',
      label: 'Students',
      value: stats?.totalStudents || 0,
      foot: 'Filter by year, section, roll no, gender',
    },
    {
      tab: 'teams',
      label: 'Teams',
      value: stats?.totalTeams || 0,
      foot: `${stats?.fullTeams || 0} full · ${stats?.formingTeams || 0} forming · ${
        stats?.allFemaleTeams || 0
      } all-female`,
    },
    {
      tab: 'mentors',
      label: 'Mentors',
      value: stats?.totalMentors || 0,
      foot: `${stats?.verifiedMentors || 0} verified`,
    },
    {
      tab: 'portal_access',
      label: 'Portal Whitelist',
      value: stats?.totalWhitelistedUsers ?? whitelistedEmails.length,
      foot: `${whitelistedEmails.filter((w) => w.role === 'STUDENT').length} students · ${whitelistedEmails.filter((w) => w.role === 'MENTOR').length} mentors`,
    },
    {
      tab: 'access',
      label: 'Admins',
      value: stats?.totalAuthorizedAdmins || 1,
      foot: 'Grant or revoke console permissions',
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />

      <main id="main" className="flex-1">
        {/* ── COMMAND BAR ── */}
        <section className="section-taupe relative overflow-hidden">
          <Aurora variant="rose" spotlight />
          <div aria-hidden className="grid-lines absolute inset-0" />

          <Container width="wide" className="relative py-10 sm:py-14">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <Reveal direction="down">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(114,56,61,0.25)] bg-[rgba(114,56,61,0.08)] px-3 py-0.5 text-xs font-bold text-primary">
                    <span className="size-1.5 rounded-full bg-primary" />
                    Admin Command Console
                  </div>
                </Reveal>

                <Reveal delay={0.08} className="mt-3">
                  <h1 className="text-display font-extrabold tracking-tight text-foreground">
                    Operations
                  </h1>
                </Reveal>

                <Reveal delay={0.14} className="mt-2">
                  <p className="max-w-2xl text-sm leading-relaxed text-muted">
                    Roster controls, student filtering, theme distributions, external portal whitelisting, and faculty verifications.
                  </p>
                </Reveal>
              </div>

              <Reveal delay={0.16}>
                <div className="flex flex-wrap items-center gap-2">
                  <PremiumButton
                    variant="glass"
                    size="sm"
                    onClick={() => handleViewAs('STUDENT')}
                  >
                    View Student Dashboard
                  </PremiumButton>
                  <PremiumButton
                    variant="glass"
                    size="sm"
                    onClick={() => handleViewAs('MENTOR')}
                  >
                    View Mentor Dashboard
                  </PremiumButton>
                  <PremiumButton variant="glass" size="sm" onClick={() => fetchAdminData(false)}>
                    Refresh
                  </PremiumButton>
                  <PremiumButton variant="ghost" size="sm" onClick={handleSignOut}>
                    Sign out
                  </PremiumButton>
                </div>
              </Reveal>
            </div>

            <RevealGroup
              className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
              stagger={0.07}
              delay={0.2}
            >
              {METRICS.map((metric) => (
                <RevealItem key={metric.label}>
                  <TiltCard intensity={5}>
                    <button
                      type="button"
                      onClick={() => setActiveTab(metric.tab)}
                      className={`h-full w-full rounded-2xl border p-4 text-left transition-colors duration-250 ${
                        activeTab === metric.tab
                          ? 'border-[rgba(114,56,61,0.42)] bg-[rgba(248,246,242,0.92)] shadow-[0_14px_40px_rgba(50,45,41,0.12)]'
                          : 'border-[rgba(209,199,189,0.8)] bg-[rgba(248,246,242,0.62)] hover:border-[rgba(114,56,61,0.28)]'
                      }`}
                    >
                      <span className="block text-label uppercase text-muted">
                        {metric.label}
                      </span>
                      <span className="mt-1 block text-3xl font-extrabold tracking-tight text-foreground">
                        <Counter to={metric.value} duration={1.3} />
                      </span>
                      <span className="mt-1.5 block text-caption leading-relaxed text-muted">
                        {metric.foot}
                      </span>
                    </button>
                  </TiltCard>
                </RevealItem>
              ))}
            </RevealGroup>
          </Container>
        </section>

        {/* ── WORKSPACE: vertical tab rail + panel ── */}
        <section className="surface-sunken">
          <Container width="wide" className="grid gap-6 py-10 lg:grid-cols-[230px_1fr]">
            {/* rail */}
            <nav aria-label="Console sections" className="lg:sticky lg:top-28 lg:self-start">
              <ul className="marquee-mask flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
                {TABS.map((t) => {
                  const active = t.key === activeTab;
                  return (
                    <li key={t.key} className="shrink-0 lg:shrink">
                      <button
                        type="button"
                        onClick={() => setActiveTab(t.key)}
                        aria-current={active ? 'page' : undefined}
                        className={`relative w-full rounded-xl px-3.5 py-2.5 text-left transition-colors duration-250 ${
                          active ? 'text-on-accent' : 'text-body hover:text-primary'
                        }`}
                      >
                        {active && (
                          <m.span
                            layoutId="adminTabPill"
                            transition={SPRING.snappy}
                            className="absolute inset-0 rounded-xl bg-primary shadow-[0_6px_20px_rgba(114,56,61,0.26)]"
                          />
                        )}
                        <span className="relative z-10 block whitespace-nowrap text-xs font-bold">
                          {t.label}
                        </span>
                        <span
                          className={`relative z-10 mt-0.5 hidden text-caption leading-snug lg:block ${
                            active ? 'text-on-accent' : 'text-muted'
                          }`}
                        >
                          {t.blurb}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-5 hidden rounded-2xl border border-[rgba(172,156,141,0.55)] bg-[rgba(172,156,141,0.14)] p-4 lg:block">
                <p className="text-label uppercase text-primary">
                  Console shortcut
                </p>
                <p className="mt-1.5 text-caption leading-relaxed text-muted">
                  Append{' '}
                  <code className="rounded bg-[rgba(114,56,61,0.12)] px-1 font-mono font-bold text-primary">
                    /admin
                  </code>{' '}
                  to an authorised college email on the login form to land here directly.
                </p>
              </div>
            </nav>

            {/* panels */}
            <div className="min-w-0">
              <AnimatePresence mode="wait" initial={false}>
                <m.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -12, filter: 'blur(6px)' }}
                  transition={{ duration: DURATION.card, ease: EASE.outExpo }}
                  className="space-y-6"
                >
                  {activeTab === 'access' && (
                    <>
                      <Panel
                        title="Grant console access"
                        description="Add college email addresses authorised to open this console."
                      >
                        <form
                          onSubmit={handleGrantAdminAccess}
                          className="flex max-w-xl flex-col gap-2.5 sm:flex-row"
                        >
                          <input
                            type="email"
                            required
                            placeholder="user@glbajajgroup.org"
                            aria-label="College email to authorise"
                            value={newAdminEmail}
                            onChange={(e) => setNewAdminEmail(e.target.value)}
                            className={CONTROL}
                          />
                          <PremiumButton
                            type="submit"
                            size="sm"
                            loading={granting}
                            magnetic={false}
                            className="shrink-0"
                          >
                            Grant access
                          </PremiumButton>
                        </form>
                      </Panel>

                      <Panel title={`Authorised accounts (${adminEmails.length})`}>
                        <ul className="divide-y divide-[rgba(209,199,189,0.7)] overflow-hidden rounded-2xl border border-[rgba(209,199,189,0.7)]">
                          {adminEmails.map((email) => {
                            const isSuper = email.toLowerCase() === SUPER_ADMIN;
                            return (
                              <li
                                key={email}
                                className="flex flex-wrap items-center justify-between gap-3 bg-[rgba(248,246,242,0.5)] p-4 transition-colors duration-250 hover:bg-[rgba(248,246,242,0.85)]"
                              >
                                <div className="min-w-0">
                                  <span className="block truncate text-sm font-bold text-foreground">
                                    {email}
                                  </span>
                                  <span className="mt-0.5 block text-caption text-muted">
                                    {isSuper
                                      ? 'Primary super admin — cannot be revoked'
                                      : 'Granted console permissions'}
                                  </span>
                                </div>

                                {isSuper ? (
                                  <Chip tone="primary">Super admin</Chip>
                                ) : (
                                  <PremiumButton
                                    variant="ghost"
                                    size="sm"
                                    magnetic={false}
                                    onClick={() =>
                                      setConfirmState({
                                        title: 'Revoke admin access?',
                                        body: `${email} will immediately lose access to this console.`,
                                        confirmLabel: 'Revoke access',
                                        onConfirm: () => revokeAdminAccess(email),
                                      })
                                    }
                                  >
                                    Revoke
                                  </PremiumButton>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </Panel>
                    </>
                  )}

                  {activeTab === 'portal_access' && (
                    <>
                      {/* Security Notice */}
                      <div className="rounded-3xl border border-[rgba(114,56,61,0.25)] bg-[rgba(114,56,61,0.06)] p-5 sm:p-6 shadow-sm">
                        <div className="flex items-start gap-4">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <ShieldAlert className="size-5" />
                          </div>
                          <div className="space-y-1 text-xs">
                            <h3 className="text-sm font-black text-foreground">
                              Portal Access Whitelist (Strictly Isolated from Admin Console)
                            </h3>
                            <p className="leading-relaxed text-body">
                              By default, platform authentication is restricted to official college accounts (<span className="font-bold">@glbajajgroup.org</span>). Whitelisting an external email (e.g. <span className="font-bold">@gmail.com</span>, external evaluators, or guest mentors) grants login access to the portal as a <span className="font-bold text-primary">Student</span> or <span className="font-bold text-primary">Mentor</span>.
                            </p>
                            <p className="font-semibold text-muted pt-1">
                              Note: Whitelisting an account here will <span className="underline font-bold">NEVER</span> grant them Admin Dashboard access. Admin console permissions remain exclusively governed under the &ldquo;Admin access&rdquo; tab.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Whitelist External Account Form */}
                      <Panel
                        title="Whitelist external account"
                        description="Grant Student or Mentor portal access to specific external emails (such as @gmail.com or personal academic accounts)."
                      >
                        <form
                          onSubmit={handleGrantPortalAccess}
                          className="space-y-4 max-w-2xl"
                        >
                          <div className="grid gap-3 sm:grid-cols-[1.5fr_1fr]">
                            <div>
                              <label className="block text-caption font-bold text-muted mb-1.5">
                                User Email Address <span className="text-primary">*</span>
                              </label>
                              <input
                                type="email"
                                required
                                placeholder="user@gmail.com or external domain"
                                aria-label="Email address to whitelist"
                                value={newWhitelistEmail}
                                onChange={(e) => setNewWhitelistEmail(e.target.value)}
                                className={CONTROL}
                              />
                            </div>

                            <div>
                              <label className="block text-caption font-bold text-muted mb-1.5">
                                Assigned Portal Role <span className="text-primary">*</span>
                              </label>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => setNewWhitelistRole('STUDENT')}
                                  className={`flex-1 rounded-xl py-2 px-3 text-xs font-bold transition-colors cursor-pointer ${
                                    newWhitelistRole === 'STUDENT'
                                      ? 'bg-primary text-on-accent shadow-sm'
                                      : 'border border-[rgba(209,199,189,0.8)] bg-white/60 text-muted hover:text-foreground'
                                  }`}
                                >
                                  Student
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setNewWhitelistRole('MENTOR')}
                                  className={`flex-1 rounded-xl py-2 px-3 text-xs font-bold transition-colors cursor-pointer ${
                                    newWhitelistRole === 'MENTOR'
                                      ? 'bg-primary text-on-accent shadow-sm'
                                      : 'border border-[rgba(209,199,189,0.8)] bg-white/60 text-muted hover:text-foreground'
                                  }`}
                                >
                                  Mentor
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-[1fr_auto] items-end">
                            <div>
                              <label className="block text-caption font-bold text-muted mb-1.5">
                                Note / Reason (Optional)
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. Industry Judge, External Participant, Faculty Guest"
                                aria-label="Optional note"
                                value={newWhitelistNote}
                                onChange={(e) => setNewWhitelistNote(e.target.value)}
                                className={CONTROL}
                              />
                            </div>

                            <PremiumButton
                              type="submit"
                              size="sm"
                              loading={grantingPortal}
                              magnetic={false}
                              className="shrink-0"
                            >
                              <UserPlus className="size-3.5 mr-1.5" />
                              Grant Portal Access
                            </PremiumButton>
                          </div>
                        </form>
                      </Panel>

                      {/* Whitelisted Accounts Directory */}
                      <Panel
                        title={`Whitelisted Portal Accounts (${whitelistedEmails.length})`}
                        description="External accounts permitted to sign in to the SIH student and mentor spaces."
                        action={
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="relative min-w-[200px]">
                              <input
                                type="text"
                                value={portalSearch}
                                onChange={(e) => setPortalSearch(e.target.value)}
                                placeholder="Search email or note..."
                                aria-label="Search whitelist"
                                className="w-full rounded-xl border border-[rgba(209,199,189,0.8)] bg-white/70 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-primary"
                              />
                              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted" />
                            </div>

                            <div className="flex gap-1">
                              {(['ALL', 'STUDENT', 'MENTOR'] as const).map((r) => (
                                <button
                                  key={r}
                                  type="button"
                                  onClick={() => setPortalRoleFilter(r)}
                                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold cursor-pointer transition-colors ${
                                    portalRoleFilter === r
                                      ? 'bg-primary text-on-accent'
                                      : 'border border-[rgba(209,199,189,0.8)] bg-white/50 text-muted hover:text-foreground'
                                  }`}
                                >
                                  {r === 'ALL' ? 'All' : r === 'STUDENT' ? 'Students' : 'Mentors'}
                                </button>
                              ))}
                            </div>
                          </div>
                        }
                      >
                        {filteredWhitelistedEmails.length === 0 ? (
                          <div className="rounded-2xl border border-[rgba(209,199,189,0.7)] bg-[rgba(248,246,242,0.4)] p-8 text-center">
                            <p className="text-sm font-bold text-foreground">
                              {whitelistedEmails.length === 0
                                ? 'No external accounts whitelisted yet'
                                : 'No whitelisted accounts match your search'}
                            </p>
                            <p className="mt-1 text-xs text-muted">
                              {whitelistedEmails.length === 0
                                ? 'Use the form above to grant portal access to @gmail.com or other external email addresses.'
                                : 'Try clearing your search query or role filter.'}
                            </p>
                          </div>
                        ) : (
                          <ul className="divide-y divide-[rgba(209,199,189,0.7)] overflow-hidden rounded-2xl border border-[rgba(209,199,189,0.7)]">
                            {filteredWhitelistedEmails.map((entry) => (
                              <li
                                key={entry.email}
                                className="flex flex-wrap items-center justify-between gap-4 bg-[rgba(248,246,242,0.5)] p-4 transition-colors duration-250 hover:bg-[rgba(248,246,242,0.85)]"
                              >
                                <div className="space-y-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-sm text-foreground truncate">
                                      {entry.email}
                                    </span>
                                    <span
                                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                                        entry.role === 'MENTOR'
                                          ? 'border border-[rgba(114,56,61,0.25)] bg-[rgba(114,56,61,0.1)] text-primary'
                                          : 'border border-[rgba(172,156,141,0.4)] bg-[rgba(172,156,141,0.15)] text-foreground'
                                      }`}
                                    >
                                      {entry.role === 'MENTOR' ? (
                                        <GraduationCap className="size-3" />
                                      ) : (
                                        <UserCheck className="size-3" />
                                      )}
                                      {entry.role}
                                    </span>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-x-3 text-caption text-muted">
                                    {entry.note && (
                                      <span>Note: <span className="text-body font-medium">{entry.note}</span></span>
                                    )}
                                    {entry.addedBy && (
                                      <span>Added by: <span className="text-body">{entry.addedBy}</span></span>
                                    )}
                                    <span>Added: {new Date(entry.createdAt).toLocaleDateString()}</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleTogglePortalRole(entry.email, entry.role)}
                                    className="rounded-xl border border-[rgba(209,199,189,0.8)] bg-white/80 px-2.5 py-1.5 text-caption font-bold text-muted hover:text-primary hover:border-primary/40 transition-colors cursor-pointer"
                                    title={`Switch role to ${entry.role === 'STUDENT' ? 'Mentor' : 'Student'}`}
                                  >
                                    Switch to {entry.role === 'STUDENT' ? 'Mentor' : 'Student'}
                                  </button>

                                  <PremiumButton
                                    variant="ghost"
                                    size="sm"
                                    magnetic={false}
                                    onClick={() =>
                                      setConfirmState({
                                        title: 'Revoke Portal Access?',
                                        body: `${entry.email} will no longer be able to log in to the portal with this external account.`,
                                        confirmLabel: 'Revoke Access',
                                        onConfirm: () => handleRevokePortalAccess(entry.email),
                                      })
                                    }
                                  >
                                    Revoke
                                  </PremiumButton>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </Panel>
                    </>
                  )}

                  {activeTab === 'teams' && (
                    <>
                      <Panel
                        title="Team filters"
                        action={
                          <span className="text-caption font-bold text-muted">
                            {filteredTeams.length} of {teams.length}
                          </span>
                        }
                      >
                        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                          <input
                            type="text"
                            placeholder="Search team, track, leader, member"
                            aria-label="Search teams"
                            value={teamSearch}
                            onChange={(e) => setTeamSearch(e.target.value)}
                            className={`${CONTROL} sm:col-span-2`}
                          />
                          <select
                            value={teamStatusFilter}
                            onChange={(e) => setTeamStatusFilter(e.target.value)}
                            aria-label="Team status"
                            className={CONTROL}
                          >
                            <option value="ALL">All statuses</option>
                            <option value="forming">Forming</option>
                            <option value="locked">Locked</option>
                            <option value="approved">Approved</option>
                          </select>
                          <select
                            value={teamTrackFilter}
                            onChange={(e) => setTeamTrackFilter(e.target.value)}
                            aria-label="Problem statement"
                            className={CONTROL}
                          >
                            <option value="ALL">All problem statements</option>
                            {problemStatementStats.map((tr) => (
                              <option key={tr.id} value={tr.code}>
                                {tr.code} — {tr.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={() => setAllFemaleFilter(!allFemaleFilter)}
                          aria-pressed={allFemaleFilter}
                          className={`mt-3 rounded-full border px-3.5 py-1.5 text-caption font-bold transition-colors duration-250 ${
                            allFemaleFilter
                              ? 'border-transparent bg-primary text-on-accent'
                              : 'border-[rgba(209,199,189,0.85)] bg-[rgba(248,246,242,0.6)] text-body hover:border-[rgba(114,56,61,0.3)]'
                          }`}
                        >
                          All-female teams only
                          {allFemaleFilter && <Icon icon={Check} size="xs" className="ml-1.5 inline" />}
                        </button>
                      </Panel>

                      {filteredTeams.length === 0 && (
                        <EmptyState
                          icon={Users}
                          size="compact"
                          title="No teams match these filters"
                          description={
                            teams.length === 0
                              ? 'No teams have been formed yet. They will appear here as students register.'
                              : 'Try widening the search, or clearing the track and status filters.'
                          }
                        />
                      )}

                      <m.div layout className="grid gap-4 xl:grid-cols-2">
                        <AnimatePresence mode="popLayout" initial={false}>
                          {filteredTeams.map((team, i) => (
                            <m.article
                              key={team.id}
                              layout
                              initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
                              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                              exit={{ opacity: 0, scale: 0.97, filter: 'blur(6px)' }}
                              transition={{
                                duration: DURATION.card,
                                ease: EASE.outExpo,
                                delay: Math.min(i * 0.03, 0.3),
                              }}
                              className="surface-raised space-y-4 rounded-3xl p-5"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-feature text-foreground">
                                      {team.name}
                                    </h3>
                                    <Chip tone="primary">{team.teamCode}</Chip>
                                    {team.isAllFemale && <Chip tone="accent">All-female</Chip>}
                                  </div>
                                  <p className="mt-1 text-xs font-bold text-primary">
                                    {team.trackName}
                                  </p>
                                  <p className="mt-0.5 text-caption text-muted">
                                    Leader: {team.leaderName} ({team.leaderEmail})
                                  </p>
                                </div>
                                <Chip tone={team.status === 'approved' ? 'primary' : 'neutral'}>
                                  {team.status.toUpperCase()} · {team.memberCount}/6
                                </Chip>
                              </div>

                              <div className="border-t border-[rgba(209,199,189,0.65)] pt-3">
                                <div className="mb-2 flex justify-between text-label uppercase text-muted">
                                  <span>Roster ({team.memberCount})</span>
                                  <span>
                                    {team.femaleCount}F / {team.maleCount}M
                                  </span>
                                </div>
                                <ul className="space-y-1.5">
                                  {team.members.map((m) => (
                                    <li key={m.id}>
                                      <button
                                        type="button"
                                        onClick={() => setSelectedStudent(m)}
                                        className="flex w-full items-center justify-between gap-3 rounded-xl border border-[rgba(209,199,189,0.7)] bg-[rgba(239,233,225,0.55)] px-3 py-2 text-left transition-colors duration-250 hover:border-[rgba(114,56,61,0.28)] hover:bg-[rgba(248,246,242,0.9)]"
                                      >
                                        <span className="min-w-0 truncate text-xs font-semibold text-foreground">
                                          {m.name}
                                          <span className="ml-1.5 text-caption font-normal text-muted">
                                            {m.branch || 'CSE'} · Yr {m.year || 'N/A'} · Sec{' '}
                                            {m.section || 'N/A'}
                                          </span>
                                        </span>
                                        <span className="shrink-0 text-caption font-bold text-primary">
                                          Inspect <Icon icon={ArrowUpRight} size="xs" />
                                        </span>
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <div className="flex flex-wrap gap-2 border-t border-[rgba(209,199,189,0.65)] pt-3">
                                <PremiumButton
                                  size="sm"
                                  variant="glass"
                                  magnetic={false}
                                  onClick={() => setSelectedTeam(team)}
                                >
                                  Inspect team
                                </PremiumButton>
                                <PremiumButton
                                  size="sm"
                                  magnetic={false}
                                  onClick={() => handleUpdateTeamStatus(team.id, 'approved')}
                                >
                                  Approve
                                </PremiumButton>
                                <PremiumButton
                                  size="sm"
                                  variant="ghost"
                                  magnetic={false}
                                  onClick={() => handleUpdateTeamStatus(team.id, 'forming')}
                                >
                                  Set forming
                                </PremiumButton>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setConfirmState({
                                      title: `Delete and disband ${team.name}?`,
                                      body: `This will permanently delete ${team.name} (${team.teamCode}). All ${team.memberCount} members will return to looking-for-team status, and all recruitment notices and requests will be removed.`,
                                      confirmLabel: 'Delete Team',
                                      onConfirm: () => disbandTeam(team.id),
                                    })
                                  }
                                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[rgba(180,50,50,0.3)] bg-[rgba(180,50,50,0.06)] px-3 py-1.5 text-xs font-bold text-[#A82B2B] transition-all duration-200 hover:bg-[rgba(180,50,50,0.15)] hover:border-[rgba(180,50,50,0.6)] active:scale-95 cursor-pointer ml-auto"
                                >
                                  <Icon icon={Trash2} size="xs" />
                                  <span>Delete Team</span>
                                </button>
                              </div>
                            </m.article>
                          ))}
                        </AnimatePresence>
                      </m.div>
                    </>
                  )}

                  {activeTab === 'students' && (
                    <>
                      <Panel
                        title="Student filters"
                        action={
                          <button
                            type="button"
                            onClick={resetStudentFilters}
                            className="text-caption font-bold text-primary transition-colors duration-250 hover:text-[var(--primary-hover)]"
                          >
                            Reset filters
                          </button>
                        }
                      >
                        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                          <input
                            type="text"
                            placeholder="Search name, email, roll no"
                            aria-label="Search students"
                            value={studentSearch}
                            onChange={(e) => setStudentSearch(e.target.value)}
                            className={CONTROL}
                          />
                          <select
                            value={studentYearFilter}
                            onChange={(e) => setStudentYearFilter(e.target.value)}
                            aria-label="Year"
                            className={CONTROL}
                          >
                            <option value="ALL">All years</option>
                            <option value="1st Year">1st Year</option>
                            <option value="2nd Year">2nd Year</option>
                            <option value="3rd Year">3rd Year</option>
                            <option value="4th Year">4th Year</option>
                          </select>
                          <select
                            value={studentBranchFilter}
                            onChange={(e) => setStudentBranchFilter(e.target.value)}
                            aria-label="Course"
                            className={CONTROL}
                          >
                            <option value="ALL">All courses</option>
                            <option value="B.Tech CSE">B.Tech CSE</option>
                            <option value="B.Tech CSE (AI/ML)">B.Tech CSE (AI/ML)</option>
                            <option value="B.Tech CS">B.Tech CS</option>
                            <option value="MBA">MBA</option>
                          </select>
                          <select
                            value={studentSectionFilter}
                            onChange={(e) => setStudentSectionFilter(e.target.value)}
                            aria-label="Section"
                            className={CONTROL}
                          >
                            <option value="ALL">All sections</option>
                            {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].map((sec) => (
                              <option key={sec} value={sec}>
                                Section {sec}
                              </option>
                            ))}
                          </select>
                          <select
                            value={studentGenderFilter}
                            onChange={(e) => setStudentGenderFilter(e.target.value)}
                            aria-label="Gender"
                            className={CONTROL}
                          >
                            <option value="ALL">All genders</option>
                            <option value="Female">Female</option>
                            <option value="Male">Male</option>
                            <option value="Other">Other</option>
                          </select>
                          <select
                            value={studentStatusFilter}
                            onChange={(e) => setStudentStatusFilter(e.target.value)}
                            aria-label="Access status"
                            className={CONTROL}
                          >
                            <option value="ALL">All access statuses</option>
                            <option value="ACTIVE">Active</option>
                            <option value="BANNED">Suspended</option>
                          </select>
                        </div>
                        <p className="mt-3 text-caption font-bold text-muted">
                          Showing {filteredStudents.length} of {students.length}
                        </p>
                      </Panel>

                      {filteredStudents.length === 0 && (
                        <EmptyState
                          icon={GraduationCap}
                          size="compact"
                          title="No students match these filters"
                          description={
                            students.length === 0
                              ? 'No students have registered yet.'
                              : 'Try clearing the year, branch, section, gender or access filters.'
                          }
                        />
                      )}

                      <m.ul
                        layout
                        className="surface-raised divide-y divide-[rgba(209,199,189,0.7)] overflow-hidden rounded-3xl empty:hidden"
                      >
                        <AnimatePresence mode="popLayout" initial={false}>
                          {filteredStudents.map((student, i) => (
                            <m.li
                              key={student.id}
                              layout
                              initial={{ opacity: 0, y: 12 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              transition={{
                                duration: DURATION.card,
                                ease: EASE.outExpo,
                                delay: Math.min(i * 0.015, 0.25),
                              }}
                              className="flex flex-col gap-3 p-4 transition-colors duration-250 hover:bg-[rgba(239,233,225,0.55)] md:flex-row md:items-center md:justify-between sm:p-5"
                            >
                              <div className="min-w-0 space-y-1.5">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm font-extrabold text-foreground">
                                    {student.name}
                                  </span>
                                  <Chip tone={student.isBanned ? 'primary' : 'accent'}>
                                    {student.isBanned ? 'Suspended' : 'Active'}
                                  </Chip>
                                  <Chip>
                                    {student.branch} · {student.year}
                                  </Chip>
                                  <Chip>Sec {student.section}</Chip>
                                  <Chip>{student.gender}</Chip>
                                </div>
                                <p className="text-caption text-muted">
                                  {student.email} · Roll {student.rollNo}
                                  {student.teamName && (
                                    <span className="font-semibold text-primary">
                                      {' '}
                                      · {student.teamName}
                                    </span>
                                  )}
                                </p>
                              </div>

                              <div className="flex flex-wrap shrink-0 gap-2 items-center">
                                <PremiumButton
                                  size="sm"
                                  variant="glass"
                                  magnetic={false}
                                  onClick={() => setSelectedStudent(student)}
                                >
                                  Inspect
                                </PremiumButton>
                                <PremiumButton
                                  size="sm"
                                  variant="ghost"
                                  magnetic={false}
                                  onClick={() =>
                                    setConfirmState(
                                      student.isBanned
                                        ? {
                                            title: 'Restore access?',
                                            body: `${student.email} will regain access to the platform.`,
                                            confirmLabel: 'Restore access',
                                            onConfirm: () =>
                                              toggleStudentAccess(student.email, 'restore'),
                                          }
                                        : {
                                            title: 'Suspend access?',
                                            body: `${student.email} will be signed out and blocked from the platform.`,
                                            confirmLabel: 'Suspend access',
                                            onConfirm: () =>
                                              toggleStudentAccess(student.email, 'ban'),
                                          }
                                    )
                                  }
                                >
                                  {student.isBanned ? 'Restore' : 'Suspend'}
                                </PremiumButton>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setConfirmState({
                                      title: `Delete profile for ${student.name}?`,
                                      body: `This will permanently remove ${student.name} (${student.email}) from the directory, remove them from any team, and delete their profile. If they sign in again later, they will start fresh from onboarding.`,
                                      confirmLabel: 'Delete Profile',
                                      onConfirm: () => toggleStudentAccess(student.email, 'delete'),
                                    })
                                  }
                                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[rgba(180,50,50,0.3)] bg-[rgba(180,50,50,0.06)] px-3 py-1.5 text-xs font-bold text-[#A82B2B] transition-all duration-200 hover:bg-[rgba(180,50,50,0.15)] hover:border-[rgba(180,50,50,0.6)] active:scale-95 cursor-pointer"
                                >
                                  <Icon icon={Trash2} size="xs" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </m.li>
                          ))}
                        </AnimatePresence>
                      </m.ul>
                    </>
                  )}

                  {activeTab === 'ps_tracks' && (
                    <>
                      <Panel
                        title="Participation by theme"
                        description="Click on any problem statement or theme below to view all registered teams, leaders, and roster capacity."
                        action={
                          <div className="flex flex-wrap items-center gap-3">
                            <button
                              type="button"
                              onClick={expandAllTracks}
                              className="text-caption font-bold text-primary transition-colors duration-250 hover:text-[var(--primary-hover)] cursor-pointer"
                            >
                              Expand all
                            </button>
                            <span className="text-muted">·</span>
                            <button
                              type="button"
                              onClick={collapseAllTracks}
                              className="text-caption font-bold text-muted transition-colors duration-250 hover:text-foreground cursor-pointer"
                            >
                              Collapse all
                            </button>
                            <span className="rounded-full border border-[rgba(209,199,189,0.7)] bg-[rgba(239,233,225,0.75)] px-2.5 py-0.5 text-caption font-bold text-muted">
                              {filteredPSTracks.length} of {problemStatementStats.length}
                            </span>
                          </div>
                        }
                      >
                        <input
                          type="text"
                          placeholder="Filter by code, theme name or category"
                          aria-label="Filter problem statements"
                          value={psSearch}
                          onChange={(e) => setPsSearch(e.target.value)}
                          className={`${CONTROL} sm:max-w-md`}
                        />
                      </Panel>

                      {filteredPSTracks.length === 0 && (
                        <EmptyState
                          icon={Layers}
                          size="compact"
                          title="No problem statements match this search"
                          description={`Try a different keyword, or clear the search to see all ${problemStatementStats.length || 17} official themes.`}
                        />
                      )}

                      <div className="space-y-3">
                        <AnimatePresence mode="popLayout" initial={false}>
                          {filteredPSTracks.map((track, i) => {
                            const isExpanded = Boolean(expandedTrackIds[track.id]);

                            return (
                              <m.div
                                key={track.id}
                                layout
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{
                                  duration: DURATION.card,
                                  ease: EASE.outExpo,
                                  delay: Math.min(i * 0.02, 0.25),
                                }}
                                className="surface-raised overflow-hidden rounded-3xl border border-[rgba(209,199,189,0.7)] transition-shadow duration-250 hover:shadow-e2"
                              >
                                {/* Accordion Header / Dropdown Trigger */}
                                <button
                                  type="button"
                                  onClick={() => toggleTrackExpand(track.id)}
                                  aria-expanded={isExpanded}
                                  className="flex w-full items-center justify-between gap-4 p-5 text-left transition-colors duration-250 hover:bg-[rgba(239,233,225,0.4)] cursor-pointer"
                                >
                                  <div className="min-w-0 flex-1 space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="font-mono text-caption font-bold text-primary">
                                        {track.code}
                                      </span>
                                      <h3 className="text-feature text-foreground">
                                        {track.name}
                                      </h3>
                                      <Chip tone={track.teamCount > 0 ? 'primary' : 'neutral'}>
                                        {track.teamCount} {track.teamCount === 1 ? 'team' : 'teams'} enrolled
                                      </Chip>
                                    </div>
                                    <p className="text-caption text-muted">
                                      {track.category} · {track.organization}
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-3 shrink-0">
                                    <span className="text-caption font-bold text-primary hidden sm:inline">
                                      {isExpanded ? 'Hide teams' : 'View teams'}
                                    </span>
                                    <div
                                      className={`flex size-8 items-center justify-center rounded-full border border-[rgba(209,199,189,0.8)] bg-[rgba(248,246,242,0.8)] text-foreground transition-transform duration-300 ${
                                        isExpanded ? 'rotate-180 bg-[rgba(114,56,61,0.12)] text-primary border-[rgba(114,56,61,0.3)]' : ''
                                      }`}
                                    >
                                      <Icon icon={ChevronDown} size="xs" />
                                    </div>
                                  </div>
                                </button>

                                {/* Accordion Body Content */}
                                <AnimatePresence initial={false}>
                                  {isExpanded && (
                                    <m.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.3, ease: EASE.outExpo }}
                                      className="overflow-hidden"
                                    >
                                      <div className="border-t border-[rgba(209,199,189,0.65)] bg-[rgba(239,233,225,0.35)] p-5 space-y-4">
                                        <div>
                                          <p className="text-label uppercase text-muted mb-1 font-bold">
                                            Problem Statement Overview
                                          </p>
                                          <p className="text-xs leading-relaxed text-body bg-[rgba(248,246,242,0.7)] p-3 rounded-xl border border-[rgba(209,199,189,0.6)]">
                                            {track.description}
                                          </p>
                                        </div>

                                        <div>
                                          <div className="mb-2.5 flex items-center justify-between">
                                            <p className="text-label uppercase text-muted font-bold">
                                              Enrolled Teams ({track.teams.length})
                                            </p>
                                            {track.teams.length > 0 && (
                                              <span className="text-caption text-muted">
                                                Click any team to inspect details
                                              </span>
                                            )}
                                          </div>

                                          {track.teams.length > 0 ? (
                                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                              {track.teams.map((t) => (
                                                <div
                                                  key={t.id}
                                                  className="flex flex-col justify-between gap-3 rounded-2xl border border-[rgba(209,199,189,0.7)] bg-[rgba(248,246,242,0.9)] p-3.5 shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-e1"
                                                >
                                                  <div className="space-y-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                      <h4 className="truncate text-xs font-extrabold text-foreground">
                                                        {t.name}
                                                      </h4>
                                                      <Chip tone={t.status === 'approved' ? 'primary' : 'neutral'}>
                                                        {t.memberCount}/6
                                                      </Chip>
                                                    </div>
                                                    <p className="truncate text-caption text-muted">
                                                      Leader: <span className="font-semibold text-body">{t.leaderName}</span>
                                                    </p>
                                                    {t.isAllFemale && (
                                                      <Chip tone="accent">All-female team</Chip>
                                                    )}
                                                  </div>

                                                  <div className="pt-2 border-t border-[rgba(209,199,189,0.5)] flex items-center justify-between">
                                                    <span className="text-caption font-semibold uppercase text-muted text-[10px]">
                                                      Status: {t.status}
                                                    </span>
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        const fullTeam = teams.find((team) => team.id === t.id);
                                                        if (fullTeam) {
                                                          setSelectedTeam(fullTeam);
                                                        }
                                                      }}
                                                      className="text-caption font-bold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
                                                    >
                                                      Inspect <Icon icon={ArrowUpRight} size="xs" />
                                                    </button>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          ) : (
                                            <div className="rounded-2xl border border-dashed border-[rgba(209,199,189,0.8)] bg-[rgba(248,246,242,0.5)] p-4 text-center">
                                              <p className="text-xs font-semibold text-muted">
                                                No teams registered under this theme yet.
                                              </p>
                                              <p className="text-caption text-muted mt-0.5">
                                                Teams will automatically appear here when formed.
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </m.div>
                                  )}
                                </AnimatePresence>
                              </m.div>
                            );
                          })}
                        </AnimatePresence>
                      </div>
                    </>
                  )}

                  {activeTab === 'mentors' && mentors.length === 0 && (
                    <EmptyState
                      icon={UserCheck}
                      title="No mentors registered yet"
                      description="Faculty mentors will appear here once they complete onboarding."
                    />
                  )}

                  {activeTab === 'mentors' && (
                    <RevealGroup className="grid gap-4 sm:grid-cols-2" stagger={0.06}>
                      {mentors.map((mentor) => (
                        <RevealItem key={mentor.id}>
                          <TiltCard intensity={5}>
                            <div className="surface-raised h-full space-y-3 rounded-3xl p-5 flex flex-col justify-between">
                              <div className="space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <h2 className="text-feature text-foreground">
                                      {mentor.name}
                                    </h2>
                                    <p className="mt-0.5 text-xs font-semibold text-primary">
                                      {mentor.designation}
                                    </p>
                                    <p className="mt-0.5 truncate text-caption text-muted">
                                      {mentor.email}
                                    </p>
                                  </div>
                                  <Chip tone={mentor.verified ? 'accent' : 'neutral'}>
                                    {mentor.verified ? 'Verified' : 'Pending Approval'}
                                  </Chip>
                                </div>

                                <div>
                                  <div className="mb-1.5 flex justify-between text-label uppercase text-muted">
                                    <span>Teams guided</span>
                                    <span>
                                      {mentor.guidedTeamsCount}
                                    </span>
                                  </div>
                                  <div className="h-1.5 overflow-hidden rounded-full bg-[rgba(209,199,189,0.7)]">
                                    <m.div
                                      initial={{ scaleX: 0 }}
                                      whileInView={{
                                        scaleX:
                                          mentor.guidedTeamsCount > 0 ? 1 : 0,
                                      }}
                                      viewport={{ once: true, amount: 0.6 }}
                                      transition={{ duration: 0.9, ease: EASE.outExpo, delay: 0.15 }}
                                      style={{ transformOrigin: 'left' }}
                                      className="h-full rounded-full bg-gradient-to-r from-[#AC9C8D] to-primary"
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[rgba(209,199,189,0.65)] pt-3">
                                {!mentor.verified && (
                                  <button
                                    type="button"
                                    onClick={() => handleApproveMentor(mentor.id)}
                                    className="flex-1 rounded-xl border border-[rgba(114,56,61,0.25)] bg-[rgba(114,56,61,0.08)] py-2 text-xs font-bold uppercase tracking-wider text-primary transition-all duration-200 hover:bg-[rgba(114,56,61,0.16)] active:scale-95 cursor-pointer"
                                  >
                                    Approve Mentor
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() =>
                                    setConfirmState({
                                      title: `Delete profile for ${mentor.name}?`,
                                      body: `This will completely remove ${mentor.name} (${mentor.email}) from the platform and unassign them from any teams. If they sign in again later, they will start fresh from onboarding.`,
                                      confirmLabel: 'Delete Profile',
                                      onConfirm: () => handleDeleteMentor(mentor.userId || mentor.id),
                                    })
                                  }
                                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[rgba(180,50,50,0.3)] bg-[rgba(180,50,50,0.06)] px-3.5 py-2 text-xs font-bold text-[#A82B2B] transition-all duration-200 hover:bg-[rgba(180,50,50,0.15)] hover:border-[rgba(180,50,50,0.6)] active:scale-95 cursor-pointer ml-auto"
                                >
                                  <Icon icon={Trash2} size="xs" />
                                  <span>Delete Profile</span>
                                </button>
                              </div>
                            </div>
                          </TiltCard>
                        </RevealItem>
                      ))}
                    </RevealGroup>
                  )}
                </m.div>
              </AnimatePresence>
            </div>
            </Container>
        </section>
      </main>

      <Footer />

      {/* ── STUDENT DETAIL ── */}
      <AnimatePresence>
        {selectedStudent && (
          <Overlay onClose={() => setSelectedStudent(null)} labelledBy="admin-student-dialog">
            <div className="flex items-start justify-between gap-4 border-b border-[rgba(209,199,189,0.7)] pb-4">
              <div className="min-w-0">
                <h2 id="admin-student-dialog" className="text-feature text-foreground">
                  {selectedStudent.name}
                </h2>
                <p className="mt-0.5 truncate text-xs font-semibold text-primary">
                  {selectedStudent.email}
                </p>
              </div>
              <PremiumButton
                variant="ghost"
                size="sm"
                magnetic={false}
                onClick={() => setSelectedStudent(null)}
              >
                Close
              </PremiumButton>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {[
                ['Roll number', selectedStudent.rollNo],
                ['Section', `Section ${selectedStudent.section}`],
                ['Branch & year', `${selectedStudent.branch} (${selectedStudent.year})`],
                ['Gender', selectedStudent.gender],
              ].map(([k, v]) => (
                <div
                  key={k as string}
                  className="rounded-xl border border-[rgba(209,199,189,0.7)] bg-[rgba(239,233,225,0.6)] p-3"
                >
                  <dt className="text-label uppercase text-muted">
                    {k}
                  </dt>
                  <dd className="mt-1 text-xs font-bold text-foreground">{v}</dd>
                </div>
              ))}
            </dl>

            {selectedStudent.skills?.length > 0 && (
              <div className="mt-5 border-t border-[rgba(209,199,189,0.7)] pt-4">
                <p className="text-label uppercase text-muted">
                  Skills
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {selectedStudent.skills.map((sk: string) => (
                    <Chip key={sk} tone="accent">
                      {sk}
                    </Chip>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-[rgba(209,199,189,0.7)] pt-4 text-xs">
              {selectedStudent.githubUrl && (
                <a
                  href={selectedStudent.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-primary hover:underline"
                >
                  GitHub <Icon icon={ArrowUpRight} size="xs" />
                </a>
              )}
              {selectedStudent.linkedinUrl && (
                <a
                  href={selectedStudent.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-primary hover:underline"
                >
                  LinkedIn <Icon icon={ArrowUpRight} size="xs" />
                </a>
              )}
              {selectedStudent.resumeUrl && (
                <a
                  href={selectedStudent.resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-primary hover:underline"
                >
                  Resume <Icon icon={ArrowUpRight} size="xs" />
                </a>
              )}

              <div className="ml-auto flex items-center gap-2">
                <PremiumButton
                  size="sm"
                  variant="glass"
                  magnetic={false}
                  onClick={() =>
                    setConfirmState(
                      selectedStudent.isBanned
                        ? {
                            title: 'Restore access?',
                            body: `${selectedStudent.email} will regain access to the platform.`,
                            confirmLabel: 'Restore access',
                            onConfirm: () => toggleStudentAccess(selectedStudent.email, 'restore'),
                          }
                        : {
                            title: 'Suspend access?',
                            body: `${selectedStudent.email} will be signed out and blocked from the platform.`,
                            confirmLabel: 'Suspend access',
                            onConfirm: () => toggleStudentAccess(selectedStudent.email, 'ban'),
                          }
                    )
                  }
                >
                  {selectedStudent.isBanned ? 'Restore access' : 'Suspend access'}
                </PremiumButton>
                <button
                  type="button"
                  onClick={() =>
                    setConfirmState({
                      title: `Delete profile for ${selectedStudent.name}?`,
                      body: `This will permanently remove ${selectedStudent.name} (${selectedStudent.email}) from the platform, remove them from any team, and delete their profile. If they sign in again later, they will start fresh from onboarding.`,
                      confirmLabel: 'Delete Profile',
                      onConfirm: () => {
                        toggleStudentAccess(selectedStudent.email, 'delete');
                        setSelectedStudent(null);
                      },
                    })
                  }
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[rgba(180,50,50,0.3)] bg-[rgba(180,50,50,0.06)] px-3 py-1.5 text-xs font-bold text-[#A82B2B] transition-all duration-200 hover:bg-[rgba(180,50,50,0.15)] hover:border-[rgba(180,50,50,0.6)] active:scale-95 cursor-pointer"
                >
                  <Icon icon={Trash2} size="xs" />
                  <span>Delete Profile</span>
                </button>
              </div>
            </div>
          </Overlay>
        )}
      </AnimatePresence>

      {/* ── TEAM DETAIL ── */}
      <AnimatePresence>
        {selectedTeam && (
          <Overlay onClose={() => setSelectedTeam(null)} labelledBy="admin-team-dialog">
            <div className="flex items-start justify-between gap-4 border-b border-[rgba(209,199,189,0.7)] pb-4">
              <div className="min-w-0">
                <h2 id="admin-team-dialog" className="text-feature text-foreground">
                  {selectedTeam.name}
                </h2>
                <p className="mt-0.5 text-xs font-semibold text-primary">
                  {selectedTeam.trackName}
                </p>
                <p className="mt-0.5 text-caption text-muted">
                  Leader: {selectedTeam.leaderName} ({selectedTeam.leaderEmail})
                </p>
              </div>
              <PremiumButton
                variant="ghost"
                size="sm"
                magnetic={false}
                onClick={() => setSelectedTeam(null)}
              >
                Close
              </PremiumButton>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Chip tone="primary">{selectedTeam.status.toUpperCase()}</Chip>
              <Chip>{selectedTeam.memberCount}/6 members</Chip>
              <Chip>
                {selectedTeam.femaleCount}F / {selectedTeam.maleCount}M
              </Chip>
              {selectedTeam.isAllFemale && <Chip tone="accent">All-female</Chip>}
            </div>

            <ul className="mt-5 space-y-1.5">
              {selectedTeam.members.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[rgba(209,199,189,0.7)] bg-[rgba(239,233,225,0.55)] px-3.5 py-2.5"
                >
                  <span className="min-w-0 truncate text-xs font-semibold text-foreground">
                    {m.name}
                    <span className="ml-1.5 text-caption font-normal text-muted">
                      {m.branch || 'CSE'} · Yr {m.year || 'N/A'} · Sec {m.section || 'N/A'}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTeam(null);
                      setSelectedStudent(m);
                    }}
                    className="shrink-0 text-caption font-bold text-primary hover:underline"
                  >
                    Inspect <Icon icon={ArrowUpRight} size="xs" />
                  </button>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[rgba(209,199,189,0.7)] pt-4">
              <div className="flex flex-wrap gap-2">
                <PremiumButton
                  size="sm"
                  magnetic={false}
                  onClick={() => {
                    handleUpdateTeamStatus(selectedTeam.id, 'approved');
                    setSelectedTeam(null);
                  }}
                >
                  Approve Team
                </PremiumButton>
                <PremiumButton
                  size="sm"
                  variant="ghost"
                  magnetic={false}
                  onClick={() => {
                    handleUpdateTeamStatus(selectedTeam.id, 'forming');
                    setSelectedTeam(null);
                  }}
                >
                  Set Forming
                </PremiumButton>
              </div>
              <button
                type="button"
                onClick={() =>
                  setConfirmState({
                    title: `Delete and disband ${selectedTeam.name}?`,
                    body: `This will permanently delete ${selectedTeam.name} (${selectedTeam.teamCode}). All ${selectedTeam.memberCount} members will return to looking-for-team status, and all notices and requests will be removed.`,
                    confirmLabel: 'Delete Team',
                    onConfirm: () => {
                      disbandTeam(selectedTeam.id);
                      setSelectedTeam(null);
                    },
                  })
                }
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[rgba(180,50,50,0.3)] bg-[rgba(180,50,50,0.06)] px-3.5 py-1.5 text-xs font-bold text-[#A82B2B] transition-all duration-200 hover:bg-[rgba(180,50,50,0.15)] hover:border-[rgba(180,50,50,0.6)] active:scale-95 cursor-pointer ml-auto"
              >
                <Icon icon={Trash2} size="xs" />
                <span>Delete Team</span>
              </button>
            </div>
          </Overlay>
        )}
      </AnimatePresence>

      {/* ── CONFIRM ── */}
      <AnimatePresence>
        {confirmState && (
          <Overlay onClose={() => setConfirmState(null)} labelledBy="admin-confirm-dialog">
            <h2 id="admin-confirm-dialog" className="text-feature text-foreground">
              {confirmState.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{confirmState.body}</p>
            <div className="mt-6 flex justify-end gap-2.5">
              <PremiumButton
                variant="ghost"
                size="sm"
                magnetic={false}
                onClick={() => setConfirmState(null)}
              >
                Cancel
              </PremiumButton>
              <PremiumButton
                size="sm"
                magnetic={false}
                onClick={() => {
                  confirmState.onConfirm();
                  setConfirmState(null);
                }}
              >
                {confirmState.confirmLabel}
              </PremiumButton>
            </div>
          </Overlay>
        )}
      </AnimatePresence>
    </div>
  );
}
