'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';

interface Track {
  id: string;
  problemStatementCode: string;
  name: string;
}

export default function CreateTeamPage() {
  const router = useRouter();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [name, setName] = useState('');
  const [trackId, setTrackId] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchTracks() {
      try {
        const res = await fetch('/api/tracks');
        const data = await res.json();
        if (data.success) {
          setTracks(data.tracks);
          if (data.tracks.length > 0) {
            setTrackId(data.tracks[0].id);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchTracks();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, trackId, whatsapp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create team');
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden font-sans">
      <Navbar />

      <main className="mx-auto max-w-lg px-4 py-16 z-10 relative">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Create a New Team
          </h1>
          <p className="text-sm text-muted mt-2">
            Establish your team profile, select your problem statement track, and provide contact info.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-8 border border-card-border shadow-2xl">
          {error && (
            <div className="mb-6 rounded-lg bg-red-950/40 p-4 text-sm text-red-400 border border-red-900/30">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wider">Team Name</label>
              <input
                type="text"
                placeholder="e.g. Code Warriors"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg bg-background/50 border border-card-border px-3.5 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wider">Problem Statement Track</label>
              <select
                value={trackId}
                onChange={(e) => setTrackId(e.target.value)}
                className="w-full rounded-lg bg-background/50 border border-card-border px-3.5 py-2 text-sm text-foreground focus:outline-none focus:border-primary cursor-pointer"
              >
                {tracks.map((track) => (
                  <option key={track.id} value={track.id} className="bg-card text-foreground">
                    {track.problemStatementCode} - {track.name.substring(0, 45)}...
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wider">Leader's WhatsApp Number</label>
              <input
                type="tel"
                placeholder="e.g. +91 99999 99999"
                required
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full rounded-lg bg-background/50 border border-card-border px-3.5 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-primary hover:bg-primary-hover py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/25 disabled:opacity-50 transition-all cursor-pointer"
              >
                {loading ? 'Creating Team...' : 'Form Team'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
