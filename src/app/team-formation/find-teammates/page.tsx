'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Navbar from '@/components/layout/Navbar';

interface Student {
  userId: string;
  name: string;
  year: string;
  branch: string;
  skills: string[];
  languages: string[];
  softSkills: string[];
  resumeUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  avatarUrl?: string | null;
}

interface Track {
  id: string;
  problemStatementCode: string;
  name: string;
}

const AVATAR_COLORS = ['from-blue-500 to-indigo-500', 'from-emerald-500 to-teal-500', 'from-rose-500 to-pink-500', 'from-amber-500 to-orange-500'];

function ProfileAvatar({ avatarUrl, name }: { avatarUrl?: string | null; name: string }) {
  if (avatarUrl?.startsWith('data:image/') || avatarUrl?.startsWith('http')) {
    return <Image unoptimized src={avatarUrl} alt={`${name}'s profile`} width={48} height={48} className="h-12 w-12 rounded-xl object-cover" />;
  }

  const color = AVATAR_COLORS[name.length % AVATAR_COLORS.length];
  return (
    <span aria-label={`${name}'s profile`} className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-sm font-bold text-white`}>
      {name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
    </span>
  );
}

export default function FindTeammatesPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [skill, setSkill] = useState('');
  const [softSkill, setSoftSkill] = useState('');
  const [language, setLanguage] = useState('');
  const [trackId, setTrackId] = useState('');
  const [inviteState, setInviteState] = useState<Record<string, 'sending' | 'sent'>>({});
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const softSkillsOptions = ['PPT Making', 'Public Speaking/Presenting', 'Technical Writing', 'UI/UX Design', 'Video Editing', 'Management'];
  const languageOptions = ['English', 'Hindi'];

  const fetchTeammates = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (skill) queryParams.append('skill', skill);
      if (softSkill) queryParams.append('softSkill', softSkill);
      if (language) queryParams.append('language', language);
      if (trackId) queryParams.append('trackId', trackId);

      const res = await fetch(`/api/students?${queryParams.toString()}`);
      const data = await res.json();
      if (data.success) {
        setStudents(data.students);
      }
    } catch (err) {
      console.error('Fetch teammates error:', err);
    }
  };

  useEffect(() => {
    async function initPage() {
      setLoading(true);
      // Fetch tracks first
      try {
        const res = await fetch('/api/tracks');
        const data = await res.json();
        if (data.success) {
          setTracks(data.tracks);
        }
      } catch (err) {
        console.error('Fetch tracks failed:', err);
      }
      await fetchTeammates();
      setLoading(false);
    }
    initPage();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTeammates();
  };

  const handleReset = () => {
    setSkill('');
    setSoftSkill('');
    setLanguage('');
    setTrackId('');
    setTimeout(() => {
      fetchTeammates();
    }, 50);
  };

  const sendInvite = async (student: Student) => {
    setInviteState((previous) => ({ ...previous, [student.userId]: 'sending' }));
    setNotice(null);

    try {
      const response = await fetch('/api/team-invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: student.userId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not send the invitation.');

      setInviteState((previous) => ({ ...previous, [student.userId]: 'sent' }));
      setNotice({ type: 'success', message: `Invitation sent to ${student.name}. They can accept it from their notifications.` });
    } catch (error: unknown) {
      setInviteState((previous) => {
        const next = { ...previous };
        delete next[student.userId];
        return next;
      });
      setNotice({ type: 'error', message: error instanceof Error ? error.message : 'Could not send the invitation.' });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Find Teammates
          </h1>
          <p className="text-sm text-muted mt-1">
            Browse and filter students looking for SIH teams based on their skills, fluency, and track interests.
          </p>
        </div>

        {/* Filter Bar */}
        <form onSubmit={handleSearch} className="glass-card rounded-2xl p-6 border border-card-border mb-8 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wider">Tech Skill</label>
            <input
              type="text"
              placeholder="e.g. React"
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              className="w-full rounded-lg bg-background/50 border border-card-border px-3.5 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wider">Soft Skill</label>
            <select
              value={softSkill}
              onChange={(e) => setSoftSkill(e.target.value)}
              className="w-full rounded-lg bg-background/50 border border-card-border px-3.5 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary"
            >
              <option value="" className="bg-card text-muted">All Soft Skills</option>
              {softSkillsOptions.map((opt) => (
                <option key={opt} value={opt} className="bg-card text-foreground">{opt}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wider">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full rounded-lg bg-background/50 border border-card-border px-3.5 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary"
            >
              <option value="" className="bg-card text-muted">All Languages</option>
              {languageOptions.map((opt) => (
                <option key={opt} value={opt} className="bg-card text-foreground">{opt}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wider">Problem Statement</label>
            <select
              value={trackId}
              onChange={(e) => setTrackId(e.target.value)}
              className="w-full rounded-lg bg-background/50 border border-card-border px-3.5 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary"
            >
              <option value="" className="bg-card text-muted">All Tracks</option>
              {tracks.map((track) => (
                <option key={track.id} value={track.id} className="bg-card text-foreground">
                  {track.problemStatementCode}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 rounded-lg bg-primary hover:bg-primary-hover py-1.5 text-sm font-semibold text-white cursor-pointer"
            >
              Filter
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="flex-1 rounded-lg bg-card-border border border-card-border py-1.5 text-sm font-semibold text-foreground hover:bg-background transition-all cursor-pointer"
            >
              Reset
            </button>
          </div>
        </form>

        {notice && (
          <div role="status" className={`mb-6 rounded-xl border px-4 py-3 text-sm ${notice.type === 'success' ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300' : 'border-red-500/25 bg-red-500/10 text-red-300'}`}>
            {notice.message}
          </div>
        )}

        {loading ? (
          <p className="text-center text-muted">Updating listings...</p>
        ) : students.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {students.map((student) => (
              <motion.article
                key={student.userId}
                whileHover={{ y: -3 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="glass-card flex flex-col justify-between rounded-2xl border border-card-border p-6 shadow-lg transition-colors hover:border-primary/35"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <ProfileAvatar avatarUrl={student.avatarUrl} name={student.name} />
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-bold text-foreground">{student.name}</h3>
                      <span className="mt-0.5 block text-xs text-muted">{student.branch} · {student.year}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-muted block font-semibold uppercase tracking-wider">Tech Skills</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {student.skills.map((sk) => (
                        <span key={sk} className="text-[9px] bg-primary/10 border border-primary/20 text-primary px-1.5 py-0.5 rounded">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-muted block font-semibold uppercase tracking-wider">Soft Skills & Language</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {student.softSkills.map((sk) => (
                        <span key={sk} className="text-[9px] bg-accent/10 border border-accent/20 text-accent px-1.5 py-0.5 rounded">
                          {sk}
                        </span>
                      ))}
                      {student.languages.map((ln) => (
                        <span key={ln} className="text-[9px] bg-background/80 border border-card-border text-foreground px-1.5 py-0.5 rounded">
                          {ln}
                        </span>
                      ))}
                    </div>
                  </div>

                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-card-border pt-4">
                  <div className="flex flex-wrap gap-1.5">
                    {student.githubUrl && (
                      <a
                        href={student.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-bold text-foreground bg-background/60 border border-card-border hover:border-primary/50 px-2 py-1 rounded-md transition-all flex items-center gap-1"
                      >
                        🐙 GitHub ↗
                      </a>
                    )}
                    {student.linkedinUrl && (
                      <a
                        href={student.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-bold text-cyan-400 bg-cyan-950/20 border border-cyan-800/30 hover:border-cyan-400/50 px-2 py-1 rounded-md transition-all flex items-center gap-1"
                      >
                        💼 LinkedIn ↗
                      </a>
                    )}
                    {student.resumeUrl && (
                      <a
                        href={student.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-bold text-pink-400 bg-pink-950/20 border border-pink-800/30 hover:border-pink-400/50 px-2 py-1 rounded-md transition-all flex items-center gap-1"
                      >
                        📄 Resume ↗
                      </a>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => sendInvite(student)}
                    disabled={Boolean(inviteState[student.userId])}
                    className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {inviteState[student.userId] === 'sending' ? 'Sending…' : inviteState[student.userId] === 'sent' ? 'Invite sent' : 'Invite'}
                  </button>
                </div>
              </motion.article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-card-border bg-card/40 px-6 py-14 text-center">
            <p className="text-base font-semibold text-foreground">No teammate profiles match these filters.</p>
            <p className="mt-1 text-sm text-muted">Clear a filter or widen your skill search to discover more collaborators.</p>
          </div>
        )}
      </main>
    </div>
  );
}
