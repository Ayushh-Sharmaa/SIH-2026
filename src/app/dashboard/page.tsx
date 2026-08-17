/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useCallback, useEffect, useState, type ReactNode, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, m } from 'framer-motion';
import Image from 'next/image';
import {
  ArrowUpRight,
  BadgeCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Code2,
  Crown,
  FlaskConical,
  Palette,
  PenLine,
  Terminal,
  Users,
  UserCheck,
  MailOpen,
  Calendar,
  Sparkles,
  UserX,
  X,
  Edit2,
  Trash2,
  Lock,
  Unlock,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Layers,
  FileText,
  Globe,
  Search,
  Plus,
  Link as LinkIcon,
  type LucideIcon,
} from 'lucide-react';
import Icon from '@/components/ui/Icon';
import { Container, EmptyState, DashboardSkeleton } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ViewingAsBanner from '@/components/layout/ViewingAsBanner';
import { useEscapeKey, useFocusTrap, useScrollLock } from '@/hooks/useFocusTrap';
import {
  Aurora,
  Counter,
  PremiumButton,
  Reveal,
  RevealGroup,
  RevealItem,
  SpotlightCard,
  SplitText,
  TiltCard,
  DURATION,
  EASE,
  SPRING,
} from '@/components/motion';
import { QueryClient } from '@/lib/queryClient';
import { logger } from '@/lib/logger';

const STANDARD_SKILLS = [
  'React', 'Node.js', 'Python', 'JavaScript', 'TypeScript', 'Next.js', 'HTML', 'CSS',
  'Tailwind', 'Vue', 'Angular', 'Express', 'Django', 'Go', 'Java', 'Spring Boot',
  'PostgreSQL', 'MongoDB', 'Docker', 'Figma', 'Git', 'Machine Learning', 'REST APIs',
  'Cloud Computing', 'SQL', 'Flutter', 'React Native', 'AWS', 'Kubernetes', 'Cybersecurity',
];

const SOFT_SKILLS_POOL = [
  'PPT Making',
  'Public Speaking/Presenting',
  'Technical Writing',
  'UI/UX Design',
  'Video Editing',
  'Management',
];

const LANGUAGE_POOL = ['English', 'Hindi', 'Punjabi', 'Bengali', 'Tamil', 'Telugu', 'Marathi', 'Gujarati'];

const AVATAR_PRESETS: Record<string, { icon: LucideIcon; wash: string }> = {
  hacker: { icon: Terminal, wash: 'from-[#AC9C8D] to-[#D1C7BD]' },
  developer: { icon: Code2, wash: 'from-[#D1C7BD] to-[#EFE9E1]' },
  designer: { icon: Palette, wash: 'from-[#D9D9D9] to-[#AC9C8D]' },
  scientist: { icon: FlaskConical, wash: 'from-[#EFE9E1] to-[#D1C7BD]' },
  manager: { icon: Crown, wash: 'from-[#AC9C8D] to-[#D9D9D9]' },
  writer: { icon: PenLine, wash: 'from-[#D1C7BD] to-[#D9D9D9]' },
};

function Avatar({
  avatarUrl,
  name,
  className = 'size-12',
}: {
  avatarUrl?: string | null;
  name: string;
  className?: string;
}) {
  if (avatarUrl?.startsWith('data:image/') || avatarUrl?.startsWith('http')) {
    return (
      <div className={`relative shrink-0 overflow-hidden rounded-2xl bg-[rgba(248,246,242,0.8)] border border-[rgba(209,199,189,0.7)] ${className}`}>
        <Image
          unoptimized
          src={avatarUrl}
          alt={`${name}'s profile`}
          fill
          sizes="96px"
          className="object-cover"
        />
      </div>
    );
  }

  const preset = AVATAR_PRESETS[avatarUrl || 'developer'] || AVATAR_PRESETS.developer;
  return (
    <span
      role="img"
      aria-label={`${name}'s profile`}
      className={`shrink-0 flex items-center justify-center rounded-2xl bg-gradient-to-br text-body ${preset.wash} ${className}`}
    >
      <Icon icon={preset.icon} size="md" />
    </span>
  );
}

function Label({ children }: { children: ReactNode }) {
  return (
    <span className="block text-label uppercase text-muted">
      {children}
    </span>
  );
}

function DeckStat({
  value,
  label,
  text,
}: {
  value?: number;
  label: string;
  text?: string;
}) {
  return (
    <RevealItem className="min-w-0">
      <TiltCard intensity={5} className="h-full">
        <SpotlightCard className="h-full rounded-2xl" intensity={0.14}>
          <div className="surface-raised h-full rounded-2xl px-4 py-3.5 border border-[rgba(209,199,189,0.7)] shadow-e1">
            <div className="truncate text-2xl font-extrabold capitalize tracking-tight text-foreground sm:text-[1.7rem]">
              {text ?? <Counter to={value ?? 0} duration={1.4} />}
            </div>
            <div className="mt-1 truncate text-label uppercase text-muted">
              {label}
            </div>
          </div>
        </SpotlightCard>
      </TiltCard>
    </RevealItem>
  );
}

// -------------------------------------------------------------
// PROGRESSIVE PROFILE MODALS
// -------------------------------------------------------------

/** 1. Personal Information Modal */
function PersonalInfoModal({
  initialData,
  onClose,
  onSuccess,
}: {
  initialData: any;
  onClose: () => void;
  onSuccess: (updated: any) => void;
}) {
  const { toast } = useToast();
  const [name, setName] = useState(initialData?.name || '');
  const [gender, setGender] = useState(initialData?.gender || '');
  const [rollNo, setRollNo] = useState(initialData?.rollNo || '');
  const [year, setYear] = useState(initialData?.year || '2nd Year');
  const [branch, setBranch] = useState(initialData?.branch || 'B.Tech CSE');
  const [section, setSection] = useState(initialData?.section || '');
  const [category, setCategory] = useState(initialData?.category || '');
  const [contact, setContact] = useState(initialData?.contact || '');
  const [avatarUrl, setAvatarUrl] = useState(initialData?.avatarUrl || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const panelRef = useFocusTrap<HTMLDivElement>(true);
  useScrollLock(true);
  useEscapeKey(true, onClose);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1_500_000) {
      setError('Please choose a photo smaller than 1.5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarUrl(String(reader.result));
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Full name is required.');
      return;
    }
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/profile/personal', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          gender: gender || null,
          rollNo: rollNo.trim() || null,
          year,
          branch,
          section: section.trim() || null,
          category: category || null,
          contact: contact.trim() || null,
          avatarUrl: avatarUrl || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save personal information');

      toast('Personal information updated successfully.', 'success');
      onSuccess(data.personal);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save personal info.');
    } finally {
      setSaving(false);
    }
  };

  const control = 'w-full rounded-xl border border-[rgba(209,199,189,0.8)] bg-[rgba(248,246,242,0.7)] px-3.5 py-2 text-sm text-foreground outline-none focus:border-primary';

  return (
    <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-modal flex items-center justify-center p-4">
      <div aria-hidden onClick={onClose} className="absolute inset-0 bg-[rgb(50_45_41/0.34)] backdrop-blur-md" />
      <m.div ref={panelRef} role="dialog" aria-modal="true" tabIndex={-1} initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="surface-overlay relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl p-6 text-foreground sm:p-8 border border-[rgba(209,199,189,0.6)]">
        <div className="flex items-center justify-between border-b border-[rgba(209,199,189,0.5)] pb-4">
          <div>
            <span className="text-label uppercase tracking-wider text-primary font-bold">Tile 01</span>
            <h3 className="mt-0.5 text-feature font-extrabold text-foreground">Edit Personal Information</h3>
          </div>
          <button onClick={onClose} aria-label="Close dialog" className="text-muted hover:text-foreground">
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && <div className="rounded-xl border border-[rgba(114,56,61,0.3)] bg-[rgba(114,56,61,0.08)] p-3 text-xs font-bold text-primary">{error}</div>}

          {/* Photo & Name */}
          <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-[rgba(248,246,242,0.6)] border border-[rgba(209,199,189,0.6)]">
            <Avatar avatarUrl={avatarUrl} name={name || 'User'} className="size-14" />
            <div className="flex-1">
              <span className="text-label uppercase text-muted block mb-1">Profile Photo</span>
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[rgba(209,199,189,0.8)] bg-white/60 px-3 py-1.5 text-xs font-semibold text-body hover:border-primary">
                <span>Upload New Photo</span>
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <Label>Full Name *</Label>
              <input required value={name} onChange={(e) => setName(e.target.value)} className={`${control} mt-1`} />
            </label>

            <label>
              <Label>Gender</Label>
              <select value={gender} onChange={(e) => setGender(e.target.value)} className={`${control} mt-1`}>
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <Label>University Roll Number</Label>
              <input value={rollNo} onChange={(e) => setRollNo(e.target.value)} placeholder="e.g. 2100970100045" className={`${control} mt-1`} />
            </label>

            <label>
              <Label>Year of Study *</Label>
              <select required value={year} onChange={(e) => setYear(e.target.value)} className={`${control} mt-1`}>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <Label>Course / Branch *</Label>
              <input required value={branch} onChange={(e) => setBranch(e.target.value)} placeholder="e.g. B.Tech CSE" className={`${control} mt-1`} />
            </label>

            <label>
              <Label>Section</Label>
              <input value={section} onChange={(e) => setSection(e.target.value)} placeholder="e.g. A, B, C" className={`${control} mt-1`} />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <Label>Category</Label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={`${control} mt-1`}>
                <option value="">Select category</option>
                <option value="General">General</option>
                <option value="OBC">OBC</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
                <option value="EWS">EWS</option>
              </select>
            </label>

            <label>
              <Label>Contact Number (Mobile)</Label>
              <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="+91 9876543210" className={`${control} mt-1`} />
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[rgba(209,199,189,0.5)]">
            <PremiumButton type="button" variant="glass" size="sm" onClick={onClose} disabled={saving}>
              Cancel
            </PremiumButton>
            <PremiumButton type="submit" size="sm" loading={saving}>
              Save Personal Info
            </PremiumButton>
          </div>
        </form>
      </m.div>
    </m.div>
  );
}

