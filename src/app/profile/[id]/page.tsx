'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, Code2, Crown, FlaskConical, Palette, PenLine, Terminal, type LucideIcon } from 'lucide-react';
import Icon from '@/components/ui/Icon';
import { Container, ProfileSkeleton } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Aurora, PremiumButton, SpotlightCard } from '@/components/motion';
import { logger } from '@/lib/logger';
import Image from 'next/image';

interface Track {
  id: string;
  name: string;
  code: string;
}

interface StudentProfile {
  name: string;
  year: string;
  branch: string;
  gender: string;
  rollNo?: string | null;
  section: string;
  skills: string[];
  languages: string[];
  softSkills: string[];
  resumeUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  avatarUrl?: string | null;
  tracksDetailed?: Track[];
  email: string;
  contact?: string | null;
}

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
  className = '',
}: {
  avatarUrl?: string | null;
  name: string;
  className?: string;
}) {
  if (avatarUrl?.startsWith('data:image/') || avatarUrl?.startsWith('http')) {
    return (
      <Image
        unoptimized
        src={avatarUrl}
        alt={`${name}'s profile`}
        width={128}
        height={128}
        className={`object-cover rounded-2xl ${className}`}
      />
    );
  }

  const preset = AVATAR_PRESETS[avatarUrl || 'developer'] || AVATAR_PRESETS.developer;
  return (
    <span
      role="img"
      aria-label={`${name}'s profile`}
      className={`flex items-center justify-center bg-gradient-to-br text-body rounded-2xl ${preset.wash} ${className}`}
    >
      <Icon icon={preset.icon} size="lg" />
    </span>
  );
}

const classifySkillDomain = (name: string): 'Engineering' | 'Design' | 'Communication' => {
  const n = name.toLowerCase();
  if (
    n.includes('figma') || n.includes('design') || n.includes('ux') ||
    n.includes('ui') || n.includes('adobe') || n.includes('canva') ||
    n.includes('wireframe') || n.includes('prototype') || n.includes('editing') ||
    n.includes('ppt')
  ) {
    return 'Design';
  }
  if (
    n.includes('speaking') || n.includes('writing') || n.includes('management') ||
    n.includes('english') || n.includes('hindi') || n.includes('sanskrit') ||
    n.includes('punjabi') || n.includes('tamil') || n.includes('telugu') ||
    n.includes('bengali') || n.includes('marathi') || n.includes('gujarati') ||
    n.includes('kannada') || n.includes('malayalam')
  ) {
    return 'Communication';
  }
  return 'Engineering';
};

const DOMAIN_SWATCH = {
  Engineering: '#72383D',
  Design: '#AC9C8D',
  Communication: '#322D29',
} as const;

const getStudentSkillBalance = (profile: StudentProfile) => {
  const allSelected = [...profile.skills, ...profile.softSkills, ...profile.languages];

  if (allSelected.length === 0) {
    return {
      total: 0,
      engineering: { count: 0, pct: 0 },
      design: { count: 0, pct: 0 },
      communication: { count: 0, pct: 0 },
    };
  }

  let eng = 0;
  let des = 0;
  let comm = 0;

  allSelected.forEach((item) => {
    const domain = classifySkillDomain(item);
    if (domain === 'Engineering') eng++;
    else if (domain === 'Design') des++;
    else comm++;
  });

  const total = allSelected.length;

  return {
    total,
    engineering: { count: eng, pct: Math.round((eng / total) * 100) },
    design: { count: des, pct: Math.round((des / total) * 100) },
    communication: { count: comm, pct: Math.round((comm / total) * 100) },
  };
};

