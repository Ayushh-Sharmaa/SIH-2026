

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Navbar from '@/components/layout/Navbar';
import ViewingAsBanner from '@/components/layout/ViewingAsBanner';

const AVATAR_PRESETS: Record<string, { emoji: string; color: string }> = {
  hacker: { emoji: '🥷', color: 'from-cyan-500 to-blue-500' },
  developer: { emoji: '💻', color: 'from-blue-500 to-indigo-500' },
  designer: { emoji: '🎨', color: 'from-pink-500 to-rose-500' },
  scientist: { emoji: '🧪', color: 'from-emerald-500 to-teal-500' },
  manager: { emoji: '👑', color: 'from-amber-500 to-yellow-500' },
  writer: { emoji: '✍️', color: 'from-teal-500 to-blue-600' },
};

function Avatar({ avatarUrl, name, className = '' }: { avatarUrl?: string | null; name: string; className?: string }) {
  if (avatarUrl?.startsWith('data:image/') || avatarUrl?.startsWith('http')) {
    return <Image unoptimized src={avatarUrl} alt={`${name}'s profile`} width={96} height={96} className={`object-cover ${className}`} />;
  }

  const preset = AVATAR_PRESETS[avatarUrl || 'developer'] || AVATAR_PRESETS.developer;
  return <span aria-label={`${name}'s profile`} className={`flex items-center justify-center bg-gradient-to-br ${preset.color} ${className}`}>{preset.emoji}</span>;
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (!res.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error(err);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

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
        alert(result.error || 'Failed to process request');
      } else {
        await fetchDashboard();
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col p-6 space-y-6">
        {/* Header bar skeleton */}
        <div className="flex justify-between items-center border-b border-card-border pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded skeleton-shimmer" />
            <div className="h-4 w-28 skeleton-shimmer" />
          </div>
          <div className="h-8 w-20 rounded-xl skeleton-shimmer" />
        </div>

        {/* Hero Welcome banner skeleton */}
        <div className="h-28 rounded-2xl bg-card border border-card-border/50 p-6 flex flex-col justify-center space-y-2">
          <div className="h-5 w-48 skeleton-shimmer" />
          <div className="h-3.5 w-96 skeleton-shimmer" />
        </div>

        {/* Main body skeleton grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
          {/* Left Card skeleton */}
          <div className="p-6 rounded-2xl border border-card-border bg-card/60 flex flex-col space-y-4">
            <div className="h-4 w-24 skeleton-shimmer" />
            <div className="h-px bg-card-border w-full" />
            <div className="h-3 w-full skeleton-shimmer" />
            <div className="h-3 w-5/6 skeleton-shimmer" />
            <div className="h-3 w-4/6 skeleton-shimmer" />
          </div>

          {/* Right Columns skeleton */}
          <div className="lg:col-span-2 p-6 rounded-2xl border border-card-border bg-card/60 flex flex-col space-y-4">
            <div className="h-4 w-32 skeleton-shimmer" />
            <div className="h-px bg-card-border w-full" />
            <div className="h-20 skeleton-shimmer rounded-xl" />
            <div className="h-10 skeleton-shimmer rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const isStudent = data?.role === 'STUDENT';
  const profile = data?.profile;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  } as const;

  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15,
      },
    },
  } as const;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ViewingAsBanner />
      <Navbar />

      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8"
      >
        {/* Welcome Banner */}
        <motion.div
          variants={cardVariants}
          className="p-6 rounded-2xl bg-gradient-to-r from-primary/15 to-accent/5 border border-primary/20 relative overflow-hidden"
        >
          <motion.div
            animate={{
              rotate: [0, 360],
            }}
            transition={{
              duration: 40,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="absolute -top-12 -right-12 w-64 h-64 bg-primary/10 rounded-full filter blur-3xl pointer-events-none"
          />
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">
            Welcome back, {profile?.name || 'User'}!
          </h2>
          <p className="text-sm text-muted mt-1">
            {isStudent ? 'Track your team formation status and explore matches.' : 'Manage your mentored hackathon teams and requests.'}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* LEFT COLUMN: Profile info */}
          <motion.div variants={cardVariants} className="space-y-6">
            <div className="glass-card parallax-card rounded-2xl p-6 border border-card-border shadow-xl">
              <div className="flex justify-between items-center mb-4 border-b border-card-border pb-2">
                <h3 className="text-base font-bold text-foreground">
                  My Profile
                </h3>
                <button
                  onClick={() => router.push('/onboarding?edit=true')}
                  className="text-xs font-semibold text-primary hover:text-primary-hover bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Edit Profile
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] text-muted uppercase tracking-wider block font-bold">Email ID</span>
                  <span className="text-sm font-semibold text-foreground">{profile?.email || 'N/A'}</span>
                </div>
                {isStudent ? (
                  <>
                    <div>
                      <span className="text-[10px] text-muted uppercase tracking-wider block font-bold">Academic Info</span>
                      <span className="text-sm font-semibold text-foreground">{profile?.branch} ({profile?.year})</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted uppercase tracking-wider block font-bold">Languages</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {profile?.languages?.map((l: string) => (
                          <span key={l} className="text-[9px] bg-background/50 border border-card-border text-foreground px-2 py-0.5 rounded font-medium">
                            {l}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted uppercase tracking-wider block font-bold">Technical Skills</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {profile?.skills?.map((s: string) => (
                          <span key={s} className="text-[9px] bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded font-medium">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted uppercase tracking-wider block font-bold">Soft Skills</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {profile?.softSkills?.map((s: string) => (
                          <span key={s} className="text-[9px] bg-accent/10 border border-accent/20 text-accent px-2 py-0.5 rounded font-medium">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted uppercase tracking-wider block font-bold mb-1.5">Social Profiles & Links</span>
                      <div className="flex flex-wrap gap-2">
                        {profile?.githubUrl && (
                          <a
                            href={profile.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-bold text-foreground bg-card border border-card-border hover:border-primary/40 px-2.5 py-1 rounded-lg transition-all"
                          >
                            🐙 GitHub ↗
                          </a>
                        )}
                        {profile?.linkedinUrl && (
                          <a
                            href={profile.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-bold text-cyan-400 bg-cyan-950/20 border border-cyan-800/30 hover:border-cyan-400/50 px-2.5 py-1 rounded-lg transition-all"
                          >
                            💼 LinkedIn ↗
                          </a>
                        )}
                        {profile?.resumeUrl && (
                          <a
                            href={profile.resumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-bold text-pink-400 bg-pink-950/20 border border-pink-800/30 hover:border-pink-400/50 px-2.5 py-1 rounded-lg transition-all"
                          >
                            📄 Resume ↗
                          </a>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <span className="text-[10px] text-muted uppercase tracking-wider block font-bold">Designation</span>
                      <span className="text-sm font-semibold text-foreground">{profile?.designation} at {profile?.organization}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted uppercase tracking-wider block font-bold">Expertise</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {profile?.expertise?.map((e: string) => (
                          <span key={e} className="text-[9px] bg-accent/10 border border-accent/20 text-accent px-2 py-0.5 rounded font-medium">
                            {e}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted uppercase tracking-wider block font-bold">Biography</span>
                      <p className="text-xs text-muted leading-relaxed mt-1 bg-background/30 p-2.5 rounded-lg border border-card-border">{profile?.bio || 'No bio provided.'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted uppercase tracking-wider block font-bold mb-1">Verification Status</span>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${profile?.verified
                          ? 'bg-green-600/10 border-green-500/20 text-green-400'
                          : 'bg-yellow-600/10 border-yellow-500/20 text-yellow-400'
                        }`}>
                        {profile?.verified ? '✓ Verified Mentor' : '⌛ Awaiting Verification'}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>

          {/* RIGHT COLUMN: Action center and team status */}
          <div className="lg:col-span-2 space-y-6">
            {isStudent ? (
              /* Student Dashboard Content */
              <div className="space-y-6">
                {data.team ? (
                  /* Team card */
                  <motion.div
                    variants={cardVariants}
                    className="glass-card rounded-2xl p-6 border border-card-border space-y-6 shadow-xl"
                  >
                    <div className="flex justify-between items-start border-b border-card-border pb-4">
                      <div>
                        <span className="text-[10px] text-primary font-bold tracking-wider uppercase">My Team</span>
                        <h3 className="text-2xl font-extrabold text-foreground mt-0.5">{data.team.name}</h3>
                        <p className="text-xs text-muted mt-1">
                          Track: <span className="text-foreground font-semibold">{data.team.track.problemStatementCode}</span> - {data.team.track.name}
                        </p>
                      </div>
                      <span className="inline-flex items-center rounded-md bg-primary/10 border border-primary/20 px-2.5 py-1 text-xs font-bold text-primary capitalize">
                        {data.team.status}
                      </span>
                    </div>

                    {/* Team roster */}
                    <div>
                      <div className="mb-3 flex items-center justify-between gap-4">
                        <h4 className="text-[10px] font-bold text-muted uppercase tracking-wider">Team roster</h4>
                        <span className="text-xs text-muted">{data.team.members.length} of 6 seats filled</span>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                        {Array.from({ length: 6 }, (_, index) => {
                          const member = data.team.members[index];
                          return member ? (
                            <motion.div key={member.userId} whileHover={{ y: -3, scale: 1.03 }} className="group min-w-0">
                              <Avatar avatarUrl={member.avatarUrl} name={member.name} className="aspect-square w-full rounded-xl border border-card-border shadow-lg" />
                              <p className="mt-1.5 truncate text-center text-[10px] font-semibold text-foreground">{member.name}</p>
                              {member.userId === data.team.leaderId && <p className="text-center text-[9px] font-semibold text-primary">Leader</p>}
                            </motion.div>
                          ) : (
                            <div key={`open-seat-${index}`} className="aspect-square rounded-xl border border-dashed border-card-border bg-background/30 flex items-center justify-center text-lg text-muted" aria-label="Open team seat">+</div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Interactive Team Leader Contact Button & Hover Popover */}
                    {data.team.leaderContact && (
                      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
                        <div>
                          <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                            👑 Team Leader Contact
                          </h4>
                          <p className="text-xs text-muted mt-0.5">
                            Leader: <strong className="text-primary font-bold">{data.team.leaderContact.name}</strong>
                          </p>
                        </div>

                        <div className="relative group">
                          <button
                            type="button"
                            className="rounded-xl bg-primary hover:bg-primary-hover px-4 py-2 text-xs font-bold text-white shadow-lg shadow-primary/20 transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            📞 Contact Team Leader
                          </button>

                          {/* Hover / Click Contact Details Card */}
                          <div className="absolute right-0 bottom-full mb-2 w-72 p-4 bg-card border border-primary/40 rounded-2xl shadow-2xl space-y-3 hidden group-hover:block group-focus-within:block z-50 animate-in fade-in zoom-in-95 duration-150">
                            <div className="flex justify-between items-center border-b border-card-border pb-1.5">
                              <span className="text-xs font-extrabold text-foreground">
                                📞 Leader Direct Channels
                              </span>
                              <span className="text-[9px] bg-primary/20 text-primary font-bold px-2 py-0.5 rounded-full">
                                Leader Only
                              </span>
                            </div>

                            {/* Email Row */}
                            <div className="space-y-1">
                              <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Email Address:</span>
                              <div className="flex items-center justify-between gap-2 p-2 bg-background/60 rounded-lg border border-card-border">
                                <a
                                  href={`mailto:${data.team.leaderContact.email}`}
                                  className="text-xs font-semibold text-primary hover:underline truncate"
                                >
                                  ✉️ {data.team.leaderContact.email || 'leader@glbajaj.org'}
                                </a>
                                <button
                                  type="button"
                                  onClick={() => navigator.clipboard.writeText(data.team.leaderContact.email || '')}
                                  className="text-[10px] font-bold bg-primary/10 hover:bg-primary/20 text-primary px-2 py-1 rounded transition-colors"
                                >
                                  Copy
                                </button>
                              </div>
                            </div>

                            {/* Phone / WhatsApp Row */}
                            <div className="space-y-1">
                              <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Phone / WhatsApp:</span>
                              <div className="flex items-center justify-between gap-2 p-2 bg-background/60 rounded-lg border border-card-border">
                                <div className="flex gap-2">
                                  <a
                                    href={`tel:${data.team.leaderContact.whatsapp || '+91 9876543210'}`}
                                    className="text-xs font-semibold text-green-400 hover:underline"
                                  >
                                    📱 {data.team.leaderContact.whatsapp || '+91 9876543210'}
                                  </a>
                                  {data.team.leaderContact.whatsapp && (
                                    <a
                                      href={`https://wa.me/${data.team.leaderContact.whatsapp.replace(/\D/g, '')}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-xs font-bold text-teal-400 hover:underline"
                                    >
                                      💬 WhatsApp
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Mentor Status */}
                    <div className="p-4 rounded-xl bg-background/30 border border-card-border flex items-center justify-between">
                      <div>
                        <h4 className="text-[10px] font-bold text-muted uppercase tracking-wider">Assigned Mentor</h4>
                        {data.team.mentor ? (
                          <p className="text-sm font-bold text-foreground mt-1">
                            {data.team.mentor.name} <span className="text-xs text-muted">({data.team.mentor.designation})</span>
                          </p>
                        ) : (
                          <p className="text-xs text-yellow-400 font-semibold mt-1">No mentor assigned yet.</p>
                        )}
                      </div>
                      {!data.team.mentor && (
                        <button
                          onClick={() => router.push('/team-formation/find-mentors')}
                          className="rounded-lg bg-primary hover:bg-primary-hover px-4 py-2 text-xs font-bold text-white cursor-pointer transform hover:-translate-y-0.5 transition-all"
                        >
                          Find Mentors
                        </button>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  /* No team card */
                  <motion.div
                    variants={cardVariants}
                    className="glass-card rounded-2xl p-8 border border-card-border text-center space-y-6 shadow-xl"
                  >
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-primary text-2xl">
                      🚀
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">You don't have a team yet</h3>
                      <p className="text-sm text-muted mt-2 max-w-sm mx-auto leading-relaxed">
                        To participate in SIH@GLBGOI, you must either join an existing forming team or start a new one as a leader.
                      </p>
                    </div>
                    <div className="flex justify-center gap-4 pt-2">
                      <button
                        onClick={() => router.push('/team-formation/create-team')}
                        className="rounded-lg bg-primary hover:bg-primary-hover px-6 py-2.5 text-sm font-bold text-white cursor-pointer shadow-lg shadow-primary/20"
                      >
                        Create a Team
                      </button>
                      <button
                        onClick={() => router.push('/team-formation/find-teammates')}
                        className="rounded-lg bg-card-border border border-card-border px-6 py-2.5 text-sm font-bold text-foreground hover:bg-background transition-colors cursor-pointer"
                      >
                        Find Teammates
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            ) : (
              /* Mentor Dashboard Content */
              <div className="space-y-6">
                {/* Mentorship stats capacity bar */}
                <motion.div variants={cardVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="glass-card rounded-2xl p-6 border border-card-border space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted block font-bold uppercase tracking-wider">Mentoring Capacity</span>
                      <span className="text-xl font-extrabold text-primary">{profile?.currentLoad} / {profile?.capacity} teams</span>
                    </div>
                    {/* Animated Capacity Progress Bar */}
                    <div className="w-full h-3 bg-card-border rounded-full overflow-hidden border border-card-border">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(profile?.currentLoad / profile?.capacity) * 100}%` }}
                        transition={{ type: 'spring', stiffness: 50, damping: 10, delay: 0.2 }}
                        className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                      />
                    </div>
                  </div>
                  <div className="glass-card rounded-2xl p-6 border border-card-border flex flex-col justify-center">
                    <span className="text-xs text-muted block font-bold uppercase tracking-wider">Incoming Requests</span>
                    <span className="text-3xl font-extrabold text-accent mt-1">{data.pendingRequests?.length || 0}</span>
                  </div>
                </motion.div>

                {/* Left column: Mentored Teams */}
                <motion.div variants={cardVariants} className="glass-card rounded-2xl p-6 border border-card-border shadow-xl">
                  <h3 className="text-base font-bold text-foreground mb-4">Teams I Guide</h3>
                  {data.teams.length > 0 ? (
                    <div className="space-y-4">
                      {data.teams.map((t: any) => (
                        <div key={t.id} className="flex justify-between items-center border border-card-border p-4 rounded-xl bg-background/50 pop-out-hover">
                          <div>
                            <span className="text-sm font-bold text-foreground block">{t.name}</span>
                            <span className="text-xs text-muted mt-0.5">Track: {t.track.name}</span>
                          </div>
                          <span className="text-xs font-semibold text-muted bg-card-border border border-card-border px-3 py-1 rounded-md">
                            {t.memberCount} / 6 Members
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted text-center py-6">You are not mentoring any teams yet.</p>
                  )}
                </motion.div>

                {/* Right column: Pending requests */}
                <motion.div variants={cardVariants} className="glass-card rounded-2xl p-6 border border-card-border shadow-xl">
                  <h3 className="text-base font-bold text-foreground mb-4">Pending Team Requests</h3>
                  {data.pendingRequests.length > 0 ? (
                    <div className="space-y-4">
                      {data.pendingRequests.map((req: any) => (
                        <div key={req.id} className="border border-card-border p-4 rounded-xl bg-background/50 space-y-4 pop-out-hover">
                          <div>
                            <span className="text-sm font-bold text-foreground">{req.team.name}</span>
                            <span className="text-xs text-muted block mt-1">Track: {req.team.track.name}</span>
                            {req.message && (
                              <p className="text-xs text-foreground italic mt-2 bg-background/80 p-2.5 rounded-lg border border-card-border">
                                "{req.message}"
                              </p>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <button
                              disabled={actionLoading !== null}
                              onClick={() => handleRequestResponse(req.id, 'accept')}
                              className="rounded-lg bg-green-600 hover:bg-green-700 px-4 py-2 text-xs font-bold text-white cursor-pointer disabled:opacity-50"
                            >
                              {actionLoading === req.id ? 'Loading...' : 'Accept'}
                            </button>
                            <button
                              disabled={actionLoading !== null}
                              onClick={() => handleRequestResponse(req.id, 'decline')}
                              className="rounded-lg bg-card-border border border-card-border px-4 py-2 text-xs font-bold text-foreground hover:bg-background cursor-pointer disabled:opacity-50"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted text-center py-6">No incoming team requests.</p>
                  )}
                </motion.div>
              </div>
            )}
          </div>
        </div>
      </motion.main>
    </div>
  );
}
