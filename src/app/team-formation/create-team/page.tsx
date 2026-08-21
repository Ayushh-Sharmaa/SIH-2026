'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { m } from 'framer-motion';
import { Check, Upload, ChevronDown, ChevronUp } from 'lucide-react';
import Icon from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Container } from '@/components/ui';
import {
  Aurora,
  Field,
  SelectField,
  PremiumButton,
  Reveal,
  SplitText,
  DURATION,
  EASE,
  SPRING,
} from '@/components/motion';
import { logger } from '@/lib/logger';
import { userFacingMessage } from '@/lib/errors';
import { QueryClient } from '@/lib/queryClient';

interface Track {
  id: string;
  problemStatementCode: string;
  name: string;
}

const STEPS = [
  { label: 'Name your team', hint: 'Something your six can rally behind.' },
  { label: 'Upload logo', hint: 'Optional. Initials used as fallback.' },
  { label: 'Pick a track', hint: 'Predefined SIH track or custom statement.' },
  { label: 'Leave a contact & mentor', hint: 'How to reach you and optional guide.' },
];

export default function CreateTeamPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [name, setName] = useState('');
  const [trackId, setTrackId] = useState('');
  const [secondaryTrackId, setSecondaryTrackId] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Custom problem statement state
  const [customPsCode, setCustomPsCode] = useState('');
  const [customPsName, setCustomPsName] = useState('');
  const [customPsCategory, setCustomPsCategory] = useState('Software');

  // Custom secondary problem statement state
  const [customSecondaryPsCode, setCustomSecondaryPsCode] = useState('');
  const [customSecondaryPsName, setCustomSecondaryPsName] = useState('');
  const [customSecondaryPsCategory, setCustomSecondaryPsCategory] = useState('Software');

  // Custom mentor state
  const [customMentorName, setCustomMentorName] = useState('');
  const [customMentorDesignation, setCustomMentorDesignation] = useState('');
  const [customMentorMobile, setCustomMentorMobile] = useState('');
  const [customMentorEmail, setCustomMentorEmail] = useState('');
  const [showExternalMentor, setShowExternalMentor] = useState(false);

  useEffect(() => {
    async function fetchTracks() {
      try {
        const data = await QueryClient.fetch<{ success: boolean; tracks: Track[] }>(
          'sih_theme_list',
          async () => {
            const res = await fetch('/api/tracks');
            return res.json();
          },
          { ttlMs: 300_000 }
        );
        if (data?.success && data.tracks) {
          setTracks(data.tracks);
          if (data.tracks.length > 0) {
            setTrackId(data.tracks[0].id);
            if (data.tracks.length > 1) {
              setSecondaryTrackId(data.tracks[1].id);
            }
          }
        }
      } catch (err) {
        logger.error('Fetch tracks failed', err);
        toast('Could not load problem statement tracks. Please refresh.', 'error');
      }
    }
    fetchTracks();
  }, [toast]);

  const handleLogoUpload = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) {
      toast('Logo must be smaller than 1.5 MB.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setLogoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!trackId) {
      setError('Primary Theme is mandatory. Please select a primary theme.');
      return;
    }

    if (!secondaryTrackId || secondaryTrackId === 'none') {
      setError('Secondary Theme is mandatory. Please select a secondary theme.');
      return;
    }

    if (trackId === secondaryTrackId && trackId !== 'custom') {
      setError('Primary and Secondary Themes must be different.');
      return;
    }

    setLoading(true);

    if (trackId === 'custom') {
      if (!customPsCode.trim()) {
        setError('Primary Custom Theme ID is required.');
        setLoading(false);
        return;
      }
      if (!customPsName.trim()) {
        setError('Primary Custom Theme Title is required.');
        setLoading(false);
        return;
      }
    }

    if (secondaryTrackId === 'custom') {
      if (!customSecondaryPsCode.trim()) {
        setError('Secondary Custom Theme ID is required.');
        setLoading(false);
        return;
      }
      if (!customSecondaryPsName.trim()) {
        setError('Secondary Custom Theme Title is required.');
        setLoading(false);
        return;
      }
    }

    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          trackId,
          secondaryTrackId: secondaryTrackId === 'none' ? undefined : secondaryTrackId,
          whatsapp: whatsapp.trim(),
          logoUrl: logoUrl || undefined,
          customPsCode: trackId === 'custom' ? customPsCode.trim() : undefined,
          customPsName: trackId === 'custom' ? customPsName.trim() : undefined,
          customPsCategory: trackId === 'custom' ? customPsCategory : undefined,
          customSecondaryPsCode: secondaryTrackId === 'custom' ? customSecondaryPsCode.trim() : undefined,
          customSecondaryPsName: secondaryTrackId === 'custom' ? customSecondaryPsName.trim() : undefined,
          customSecondaryPsCategory: secondaryTrackId === 'custom' ? customSecondaryPsCategory : undefined,
          customMentorName: customMentorName.trim() || undefined,
          customMentorDesignation: customMentorDesignation.trim() || undefined,
          customMentorMobile: customMentorMobile.trim() || undefined,
          customMentorEmail: customMentorEmail.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create team');
      router.push('/dashboard');
    } catch (err) {
      setError(userFacingMessage(err, 'An error occurred.'));
    } finally {
      setLoading(false);
    }
  };

  const initials = name
    ? name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'NS';

  const filled = [
    name,
    trackId,
    whatsapp,
    logoUrl || 'hasInitials',
  ].filter(Boolean).length;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />

      <main id="main" className="relative flex-1 overflow-visible">
        <Aurora variant="rose" spotlight />

        <Container width="content" className="grid gap-10 py-14 lg:grid-cols-[0.85fr_1fr] lg:gap-16 lg:py-20">
          {/* Narrative rail */}
          <div className="lg:pt-6">
            <Reveal direction="none" blur={false}>
              <span className="text-label uppercase text-primary">
                Step one of the journey
              </span>
            </Reveal>

            <SplitText
              as="h1"
              text="Form your team."
              className="mt-3 text-title text-foreground"
              delay={0.08}
            />

            <Reveal delay={0.28} className="mt-4">
              <p className="max-w-md text-sm leading-relaxed text-body">
                Establish your team profile, upload a custom logo or use default initials, select your target track, and optionally add mentor details.
              </p>
            </Reveal>

            <ol className="mt-10 space-y-5">
              {STEPS.map((s, i) => (
                <Reveal key={s.label} delay={0.4 + i * 0.09} direction="right">
                  <li className="flex gap-4">
                    <span
                      className={`grid size-7 shrink-0 place-items-center rounded-full border text-caption font-black transition-colors duration-300 ${
                        i < filled
                          ? 'border-transparent bg-primary text-on-accent'
                          : 'border-[rgba(172,156,141,0.6)] bg-[rgba(239,233,225,0.7)] text-muted'
                      }`}
                    >
                      {i < filled ? <Icon icon={Check} size="xs" strokeWidth={3} /> : i + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-foreground">{s.label}</span>
                      <span className="mt-0.5 block text-xs text-muted">{s.hint}</span>
                    </span>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>

          {/* Form card */}
          <Reveal direction="left" scale delay={0.12}>
            <div className="surface-raised rounded-3xl p-7 sm:p-9">
              <div className="mb-7">
                <div className="mb-2 flex items-center justify-between text-label uppercase text-muted">
                  <span>Team details</span>
                  <span>{filled} / 4</span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-[rgba(209,199,189,0.6)]">
                  <m.div
                    animate={{ scaleX: filled / 4 }}
                    initial={{ scaleX: 0 }}
                    transition={{ duration: DURATION.card, ease: EASE.outExpo }}
                    style={{ transformOrigin: 'left' }}
                    className="h-full rounded-full bg-gradient-to-r from-[#AC9C8D] to-primary"
                  />
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <Field
                  label="Team name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  hint="e.g. Nexa Sphere"
                />

                {/* Team Logo */}
                <div className="space-y-2">
                  <span className="text-label uppercase text-muted">Team logo</span>
                  <div className="flex flex-col items-center gap-5 rounded-2xl border border-[rgba(209,199,189,0.8)] bg-[rgba(239,233,225,0.5)] p-4 sm:flex-row">
                    <div className="size-20 shrink-0 overflow-hidden rounded-2xl border-2 border-[rgba(114,56,61,0.5)] shadow-[0_10px_30px_rgba(50,45,41,0.14)] bg-gradient-to-br from-[rgba(114,56,61,0.1)] to-[rgba(114,56,61,0.02)] flex items-center justify-center font-black text-primary text-xl">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="size-full object-cover" />
                      ) : (
                        initials
                      )}
                    </div>
                    <div className="flex-1 space-y-2 text-center sm:text-left">
                      <p className="text-xs text-muted">
                        Upload custom logo. Fallback shows team initials text (e.g. &ldquo;{initials}&rdquo;).
                      </p>
                      <div className="flex justify-center gap-2 sm:justify-start">
                        <label className="cursor-pointer rounded-lg border border-[rgba(114,56,61,0.3)] bg-[rgba(114,56,61,0.08)] px-3 py-1.5 text-caption font-bold text-primary hover:bg-[rgba(114,56,61,0.15)] transition-colors">
                          Upload logo
                          <input
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={(e) => handleLogoUpload(e.target.files?.[0])}
                          />
                        </label>
                        {logoUrl && (
                          <button
                            type="button"
                            onClick={() => setLogoUrl('')}
                            className="rounded-lg border border-[rgba(209,199,189,0.85)] bg-[rgba(248,246,242,0.7)] px-3 py-1.5 text-caption font-bold text-body hover:text-primary transition-colors"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Theme Selection */}
                <div className="space-y-4">
                  <SelectField
                    label="Primary Theme"
                    value={trackId}
                    onChange={(e) => setTrackId(e.target.value)}
                  >
                    {tracks.map((track) => (
                      <option key={track.id} value={track.id}>
                        {track.problemStatementCode} — {track.name}
                      </option>
                    ))}
                    <option value="custom">Other / Custom Theme</option>
                  </SelectField>

                  {trackId === 'custom' && (
                    <m.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4 rounded-2xl border border-[rgba(209,199,189,0.8)] bg-[rgba(239,233,225,0.45)] p-4"
                    >
                      <h3 className="text-xs font-bold uppercase text-muted tracking-wider">Primary Custom Theme Details</h3>
                      <Field
                        label="Theme / Problem Statement ID"
                        required
                        value={customPsCode}
                        onChange={(e) => setCustomPsCode(e.target.value)}
                        hint="e.g. SIH1540"
                      />
                      <Field
                        label="Theme Name / Title"
                        required
                        value={customPsName}
                        onChange={(e) => setCustomPsName(e.target.value)}
                        hint="e.g. Smart Agri Solutions"
                      />
                      <SelectField
                        label="Theme Category"
                        value={customPsCategory}
                        onChange={(e) => setCustomPsCategory(e.target.value)}
                      >
                        <option value="Software">Software</option>
                        <option value="Hardware">Hardware</option>
                        <option value="Software/Hardware">Software/Hardware</option>
                      </SelectField>
                    </m.div>
                  )}

                  <SelectField
                    label="Secondary Theme"
                    value={secondaryTrackId}
                    onChange={(e) => setSecondaryTrackId(e.target.value)}
                  >
                    {tracks.map((track) => (
                      <option key={track.id} value={track.id}>
                        {track.problemStatementCode} — {track.name}
                      </option>
                    ))}
                    <option value="custom">Other / Custom Theme</option>
                  </SelectField>

                  {secondaryTrackId === 'custom' && (
                    <m.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4 rounded-2xl border border-[rgba(209,199,189,0.8)] bg-[rgba(239,233,225,0.45)] p-4"
                    >
                      <h3 className="text-xs font-bold uppercase text-muted tracking-wider">Secondary Custom Theme Details</h3>
                      <Field
                        label="Theme / Problem Statement ID"
                        required
                        value={customSecondaryPsCode}
                        onChange={(e) => setCustomSecondaryPsCode(e.target.value)}
                        hint="e.g. SIH1541"
                      />
                      <Field
                        label="Theme Name / Title"
                        required
                        value={customSecondaryPsName}
                        onChange={(e) => setCustomSecondaryPsName(e.target.value)}
                        hint="e.g. Secondary Tech Solution"
                      />
                      <SelectField
                        label="Theme Category"
                        value={customSecondaryPsCategory}
                        onChange={(e) => setCustomSecondaryPsCategory(e.target.value)}
                      >
                        <option value="Software">Software</option>
                        <option value="Hardware">Hardware</option>
                        <option value="Software/Hardware">Software/Hardware</option>
                      </SelectField>
                    </m.div>
                  )}
                </div>

                {/* Team Contact */}
                <Field
                  label="Leader's WhatsApp number"
                  type="tel"
                  required
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  hint="e.g. +91 99999 99999"
                />

                {/* External Mentor (Optional) */}
                <div className="rounded-2xl border border-[rgba(209,199,189,0.8)] bg-[rgba(239,233,225,0.45)] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowExternalMentor(!showExternalMentor)}
                    className="flex w-full items-center justify-between p-4 text-left outline-none hover:bg-[rgba(209,199,189,0.1)] transition-colors"
                  >
                    <span className="text-xs font-bold uppercase text-muted tracking-wider">External Mentor Details (Optional)</span>
                    <Icon icon={showExternalMentor ? ChevronUp : ChevronDown} size="sm" className="text-muted" />
                  </button>

                  {showExternalMentor && (
                    <m.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="p-4 pt-0 space-y-4 border-t border-[rgba(209,199,189,0.3)]"
                    >
                      <Field
                        label="Mentor Name"
                        value={customMentorName}
                        onChange={(e) => setCustomMentorName(e.target.value)}
                        hint="e.g. Dr. Jane Doe"
                      />
                      <Field
                        label="Mentor Designation"
                        value={customMentorDesignation}
                        onChange={(e) => setCustomMentorDesignation(e.target.value)}
                        hint="e.g. Technical Director"
                      />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field
                          label="Mentor Mobile No"
                          type="tel"
                          value={customMentorMobile}
                          onChange={(e) => setCustomMentorMobile(e.target.value)}
                          hint="e.g. 9999988888"
                        />
                        <Field
                          label="Mentor Email"
                          type="email"
                          value={customMentorEmail}
                          onChange={(e) => setCustomMentorEmail(e.target.value)}
                          hint="e.g. mentor@domain.com"
                        />
                      </div>
                    </m.div>
                  )}
                </div>

                {error && (
                  <p className="text-sm font-bold text-primary bg-[rgba(114,56,61,0.08)] border border-[rgba(114,56,61,0.2)] rounded-xl p-3">
                    {error}
                  </p>
                )}

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

                <p className="text-center text-caption text-muted">
                  Already have a team? Head back to your{' '}
                  <a href="/dashboard" className="font-bold text-primary hover:underline">
                    dashboard
                  </a>
                  .
                </p>
              </form>
            </div>
          </Reveal>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