export default function StudentProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch(`/api/profile/student?userId=${params.id}`);
        const data = await res.json();
        if (data.success) {
          setProfile(data.profile);
        } else {
          toast(data.error || 'Failed to load profile.', 'error');
        }
      } catch (err) {
        logger.error('Load target profile failed', err);
        toast('Failed to load profile. Please verify your connection.', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [params.id, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
        <Navbar />
        <main className="flex-1">
          <ProfileSkeleton />
        </main>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
        <Navbar />
        <Container width="narrow" className="py-20 text-center">
          <h2 className="text-2xl font-black text-foreground">Profile not found</h2>
          <p className="mt-2 text-muted text-sm">The student you are looking for does not have an active profile.</p>
          <PremiumButton variant="glass" className="mt-6" onClick={() => router.push('/team-formation/find-teammates')}>
            Back to Teammates
          </PremiumButton>
        </Container>
        <Footer />
      </div>
    );
  }

  const balance = getStudentSkillBalance(profile);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <Navbar />

      <main className="flex-1">
        <section className="section-dune relative overflow-hidden pb-10">
          <Aurora variant="warm" spotlight={false} />
          <Container width="narrow" className="relative pt-8">
            <button
              onClick={() => router.back()}
              className="group mb-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted transition-colors hover:text-primary"
            >
              <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
              Back
            </button>

            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <Avatar avatarUrl={profile.avatarUrl} name={profile.name} className="size-20 shrink-0 shadow-md" />
                <div className="min-w-0">
                  <h1 className="text-3xl font-extrabold leading-none tracking-tight text-foreground sm:text-4xl truncate">
                    {profile.name}
                  </h1>
                  <p className="mt-2 text-sm font-semibold text-primary uppercase tracking-wider">
                    Student{profile.branch || profile.year ? ` · ${profile.branch || ''} ${profile.year ? `(${profile.year})` : ''}` : ''}
                  </p>
                </div>
              </div>
            </div>
          </Container>
        </section>

        <section className="relative border-t border-[rgba(209,199,189,0.55)]">
          <div className="surface-sunken">
            <Container width="narrow" className="py-12 space-y-6">
              {/* Bento Grid */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Academic Details */}
                <SpotlightCard className="rounded-3xl">
                  <div className="surface-raised rounded-3xl p-6 sm:p-7 space-y-5">
                    <h2 className="text-feature text-foreground">Academic Details</h2>
                    <div className="h-px bg-gradient-to-r from-[rgba(172,156,141,0.55)] via-[rgba(209,199,189,0.35)] to-transparent" />
                    <dl className="grid grid-cols-2 gap-4 text-sm">
                      {[
                        ['Year of study', profile.year || 'N/A'],
                        ['Academic branch', profile.branch || 'N/A'],
                        profile.rollNo ? ['Roll number', profile.rollNo] : null,
                        ['Section', profile.section ? `Section ${profile.section}` : 'N/A'],
                        ['Gender', profile.gender || 'N/A'],
                      ].filter((x): x is [string, string] => x !== null).map(([k, v]) => (
                        <div key={k}>
                          <dt className="text-label uppercase text-muted text-xs">{k}</dt>
                          <dd className="mt-1 font-bold text-foreground text-sm">{v}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </SpotlightCard>

                {/* Skill Split Chart */}
                {balance.total > 0 && (
                  <SpotlightCard className="rounded-3xl">
                    <div className="surface-raised rounded-3xl p-6 sm:p-7 space-y-5">
                      <h2 className="text-feature text-foreground">Skill Balance</h2>
                      <div className="h-px bg-gradient-to-r from-[rgba(172,156,141,0.55)] via-[rgba(209,199,189,0.35)] to-transparent" />
                      <div className="flex flex-col items-center gap-6 sm:flex-row">
                        <div className="relative grid size-24 shrink-0 place-items-center">
                          <svg className="size-full -rotate-90" viewBox="0 0 36 36" aria-hidden>
                            <circle
                              cx="18"
                              cy="18"
                              r="15.915"
                              fill="transparent"
                              stroke="rgba(209,199,189,0.3)"
                              strokeWidth="3.2"
                            />
                            {(
                              [
                                ['Engineering', balance.engineering.pct, 0],
                                ['Design', balance.design.pct, balance.engineering.pct],
                                [
                                  'Communication',
                                  balance.communication.pct,
                                  balance.engineering.pct + balance.design.pct,
                                ],
                              ] as const
                            ).map(
                              ([domain, pct, offset]) =>
                                pct > 0 && (
                                  <circle
                                    key={domain}
                                    cx="18"
                                    cy="18"
                                    r="15.915"
                                    fill="transparent"
                                    stroke={DOMAIN_SWATCH[domain]}
                                    strokeWidth="3.4"
                                    strokeDasharray={`${pct} ${100 - pct}`}
                                    strokeDashoffset={`-${offset}`}
                                  />
                                )
                            )}
                          </svg>
                          <div className="pointer-events-none absolute text-center">
                            <span className="block text-xl font-extrabold leading-none tracking-tight text-foreground">
                              {balance.total}
                            </span>
                            <span className="mt-0.5 block text-[8px] uppercase tracking-wider text-muted">
                              skills
                            </span>
                          </div>
                        </div>

                        <div className="w-full flex-1 space-y-2">
                          <span className="block text-xs font-bold text-foreground uppercase tracking-wider">
                            Domain Distribution
                          </span>
                          <div className="space-y-1.5 text-xs">
                            {(
                              [
                                ['Engineering', 'Engineering & code', balance.engineering],
                                ['Design', 'Design & UI/UX', balance.design],
                                ['Communication', 'Communication & soft skills', balance.communication],
                              ] as const
                            ).map(([key, label, val]) => (
                              <div key={key} className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5 text-muted">
                                  <span
                                    className="size-2 rounded-full"
                                    style={{ backgroundColor: DOMAIN_SWATCH[key] }}
                                  />
                                  {label}
                                </span>
                                <span className="font-bold text-foreground">
                                  {val.count} ({val.pct}%)
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </SpotlightCard>
                )}
              </div>

              {/* Skills Panel */}
              <SpotlightCard className="rounded-3xl">
                <div className="surface-raised rounded-3xl p-6 sm:p-7 space-y-6">
                  <h2 className="text-feature text-foreground">Skills &amp; Fluency</h2>
                  <div className="h-px bg-gradient-to-r from-[rgba(172,156,141,0.55)] via-[rgba(209,199,189,0.35)] to-transparent" />
                  
                  <div className="space-y-5">
                    {profile.skills.length === 0 && profile.softSkills.length === 0 && profile.languages.length === 0 && (
                      <p className="text-sm text-muted">No skills listed yet.</p>
                    )}

                    {profile.skills.length > 0 && (
                      <div>
                        <span className="block text-label uppercase text-muted text-xs mb-2">Technical Skills</span>
                        <div className="flex flex-wrap gap-1.5">
                          {profile.skills.map((sk) => (
                            <span
                              key={sk}
                              className="rounded-md border border-[rgba(114,56,61,0.22)] bg-[rgba(114,56,61,0.08)] px-2.5 py-0.5 text-xs font-semibold text-primary"
                            >
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {profile.softSkills.length > 0 && (
                      <div>
                        <span className="block text-label uppercase text-muted text-xs mb-2">Soft Skills</span>
                        <div className="flex flex-wrap gap-1.5">
                          {profile.softSkills.map((sk) => (
                            <span
                              key={sk}
                              className="rounded-md border border-[rgba(172,156,141,0.55)] bg-[rgba(172,156,141,0.18)] px-2.5 py-0.5 text-xs font-semibold text-foreground"
                            >
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {profile.languages.length > 0 && (
                      <div>
                        <span className="block text-label uppercase text-muted text-xs mb-2">Languages</span>
                        <div className="flex flex-wrap gap-1.5">
                          {profile.languages.map((ln) => (
                            <span
                              key={ln}
                              className="rounded-md border border-[rgba(209,199,189,0.7)] bg-[rgba(239,233,225,0.8)] px-2.5 py-0.5 text-xs font-semibold text-body"
                            >
                              {ln}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </SpotlightCard>

              {/* Preferences & Contact */}
              <SpotlightCard className="rounded-3xl">
                <div className="surface-raised rounded-3xl p-6 sm:p-7 space-y-6">
                  <h2 className="text-feature text-foreground">Preferences &amp; Contact</h2>
                  <div className="h-px bg-gradient-to-r from-[rgba(172,156,141,0.55)] via-[rgba(209,199,189,0.35)] to-transparent" />
                  
                  <div className="space-y-5">
                    {profile.tracksDetailed && profile.tracksDetailed.length > 0 ? (
                      <div>
                        <span className="block text-label uppercase text-muted text-xs mb-2">Problem Statement Tracks</span>
                        <div className="space-y-2">
                          {profile.tracksDetailed.map((t) => (
                            <div
                              key={t.id}
                              className="rounded-xl border border-[rgba(209,199,189,0.6)] bg-white/40 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                            >
                              <div>
                                <span className="text-xs font-bold text-primary">{t.code}</span>
                                <p className="text-xs font-bold text-foreground mt-0.5">{t.name}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <span className="block text-label uppercase text-muted text-xs mb-2">Problem Statement Tracks</span>
                        <p className="text-sm text-muted">No tracks chosen yet.</p>
                      </div>
                    )}

                    <div>
                      <span className="block text-label uppercase text-muted text-xs mb-3">Contact Details &amp; Professional Profiles</span>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {/* Email Card/Button */}
                        <a
                          href={`mailto:${profile.email}`}
                          className="flex items-center gap-3 rounded-xl border border-[rgba(209,199,189,0.6)] bg-white/50 p-3 hover:border-primary/40 hover:text-primary transition-all duration-200"
                        >
                          <div className="size-8 rounded-lg bg-[rgba(114,56,61,0.08)] text-primary flex items-center justify-center shrink-0">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4">
                              <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="block text-[9px] font-black uppercase text-muted tracking-wider">Email Address</span>
                            <span className="block text-xs font-bold text-foreground truncate">{profile.email}</span>
                          </div>
                        </a>

                        {/* Phone Card/Button (if provided) */}
                        {profile.contact && (
                          <a
                            href={`tel:${profile.contact}`}
                            className="flex items-center gap-3 rounded-xl border border-[rgba(209,199,189,0.6)] bg-white/50 p-3 hover:border-primary/40 hover:text-primary transition-all duration-200"
                          >
                            <div className="size-8 rounded-lg bg-[rgba(114,56,61,0.08)] text-primary flex items-center justify-center shrink-0">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4">
                                <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="block text-[9px] font-black uppercase text-muted tracking-wider">Phone Number</span>
                              <span className="block text-xs font-bold text-foreground truncate">{profile.contact}</span>
                            </div>
                          </a>
                        )}

                        {/* GitHub Button */}
                        {profile.githubUrl && (
                          <a
                            href={profile.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 rounded-xl border border-[rgba(209,199,189,0.6)] bg-white/50 p-3 hover:border-primary/40 hover:text-primary transition-all duration-200"
                          >
                            <div className="size-8 rounded-lg bg-[rgba(114,56,61,0.08)] text-primary flex items-center justify-center shrink-0">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4">
                                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="block text-[9px] font-black uppercase text-muted tracking-wider">GitHub Profile</span>
                              <span className="block text-xs font-bold text-foreground truncate">View GitHub</span>
                            </div>
                          </a>
                        )}

                        {/* LinkedIn Button */}
                        {profile.linkedinUrl && (
                          <a
                            href={profile.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 rounded-xl border border-[rgba(209,199,189,0.6)] bg-white/50 p-3 hover:border-primary/40 hover:text-primary transition-all duration-200"
                          >
                            <div className="size-8 rounded-lg bg-[rgba(114,56,61,0.08)] text-primary flex items-center justify-center shrink-0">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4">
                                <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zM4 2a2 2 0 110 4 2 2 0 010-4z" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="block text-[9px] font-black uppercase text-muted tracking-wider">LinkedIn Profile</span>
                              <span className="block text-xs font-bold text-foreground truncate">View LinkedIn</span>
                            </div>
                          </a>
                        )}

                        {/* Résumé Button */}
                        {profile.resumeUrl && (
                          <a
                            href={profile.resumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 rounded-xl border border-[rgba(209,199,189,0.6)] bg-white/50 p-3 hover:border-primary/40 hover:text-primary transition-all duration-200"
                          >
                            <div className="size-8 rounded-lg bg-[rgba(114,56,61,0.08)] text-primary flex items-center justify-center shrink-0">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4">
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="block text-[9px] font-black uppercase text-muted tracking-wider">Student Résumé</span>
                              <span className="block text-xs font-bold text-foreground truncate">View Résumé</span>
                            </div>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </SpotlightCard>
            </Container>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
