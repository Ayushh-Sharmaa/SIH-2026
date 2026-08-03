'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminDashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'access' | 'teams' | 'students' | 'mentors' | 'ps_tracks'>('access');

  // Admin Data State
  const [stats, setStats] = useState<any>(null);
  const [adminEmails, setAdminEmails] = useState<string[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);
  const [problemStatementStats, setProblemStatementStats] = useState<any[]>([]);

  // Selected Detail Modals
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [selectedPSTrack, setSelectedPSTrack] = useState<any>(null);

  // Admin Email Access Form State
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [granting, setGranting] = useState(false);

  // Student Filters
  const [studentSearch, setStudentSearch] = useState('');
  const [studentYearFilter, setStudentYearFilter] = useState('ALL');
  const [studentBranchFilter, setStudentBranchFilter] = useState('ALL');
  const [studentSectionFilter, setStudentSectionFilter] = useState('ALL');
  const [studentGenderFilter, setStudentGenderFilter] = useState('ALL');
  const [studentStatusFilter, setStudentStatusFilter] = useState('ALL');

  // Team Filters
  const [teamSearch, setTeamSearch] = useState('');
  const [teamStatusFilter, setTeamStatusFilter] = useState('ALL');
  const [teamTrackFilter, setTeamTrackFilter] = useState('ALL');
  const [allFemaleFilter, setAllFemaleFilter] = useState(false);

  // PS Track Filters
  const [psSearch, setPsSearch] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/data');
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          setError(data.error || 'Admin permissions required.');
          router.push('/login');
          return;
        }
        throw new Error(data.error || 'Failed to fetch admin data.');
      }

      setStats(data.stats);
      setAdminEmails(data.adminEmails || []);
      setTeams(data.teams || []);
      setStudents(data.students || []);
      setMentors(data.mentors || []);
      setProblemStatementStats(data.problemStatementStats || []);
    } catch (err: any) {
      console.error('Admin fetch error:', err);
      setError(err.message || 'Error loading admin dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const handleGrantAdminAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail) return;

    setGranting(true);
    setError('');
    setSuccessMsg('');

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
      setSuccessMsg(`Success: ${data.message}`);
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchAdminData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGranting(false);
    }
  };

  const handleRevokeAdminAccess = async (emailToRevoke: string) => {
    if (!confirm(`Are you sure you want to revoke admin permissions from ${emailToRevoke}?`)) return;

    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/admin/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove', email: emailToRevoke }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to revoke access');

      setAdminEmails(data.adminEmails);
      setSuccessMsg(`Success: Revoked admin access from ${emailToRevoke}`);
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchAdminData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleStudentAccessToggle = async (studentEmail: string, action: 'ban' | 'restore') => {
    const actionLabel = action === 'ban' ? 'suspend user access for' : 'restore access for';
    if (!confirm(`Are you sure you want to ${actionLabel} ${studentEmail}?`)) return;

    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/admin/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: studentEmail, action }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to update student access');

      setSuccessMsg(`Success: ${data.message}`);
      setTimeout(() => setSuccessMsg(''), 4000);
      setSelectedStudent(null);
      fetchAdminData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateTeamStatus = async (teamId: string, status: string) => {
    try {
      const res = await fetch('/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, action: 'update_status', status }),
      });
      if (!res.ok) throw new Error('Failed to update team status');
      fetchAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDisbandTeam = async (teamId: string) => {
    if (!confirm('Are you sure you want to disband this team? All members will be returned to Looking For Team status.')) return;
    try {
      const res = await fetch('/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, action: 'delete' }),
      });
      if (!res.ok) throw new Error('Failed to disband team');
      fetchAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSignOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  // Filtered Students List
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.branch.toLowerCase().includes(studentSearch.toLowerCase());

    const matchesYear = studentYearFilter === 'ALL' || s.year === studentYearFilter;
    const matchesBranch = studentBranchFilter === 'ALL' || s.branch === studentBranchFilter;
    const matchesSection = studentSectionFilter === 'ALL' || s.section === studentSectionFilter;
    const matchesGender = studentGenderFilter === 'ALL' || s.gender?.toLowerCase() === studentGenderFilter.toLowerCase();
    const matchesStatus =
      studentStatusFilter === 'ALL' ||
      (studentStatusFilter === 'BANNED' ? s.isBanned : !s.isBanned);

    return matchesSearch && matchesYear && matchesBranch && matchesSection && matchesGender && matchesStatus;
  });

  // Filtered Teams List
  const filteredTeams = teams.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(teamSearch.toLowerCase()) ||
      t.trackName.toLowerCase().includes(teamSearch.toLowerCase()) ||
      t.leaderName.toLowerCase().includes(teamSearch.toLowerCase()) ||
      t.members.some((m: any) => m.name.toLowerCase().includes(teamSearch.toLowerCase()));

    const matchesStatus = teamStatusFilter === 'ALL' || t.status === teamStatusFilter;
    const matchesTrack = teamTrackFilter === 'ALL' || t.trackId === teamTrackFilter || t.trackCode === teamTrackFilter;
    const matchesAllFemale = !allFemaleFilter || t.isAllFemale;

    return matchesSearch && matchesStatus && matchesTrack && matchesAllFemale;
  });

  // Filtered PS Track Stats
  const filteredPSTracks = problemStatementStats.filter(
    (tr) =>
      tr.code.toLowerCase().includes(psSearch.toLowerCase()) ||
      tr.name.toLowerCase().includes(psSearch.toLowerCase()) ||
      tr.category.toLowerCase().includes(psSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center space-y-4">
          <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted font-bold">Loading SIH Admin Control Console...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Admin Top Command Header */}
      <header className="glass-card rounded-3xl p-6 border border-card-border shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30 uppercase tracking-wider">
              🛡️ Admin Command Center
            </span>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              ● Security Console Active
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight mt-2">
            SIH@GLBGOI Administration
          </h1>
          <p className="text-xs sm:text-sm text-muted">
            Comprehensive control center for student verification, team management, SIH problem statement participation, and admin security permissions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => router.push('/dashboard?role=STUDENT')}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 transition-all cursor-pointer flex items-center gap-1.5"
          >
            🎓 View Student Dashboard
          </button>
          <button
            type="button"
            onClick={() => router.push('/dashboard?role=MENTOR')}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 transition-all cursor-pointer flex items-center gap-1.5"
          >
            👨‍🏫 View Mentor Dashboard
          </button>
          <button
            type="button"
            onClick={fetchAdminData}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-card border border-card-border hover:bg-card-border text-foreground transition-all cursor-pointer"
          >
            🔄 Refresh Data
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 transition-all cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Secret /admin Security & BanTan Special Demo Token Notice */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4 text-xs sm:text-sm text-primary flex items-start gap-3 shadow-lg">
          <span className="text-xl">💡</span>
          <div>
            <strong className="font-bold block text-foreground">Secret Admin Login Shortcut:</strong> You can log in directly to this Admin Command Center by appending <code className="bg-primary/20 px-1.5 py-0.5 rounded font-mono font-bold">/admin</code> to any authorized email (e.g. <code className="bg-primary/20 px-1.5 py-0.5 rounded font-mono font-bold">tanishk.bansal2025@glbajajgroup.org/admin</code>).
          </div>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs sm:text-sm text-amber-300 flex items-start gap-3 shadow-lg">
          <span className="text-xl">🧪</span>
          <div>
            <strong className="font-bold block text-amber-200">BanTan Special Test Account Token:</strong> Enter <code className="bg-amber-500/20 px-1.5 py-0.5 rounded font-mono font-bold text-amber-200">BanTan@BanTan0607</code> in the login email field to bypass passwords & explore all features in sandbox mode without affecting public search data!
          </div>
        </div>
      </div>

      {/* Error / Success Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm font-bold flex justify-between items-center">
          <span>⚠️ {error}</span>
          <button onClick={() => setError('')} className="text-xs">✕</button>
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm font-bold flex justify-between items-center">
          <span>✅ {successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="text-xs">✕</button>
        </div>
      )}

      {/* Clickable Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => setActiveTab('students')}
          className={`glass-card p-5 rounded-2xl border text-left transition-all cursor-pointer transform hover:-translate-y-1 ${
            activeTab === 'students' ? 'border-primary shadow-[0_0_20px_rgba(99,102,241,0.25)]' : 'border-card-border hover:border-primary/40'
          }`}
        >
          <span className="text-xs font-bold text-muted uppercase tracking-wider block">Total Students ↗</span>
          <span className="text-3xl font-extrabold text-foreground mt-1 block">{stats?.totalStudents || 0}</span>
          <span className="text-[10px] text-primary font-semibold block mt-1">Click to filter by Year, Sec, Roll No, Gender</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('teams')}
          className={`glass-card p-5 rounded-2xl border text-left transition-all cursor-pointer transform hover:-translate-y-1 ${
            activeTab === 'teams' ? 'border-primary shadow-[0_0_20px_rgba(99,102,241,0.25)]' : 'border-card-border hover:border-primary/40'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-muted uppercase tracking-wider block">Total Teams ↗</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
              👩‍💻 {stats?.allFemaleTeams || 0} All-Female
            </span>
          </div>
          <span className="text-3xl font-extrabold text-foreground mt-1 block">{stats?.totalTeams || 0}</span>
          <span className="text-[10px] text-emerald-400 font-semibold block mt-1">
            {stats?.fullTeams || 0} Full / {stats?.formingTeams || 0} Forming
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('mentors')}
          className={`glass-card p-5 rounded-2xl border text-left transition-all cursor-pointer transform hover:-translate-y-1 ${
            activeTab === 'mentors' ? 'border-primary shadow-[0_0_20px_rgba(99,102,241,0.25)]' : 'border-card-border hover:border-primary/40'
          }`}
        >
          <span className="text-xs font-bold text-muted uppercase tracking-wider block">Faculty Mentors ↗</span>
          <span className="text-3xl font-extrabold text-foreground mt-1 block">{stats?.totalMentors || 0}</span>
          <span className="text-[10px] text-accent font-semibold block mt-1">{stats?.verifiedMentors || 0} Verified Mentors</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('access')}
          className={`glass-card p-5 rounded-2xl border text-left transition-all cursor-pointer transform hover:-translate-y-1 ${
            activeTab === 'access' ? 'border-primary shadow-[0_0_20px_rgba(99,102,241,0.25)]' : 'border-card-border hover:border-primary/40'
          }`}
        >
          <span className="text-xs font-bold text-muted uppercase tracking-wider block">Admin Accounts ↗</span>
          <span className="text-3xl font-extrabold text-foreground mt-1 block">{stats?.totalAuthorizedAdmins || 1}</span>
          <span className="text-[10px] text-purple-400 font-semibold block mt-1">Click to grant/revoke admin access</span>
        </button>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex border-b border-card-border gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('access')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-t-xl transition-all cursor-pointer shrink-0 ${
            activeTab === 'access'
              ? 'bg-card border-t border-x border-card-border text-primary border-b-2 border-b-primary'
              : 'text-muted hover:text-foreground'
          }`}
        >
          🛡️ Admin Access Permissions ({adminEmails.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('teams')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-t-xl transition-all cursor-pointer shrink-0 ${
            activeTab === 'teams'
              ? 'bg-card border-t border-x border-card-border text-primary border-b-2 border-b-primary'
              : 'text-muted hover:text-foreground'
          }`}
        >
          👥 Team Management ({teams.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('students')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-t-xl transition-all cursor-pointer shrink-0 ${
            activeTab === 'students'
              ? 'bg-card border-t border-x border-card-border text-primary border-b-2 border-b-primary'
              : 'text-muted hover:text-foreground'
          }`}
        >
          🎓 Student Directory ({students.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('ps_tracks')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-t-xl transition-all cursor-pointer shrink-0 ${
            activeTab === 'ps_tracks'
              ? 'bg-card border-t border-x border-card-border text-primary border-b-2 border-b-primary'
              : 'text-muted hover:text-foreground'
          }`}
        >
          📊 Problem Statement Participation ({problemStatementStats.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('mentors')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-t-xl transition-all cursor-pointer shrink-0 ${
            activeTab === 'mentors'
              ? 'bg-card border-t border-x border-card-border text-primary border-b-2 border-b-primary'
              : 'text-muted hover:text-foreground'
          }`}
        >
          👨‍🏫 Faculty Mentors ({mentors.length})
        </button>
      </div>

      {/* TAB 1: Admin Access Permissions */}
      {activeTab === 'access' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="glass-card p-6 rounded-3xl border border-card-border space-y-4">
            <div>
              <h3 className="text-lg font-extrabold text-foreground">Grant Admin Access Permissions</h3>
              <p className="text-xs text-muted mt-0.5">
                Add college email addresses authorized to log into this Admin Command Center via the <code className="bg-primary/20 px-1 py-0.5 rounded font-mono font-bold">/admin</code> command.
              </p>
            </div>

            <form onSubmit={handleGrantAdminAccess} className="flex flex-col sm:flex-row gap-3 max-w-xl">
              <input
                type="email"
                required
                placeholder="Enter college email (e.g. user@glbajajgroup.org)"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                className="flex-1 rounded-xl bg-background border border-card-border px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary"
              />
              <button
                type="submit"
                disabled={granting}
                className="rounded-xl bg-primary hover:bg-primary-hover px-5 py-2.5 text-xs font-bold text-white shadow-lg transition-all disabled:opacity-50 cursor-pointer shrink-0"
              >
                {granting ? 'Granting...' : '+ Grant Admin Access'}
              </button>
            </form>
          </div>

          <div className="glass-card p-6 rounded-3xl border border-card-border space-y-4">
            <h3 className="text-base font-extrabold text-foreground">Authorized Admin Email Accounts ({adminEmails.length})</h3>

            <div className="divide-y divide-card-border border border-card-border rounded-2xl overflow-hidden bg-background/40">
              {adminEmails.map((email) => {
                const isSuperAdmin = email.toLowerCase() === 'tanishk.bansal2025@glbajajgroup.org';
                return (
                  <div key={email} className="p-4 flex items-center justify-between gap-4 hover:bg-card/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="p-2 rounded-xl bg-primary/10 text-primary text-base">🛡️</span>
                      <div>
                        <span className="text-sm font-bold text-foreground block">{email}</span>
                        <span className="text-[10px] text-muted block">
                          {isSuperAdmin ? 'Primary Super Admin (Perpetual)' : 'Granted Admin Permissions'}
                        </span>
                      </div>
                    </div>

                    {isSuperAdmin ? (
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30">
                        Primary Super Admin
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRevokeAdminAccess(email)}
                        className="px-3 py-1.5 text-xs font-bold rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 transition-all cursor-pointer"
                      >
                        Revoke Access
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* TAB 2: Team Management */}
      {activeTab === 'teams' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Team Filters Toolbar */}
          <div className="glass-card p-4 rounded-2xl border border-card-border flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <input
                type="text"
                placeholder="Search team name, track, leader, member..."
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
                className="w-full sm:w-64 rounded-xl bg-background border border-card-border px-3.5 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
              />

              <select
                value={teamStatusFilter}
                onChange={(e) => setTeamStatusFilter(e.target.value)}
                className="rounded-xl bg-background border border-card-border px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="forming">Forming</option>
                <option value="locked">Locked</option>
                <option value="approved">Approved</option>
              </select>

              <select
                value={teamTrackFilter}
                onChange={(e) => setTeamTrackFilter(e.target.value)}
                className="rounded-xl bg-background border border-card-border px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary cursor-pointer max-w-[200px] truncate"
              >
                <option value="ALL">All Problem Statements (18 Themes)</option>
                {problemStatementStats.map((tr) => (
                  <option key={tr.id} value={tr.code}>
                    {tr.code} - {tr.name}
                  </option>
                ))}
              </select>

              {/* All Female Teams Quick Filter Toggle */}
              <button
                type="button"
                onClick={() => setAllFemaleFilter(!allFemaleFilter)}
                className={`px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border ${
                  allFemaleFilter
                    ? 'bg-pink-500/20 text-pink-300 border-pink-500/40 shadow-[0_0_15px_rgba(236,72,153,0.3)]'
                    : 'bg-card border-card-border text-muted hover:text-foreground'
                }`}
              >
                👩‍💻 All-Female Teams {allFemaleFilter && '✓'}
              </button>
            </div>

            <span className="text-xs text-muted font-bold shrink-0">Showing {filteredTeams.length} of {teams.length} teams</span>
          </div>

          {/* Teams Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredTeams.map((team) => (
              <div key={team.id} className="glass-card p-6 rounded-3xl border border-card-border space-y-4 relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-lg font-extrabold text-foreground">{team.name}</h4>
                      {team.isAllFemale && (
                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/40">
                          👩‍💻 All-Female Team
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-primary block mt-1">{team.trackName}</span>
                    <span className="text-xs text-muted block mt-0.5">Leader: {team.leaderName} ({team.leaderEmail})</span>
                  </div>

                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full border ${
                      team.status === 'approved'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : team.status === 'locked'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    {team.status.toUpperCase()} ({team.memberCount}/6)
                  </span>
                </div>

                {/* Team Roster Members List */}
                <div className="space-y-2 border-t border-card-border pt-3">
                  <div className="flex justify-between items-center text-[10px] font-bold text-muted uppercase tracking-wider">
                    <span>Roster Members ({team.memberCount}):</span>
                    <span>Gender: {team.femaleCount} Female / {team.maleCount} Male</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {team.members.map((m: any) => (
                      <div
                        key={m.id}
                        onClick={() => setSelectedStudent(m)}
                        className="p-2.5 rounded-xl bg-background/50 border border-card-border hover:border-primary/40 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2 text-xs font-semibold">
                          <span>👤 {m.name}</span>
                          <span className="text-[10px] text-muted">({m.branch || 'CSE'}, Yr: {m.year || 'N/A'}, Sec: {m.section || 'N/A'})</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="px-2 py-0.5 rounded-md bg-card border border-card-border text-muted">
                            {m.gender || 'Not specified'}
                          </span>
                          <span className="text-primary font-bold">Inspect ↗</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions Toolbar */}
                <div className="flex flex-wrap gap-2 pt-3 border-t border-card-border">
                  <button
                    type="button"
                    onClick={() => setSelectedTeam(team)}
                    className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 transition-all cursor-pointer"
                  >
                    🔍 Inspect Team Details
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateTeamStatus(team.id, 'approved')}
                    className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all cursor-pointer"
                  >
                    ✓ Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateTeamStatus(team.id, 'forming')}
                    className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-all cursor-pointer"
                  >
                    Set Forming
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDisbandTeam(team.id)}
                    className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 transition-all cursor-pointer ml-auto"
                  >
                    Disband
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* TAB 3: Advanced Student Directory */}
      {activeTab === 'students' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Advanced Multi-Attribute Filters Toolbar */}
          <div className="glass-card p-4 rounded-2xl border border-card-border space-y-3">
            <span className="text-xs font-bold text-primary uppercase tracking-wider block">Student Directory Multi-Attribute Filters</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-2.5">
              <input
                type="text"
                placeholder="Search Name, Email, Roll No..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="rounded-xl bg-background border border-card-border px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
              />

              <select
                value={studentYearFilter}
                onChange={(e) => setStudentYearFilter(e.target.value)}
                className="rounded-xl bg-background border border-card-border px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="ALL">All Years</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>

              <select
                value={studentBranchFilter}
                onChange={(e) => setStudentBranchFilter(e.target.value)}
                className="rounded-xl bg-background border border-card-border px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="ALL">All Branches</option>
                <option value="CSE">CSE</option>
                <option value="CSE (AI/ML)">CSE (AI/ML)</option>
                <option value="CS">CS</option>
              </select>

              <select
                value={studentSectionFilter}
                onChange={(e) => setStudentSectionFilter(e.target.value)}
                className="rounded-xl bg-background border border-card-border px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="ALL">All Sections (A-I)</option>
                {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].map((sec) => (
                  <option key={sec} value={sec}>Section {sec}</option>
                ))}
              </select>

              <select
                value={studentGenderFilter}
                onChange={(e) => setStudentGenderFilter(e.target.value)}
                className="rounded-xl bg-background border border-card-border px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="ALL">All Genders</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>

              <select
                value={studentStatusFilter}
                onChange={(e) => setStudentStatusFilter(e.target.value)}
                className="rounded-xl bg-background border border-card-border px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="ALL">All Access Statuses</option>
                <option value="ACTIVE">Active Users</option>
                <option value="BANNED">Suspended Users</option>
              </select>
            </div>
            <div className="flex justify-between items-center text-xs text-muted pt-1">
              <span>Showing {filteredStudents.length} of {students.length} students</span>
              <button
                type="button"
                onClick={() => {
                  setStudentSearch('');
                  setStudentYearFilter('ALL');
                  setStudentBranchFilter('ALL');
                  setStudentSectionFilter('ALL');
                  setStudentGenderFilter('ALL');
                  setStudentStatusFilter('ALL');
                }}
                className="text-primary font-bold hover:underline cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* Students Directory Table / Cards */}
          <div className="divide-y divide-card-border border border-card-border rounded-3xl overflow-hidden glass-card">
            {filteredStudents.map((student) => (
              <div key={student.id} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-card/40 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-extrabold text-foreground">{student.name}</span>
                    {student.isBanned ? (
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        🚫 Access Suspended
                      </span>
                    ) : (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        Active Account
                      </span>
                    )}
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                      {student.branch} • {student.year}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-card border border-card-border text-muted">
                      Sec: {student.section}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-card border border-card-border text-muted">
                      Gender: {student.gender}
                    </span>
                  </div>
                  <div className="text-xs text-muted flex items-center gap-3">
                    <span>{student.email}</span>
                    <span>• Roll: {student.rollNo}</span>
                    {student.teamName && <span className="text-primary font-semibold">• Team: {student.teamName}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedStudent(student)}
                    className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 transition-all cursor-pointer"
                  >
                    🔍 Inspect Profile
                  </button>

                  {student.isBanned ? (
                    <button
                      type="button"
                      onClick={() => handleStudentAccessToggle(student.email, 'restore')}
                      className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all cursor-pointer"
                    >
                      ✅ Restore Access
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleStudentAccessToggle(student.email, 'ban')}
                      className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 transition-all cursor-pointer"
                    >
                      🚫 Remove Access
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* TAB 4: Problem Statement Wide Participation Analytics */}
      {activeTab === 'ps_tracks' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="glass-card p-4 rounded-2xl border border-card-border flex flex-col sm:flex-row items-center justify-between gap-3">
            <input
              type="text"
              placeholder="Filter by PS Code, Theme Name, Category..."
              value={psSearch}
              onChange={(e) => setPsSearch(e.target.value)}
              className="w-full sm:w-80 rounded-xl bg-background border border-card-border px-4 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
            />
            <span className="text-xs text-muted font-bold">18 Official SIH 2026 Themes Participation Overview</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredPSTracks.map((track) => (
              <div key={track.id} className="glass-card p-6 rounded-3xl border border-card-border space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 font-mono">
                      {track.code}
                    </span>
                    <h4 className="text-lg font-extrabold text-foreground mt-1">{track.name}</h4>
                    <span className="text-xs text-muted block">{track.category} • {track.organization}</span>
                  </div>

                  <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {track.teamCount} Teams Joined
                  </span>
                </div>

                <p className="text-xs text-muted leading-relaxed line-clamp-2">{track.description}</p>

                {track.teams.length > 0 ? (
                  <div className="space-y-2 border-t border-card-border pt-3">
                    <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Participating Teams ({track.teams.length}):</span>
                    <div className="space-y-1.5">
                      {track.teams.map((t: any) => (
                        <div key={t.id} className="p-2 rounded-xl bg-background/50 border border-card-border flex items-center justify-between text-xs">
                          <span className="font-bold text-foreground">🚀 {t.name} (Leader: {t.leaderName})</span>
                          <span className="text-[10px] font-semibold text-primary">{t.memberCount}/6 Members</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-muted italic block border-t border-card-border pt-3">No teams registered under this theme yet.</span>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* TAB 5: Faculty Mentors */}
      {activeTab === 'mentors' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {mentors.map((mentor) => (
            <div key={mentor.id} className="glass-card p-6 rounded-3xl border border-card-border space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-base font-extrabold text-foreground">{mentor.name}</h4>
                  <span className="text-xs text-primary font-semibold block">{mentor.designation}</span>
                  <span className="text-xs text-muted block">{mentor.email}</span>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Verified Mentor
                </span>
              </div>
              <div className="text-xs text-muted">
                Capacity Allocation Load: <strong>{mentor.currentLoad} / {mentor.capacity} Teams Assigned</strong>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* STUDENT PROFILE INSPECT MODAL */}
      {selectedStudent && (
        <div onClick={() => setSelectedStudent(null)} className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md p-4 flex items-center justify-center">
          <div onClick={(e) => e.stopPropagation()} className="glass-card max-w-2xl w-full rounded-3xl p-6 border border-primary/40 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-card-border pb-3">
              <div>
                <h3 className="text-xl font-extrabold text-foreground">{selectedStudent.name}</h3>
                <span className="text-xs text-primary font-semibold">{selectedStudent.email}</span>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="text-xs font-bold bg-card border border-card-border px-3 py-1.5 rounded-xl cursor-pointer">✕ Close</button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-background/50 rounded-xl border border-card-border">
                <span className="text-muted block text-[10px] uppercase font-bold">Roll Number</span>
                <span className="font-bold text-foreground mt-0.5 block">{selectedStudent.rollNo}</span>
              </div>
              <div className="p-3 bg-background/50 rounded-xl border border-card-border">
                <span className="text-muted block text-[10px] uppercase font-bold">Section</span>
                <span className="font-bold text-foreground mt-0.5 block">Section {selectedStudent.section}</span>
              </div>
              <div className="p-3 bg-background/50 rounded-xl border border-card-border">
                <span className="text-muted block text-[10px] uppercase font-bold">Branch & Year</span>
                <span className="font-bold text-foreground mt-0.5 block">{selectedStudent.branch} ({selectedStudent.year})</span>
              </div>
              <div className="p-3 bg-background/50 rounded-xl border border-card-border">
                <span className="text-muted block text-[10px] uppercase font-bold">Gender</span>
                <span className="font-bold text-foreground mt-0.5 block">{selectedStudent.gender}</span>
              </div>
            </div>

            <div className="space-y-2 border-t border-card-border pt-3">
              <span className="text-xs font-bold text-foreground block">Skills & Technical Competencies</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedStudent.skills?.map((sk: string) => (
                  <span key={sk} className="text-xs bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-lg font-bold">
                    {sk}
                  </span>
                ))}
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-3 pt-3 border-t border-card-border text-xs">
              {selectedStudent.githubUrl && (
                <a href={selectedStudent.githubUrl} target="_blank" rel="noreferrer" className="text-primary font-bold hover:underline">
                  ↗ GitHub Profile
                </a>
              )}
              {selectedStudent.linkedinUrl && (
                <a href={selectedStudent.linkedinUrl} target="_blank" rel="noreferrer" className="text-primary font-bold hover:underline">
                  ↗ LinkedIn Profile
                </a>
              )}
              {selectedStudent.resumeUrl && (
                <a href={selectedStudent.resumeUrl} target="_blank" rel="noreferrer" className="text-primary font-bold hover:underline">
                  ↗ View Resume
                </a>
              )}
            </div>

            {/* Admin Action Bar */}
            <div className="pt-4 border-t border-card-border flex justify-end">
              {selectedStudent.isBanned ? (
                <button
                  type="button"
                  onClick={() => handleStudentAccessToggle(selectedStudent.email, 'restore')}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all cursor-pointer"
                >
                  ✅ Restore User Access
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleStudentAccessToggle(selectedStudent.email, 'ban')}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 transition-all cursor-pointer"
                >
                  🚫 Remove / Suspend User Access
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
