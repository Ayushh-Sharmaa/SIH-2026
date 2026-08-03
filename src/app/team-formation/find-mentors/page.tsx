'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';

interface Mentor {
  userId: string;
  name: string;
  designation: string;
  organization: string;
  expertise: string[];
  capacity: number;
  currentLoad: number;
  bio?: string;
  linkedinUrl?: string;
  email: string;
}

export default function FindMentorsPage() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [expertise, setExpertise] = useState('');

  const fetchMentors = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (expertise) queryParams.append('expertise', expertise);

      const res = await fetch(`/api/mentors?${queryParams.toString()}`);
      const data = await res.json();
      if (data.success) {
        setMentors(data.mentors);
      }
    } catch (err) {
      console.error('Fetch mentors failed:', err);
    }
  };

  useEffect(() => {
    async function initPage() {
      setLoading(true);
      await fetchMentors();
      setLoading(false);
    }
    initPage();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTeammates();
  };

  const fetchTeammates = async () => {
    setLoading(true);
    await fetchMentors();
    setLoading(false);
  };

  const handleReset = () => {
    setExpertise('');
    setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/mentors');
        const data = await res.json();
        if (data.success) setMentors(data.mentors);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 50);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Find Mentors
          </h1>
          <p className="text-sm text-muted mt-1">
            Discover verified mentors from GL Bajaj faculty or industry leaders who can guide your SIH team.
          </p>
        </div>

        {/* Filter Bar */}
        <form onSubmit={handleSearch} className="glass-card rounded-2xl p-6 border border-card-border mb-8 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wider">Expertise / Domain</label>
            <input
              type="text"
              placeholder="e.g. Machine Learning, Cloud"
              value={expertise}
              onChange={(e) => setExpertise(e.target.value)}
              className="w-full rounded-lg bg-background/50 border border-card-border px-3.5 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex gap-2 md:col-span-2">
            <button
              type="submit"
              className="flex-1 rounded-lg bg-primary hover:bg-primary-hover py-1.5 text-sm font-semibold text-white cursor-pointer"
            >
              Search expertise
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

        {loading ? (
          <p className="text-center text-muted">Updating listings...</p>
        ) : mentors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mentors.map((mentor) => (
              <div key={mentor.userId} className="glass-card rounded-2xl p-6 border border-card-border flex flex-col justify-between hover:border-primary/20 transition-all">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{mentor.name}</h3>
                    <span className="text-xs text-muted block mt-0.5">{mentor.designation} at {mentor.organization}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-muted block font-semibold uppercase tracking-wider">Expertise Domains</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {mentor.expertise.map((exp) => (
                        <span key={exp} className="text-[9px] bg-accent/10 border border-accent/20 text-accent px-1.5 py-0.5 rounded">
                          {exp}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-muted block font-semibold uppercase tracking-wider">Biography</span>
                    <p className="text-xs text-muted leading-relaxed mt-1 line-clamp-3">
                      {mentor.bio || 'No biography details provided.'}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-card-border/50 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted">Teams capacity:</span>
                      <span className="font-semibold text-foreground">{mentor.currentLoad} / {mentor.capacity} guided</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-card-border flex items-center justify-between gap-4">
                  <div className="flex gap-2">
                    {mentor.linkedinUrl && (
                      <a href={mentor.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-muted hover:text-foreground">
                        LinkedIn
                      </a>
                    )}
                  </div>
                  <button
                    disabled={mentor.currentLoad >= mentor.capacity}
                    onClick={() => alert(`Request to guide your team sent to ${mentor.name} (Simulated - Full requests flow will be deployed in Phase 2!)`)}
                    className="rounded-lg bg-primary hover:bg-primary-hover px-3 py-1.5 text-xs font-semibold text-white cursor-pointer disabled:opacity-50"
                  >
                    {mentor.currentLoad >= mentor.capacity ? 'Full' : 'Request'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted py-12">No verified mentors found matching these criteria.</p>
        )}
      </main>
    </div>
  );
}
