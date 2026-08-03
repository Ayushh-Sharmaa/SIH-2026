'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';

interface Track {
  id: string;
  name: string;
  problemStatementCode: string;
  description: string;
  category: string;
  teamCount: number;
}

export default function TracksPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTracks() {
      try {
        const res = await fetch('/api/tracks');
        const data = await res.json();
        if (data.success) {
          setTracks(data.tracks);
        }
      } catch (err) {
        console.error('Fetch tracks failed:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchTracks();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="text-lg">Loading tracks...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            SIH Problem Statements
          </h1>
          <p className="text-sm text-muted mt-1">
            Explore the problem statement categories and track the live team formation density.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tracks.map((track) => (
            <div key={track.id} className="glass-card rounded-2xl p-6 border border-card-border flex flex-col justify-between hover:border-primary/30 transition-all">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    {track.category}
                  </span>
                  <span className="text-sm font-bold text-muted uppercase">
                    {track.problemStatementCode}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">{track.name}</h3>
                  <p className="text-xs text-muted leading-relaxed mt-2">{track.description}</p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-card-border flex items-center justify-between">
                <span className="text-xs text-muted">
                  Registered Teams
                </span>
                <span className="text-sm font-extrabold text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-lg">
                  {track.teamCount} teams
                </span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
