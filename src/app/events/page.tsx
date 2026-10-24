'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { m } from 'framer-motion';
import Image from 'next/image';
import { Calendar, ArrowRight, Search, Users, Sparkles } from 'lucide-react';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Aurora from '@/components/motion/Aurora';
import SpotlightCard from '@/components/motion/SpotlightCard';
import Reveal, { RevealGroup, RevealItem } from '@/components/motion/Reveal';
import SplitText from '@/components/motion/SplitText';
import { TiltCard } from '@/components/motion/Magnetic';
import { EASE } from '@/components/motion/tokens';
import { Container, Section } from '@/components/ui';

interface ArenaEvent {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string;
  bannerUrl: string | null;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  organizer?: string;
  teamSize?: string;
  category?: string;
}

function EventCard({ event }: { event: ArenaEvent }) {
  const startYear = event.startDate ? new Date(event.startDate).getFullYear() : null;
  const endYear = event.endDate ? new Date(event.endDate).getFullYear() : null;
  const dateRange =
    startYear && endYear && startYear !== endYear
      ? `${startYear} – ${endYear}`
      : startYear
        ? String(startYear)
        : null;

  return (
    <RevealItem>
      <TiltCard className="h-full">
        <SpotlightCard className="h-full rounded-3xl">
          <Link
            href={`/events/${event.slug}`}
            className="surface-claymorphic group relative flex h-full flex-col gap-5 overflow-hidden p-6 sm:p-8 transition-shadow duration-400"
          >
            {/* Top row: Status Badge & Team Size / Date */}
            <div className="flex items-center justify-between gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-caption font-bold ${
                  event.isActive
                    ? 'border-[rgba(114,56,61,0.24)] bg-[rgba(114,56,61,0.09)] text-primary'
                    : 'border-[rgba(209,199,189,0.75)] bg-[rgba(239,233,225,0.75)] text-muted'
                }`}
              >
                <span className={`size-1.5 rounded-full ${event.isActive ? 'bg-primary animate-pulse' : 'bg-muted'}`} />
                {event.isActive ? 'Active' : 'Closed'}
              </span>

              {event.teamSize ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(209,199,189,0.75)] bg-white/70 px-2.5 py-0.5 text-caption font-bold text-foreground">
                  <Users className="size-3 text-primary" />
                  {event.teamSize}
                </span>
              ) : dateRange ? (
                <span className="flex items-center gap-1 text-caption text-muted">
                  <Calendar className="size-3" />
                  {dateRange}
                </span>
              ) : null}
            </div>

            {/* Logo + Header */}
            <div className="flex items-start gap-4">
              {event.bannerUrl && (
                <div className="relative flex size-16 shrink-0 items-center justify-center rounded-2xl border border-[rgba(209,199,189,0.7)] bg-white/80 p-2 shadow-sm transition-transform duration-300 group-hover:scale-105">
                  <Image
                    src={event.bannerUrl}
                    alt={`${event.name} logo`}
                    width={56}
                    height={56}
                    className="size-full object-contain"
                  />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="text-heading text-foreground font-extrabold tracking-tight">
                  {event.name}
                </h2>
                {event.tagline && (
                  <p className="mt-1 text-xs font-semibold text-primary line-clamp-1">{event.tagline}</p>
                )}
                {event.organizer && (
                  <p className="mt-0.5 text-[11px] font-medium text-muted line-clamp-1">{event.organizer}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="flex-1">
              <p className="text-sm leading-relaxed text-muted line-clamp-4">
                {event.description}
              </p>
            </div>

            {/* Bottom Meta & Action */}
            <div className="pt-3 border-t border-[rgba(209,199,189,0.5)] flex items-center justify-between">
              {event.category ? (
                <span className="text-caption font-semibold text-muted flex items-center gap-1.5">
                  <Sparkles className="size-3 text-primary" />
                  {event.category.split('&')[0].trim()}
                </span>
              ) : (
                <span className="text-caption text-muted">Open Event</span>
              )}

              <span className="inline-flex items-center gap-2 text-label uppercase text-primary font-bold transition-all duration-300 group-hover:gap-3">
                Enter Event
                <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        </SpotlightCard>
      </TiltCard>
    </RevealItem>
  );
}

export default function EventsPage() {
  const [events, setEvents] = useState<ArenaEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/events')
      .then((r) => r.json())
      .then((d) => { if (active && d.success) setEvents(d.events); })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filtered = events.filter((e) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      e.name.toLowerCase().includes(q) ||
      (e.tagline ?? '').toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <Navbar />
      <main id="main" className="flex-1">
        {/* Hero */}
        <section className="section-taupe relative overflow-hidden pb-section-compact pt-[calc(var(--nav-h)+3rem)]">
          <Aurora variant="warm" spotlight />
          <div aria-hidden className="grid-lines absolute inset-0" />
          <Container width="wide" className="relative">
            <Reveal>
              <span className="text-label uppercase text-primary">Arena · GL Bajaj</span>
              <h1 className="mt-4 text-display text-foreground">
                <SplitText text="All Events" as="span" mode="word" delay={0.1} />
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
                Browse every hackathon event on Arena. Select an event to view its timeline,
                tracks, and form your team.
              </p>
            </Reveal>

            {/* Search */}
            <m.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6, ease: EASE.outExpo }}
              className="relative mt-8 max-w-md"
            >
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <input
                type="search"
                placeholder="Search events…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-xl border border-[rgba(209,199,189,0.8)] bg-[rgba(248,246,242,0.8)] py-2.5 pl-10 pr-4 text-sm text-foreground outline-none placeholder:text-muted focus:border-primary focus:shadow-[0_0_0_4px_rgba(114,56,61,0.1)] focus:bg-white/90 transition-all"
              />
            </m.div>
          </Container>
        </section>

        {/* Events grid */}
        <Section tone="mist" rhythm="spacious">
          <Container width="wide">
            {loading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-72 rounded-3xl skeleton-shimmer" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-4 py-20 text-center">
                <div className="flex size-16 items-center justify-center rounded-2xl border border-[rgba(209,199,189,0.6)] bg-white/40">
                  <Calendar className="size-7 text-muted" />
                </div>
                <p className="text-sm text-muted">
                  {query ? 'No events match your search.' : 'No active events at the moment. Check back soon.'}
                </p>
              </div>
            ) : (
              <RevealGroup stagger={0.08} className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </RevealGroup>
            )}
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}