'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';

interface Track {
  id: string;
  name: string;
  problemStatementCode: string;
  description: string;
  category: string;
  organization?: string;
  sihUrl?: string;
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
        <p className="text-lg animate-pulse text-muted">Loading SIH themes...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Official SIH 2026 Problem Statement Themes
          </h1>
          <p className="text-sm text-muted mt-1">
            Explore official Smart India Hackathon problem domains and reference themes.
          </p>
        </div>

        {/* Notice Banner */}
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs sm:text-sm text-amber-300 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📢</span>
            <div>
              <strong className="font-bold block">Official SIH 2026 Problem Statements Notice</strong>
              <span className="opacity-90">Official PS are not released yet. Tracks shown below are based on official SIH themes.</span>
            </div>
          </div>
          <a
            href="https://sih.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 px-3.5 py-1.5 text-xs font-bold transition-all"
          >
            ↗ Official SIH Portal
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tracks.map((track) => (
            <div key={track.id} className="glass-card rounded-2xl p-6 border border-card-border flex flex-col justify-between hover:border-primary/40 transition-all space-y-4 shadow-xl">
              <div className="space-y-3">
                <div className="flex flex-wrap justify-between items-center gap-2 border-b border-card-border pb-2">
                  <span className="inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-bold text-primary">
                    {track.category}
                  </span>
                  <span className="text-xs font-extrabold text-foreground bg-card border border-card-border px-2 py-0.5 rounded">
                    {track.problemStatementCode}
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">{track.name}</h3>
                  <p className="text-xs text-muted leading-relaxed mt-1.5">{track.description}</p>
                </div>
              </div>

              {track.organization && (
                <div className="pt-3 border-t border-card-border flex items-center justify-between text-xs">
                  <span className="text-muted">
                    Ministry / Org: <strong className="text-foreground">{track.organization}</strong>
                  </span>
                  {track.sihUrl && (
                    <a
                      href={track.sihUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      SIH Portal ↗
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
