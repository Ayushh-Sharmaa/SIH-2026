'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import Icon from '@/components/ui/Icon';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import {
  Aurora,
  Field,
  SelectField,
  PremiumButton,
  Reveal,
  SplitText,
  DURATION,
  EASE,
} from '@/components/motion';

interface Track {
  id: string;
  problemStatementCode: string;
  name: string;
}

const STEPS = [
  { label: 'Name your team', hint: 'Something your six can rally behind.' },
  { label: 'Pick a track', hint: 'You can change this until the roster locks.' },
  { label: 'Leave a contact', hint: 'Teammates reach the leader through this.' },
];

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
          if (data.tracks.length > 0) setTrackId(data.tracks[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchTracks();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
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

  const filled = [name, trackId, whatsapp].filter(Boolean).length;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />

      <main id="main" className="relative flex-1 overflow-hidden">
        <Aurora variant="rose" spotlight />

        {/* asymmetric split — copy rail left, form right */}
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[0.85fr_1fr] lg:gap-16 lg:py-20 lg:px-8">
          {/* narrative rail */}
          <div className="lg:pt-6">
            <Reveal direction="none" blur={false}>
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
                Step one of the journey
              </span>
            </Reveal>

            <SplitText
              as="h1"
              text="Form your team."
              className="mt-3 text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-5xl"
              delay={0.08}
            />

            <Reveal delay={0.28} className="mt-4">
              <p className="max-w-md text-sm leading-relaxed text-foreground/65">
                Establish your team profile, choose a problem statement track, and leave a way for
                teammates to reach you. You become the team leader.
              </p>
            </Reveal>

            <ol className="mt-10 space-y-5">
              {STEPS.map((s, i) => (
                <Reveal key={s.label} delay={0.4 + i * 0.09} direction="right">
                  <li className="flex gap-4">
                    <span
                      className={`grid size-7 shrink-0 place-items-center rounded-full border text-[11px] font-black transition-colors duration-300 ${
                        i < filled
                          ? 'border-transparent bg-primary text-[#FBF9F6]'
                          : 'border-[rgba(172,156,141,0.6)] bg-[rgba(239,233,225,0.7)] text-muted'
                      }`}
                    >
                      {i < filled ? <Icon icon={Check} size="xs" strokeWidth={3} /> : i + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-foreground">{s.label}</span>
                      <span className="mt-0.5 block text-xs text-foreground/55">{s.hint}</span>
                    </span>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>

          {/* form card */}
          <Reveal direction="left" scale delay={0.12}>
            <div className="surface-raised rounded-3xl p-7 sm:p-9">
              <div className="mb-7">
                <div className="mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
                  <span>Team details</span>
                  <span>{filled} / 3</span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-[rgba(209,199,189,0.6)]">
                  <motion.div
                    animate={{ scaleX: filled / 3 }}
                    initial={{ scaleX: 0 }}
                    transition={{ duration: DURATION.card, ease: EASE.outExpo }}
                    style={{ transformOrigin: 'left' }}
                    className="h-full rounded-full bg-gradient-to-r from-[#AC9C8D] to-primary"
                  />
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <Field
                  label="Team name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  hint="e.g. Code Warriors"
                />

                <SelectField
                  label="Problem statement track"
                  value={trackId}
                  onChange={(e) => setTrackId(e.target.value)}
                >
                  {tracks.map((track) => (
                    <option key={track.id} value={track.id}>
                      {track.problemStatementCode} — {track.name}
                    </option>
                  ))}
                </SelectField>

                <Field
                  label="Leader's WhatsApp number"
                  type="tel"
                  required
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  error={error || undefined}
                  hint="e.g. +91 99999 99999"
                />

                <div className="pt-2">
                  <PremiumButton
                    type="submit"
                    size="lg"
                    loading={loading}
                    className="w-full"
                    magnetic={false}
                  >
                    {loading ? 'Creating team…' : 'Form team'}
                  </PremiumButton>
                </div>

                <p className="text-center text-[11px] text-foreground/50">
                  Already have a team? Head back to your{' '}
                  <a href="/dashboard" className="font-bold text-primary hover:underline">
                    dashboard
                  </a>
                  .
                </p>
              </form>
            </div>
          </Reveal>
        </div>
      </main>

      <Footer />
    </div>
  );
}