/** 2. Skills & Fluency Modal */
function SkillsFluencyModal({
  initialData,
  onClose,
  onSuccess,
}: {
  initialData: any;
  onClose: () => void;
  onSuccess: (updated: any) => void;
}) {
  const { toast } = useToast();
  const [skills, setSkills] = useState<string[]>(initialData?.skills || []);
  const [softSkills, setSoftSkills] = useState<string[]>(initialData?.softSkills || []);
  const [languages, setLanguages] = useState<string[]>(initialData?.languages || ['English (Fluent)', 'Hindi (Fluent)']);
  const [customSkill, setCustomSkill] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const panelRef = useFocusTrap<HTMLDivElement>(true);
  useScrollLock(true);
  useEscapeKey(true, onClose);

  const toggleSkill = (sk: string) => {
    setSkills((prev) => (prev.includes(sk) ? prev.filter((s) => s !== sk) : [...prev, sk]));
  };

  const addCustomSkill = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const clean = customSkill.trim();
    if (clean && !skills.includes(clean)) {
      setSkills((prev) => [...prev, clean]);
      setCustomSkill('');
    }
  };

  const toggleSoftSkill = (ss: string) => {
    setSoftSkills((prev) => (prev.includes(ss) ? prev.filter((s) => s !== ss) : [...prev, ss]));
  };

  const toggleLanguage = (lang: string) => {
    const existing = languages.find((l) => l.startsWith(lang));
    if (existing) {
      setLanguages((prev) => prev.filter((l) => !l.startsWith(lang)));
    } else {
      setLanguages((prev) => [...prev, `${lang} (Fluent)`]);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/profile/skills', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills, softSkills, languages }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save skills');

      toast('Skills & fluency updated successfully.', 'success');
      onSuccess(data.skills);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save skills.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-modal flex items-center justify-center p-4">
      <div aria-hidden onClick={onClose} className="absolute inset-0 bg-[rgb(50_45_41/0.34)] backdrop-blur-md" />
      <m.div ref={panelRef} role="dialog" aria-modal="true" tabIndex={-1} initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="surface-overlay relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl p-6 text-foreground sm:p-8 border border-[rgba(209,199,189,0.6)]">
        <div className="flex items-center justify-between border-b border-[rgba(209,199,189,0.5)] pb-4">
          <div>
            <span className="text-label uppercase tracking-wider text-primary font-bold">Tile 02</span>
            <h3 className="mt-0.5 text-feature font-extrabold text-foreground">Edit Skills & Fluency</h3>
          </div>
          <button onClick={onClose} aria-label="Close dialog" className="text-muted hover:text-foreground">
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {error && <div className="rounded-xl border border-[rgba(114,56,61,0.3)] bg-[rgba(114,56,61,0.08)] p-3 text-xs font-bold text-primary">{error}</div>}

          {/* Technical Skills */}
          <div>
            <Label>Technical Skills (Select or Add)</Label>
            <div className="flex gap-2 mt-2 mb-3">
              <input
                type="text"
                value={customSkill}
                onChange={(e) => setCustomSkill(e.target.value)}
                onKeyDown={addCustomSkill}
                placeholder="Add custom skill (e.g. Solidity, Three.js)"
                className="flex-1 rounded-xl border border-[rgba(209,199,189,0.8)] bg-[rgba(248,246,242,0.7)] px-3.5 py-1.5 text-sm text-foreground outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={addCustomSkill}
                className="px-3 py-1.5 rounded-xl border border-[rgba(209,199,189,0.8)] bg-white text-xs font-semibold text-body hover:border-primary"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2.5 rounded-2xl bg-[rgba(248,246,242,0.6)] border border-[rgba(209,199,189,0.6)]">
              {STANDARD_SKILLS.map((sk) => {
                const selected = skills.includes(sk);
                return (
                  <button
                    key={sk}
                    type="button"
                    onClick={() => toggleSkill(sk)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                      selected
                        ? 'bg-primary text-on-accent border border-transparent shadow-xs'
                        : 'border border-[rgba(209,199,189,0.8)] bg-white/70 text-body hover:border-primary'
                    }`}
                  >
                    {selected ? `✓ ${sk}` : `+ ${sk}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Soft Skills */}
          <div>
            <Label>Soft Skills</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {SOFT_SKILLS_POOL.map((ss) => {
                const selected = softSkills.includes(ss);
                return (
                  <button
                    key={ss}
                    type="button"
                    onClick={() => toggleSoftSkill(ss)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                      selected
                        ? 'bg-foreground text-on-accent border border-transparent'
                        : 'border border-[rgba(209,199,189,0.8)] bg-white/70 text-body hover:border-foreground'
                    }`}
                  >
                    {selected ? `✓ ${ss}` : `+ ${ss}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Languages */}
          <div>
            <Label>Spoken Languages</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {LANGUAGE_POOL.map((lang) => {
                const selected = languages.some((l) => l.startsWith(lang));
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => toggleLanguage(lang)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                      selected
                        ? 'bg-clay text-ink border border-transparent font-bold'
                        : 'border border-[rgba(209,199,189,0.8)] bg-white/70 text-body hover:border-clay'
                    }`}
                  >
                    {selected ? `✓ ${lang}` : `+ ${lang}`}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[rgba(209,199,189,0.5)]">
            <PremiumButton type="button" variant="glass" size="sm" onClick={onClose} disabled={saving}>
              Cancel
            </PremiumButton>
            <PremiumButton type="submit" size="sm" loading={saving}>
              Save Skills & Fluency
            </PremiumButton>
          </div>
        </form>
      </m.div>
    </m.div>
  );
}

/** 3. Themes & Links Modal */
function ThemesLinksModal({
  initialData,
  onClose,
  onSuccess,
}: {
  initialData: any;
  onClose: () => void;
  onSuccess: (updated: any) => void;
}) {
  const { toast } = useToast();
  const initialTracks = Array.isArray(initialData?.trackInterest)
    ? initialData.trackInterest
    : Array.isArray(initialData?.tracksDetailed)
    ? initialData.tracksDetailed.map((t: any) => t.id)
    : Array.isArray(initialData?.tracks)
    ? initialData.tracks.map((t: any) => (typeof t === 'string' ? t : t.id))
    : [];
  const [selectedTracks, setSelectedTracks] = useState<string[]>(initialTracks);
  const [githubUrl, setGithubUrl] = useState(initialData?.githubUrl || '');
  const [linkedinUrl, setLinkedinUrl] = useState(initialData?.linkedinUrl || '');
  const [resumeUrl, setResumeUrl] = useState(initialData?.resumeUrl || '');
  const [tracks, setTracks] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const panelRef = useFocusTrap<HTMLDivElement>(true);
  useScrollLock(true);
  useEscapeKey(true, onClose);

  useEffect(() => {
    QueryClient.fetch<{ success: boolean; tracks: any[] }>(
      'sih_theme_list',
      async () => {
        const res = await fetch('/api/tracks');
        return res.json();
      },
      { ttlMs: 300_000 }
    ).then((d) => {
      if (d?.success && d.tracks) setTracks(d.tracks);
    }).catch(() => undefined);
  }, []);

  const toggleTrack = (id: string) => {
    setError('');
    setSelectedTracks((prev) => {
      if (prev.includes(id)) return prev.filter((t) => t !== id);
      if (prev.length >= 2) {
        return [prev[1], id]; // Keep latest 2
      }
      return [...prev, id];
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (selectedTracks.length !== 2) {
      setError('Please select exactly 2 SIH themes according to platform guidelines.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/profile/themes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackInterest: selectedTracks,
          githubUrl: githubUrl.trim() || undefined,
          linkedinUrl: linkedinUrl.trim() || undefined,
          resumeUrl: resumeUrl.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save themes and links');

      toast('Themes & links updated successfully.', 'success');
      onSuccess({
        ...data.themes,
        trackInterest: data.themes?.trackInterest || selectedTracks,
        tracksDetailed: data.themes?.tracksDetailed || tracks.filter((t) => selectedTracks.includes(t.id)),
        tracks: data.themes?.tracksDetailed || tracks.filter((t) => selectedTracks.includes(t.id)),
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save themes.');
    } finally {
      setSaving(false);
    }
  };

  const control = 'w-full rounded-xl border border-[rgba(209,199,189,0.8)] bg-[rgba(248,246,242,0.7)] px-3.5 py-2 text-sm text-foreground outline-none focus:border-primary';

  return (
    <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-modal flex items-center justify-center p-4">
      <div aria-hidden onClick={onClose} className="absolute inset-0 bg-[rgb(50_45_41/0.34)] backdrop-blur-md" />
      <m.div ref={panelRef} role="dialog" aria-modal="true" tabIndex={-1} initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="surface-overlay relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl p-6 text-foreground sm:p-8 border border-[rgba(209,199,189,0.6)]">
        <div className="flex items-center justify-between border-b border-[rgba(209,199,189,0.5)] pb-4">
          <div>
            <span className="text-label uppercase tracking-wider text-primary font-bold">Tile 03</span>
            <h3 className="mt-0.5 text-feature font-extrabold text-foreground">Edit Themes & Links</h3>
          </div>
          <button onClick={onClose} aria-label="Close dialog" className="text-muted hover:text-foreground">
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && <div className="rounded-xl border border-[rgba(114,56,61,0.3)] bg-[rgba(114,56,61,0.08)] p-3 text-xs font-bold text-primary">{error}</div>}

          {/* Theme Selection */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label>SIH Themes / Interests</Label>
              <span className="text-[11px] font-bold text-primary bg-[rgba(114,56,61,0.08)] px-2 py-0.5 rounded-md">
                {selectedTracks.length} / 2 Selected
              </span>
            </div>
            <p className="text-[11px] text-muted mb-2">Select your 2 preferred official SIH problem statement themes.</p>
            <div className="space-y-1.5 max-h-52 overflow-y-auto p-2.5 rounded-2xl bg-[rgba(248,246,242,0.6)] border border-[rgba(209,199,189,0.6)]">
              {tracks.map((track) => {
                const selected = selectedTracks.includes(track.id);
                return (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => toggleTrack(track.id)}
                    className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between gap-2 ${
                      selected
                        ? 'border-primary bg-[rgba(114,56,61,0.08)] text-primary font-bold'
                        : 'border-[rgba(209,199,189,0.6)] bg-white/60 text-body hover:border-primary'
                    }`}
                  >
                    <span className="truncate">
                      <span className="font-bold text-foreground">{track.name}</span>{' '}
                      <span className="text-[11px] text-muted font-normal">({track.problemStatementCode})</span>
                    </span>
                    {selected && <CheckCircle2 className="size-4 shrink-0 text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label>GitHub Profile URL (Optional)</Label>
            <div className="relative mt-1">
              <input value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/username" className={`${control} pl-9`} />
              <Code2 className="absolute left-3 top-2.5 size-4 text-muted" />
            </div>
          </div>

          <div>
            <Label>LinkedIn Profile URL (Optional)</Label>
            <div className="relative mt-1">
              <input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/username" className={`${control} pl-9`} />
              <Globe className="absolute left-3 top-2.5 size-4 text-muted" />
            </div>
          </div>

          <div>
            <Label>Portfolio or Resume Link (Optional)</Label>
            <div className="relative mt-1">
              <input value={resumeUrl} onChange={(e) => setResumeUrl(e.target.value)} placeholder="https://drive.google.com/... or https://portfolio.dev" className={`${control} pl-9`} />
              <FileText className="absolute left-3 top-2.5 size-4 text-muted" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[rgba(209,199,189,0.5)]">
            <PremiumButton type="button" variant="glass" size="sm" onClick={onClose} disabled={saving}>
              Cancel
            </PremiumButton>
            <PremiumButton type="submit" size="sm" loading={saving}>
              Save Themes & Links
            </PremiumButton>
          </div>
        </form>
      </m.div>
    </m.div>
  );
}

function MentorPersonalModal({
  initialData,
  onClose,
  onSuccess,
}: {
  initialData: any;
  onClose: () => void;
  onSuccess: (updated: any) => void;
}) {
  const { toast } = useToast();
  const [name, setName] = useState(initialData?.name || '');
  const [designation, setDesignation] = useState(initialData?.designation || '');
  const [organization, setOrganization] = useState(initialData?.organization || 'GL Bajaj Group of Institutions');
  const [contact, setContact] = useState(initialData?.contact || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const panelRef = useFocusTrap<HTMLDivElement>(true);
  useScrollLock(true);
  useEscapeKey(true, onClose);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/profile/mentor', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'personal',
          name,
          designation,
          organization,
          contact,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save faculty profile');

      toast('Faculty personal information updated.', 'success');
      onSuccess(data.profile);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const control =
    'w-full rounded-xl border border-[rgba(209,199,189,0.8)] bg-[rgba(248,246,242,0.7)] px-3.5 py-2 text-sm text-foreground outline-none transition-all focus:border-primary focus:bg-white';

  return (
    <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-modal flex items-center justify-center p-4">
      <div aria-hidden onClick={onClose} className="absolute inset-0 bg-[rgb(50_45_41/0.34)] backdrop-blur-md" />
      <m.div ref={panelRef} role="dialog" aria-modal="true" tabIndex={-1} initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="surface-overlay relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl p-6 text-foreground sm:p-8 border border-[rgba(209,199,189,0.6)]">
        <div className="flex items-center justify-between border-b border-[rgba(209,199,189,0.5)] pb-4">
          <div>
            <span className="text-label uppercase tracking-wider text-primary font-bold">Tile 01</span>
            <h3 className="mt-0.5 text-feature font-extrabold text-foreground">Faculty Identity & Designation</h3>
          </div>
          <button onClick={onClose} aria-label="Close dialog" className="text-muted hover:text-foreground">
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && <div className="rounded-xl border border-[rgba(114,56,61,0.3)] bg-[rgba(114,56,61,0.08)] p-3 text-xs font-bold text-primary">{error}</div>}

          <div>
            <Label>Full Name *</Label>
            <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Dr. Jane Doe" className={control} />
          </div>

          <div>
            <Label>Faculty Designation *</Label>
            <input value={designation} onChange={(e) => setDesignation(e.target.value)} required placeholder="Associate Professor / Mentor" className={control} />
          </div>

          <div>
            <Label>Department / Organization *</Label>
            <input value={organization} onChange={(e) => setOrganization(e.target.value)} required placeholder="GL Bajaj Group of Institutions" className={control} />
          </div>

          <div>
            <Label>Mobile Contact (Kept Private)</Label>
            <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="+91 98765 43210" className={control} />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[rgba(209,199,189,0.5)]">
            <PremiumButton type="button" variant="glass" size="sm" onClick={onClose} disabled={saving}>
              Cancel
            </PremiumButton>
            <PremiumButton type="submit" size="sm" loading={saving}>
              Save Identity
            </PremiumButton>
          </div>
        </form>
      </m.div>
    </m.div>
  );
}

function MentorExpertiseModal({
  initialData,
  onClose,
  onSuccess,
}: {
  initialData: any;
  onClose: () => void;
  onSuccess: (updated: any) => void;
}) {
  const { toast } = useToast();
  const [expertise, setExpertise] = useState<string[]>(initialData?.expertise || []);
  const [customTag, setCustomTag] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const panelRef = useFocusTrap<HTMLDivElement>(true);
  useScrollLock(true);
  useEscapeKey(true, onClose);

  const SUGGESTED_EXPERTISE = [
    'AI/ML', 'Full Stack Web', 'Cloud Computing', 'Cybersecurity', 'IoT & Embedded',
    'Mobile App Dev', 'Blockchain', 'Data Science', 'DevOps & CI/CD', 'UI/UX Architecture',
    'Robotics', 'NLP & LLMs', 'Computer Vision', 'AR/VR', 'Distributed Systems',
  ];

  const toggleTag = (tag: string) => {
    setExpertise((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const addCustomTag = (e: any) => {
    if (e.key === 'Enter' || e.type === 'click') {
      e.preventDefault();
      const val = customTag.trim();
      if (val && !expertise.includes(val)) {
        setExpertise((prev) => [...prev, val]);
        setCustomTag('');
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/profile/mentor', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'expertise',
          expertise,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save expertise');

      toast('Domain expertise tags updated.', 'success');
      onSuccess(data.profile);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update expertise.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-modal flex items-center justify-center p-4">
      <div aria-hidden onClick={onClose} className="absolute inset-0 bg-[rgb(50_45_41/0.34)] backdrop-blur-md" />
      <m.div ref={panelRef} role="dialog" aria-modal="true" tabIndex={-1} initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="surface-overlay relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl p-6 text-foreground sm:p-8 border border-[rgba(209,199,189,0.6)]">
        <div className="flex items-center justify-between border-b border-[rgba(209,199,189,0.5)] pb-4">
          <div>
            <span className="text-label uppercase tracking-wider text-primary font-bold">Tile 02</span>
            <h3 className="mt-0.5 text-feature font-extrabold text-foreground">Domain Expertise</h3>
          </div>
          <button onClick={onClose} aria-label="Close dialog" className="text-muted hover:text-foreground">
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && <div className="rounded-xl border border-[rgba(114,56,61,0.3)] bg-[rgba(114,56,61,0.08)] p-3 text-xs font-bold text-primary">{error}</div>}

          <div>
            <Label>Custom Domain / Technology</Label>
            <div className="flex gap-2 mt-2 mb-3">
              <input
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyDown={addCustomTag}
                placeholder="e.g. Edge AI, Quantum Computing"
                className="flex-1 rounded-xl border border-[rgba(209,199,189,0.8)] bg-[rgba(248,246,242,0.7)] px-3.5 py-1.5 text-sm text-foreground outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={addCustomTag}
                className="px-3 py-1.5 rounded-xl border border-[rgba(209,199,189,0.8)] bg-white text-xs font-semibold text-body hover:border-primary"
              >
                Add
              </button>
            </div>

            <Label>Suggested Domains</Label>
            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2.5 rounded-2xl bg-[rgba(248,246,242,0.6)] border border-[rgba(209,199,189,0.6)] mt-1.5">
              {SUGGESTED_EXPERTISE.map((tag) => {
                const selected = expertise.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                      selected
                        ? 'bg-primary text-on-accent border border-transparent shadow-xs'
                        : 'border border-[rgba(209,199,189,0.8)] bg-white/70 text-body hover:border-primary'
                    }`}
                  >
                    {selected ? `✓ ${tag}` : `+ ${tag}`}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[rgba(209,199,189,0.5)]">
            <PremiumButton type="button" variant="glass" size="sm" onClick={onClose} disabled={saving}>
              Cancel
            </PremiumButton>
            <PremiumButton type="submit" size="sm" loading={saving}>
              Save Expertise
            </PremiumButton>
          </div>
        </form>
      </m.div>
    </m.div>
  );
}

function MentorBioModal({
  initialData,
  onClose,
  onSuccess,
}: {
  initialData: any;
  onClose: () => void;
  onSuccess: (updated: any) => void;
}) {
  const { toast } = useToast();
  const [bio, setBio] = useState(initialData?.bio || '');
  const [linkedinUrl, setLinkedinUrl] = useState(initialData?.linkedinUrl || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const panelRef = useFocusTrap<HTMLDivElement>(true);
  useScrollLock(true);
  useEscapeKey(true, onClose);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/profile/mentor', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'bio',
          bio,
          linkedinUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save bio');

      toast('Professional bio & links updated.', 'success');
      onSuccess(data.profile);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update bio.');
    } finally {
      setSaving(false);
    }
  };

  const control =
    'w-full rounded-xl border border-[rgba(209,199,189,0.8)] bg-[rgba(248,246,242,0.7)] px-3.5 py-2 text-sm text-foreground outline-none transition-all focus:border-primary focus:bg-white';

  return (
    <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-modal flex items-center justify-center p-4">
      <div aria-hidden onClick={onClose} className="absolute inset-0 bg-[rgb(50_45_41/0.34)] backdrop-blur-md" />
      <m.div ref={panelRef} role="dialog" aria-modal="true" tabIndex={-1} initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="surface-overlay relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl p-6 text-foreground sm:p-8 border border-[rgba(209,199,189,0.6)]">
        <div className="flex items-center justify-between border-b border-[rgba(209,199,189,0.5)] pb-4">
          <div>
            <span className="text-label uppercase tracking-wider text-primary font-bold">Tile 03</span>
            <h3 className="mt-0.5 text-feature font-extrabold text-foreground">Professional Bio & Links</h3>
          </div>
          <button onClick={onClose} aria-label="Close dialog" className="text-muted hover:text-foreground">
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && <div className="rounded-xl border border-[rgba(114,56,61,0.3)] bg-[rgba(114,56,61,0.08)] p-3 text-xs font-bold text-primary">{error}</div>}

          <div>
            <Label>Faculty Bio & Research Statement</Label>
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g. Associate Professor in CSE with 10+ years mentoring student teams in Hackathons, AI/ML, and Systems engineering."
              className={`${control} resize-none`}
            />
          </div>

          <div>
            <Label>LinkedIn Profile URL</Label>
            <div className="relative mt-1">
              <input
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/username"
                className={`${control} pl-9`}
              />
              <Globe className="absolute left-3 top-2.5 size-4 text-muted" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[rgba(209,199,189,0.5)]">
            <PremiumButton type="button" variant="glass" size="sm" onClick={onClose} disabled={saving}>
              Cancel
            </PremiumButton>
            <PremiumButton type="submit" size="sm" loading={saving}>
              Save Bio & Links
            </PremiumButton>
          </div>
        </form>
      </m.div>
    </m.div>
  );
}

// -------------------------------------------------------------
// MAIN DASHBOARD COMPONENT
// -------------------------------------------------------------

export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();

  // Stage 1: Bootstrap State (Critical path)
  const [bootstrapLoading, setBootstrapLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [completion, setCompletion] = useState<any>({
    personalInfoComplete: false,
    skillsComplete: false,
    themesComplete: false,
    onboardingComplete: false,
    identityComplete: false,
    expertiseComplete: false,
    bioComplete: false,
  });
  const [personalSummary, setPersonalSummary] = useState<any>(null);
  const [skillsSummary, setSkillsSummary] = useState<any>(null);
  const [themesSummary, setThemesSummary] = useState<any>(null);
  const [teamSummary, setTeamSummary] = useState<any>(null);
  const [mentorStats, setMentorStats] = useState<any>(null);

  // Stage 2: Secondary Non-Blocking State
  const [teamDetailsLoading, setTeamDetailsLoading] = useState(false);
  const [teamDetails, setTeamDetails] = useState<any>(null);
  const [receivedInvites, setReceivedInvites] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [mentorTeams, setMentorTeams] = useState<any[]>([]);
  const [mentorRequests, setMentorRequests] = useState<any[]>([]);

  // Active Tabs
  const [activeTab, setActiveTab] = useState<'team' | 'requests'>('team');
  const [mentorTab, setMentorTab] = useState<'assigned' | 'requests'>('assigned');

  // Modals state
  const [activeModal, setActiveModal] = useState<'personal' | 'skills' | 'themes' | 'mentor_personal' | 'mentor_expertise' | 'mentor_bio' | null>(null);

  // 1. Critical Path Bootstrap Fetch
  const loadBootstrapData = useCallback(async () => {
    try {
      const cacheKey = 'sih_dashboard_bootstrap';
      const data = await QueryClient.fetch<any>(
        cacheKey,
        async () => {
          const res = await fetch('/api/dashboard/bootstrap', { cache: 'no-store' });
          return res.json();
        },
        { ttlMs: 15_000 }
      );

      if (!data?.success) {
        QueryClient.clear();
        router.push('/login');
        return;
      }

      setUser(data.user);
      if (data.role === 'MENTOR') {
        setCompletion({
          identityComplete: data.user.identityComplete,
          expertiseComplete: data.user.expertiseComplete,
          bioComplete: data.user.bioComplete,
          onboardingComplete: data.user.onboardingComplete,
        });
        setMentorStats(data.stats || { assignedTeamsCount: 0, pendingRequestsCount: 0 });
      } else {
        setCompletion(data.completion || {});
        setPersonalSummary(data.personalSummary || {});
        setSkillsSummary(data.skillsSummary || {});
        setThemesSummary(data.themesSummary || {});
        setTeamSummary(data.teamSummary || null);
      }
    } catch (err: unknown) {
      logger.error('Dashboard bootstrap error', err);
    } finally {
      setBootstrapLoading(false);
    }
  }, []);

  // 2. Secondary Path Team Details Fetch
  const loadTeamDetails = useCallback(async () => {
    setTeamDetailsLoading(true);
    try {
      const res = await fetch('/api/dashboard/team-details', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        if (data.role === 'MENTOR') {
          setMentorTeams(data.teams || []);
          setMentorRequests(data.mentorRequests || []);
        } else {
          setTeamDetails(data.teamDetails || null);
          setReceivedInvites(data.receivedInvites || []);
          setSentRequests(data.sentRequests || []);
        }
      }
    } catch (err) {
      logger.error('Dashboard secondary data error', err);
    } finally {
      setTeamDetailsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBootstrapData().then(() => {
      loadTeamDetails();
    });
  }, [loadBootstrapData, loadTeamDetails]);

  // Save callbacks with cache invalidation
  const handlePersonalSaved = (updated: any) => {
    QueryClient.invalidate('sih_dashboard_bootstrap');
    QueryClient.invalidate('teammates:');
    setPersonalSummary(updated);
    setUser((prev: any) => ({ ...prev, name: updated.name, avatarUrl: updated.avatarUrl, branch: updated.branch, year: updated.year }));
    setCompletion((prev: any) => ({
      ...prev,
      personalInfoComplete: Boolean(updated.name && updated.year && updated.branch),
    }));
  };

  const handleSkillsSaved = (updated: any) => {
    QueryClient.invalidate('sih_dashboard_bootstrap');
    QueryClient.invalidate('teammates:');
    setSkillsSummary(updated);
    setCompletion((prev: any) => ({
      ...prev,
      skillsComplete: Boolean(updated.skills?.length > 0 || updated.languages?.length > 0),
    }));
  };

  const handleThemesSaved = (updated: any) => {
    QueryClient.invalidate('sih_dashboard_bootstrap');
    QueryClient.invalidate('teammates:');
    setThemesSummary(updated);
    setCompletion((prev: any) => ({
      ...prev,
      themesComplete: Boolean(updated.trackInterest?.length > 0 || updated.githubUrl || updated.linkedinUrl),
    }));
  };

  // Mentor profile section handlers
  const handleMentorProfileSaved = (updated: any) => {
    QueryClient.invalidate('sih_dashboard_bootstrap');
    QueryClient.invalidate('mentors:');
    setUser((prev: any) => ({ ...prev, ...updated }));
    setCompletion({
      identityComplete: Boolean(updated.name?.trim() && updated.designation?.trim() && updated.organization?.trim()),
      expertiseComplete: Boolean(updated.expertise && updated.expertise.length > 0),
      bioComplete: Boolean(updated.bio?.trim() && updated.linkedinUrl?.trim()),
      onboardingComplete: Boolean(updated.name?.trim() && updated.designation?.trim() && updated.expertise?.length > 0),
    });
  };

  const handleRespondMentorRequest = async (requestId: string, action: 'accept' | 'decline' | 'meeting') => {
    try {
      const res = await fetch(`/api/mentor-requests/${requestId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update request.');

      QueryClient.invalidate('sih_dashboard_bootstrap');
      QueryClient.invalidate('mentors:');
      toast(`Mentorship request ${action === 'accept' ? 'accepted' : action === 'decline' ? 'declined' : 'updated'}.`, 'success');
      setMentorRequests((prev) => prev.filter((r) => r.id !== requestId));
      if (action === 'accept') {
        loadTeamDetails();
      }
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to respond to request.', 'error');
    }
  };

  // Team actions
  const handleRespondInvite = async (inviteId: string, action: 'accept' | 'decline') => {
    try {
      const res = await fetch('/api/team-invites', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteId, action }),
      });
      if (res.ok) {
        QueryClient.invalidate('sih_dashboard_bootstrap');
        QueryClient.invalidate('teams:');
        toast(`Invite ${action}ed successfully.`, 'success');
        setReceivedInvites((prev) => prev.filter((i) => i.id !== inviteId));
        loadBootstrapData();
        loadTeamDetails();
      }
    } catch (e) {
      toast('Failed to process invite response.', 'error');
    }
  };

  const handleRespondJoinRequest = async (requestId: string, action: 'accept' | 'decline') => {
    try {
      const res = await fetch('/api/join-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
      });
      if (res.ok) {
        QueryClient.invalidate('sih_dashboard_bootstrap');
        QueryClient.invalidate('teams:');
        toast(`Request ${action}ed.`, 'success');
        if (teamDetails?.joinRequests) {
          setTeamDetails((prev: any) => ({
            ...prev,
            joinRequests: prev.joinRequests.filter((r: any) => r.id !== requestId),
          }));
        }
        loadBootstrapData();
        loadTeamDetails();
      }
    } catch (e) {
      toast('Failed to respond to request.', 'error');
    }
  };

  if (bootstrapLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
        <Navbar />
        <main className="flex-1 py-10">
          <Container>
            <DashboardSkeleton />
          </Container>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground flex flex-col justify-between">
      <ViewingAsBanner />
      <Navbar />

      <main className="relative flex-1 py-8 sm:py-10">
        <Aurora />
        <Container>
          {user?.role === 'MENTOR' ? (
            /* ========================================================= */
            /* FACULTY MENTOR DASHBOARD VIEW                             */
            /* ========================================================= */
            <div>
              {/* Mentor Header Banner */}
              <div className="surface-raised rounded-3xl p-6 sm:p-8 border border-[rgba(209,199,189,0.7)] shadow-e2 mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar avatarUrl={user?.avatarUrl} name={user?.name || 'Faculty Mentor'} className="size-16 sm:size-20" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-label uppercase tracking-wider text-primary font-bold">Faculty Mentor Dashboard</span>
                        {user?.verified && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(114,56,61,0.1)] border border-[rgba(114,56,61,0.25)] px-2.5 py-0.5 text-[10px] font-extrabold text-primary">
                            <ShieldCheck className="size-3 text-primary" />
                            VERIFIED FACULTY
                          </span>
                        )}
                      </div>
                      <h1 className="text-display text-foreground font-extrabold mt-0.5">
                        Welcome back, {user?.name}
                      </h1>
                      <p className="text-xs text-muted mt-1">
                        {user?.designation || 'Mentor'} • {user?.organization || 'GL Bajaj Group of Institutions'} • {user?.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveModal('mentor_personal')}
                      className="px-4 py-2 rounded-xl border border-[rgba(209,199,189,0.8)] bg-white/70 text-xs font-semibold text-foreground hover:border-primary flex items-center gap-1.5 shadow-xs"
                    >
                      <Edit2 className="size-3.5 text-primary" />
                      <span>Edit Faculty Profile</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Mentor Top Deck Stats Bar */}
              <RevealGroup className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <DeckStat
                  value={mentorStats?.assignedTeamsCount ?? mentorTeams.length}
                  label="Assigned Teams"
                  text={`${mentorTeams.length} Teams Under Guidance`}
                />
                <DeckStat
                  value={mentorTeams.reduce((sum, t) => sum + (t.members?.length || 0), 0)}
                  label="Students Guided"
                  text="Total Mentored Students"
                />
                <DeckStat
                  value={mentorStats?.pendingRequestsCount ?? mentorRequests.length}
                  label="Mentorship Requests"
                  text={`${mentorRequests.length} Pending Inquiries`}
                />
                <DeckStat
                  value={user?.verified ? 1 : 0}
                  label="Faculty Status"
                  text={user?.verified ? 'Verified Mentor' : 'Verification Pending'}
                />
              </RevealGroup>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: 3 Progressive Mentor Profile Completion Tiles */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="text-heading text-foreground font-bold">Profile Completion</h2>
                    <span className="text-xs font-semibold text-primary">
                      {[completion.identityComplete, completion.expertiseComplete, completion.bioComplete].filter(Boolean).length} of 3 Complete
                    </span>
                  </div>

                  {/* Tile 1: Faculty Identity */}
                  <SpotlightCard className="rounded-3xl" intensity={0.14}>
                    <div
                      onClick={() => setActiveModal('mentor_personal')}
                      className="surface-raised rounded-3xl p-6 border border-[rgba(209,199,189,0.7)] shadow-e1 hover:shadow-e3 transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-label uppercase tracking-wider text-muted font-bold">Tile 01</span>
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                            completion.identityComplete
                              ? 'bg-[rgba(114,56,61,0.1)] text-primary border border-[rgba(114,56,61,0.2)]'
                              : 'bg-pearl text-body border border-[rgba(209,199,189,0.7)]'
                          }`}
                        >
                          {completion.identityComplete ? <CheckCircle2 className="size-3" /> : <AlertCircle className="size-3" />}
                          <span>{completion.identityComplete ? 'Complete' : 'Incomplete'}</span>
                        </span>
                      </div>

                      <h3 className="text-feature font-extrabold text-foreground mb-1">Faculty Identity & Designation</h3>
                      <p className="text-xs text-muted mb-4">
                        Name, academic designation, department/institution, and mobile contact.
                      </p>

                      <div className="p-3 rounded-2xl bg-[rgba(248,246,242,0.6)] border border-[rgba(209,199,189,0.6)] text-xs text-body space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted">Name:</span>
                          <span className="font-semibold text-foreground">{user?.name || 'Not set'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted">Designation:</span>
                          <span className="font-semibold text-foreground">{user?.designation || 'Mentor'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted">Department:</span>
                          <span className="font-semibold text-foreground">{user?.organization || 'GL Bajaj Group of Institutions'}</span>
                        </div>
                      </div>
                    </div>
                  </SpotlightCard>

                  {/* Tile 2: Domain Expertise */}
                  <SpotlightCard className="rounded-3xl" intensity={0.14}>
                    <div
                      onClick={() => setActiveModal('mentor_expertise')}
                      className="surface-raised rounded-3xl p-6 border border-[rgba(209,199,189,0.7)] shadow-e1 hover:shadow-e3 transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-label uppercase tracking-wider text-muted font-bold">Tile 02</span>
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                            completion.expertiseComplete
                              ? 'bg-[rgba(114,56,61,0.1)] text-primary border border-[rgba(114,56,61,0.2)]'
                              : 'bg-pearl text-body border border-[rgba(209,199,189,0.7)]'
                          }`}
                        >
                          {completion.expertiseComplete ? <CheckCircle2 className="size-3" /> : <AlertCircle className="size-3" />}
                          <span>{completion.expertiseComplete ? 'Complete' : 'Incomplete'}</span>
                        </span>
                      </div>

                      <h3 className="text-feature font-extrabold text-foreground mb-1">Domain Expertise</h3>
                      <p className="text-xs text-muted mb-4">
                        Technical domains and technology areas you guide teams in.
                      </p>

                      <div className="flex flex-wrap gap-1.5">
                        {user?.expertise && user.expertise.length > 0 ? (
                          user.expertise.map((exp: string) => (
                            <span
                              key={exp}
                              className="rounded-lg border border-[rgba(114,56,61,0.25)] bg-[rgba(114,56,61,0.07)] px-2.5 py-1 text-xs font-semibold text-primary"
                            >
                              {exp}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-muted italic">Click to select your domain expertise</span>
                        )}
                      </div>
                    </div>
                  </SpotlightCard>

                  {/* Tile 3: Professional Bio & Links */}
                  <SpotlightCard className="rounded-3xl" intensity={0.14}>
                    <div
                      onClick={() => setActiveModal('mentor_bio')}
                      className="surface-raised rounded-3xl p-6 border border-[rgba(209,199,189,0.7)] shadow-e1 hover:shadow-e3 transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-label uppercase tracking-wider text-muted font-bold">Tile 03</span>
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                            completion.bioComplete
                              ? 'bg-[rgba(114,56,61,0.1)] text-primary border border-[rgba(114,56,61,0.2)]'
                              : 'bg-pearl text-body border border-[rgba(209,199,189,0.7)]'
                          }`}
                        >
                          {completion.bioComplete ? <CheckCircle2 className="size-3" /> : <AlertCircle className="size-3" />}
                          <span>{completion.bioComplete ? 'Complete' : 'Incomplete'}</span>
                        </span>
                      </div>

                      <h3 className="text-feature font-extrabold text-foreground mb-1">Professional Bio & Links</h3>
                      <p className="text-xs text-muted mb-4">
                        Faculty biography, research focus, and professional LinkedIn profile.
                      </p>

                      <p className="text-xs text-body leading-relaxed line-clamp-3 mb-3">
                        {user?.bio || 'Click to write a brief bio and add your LinkedIn profile.'}
                      </p>

                      {user?.linkedinUrl && (
                        <div className="flex items-center gap-1.5 text-xs text-primary font-semibold">
                          <Globe className="size-3.5" />
                          <span className="truncate">{user.linkedinUrl}</span>
                        </div>
                      )}
                    </div>
                  </SpotlightCard>
                </div>

                {/* Right Column: Assigned Teams & Mentorship Requests */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Tab Navigation */}
                  <div className="flex gap-2 p-1.5 rounded-2xl bg-[rgba(248,246,242,0.8)] border border-[rgba(209,199,189,0.7)]">
                    <button
                      onClick={() => setMentorTab('assigned')}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
                        mentorTab === 'assigned'
                          ? 'bg-primary text-on-accent shadow-xs'
                          : 'text-body hover:text-foreground'
                      }`}
                    >
                      Assigned Teams ({mentorTeams.length})
                    </button>
                    <button
                      onClick={() => setMentorTab('requests')}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all relative ${
                        mentorTab === 'requests'
                          ? 'bg-primary text-on-accent shadow-xs'
                          : 'text-body hover:text-foreground'
                      }`}
                    >
                      <span>Mentorship Requests</span>
                      {mentorRequests.length > 0 && (
                        <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-white text-primary text-[10px] font-black">
                          {mentorRequests.length}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Tab 1: Assigned Teams */}
                  {mentorTab === 'assigned' && (
                    <div>
                      {teamDetailsLoading ? (
                        <div className="space-y-4">
                          {[1, 2].map((i) => (
                            <div key={i} className="h-44 rounded-3xl bg-[rgba(209,199,189,0.3)] animate-pulse" />
                          ))}
                        </div>
                      ) : mentorTeams.length === 0 ? (
                        <div className="surface-raised rounded-3xl p-10 text-center border border-[rgba(209,199,189,0.7)] shadow-e1">
                          <Users className="size-12 mx-auto text-muted mb-3 opacity-60" />
                          <h3 className="text-feature font-bold text-foreground mb-1">No Teams Assigned Yet</h3>
                          <p className="text-xs text-muted max-w-sm mx-auto">
                            Student teams searching for guidance in your domain can submit mentorship requests to you from the Mentor Directory.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {mentorTeams.map((team: any) => (
                            <SpotlightCard key={team.id} className="rounded-3xl" intensity={0.12}>
                              <div className="surface-raised rounded-3xl p-6 border border-[rgba(209,199,189,0.7)] shadow-e1">
                                <div className="flex items-start justify-between gap-3 mb-4">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-xs font-bold text-primary bg-[rgba(114,56,61,0.08)] px-2 py-0.5 rounded-md border border-[rgba(114,56,61,0.2)]">
                                        {team.teamCode}
                                      </span>
                                      <span className="text-xs font-bold text-muted uppercase">
                                        {team.status === 'forming' ? 'Forming' : 'Locked'}
                                      </span>
                                    </div>
                                    <h3 className="text-heading font-extrabold text-foreground mt-1">{team.name}</h3>
                                    {team.track && (
                                      <p className="text-xs text-primary font-semibold mt-0.5">
                                        Theme: <span className="font-bold">{team.track.problemStatementCode}</span> — {team.track.name}
                                      </p>
                                    )}
                                  </div>

                                  <span className="px-3 py-1 rounded-full bg-[rgba(248,246,242,0.8)] border border-[rgba(209,199,189,0.8)] text-xs font-bold text-foreground">
                                    {team.members?.length || team.memberCount} / 6 Members
                                  </span>
                                </div>

                                {/* Student Member Roster */}
                                <div className="mt-4 pt-4 border-t border-[rgba(209,199,189,0.5)]">
                                  <h4 className="text-label uppercase tracking-wider text-muted font-bold mb-3">Student Roster</h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {team.members?.map((m: any) => (
                                      <div
                                        key={m.userId}
                                        className="flex items-center gap-2.5 p-2 rounded-xl bg-[rgba(248,246,242,0.6)] border border-[rgba(209,199,189,0.5)] text-xs"
                                      >
                                        <Avatar avatarUrl={m.avatarUrl} name={m.name} className="size-8" />
                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-center gap-1">
                                            <span className="font-bold text-foreground truncate">{m.name}</span>
                                            {m.userId === team.leaderId && (
                                              <span className="text-[9px] font-bold text-primary bg-[rgba(114,56,61,0.1)] px-1 rounded">LEAD</span>
                                            )}
                                          </div>
                                          <p className="text-[11px] text-muted truncate">{m.branch} • {m.year}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </SpotlightCard>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 2: Mentorship Requests */}
                  {mentorTab === 'requests' && (
                    <div>
                      {mentorRequests.length === 0 ? (
                        <div className="surface-raised rounded-3xl p-10 text-center border border-[rgba(209,199,189,0.7)] shadow-e1">
                          <MailOpen className="size-12 mx-auto text-muted mb-3 opacity-60" />
                          <h3 className="text-feature font-bold text-foreground mb-1">No Pending Requests</h3>
                          <p className="text-xs text-muted max-w-sm mx-auto">
                            When student teams request your guidance, their problem statements and team pitches will appear here.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {mentorRequests.map((req: any) => (
                            <div
                              key={req.id}
                              className="surface-raised rounded-3xl p-6 border border-[rgba(209,199,189,0.7)] shadow-e1"
                            >
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <div>
                                  <span className="font-mono text-xs font-bold text-primary bg-[rgba(114,56,61,0.08)] px-2 py-0.5 rounded-md border border-[rgba(114,56,61,0.2)]">
                                    {req.team?.teamCode}
                                  </span>
                                  <h3 className="text-feature font-bold text-foreground mt-1">{req.team?.name}</h3>
                                  {req.team?.track && (
                                    <p className="text-xs text-primary font-semibold">
                                      Theme: {req.team.track.problemStatementCode} — {req.team.track.name}
                                    </p>
                                  )}
                                </div>

                                <span className="text-[11px] font-bold text-muted uppercase">
                                  {new Date(req.createdAt).toLocaleDateString()}
                                </span>
                              </div>

                              {req.message && (
                                <div className="p-3 rounded-xl bg-[rgba(248,246,242,0.7)] border border-[rgba(209,199,189,0.6)] my-3 text-xs text-body italic">
                                  "{req.message}"
                                </div>
                              )}

                              <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-[rgba(209,199,189,0.5)]">
                                <button
                                  onClick={() => handleRespondMentorRequest(req.id, 'decline')}
                                  className="px-3.5 py-1.5 rounded-xl border border-[rgba(209,199,189,0.8)] bg-white text-xs font-semibold text-body hover:bg-[rgba(209,199,189,0.2)]"
                                >
                                  Decline
                                </button>
                                <button
                                  onClick={() => handleRespondMentorRequest(req.id, 'meeting')}
                                  className="px-3.5 py-1.5 rounded-xl border border-[rgba(114,56,61,0.3)] bg-[rgba(114,56,61,0.08)] text-xs font-semibold text-primary hover:bg-[rgba(114,56,61,0.15)]"
                                >
                                  Request Review Meeting
                                </button>
                                <button
                                  onClick={() => handleRespondMentorRequest(req.id, 'accept')}
                                  className="px-4 py-1.5 rounded-xl bg-primary text-on-accent text-xs font-semibold hover:opacity-90 shadow-xs"
                                >
                                  Accept Mentorship
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================= */
            /* STUDENT DASHBOARD VIEW                                    */
            /* ========================================================= */
            <div>
              {/* Header Banner */}
              <div className="surface-raised rounded-3xl p-6 sm:p-7 border border-[rgba(209,199,189,0.7)] shadow-e2 mb-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                  <div className="flex items-center gap-4 sm:gap-5 min-w-0 flex-1">
                    <Avatar
                      avatarUrl={user?.avatarUrl}
                      name={user?.name || 'User'}
                      className="size-16 sm:size-20 shrink-0 shadow-sm"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-label uppercase tracking-wider text-primary font-bold">Student Dashboard</span>
                      <h1 className="text-xl sm:text-2xl lg:text-3xl text-foreground font-extrabold mt-0.5 truncate tracking-tight">
                        Welcome back, {user?.name}
                      </h1>
                      <p className="text-xs text-muted mt-1 truncate">
                        {user?.branch || 'Student'} • {user?.year || 'Participant'} • {user?.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setActiveModal('personal')}
                      className="px-4 py-2 rounded-xl border border-[rgba(209,199,189,0.8)] bg-white/70 text-xs font-semibold text-foreground hover:border-primary flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <Edit2 className="size-3.5 text-primary" />
                      <span>Edit Profile</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Top Deck Stats Bar */}
              <RevealGroup className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <DeckStat
                  value={teamSummary ? teamSummary.memberCount : 0}
                  label={teamSummary ? `${teamSummary.memberCount} of 6 Members` : 'No Team'}
                  text={teamSummary ? `${teamSummary.memberCount} Members` : 'Looking for Team'}
                />
                <DeckStat
                  value={teamSummary ? teamSummary.openSeats : 6}
                  label="Open Roster Seats"
                  text={teamSummary ? `${teamSummary.openSeats} Open Seats` : '6 Seats Open'}
                />
                <DeckStat
                  value={teamSummary?.hasMentor ? 1 : 0}
                  label="Assigned Mentor"
                  text={teamSummary?.hasMentor ? 'Mentor Assigned' : 'No Mentor'}
                />
                <DeckStat
                  value={teamSummary ? 1 : 0}
                  label="Recruitment Status"
                  text={teamSummary ? (teamSummary.status === 'forming' ? 'Recruiting Open' : 'Team Locked') : 'Available'}
                />
              </RevealGroup>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: 3 Progressive Profile Completion Tiles */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="text-heading text-foreground font-bold">Profile Completion</h2>
                    <span className="text-xs font-semibold text-primary">
                      {[completion.personalInfoComplete, completion.skillsComplete, completion.themesComplete].filter(Boolean).length} of 3 Complete
                    </span>
                  </div>

                  {/* Tile 1: Personal Information */}
                  <SpotlightCard className="rounded-3xl" intensity={0.14}>
                    <div
                      onClick={() => setActiveModal('personal')}
                      className="surface-raised rounded-3xl p-6 border border-[rgba(209,199,189,0.7)] shadow-e1 hover:shadow-e3 transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-label uppercase tracking-wider text-muted font-bold">Tile 01</span>
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                            completion.personalInfoComplete
                              ? 'bg-[rgba(114,56,61,0.1)] text-primary border border-[rgba(114,56,61,0.2)]'
                              : 'bg-pearl text-body border border-[rgba(209,199,189,0.7)]'
                          }`}
                        >
                          {completion.personalInfoComplete ? <CheckCircle2 className="size-3" /> : <AlertCircle className="size-3" />}
                          <span>{completion.personalInfoComplete ? 'Complete' : 'Incomplete'}</span>
                        </span>
                      </div>

                      <h3 className="text-feature font-extrabold text-foreground mb-1">Personal Information</h3>
                      <p className="text-xs text-muted mb-4">
                        Full name, academic branch, roll number, year of study, section, and mobile contact.
                      </p>

                      <div className="p-3 rounded-2xl bg-[rgba(248,246,242,0.6)] border border-[rgba(209,199,189,0.6)] text-xs text-body space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted">Name:</span>
                          <span className="font-semibold text-foreground">{personalSummary?.name || 'Not set'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted">Branch / Year:</span>
                          <span className="font-semibold text-foreground">{personalSummary?.branch || 'CSE'} ({personalSummary?.year || '2nd Year'})</span>
                        </div>
                        {personalSummary?.rollNo && (
                          <div className="flex justify-between">
                            <span className="text-muted">Roll No:</span>
                            <span className="font-semibold text-foreground">{personalSummary.rollNo}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </SpotlightCard>

                  {/* Tile 2: Skills & Fluency */}
                  <SpotlightCard className="rounded-3xl" intensity={0.14}>
                    <div
                      onClick={() => setActiveModal('skills')}
                      className="surface-raised rounded-3xl p-6 border border-[rgba(209,199,189,0.7)] shadow-e1 hover:shadow-e3 transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-label uppercase tracking-wider text-muted font-bold">Tile 02</span>
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                            completion.skillsComplete
                              ? 'bg-[rgba(114,56,61,0.1)] text-primary border border-[rgba(114,56,61,0.2)]'
                              : 'bg-pearl text-body border border-[rgba(209,199,189,0.7)]'
                          }`}
                        >
                          {completion.skillsComplete ? <CheckCircle2 className="size-3" /> : <AlertCircle className="size-3" />}
                          <span>{completion.skillsComplete ? 'Complete' : 'Incomplete'}</span>
                        </span>
                      </div>

                      <h3 className="text-feature font-extrabold text-foreground mb-1">Skills & Fluency</h3>
                      <p className="text-xs text-muted mb-4">
                        Technical skill tags, soft skills, and spoken languages.
                      </p>

                      <div className="flex flex-wrap gap-1.5">
                        {skillsSummary?.skills && skillsSummary.skills.length > 0 ? (
                          skillsSummary.skills.slice(0, 6).map((sk: string) => (
                            <span
                              key={sk}
                              className="rounded-lg border border-[rgba(114,56,61,0.25)] bg-[rgba(114,56,61,0.07)] px-2 py-0.5 text-[11px] font-medium text-primary"
                            >
                              {sk}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-muted italic">Click to add your skills</span>
                        )}
                      </div>
                    </div>
                  </SpotlightCard>

                  {/* Tile 3: Themes & Links */}
                  <SpotlightCard className="rounded-3xl" intensity={0.14}>
                    <div
                      onClick={() => setActiveModal('themes')}
                      className="surface-raised rounded-3xl p-6 border border-[rgba(209,199,189,0.7)] shadow-e1 hover:shadow-e3 transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-label uppercase tracking-wider text-muted font-bold">Tile 03</span>
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                            completion.themesComplete
                              ? 'bg-[rgba(114,56,61,0.1)] text-primary border border-[rgba(114,56,61,0.2)]'
                              : 'bg-pearl text-body border border-[rgba(209,199,189,0.7)]'
                          }`}
                        >
                          {completion.themesComplete ? <CheckCircle2 className="size-3" /> : <AlertCircle className="size-3" />}
                          <span>{completion.themesComplete ? 'Complete' : 'Incomplete'}</span>
                        </span>
                      </div>

                      <h3 className="text-feature font-extrabold text-foreground mb-1">Themes & Links</h3>
                      <p className="text-xs text-muted mb-4">
                        Selected SIH themes, GitHub profile, LinkedIn, and portfolio link.
                      </p>

                      <div className="flex flex-wrap gap-1.5">
                        {themesSummary?.tracksDetailed && themesSummary.tracksDetailed.length > 0 ? (
                          themesSummary.tracksDetailed.slice(0, 2).map((t: any) => (
                            <span
                              key={t.id || t.problemStatementCode}
                              className="rounded-lg border border-[rgba(114,56,61,0.25)] bg-[rgba(114,56,61,0.07)] px-2 py-0.5 text-[11px] font-semibold text-primary truncate max-w-[200px]"
                            >
                              {t.name || t.problemStatementCode}
                            </span>
                          ))
                        ) : themesSummary?.trackInterest && themesSummary.trackInterest.length > 0 ? (
                          themesSummary.trackInterest.slice(0, 2).map((t: any) => (
                            <span
                              key={typeof t === 'string' ? t : t.id}
                              className="rounded-lg border border-[rgba(114,56,61,0.25)] bg-[rgba(114,56,61,0.07)] px-2 py-0.5 text-[11px] font-semibold text-primary truncate max-w-[200px]"
                            >
                              {typeof t === 'string' ? t : t.name || t.problemStatementCode}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-muted italic">Click to select SIH themes</span>
                        )}
                      </div>
                    </div>
                  </SpotlightCard>
                </div>

                {/* Right Column: Team Management and Invites */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Tab Navigation */}
                  <div className="flex gap-2 p-1.5 rounded-2xl bg-[rgba(248,246,242,0.8)] border border-[rgba(209,199,189,0.7)]">
                    <button
                      onClick={() => setActiveTab('team')}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
                        activeTab === 'team'
                          ? 'bg-primary text-on-accent shadow-xs'
                          : 'text-body hover:text-foreground'
                      }`}
                    >
                      My Team Space
                    </button>
                    <button
                      onClick={() => setActiveTab('requests')}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all relative ${
                        activeTab === 'requests'
                          ? 'bg-primary text-on-accent shadow-xs'
                          : 'text-body hover:text-foreground'
                      }`}
                    >
                      <span>Invites & Requests</span>
                      {receivedInvites.length + sentRequests.length > 0 && (
                        <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-white text-primary text-[10px] font-black">
                          {receivedInvites.length + sentRequests.length}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Tab 1: Team Space */}
                  {activeTab === 'team' && (
                    <div>
                      {teamDetailsLoading || (teamSummary?.hasTeam && !teamDetails) ? (
                        <div className="surface-raised rounded-3xl p-6 border border-[rgba(209,199,189,0.7)] shadow-e1 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="h-6 w-32 rounded-lg bg-[rgba(209,199,189,0.3)] animate-pulse" />
                            <div className="h-6 w-24 rounded-full bg-[rgba(209,199,189,0.3)] animate-pulse" />
                          </div>
                          <div className="h-8 w-48 rounded-xl bg-[rgba(209,199,189,0.3)] animate-pulse" />
                          <div className="h-20 rounded-2xl bg-[rgba(209,199,189,0.2)] animate-pulse" />
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                            <div className="h-16 rounded-2xl bg-[rgba(209,199,189,0.25)] animate-pulse" />
                            <div className="h-16 rounded-2xl bg-[rgba(209,199,189,0.25)] animate-pulse" />
                          </div>
                        </div>
                      ) : teamDetails ? (
                        <div className="space-y-6">
                          {/* Team Overview Card */}
                          <div className="surface-raised rounded-3xl p-6 border border-[rgba(209,199,189,0.7)] shadow-e1">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <span className="font-mono text-xs font-bold text-primary bg-[rgba(114,56,61,0.08)] px-2.5 py-0.5 rounded-md border border-[rgba(114,56,61,0.2)]">
                                    {teamDetails.teamCode}
                                  </span>
                                  <span className="text-xs font-bold text-muted uppercase">
                                    {teamDetails.status === 'forming' ? 'Forming' : 'Locked'}
                                  </span>
                                  {teamDetails.leaderId === user?.userId && (
                                    <span className="text-[10px] font-bold text-primary bg-[rgba(114,56,61,0.12)] px-2 py-0.5 rounded-md">
                                      Leader View
                                    </span>
                                  )}
                                </div>
                                <h3 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight truncate">
                                  {teamDetails.name}
                                </h3>

                                {/* Clean Human-Readable Themes Box */}
                                <div className="mt-3 space-y-2 p-3.5 rounded-2xl bg-[rgba(248,246,242,0.7)] border border-[rgba(209,199,189,0.6)] text-xs">
                                  {teamDetails.track && (
                                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                                      <span className="text-[10px] uppercase font-bold tracking-wider text-muted shrink-0 sm:w-28">
                                        Primary Theme:
                                      </span>
                                      <span className="font-bold text-primary">
                                        {teamDetails.track.name}{' '}
                                        <span className="font-normal text-muted text-[11px]">
                                          ({teamDetails.track.problemStatementCode})
                                        </span>
                                      </span>
                                    </div>
                                  )}
                                  {teamDetails.secondaryTrack && (
                                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                                      <span className="text-[10px] uppercase font-bold tracking-wider text-muted shrink-0 sm:w-28">
                                        Secondary Theme:
                                      </span>
                                      <span className="font-semibold text-foreground">
                                        {teamDetails.secondaryTrack.name}{' '}
                                        <span className="font-normal text-muted text-[11px]">
                                          ({teamDetails.secondaryTrack.problemStatementCode})
                                        </span>
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Capacity & Open Seats Badge */}
                              <div className="flex flex-col sm:items-end gap-1.5 shrink-0">
                                <span className="px-3 py-1 rounded-full bg-[rgba(248,246,242,0.9)] border border-[rgba(209,199,189,0.8)] text-xs font-bold text-foreground inline-flex items-center gap-1.5">
                                  <span>{(teamDetails.members?.length || teamDetails.memberCount || 1)} / 6 Members</span>
                                </span>
                                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md text-right ${
                                  Math.max(0, 6 - (teamDetails.members?.length || teamDetails.memberCount || 1)) > 0
                                    ? 'text-primary bg-[rgba(114,56,61,0.08)]'
                                    : 'text-muted bg-[rgba(209,199,189,0.4)]'
                                }`}>
                                  {Math.max(0, 6 - (teamDetails.members?.length || teamDetails.memberCount || 1))} Open Seat{Math.max(0, 6 - (teamDetails.members?.length || teamDetails.memberCount || 1)) !== 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>

                            {/* Member Roster */}
                            <div className="mt-4 pt-4 border-t border-[rgba(209,199,189,0.5)]">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-label uppercase tracking-wider text-muted font-bold">Team Roster</h4>
                                <span className="text-[11px] text-muted font-semibold">
                                  {teamDetails.members?.length || 1} of 6 filled
                                </span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {teamDetails.members?.map((m: any) => (
                                  <div
                                    key={m.userId}
                                    className="flex items-center gap-3 p-3 rounded-2xl bg-[rgba(248,246,242,0.7)] border border-[rgba(209,199,189,0.6)] text-xs min-w-0"
                                  >
                                    <Avatar avatarUrl={m.avatarUrl} name={m.name} className="size-9 shrink-0" />
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-bold text-foreground truncate">{m.name}</span>
                                        {m.userId === teamDetails.leaderId && (
                                          <span className="text-[9px] font-bold text-primary bg-[rgba(114,56,61,0.12)] px-1.5 py-0.5 rounded shrink-0">LEAD</span>
                                        )}
                                        {m.userId === user?.userId && (
                                          <span className="text-[9px] font-semibold text-muted bg-white/80 px-1 rounded border border-[rgba(209,199,189,0.6)] shrink-0">You</span>
                                        )}
                                      </div>
                                      <p className="text-[11px] text-muted truncate mt-0.5">{m.branch || 'Student'} • {m.year || 'General'}</p>
                                      {m.skills && m.skills.length > 0 && (
                                        <p className="text-[10px] text-primary font-medium truncate mt-0.5">
                                          {m.skills.slice(0, 3).join(', ')}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Team Space Actions */}
                            <div className="mt-5 pt-4 border-t border-[rgba(209,199,189,0.5)] flex flex-wrap items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <PremiumButton
                                  size="sm"
                                  variant="glass"
                                  onClick={() => router.push(`/teams/${teamDetails.id}`)}
                                >
                                  View Public Team Page
                                </PremiumButton>
                                {teamDetails.leaderId === user?.userId && (
                                  <PremiumButton
                                    size="sm"
                                    onClick={() => router.push('/team-formation/browse-teammates')}
                                  >
                                    <Users className="size-3.5" />
                                    <span>Invite Teammates</span>
                                  </PremiumButton>
                                )}
                              </div>

                              {teamDetails.leaderId === user?.userId && teamDetails.joinRequests && teamDetails.joinRequests.length > 0 && (
                                <button
                                  onClick={() => setActiveTab('requests')}
                                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                                >
                                  <span>Review {teamDetails.joinRequests.filter((r: any) => r.status === 'pending').length} Pending Request(s)</span>
                                  <ArrowUpRight className="size-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Teamless State */
                        <div className="surface-raised rounded-3xl p-8 sm:p-10 text-center border border-[rgba(209,199,189,0.7)] shadow-e1">
                          <div className="size-16 rounded-3xl bg-[rgba(114,56,61,0.08)] border border-[rgba(114,56,61,0.18)] flex items-center justify-center text-primary mx-auto mb-4">
                            <Users className="size-8" />
                          </div>
                          <h3 className="text-heading font-extrabold text-foreground mb-2">You are not in a team yet</h3>
                          <p className="text-xs text-muted max-w-md mx-auto mb-6 leading-relaxed">
                            Form a new team of up to 6 members or browse existing teams looking for your skills in Smart India Hackathon 2026.
                          </p>

                          {sentRequests.length > 0 && (
                            <div className="mb-6 p-3 rounded-2xl border border-[rgba(114,56,61,0.25)] bg-[rgba(114,56,61,0.06)] max-w-md mx-auto flex items-center justify-between text-xs text-primary font-semibold">
                              <span>You have {sentRequests.length} active join request{sentRequests.length > 1 ? 's' : ''}.</span>
                              <button
                                onClick={() => setActiveTab('requests')}
                                className="underline font-bold hover:opacity-80"
                              >
                                View Status
                              </button>
                            </div>
                          )}

                          <div className="flex flex-wrap items-center justify-center gap-3">
                            <PremiumButton size="sm" onClick={() => router.push('/team-formation/browse-teams')}>
                              <Search className="size-3.5" />
                              <span>Browse Teams & Post Join Request</span>
                            </PremiumButton>
                            <PremiumButton variant="glass" size="sm" onClick={() => router.push('/team-formation/create-team')}>
                              <Plus className="size-3.5" />
                              <span>Create a New Team</span>
                            </PremiumButton>
                            <PremiumButton variant="glass" size="sm" onClick={() => router.push('/team-formation/browse-teammates')}>
                              <Users className="size-3.5" />
                              <span>Browse Teammates</span>
                            </PremiumButton>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 2: Invites & Requests */}
                  {activeTab === 'requests' && (
                    <div className="space-y-6">
                      {/* Received Invites */}
                      <div className="surface-raised rounded-3xl p-6 border border-[rgba(209,199,189,0.7)] shadow-e1">
                        <h3 className="text-feature text-foreground font-bold mb-4">Received Team Invites</h3>
                        {receivedInvites.length === 0 ? (
                          <p className="text-xs text-muted italic">No team invites received at this moment.</p>
                        ) : (
                          <div className="space-y-3">
                            {receivedInvites.map((inv: any) => (
                              <div
                                key={inv.id}
                                className="flex items-center justify-between p-3.5 rounded-2xl bg-[rgba(248,246,242,0.7)] border border-[rgba(209,199,189,0.6)]"
                              >
                                <div>
                                  <h4 className="text-sm font-bold text-foreground">{inv.team?.name}</h4>
                                  <p className="text-xs text-muted">Theme: {inv.team?.track?.problemStatementCode || 'General'}</p>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleRespondInvite(inv.id, 'accept')}
                                    className="px-3 py-1.5 rounded-xl bg-primary text-on-accent text-xs font-semibold hover:opacity-90"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => handleRespondInvite(inv.id, 'decline')}
                                    className="px-3 py-1.5 rounded-xl border border-[rgba(209,199,189,0.8)] bg-white text-xs font-semibold text-body hover:bg-[rgba(209,199,189,0.2)]"
                                  >
                                    Decline
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Sent Join Requests */}
                      <div className="surface-raised rounded-3xl p-6 border border-[rgba(209,199,189,0.7)] shadow-e1">
                        <h3 className="text-feature text-foreground font-bold mb-4">Sent Join Requests</h3>
                        {sentRequests.length === 0 ? (
                          <p className="text-xs text-muted italic">You have no active requests sent to teams.</p>
                        ) : (
                          <div className="space-y-3">
                            {sentRequests.map((req: any) => (
                              <div
                                key={req.id}
                                className="flex items-center justify-between p-3.5 rounded-2xl bg-[rgba(248,246,242,0.7)] border border-[rgba(209,199,189,0.6)] text-xs"
                              >
                                <div>
                                  <h4 className="font-bold text-foreground">{req.team?.name}</h4>
                                  <p className="text-muted">Theme: {req.team?.track?.problemStatementCode || 'General'}</p>
                                </div>
                                <span className="font-bold text-primary bg-[rgba(114,56,61,0.08)] px-2.5 py-1 rounded-lg uppercase text-[10px]">
                                  {req.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Incoming Join Requests (for Leader) */}
                      {teamDetails?.joinRequests && teamDetails.joinRequests.length > 0 && (
                        <div className="surface-raised rounded-3xl p-6 border border-[rgba(209,199,189,0.7)] shadow-e1">
                          <h3 className="text-feature text-foreground font-bold mb-4">Incoming Join Requests</h3>
                          <div className="space-y-3">
                            {teamDetails.joinRequests.map((req: any) => (
                              <div
                                key={req.id}
                                className="flex items-center justify-between p-3.5 rounded-2xl bg-[rgba(248,246,242,0.7)] border border-[rgba(209,199,189,0.6)]"
                              >
                                <div className="flex items-center gap-3">
                                  <Avatar avatarUrl={req.student?.avatarUrl} name={req.student?.name} className="size-10" />
                                  <div>
                                    <h4 className="text-sm font-bold text-foreground">{req.student?.name}</h4>
                                    <p className="text-xs text-muted">{req.student?.branch} • {req.student?.year}</p>
                                  </div>
                                </div>
                                {req.status === 'pending' ? (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleRespondJoinRequest(req.id, 'accept')}
                                      className="px-3 py-1.5 rounded-xl bg-primary text-on-accent text-xs font-semibold hover:opacity-90"
                                    >
                                      Accept
                                    </button>
                                    <button
                                      onClick={() => handleRespondJoinRequest(req.id, 'decline')}
                                      className="px-3 py-1.5 rounded-xl border border-[rgba(209,199,189,0.8)] bg-white text-xs font-semibold text-body hover:bg-[rgba(209,199,189,0.2)]"
                                    >
                                      Decline
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-xs font-semibold text-muted uppercase">{req.status}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </Container>
      </main>

      {/* Progressive Modals */}
      <AnimatePresence>
        {activeModal === 'personal' && (
          <PersonalInfoModal
            initialData={personalSummary}
            onClose={() => setActiveModal(null)}
            onSuccess={handlePersonalSaved}
          />
        )}
        {activeModal === 'skills' && (
          <SkillsFluencyModal
            initialData={skillsSummary}
            onClose={() => setActiveModal(null)}
            onSuccess={handleSkillsSaved}
          />
        )}
        {activeModal === 'themes' && (
          <ThemesLinksModal
            initialData={themesSummary}
            onClose={() => setActiveModal(null)}
            onSuccess={handleThemesSaved}
          />
        )}
        {activeModal === 'mentor_personal' && (
          <MentorPersonalModal
            initialData={user}
            onClose={() => setActiveModal(null)}
            onSuccess={handleMentorProfileSaved}
          />
        )}
        {activeModal === 'mentor_expertise' && (
          <MentorExpertiseModal
            initialData={user}
            onClose={() => setActiveModal(null)}
            onSuccess={handleMentorProfileSaved}
          />
        )}
        {activeModal === 'mentor_bio' && (
          <MentorBioModal
            initialData={user}
            onClose={() => setActiveModal(null)}
            onSuccess={handleMentorProfileSaved}
          />
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
