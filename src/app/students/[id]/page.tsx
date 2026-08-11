'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft,
  ArrowUpRight,
  Code2,
  Crown,
  FileText,
  FlaskConical,
  GraduationCap,
  Mail,
  Palette,
  PenLine,
  Phone,
  Terminal,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react';
import Icon from '@/components/ui/Icon';
import { Container, ProfileSkeleton } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Aurora, PremiumButton, SpotlightCard } from '@/components/motion';
import { logger } from '@/lib/logger';

interface Track {
  id: string;
  name: string;
  code: string;
}

interface StudentProfile {
  userId: string;
  name: string;
  year: string;
  branch: string;
  gender?: string | null;
  rollNo?: string | null;
  section?: string | null;
  category?: string | null;
  college?: string | null;
  skills: string[];
  languages: string[];
  softSkills: string[];
  resumeUrl?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  avatarUrl?: string | null;
  email: string;
  contact?: string | null;
  teamStatus?: string | null;
  roleInTeam?: string | null;
  team?: {
    id: string;
    teamCode: string;
    name: string;
    mentorId?: string | null;
  } | null;
  tracksDetailed?: Track[];
}

const AVATAR_PRESETS: Record<string, { icon: LucideIcon; wash: string }> = {
  hacker: { icon: Terminal, wash: 'from-[#AC9C8D] to-[#D1C7BD]' },
  developer: { icon: Code2, wash: 'from-[#D1C7BD] to-[#EFE9E1]' },
  designer: { icon: Palette, wash: 'from-[#D9D9D9] to-[#AC9C8D]' },
  scientist: { icon: FlaskConical, wash: 'from-[#EFE9E1] to-[#D1C7BD]' },
  manager: { icon: Crown, wash: 'from-[#AC9C8D] to-[#D9D9D9]' },
  writer: { icon: PenLine, wash: 'from-[#D1C7BD] to-[#D9D9D9]' },
};

function StudentAvatar({
  avatarUrl,
  name,
  className = 'size-20',
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
        alt={`${name}'s profile avatar`}
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

const classifyDomain = (name: string): 'Engineering' | 'Design' | 'Communication' => {
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
    n.includes('english') || n.includes('hindi')
  ) {
    return 'Communication';
  }
  return 'Engineering';
};

const DOMAIN_COLOR = {
  Engineering: '#72383D',
  Design: '#AC9C8D',
  Communication: '#322D29',
} as const;

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
          toast(data.error || 'Failed to load student profile.', 'error');
        }
      } catch (err) {
        logger.error('Load target student profile error', err);
        toast('Failed to load profile. Check your connection.', 'error');
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
          <h2 className="text-2xl font-bold text-foreground">Student Profile Not Found</h2>
          <p className="mt-2 text-sm text-muted">The student profile you requested could not be located.</p>
          <PremiumButton variant="glass" className="mt-6" onClick={() => router.back()}>
            Back Previous
          </PremiumButton>
        </Container>
        <Footer />
      </div>
    );
  }

  const allSkills = [...profile.skills, ...profile.softSkills, ...profile.languages];
  let eng = 0, des = 0, comm = 0;
  allSkills.forEach((item) => {
    const d = classifyDomain(item);
    if (d === 'Engineering') eng++;
    else if (d === 'Design') des++;
    else comm++;
  });
  const totalSkills = allSkills.length;
  const engPct = totalSkills > 0 ? Math.round((eng / totalSkills) * 100) : 0;
  const desPct = totalSkills > 0 ? Math.round((des / totalSkills) * 100) : 0;
  const commPct = totalSkills > 0 ? Math.round((comm / totalSkills) * 100) : 0;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <Navbar />

      <main className="flex-1">
        {/* Banner Section */}
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
                <StudentAvatar avatarUrl={profile.avatarUrl} name={profile.name} className="size-20 shrink-0 shadow-md" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-[rgba(114,56,61,0.3)] bg-[rgba(114,56,61,0.08)] px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-primary">
                      STUDENT
                    </span>
                    {profile.team && (
                      <button
                        onClick={() => router.push(`/teams/${profile.team!.id}`)}
                        className="rounded-full border border-[rgba(209,199,189,0.7)] bg-white/50 px-2.5 py-0.5 text-[10px] font-bold text-foreground hover:border-primary transition-colors"
                      >
                        Team: {profile.team.name} ({profile.roleInTeam || 'Member'})
                      </button>
                    )}
                  </div>

                  <h1 className="mt-2 text-3xl font-extrabold leading-none tracking-tight text-foreground sm:text-4xl truncate">
                    {profile.name}
                  </h1>

                  <p className="mt-1 text-sm font-semibold text-muted">
                    {profile.branch} · {profile.year} {profile.section ? `(Section ${profile.section})` : ''}
                  </p>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* Details Section */}
        <section className="relative border-t border-[rgba(209,199,189,0.55)]">
          <div className="surface-sunken">
            <Container width="narrow" className="py-12 space-y-6">
              {/* Bento Grid */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Academic Information */}
                <SpotlightCard className="rounded-3xl">
                  <div className="surface-raised rounded-3xl p-6 sm:p-7 space-y-5">
                    <h2 className="text-feature text-foreground">Academic Details</h2>
                    <div className="h-px bg-gradient-to-r from-[rgba(172,156,141,0.55)] via-[rgba(209,199,189,0.35)] to-transparent" />

                    <dl className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <dt className="text-label uppercase text-muted text-xs">Course / Branch</dt>
                        <dd className="mt-1 font-bold text-foreground">{profile.branch || 'N/A'}</dd>
                      </div>
                      <div>
                        <dt className="text-label uppercase text-muted text-xs">Year of Study</dt>
                        <dd className="mt-1 font-bold text-foreground">{profile.year || 'N/A'}</dd>
                      </div>
                      {profile.rollNo && (
                        <div>
                          <dt className="text-label uppercase text-muted text-xs">Roll Number</dt>
                          <dd className="mt-1 font-bold text-foreground">{profile.rollNo}</dd>
                        </div>
                      )}
                      <div>
                        <dt className="text-label uppercase text-muted text-xs">Class Section</dt>
                        <dd className="mt-1 font-bold text-foreground">{profile.section ? `Section ${profile.section}` : 'N/A'}</dd>
                      </div>
                      <div>
                        <dt className="text-label uppercase text-muted text-xs">Gender</dt>
                        <dd className="mt-1 font-bold text-foreground">{profile.gender || 'N/A'}</dd>
                      </div>
                      <div>
                        <dt className="text-label uppercase text-muted text-xs">Institution</dt>
                        <dd className="mt-1 font-bold text-foreground truncate">{profile.college || 'GL Bajaj Group of Institutions'}</dd>
                      </div>
                    </dl>
                  </div>
                </SpotlightCard>

                {/* Skill Split Chart */}
                {totalSkills > 0 && (
                  <SpotlightCard className="rounded-3xl">
                    <div className="surface-raised rounded-3xl p-6 sm:p-7 space-y-5">
                      <h2 className="text-feature text-foreground">Skill Domain Breakdown</h2>
                      <div className="h-px bg-gradient-to-r from-[rgba(172,156,141,0.55)] via-[rgba(209,199,189,0.35)] to-transparent" />

                      <div className="flex flex-col items-center gap-6 sm:flex-row">
                        <div className="relative grid size-24 shrink-0 place-items-center">
                          <svg className="size-full -rotate-90" viewBox="0 0 36 36" aria-hidden>
                            <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="rgba(209,199,189,0.3)" strokeWidth="3.2" />
                            {engPct > 0 && (
                              <circle cx="18" cy="18" r="15.915" fill="transparent" stroke={DOMAIN_COLOR.Engineering} strokeWidth="3.4" strokeDasharray={`${engPct} ${100 - engPct}`} strokeDashoffset="0" />
                            )}
                            {desPct > 0 && (
                              <circle cx="18" cy="18" r="15.915" fill="transparent" stroke={DOMAIN_COLOR.Design} strokeWidth="3.4" strokeDasharray={`${desPct} ${100 - desPct}`} strokeDashoffset={`-${engPct}`} />
                            )}
                            {commPct > 0 && (
                              <circle cx="18" cy="18" r="15.915" fill="transparent" stroke={DOMAIN_COLOR.Communication} strokeWidth="3.4" strokeDasharray={`${commPct} ${100 - commPct}`} strokeDashoffset={`-${engPct + desPct}`} />
                            )}
                          </svg>
                          <div className="pointer-events-none absolute text-center">
                            <span className="block text-xl font-extrabold leading-none tracking-tight text-foreground">
                              {totalSkills}
                            </span>
                            <span className="mt-0.5 block text-[8px] uppercase tracking-wider text-muted">
                              skills
                            </span>
                          </div>
                        </div>

                        <div className="w-full flex-1 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-muted">
                              <span className="size-2 rounded-full" style={{ backgroundColor: DOMAIN_COLOR.Engineering }} />
                              Engineering &amp; Dev
                            </span>
                            <span className="font-bold text-foreground">{eng} ({engPct}%)</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-muted">
                              <span className="size-2 rounded-full" style={{ backgroundColor: DOMAIN_COLOR.Design }} />
                              Design &amp; UI/UX
                            </span>
                            <span className="font-bold text-foreground">{des} ({desPct}%)</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-muted">
                              <span className="size-2 rounded-full" style={{ backgroundColor: DOMAIN_COLOR.Communication }} />
                              Communication
                            </span>
                            <span className="font-bold text-foreground">{comm} ({commPct}%)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </SpotlightCard>
                )}
              </div>

              {/* Technical & Soft Skills */}
              <SpotlightCard className="rounded-3xl">
                <div className="surface-raised rounded-3xl p-6 sm:p-7 space-y-6">
                  <h2 className="text-feature text-foreground">Skills &amp; Capabilities</h2>
                  <div className="h-px bg-gradient-to-r from-[rgba(172,156,141,0.55)] via-[rgba(209,199,189,0.35)] to-transparent" />

                  <div className="space-y-5">
                    {profile.skills.length > 0 && (
                      <div>
                        <span className="block text-label uppercase text-muted text-xs mb-2">Technical Skills</span>
                        <div className="flex flex-wrap gap-1.5">
                          {profile.skills.map((sk) => (
                            <span
                              key={sk}
                              className="rounded-md border border-[rgba(114,56,61,0.22)] bg-[rgba(114,56,61,0.08)] px-2.5 py-1 text-xs font-semibold text-primary"
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
                              className="rounded-md border border-[rgba(172,156,141,0.55)] bg-[rgba(172,156,141,0.18)] px-2.5 py-1 text-xs font-semibold text-foreground"
                            >
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {profile.languages.length > 0 && (
                      <div>
                        <span className="block text-label uppercase text-muted text-xs mb-2">Languages Spoken</span>
                        <div className="flex flex-wrap gap-1.5">
                          {profile.languages.map((ln) => (
                            <span
                              key={ln}
                              className="rounded-md border border-[rgba(209,199,189,0.7)] bg-[rgba(239,233,225,0.8)] px-2.5 py-1 text-xs font-semibold text-body"
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

              {/* SIH Preferences & Contact Information */}
              <SpotlightCard className="rounded-3xl">
                <div className="surface-raised rounded-3xl p-6 sm:p-7 space-y-6">
                  <h2 className="text-feature text-foreground">SIH Preferences &amp; Contact Details</h2>
                  <div className="h-px bg-gradient-to-r from-[rgba(172,156,141,0.55)] via-[rgba(209,199,189,0.35)] to-transparent" />

                  <div className="space-y-5">
                    {profile.tracksDetailed && profile.tracksDetailed.length > 0 && (
                      <div>
                        <span className="block text-label uppercase text-muted text-xs mb-2">Preferred Problem Statement Tracks</span>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {profile.tracksDetailed.map((t) => (
                            <div
                              key={t.id}
                              className="rounded-xl border border-[rgba(209,199,189,0.6)] bg-white/40 p-3"
                            >
                              <span className="text-xs font-bold text-primary">{t.code}</span>
                              <p className="text-xs font-bold text-foreground mt-0.5">{t.name}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <span className="block text-label uppercase text-muted text-xs mb-3">Actionable Contact &amp; Professional Links</span>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {/* Mailto Action */}
                        <a
                          href={`mailto:${profile.email}`}
                          className="flex items-center gap-3 rounded-xl border border-[rgba(209,199,189,0.6)] bg-white/50 p-3 hover:border-primary/40 hover:text-primary transition-all"
                        >
                          <div className="size-8 rounded-lg bg-[rgba(114,56,61,0.08)] text-primary flex items-center justify-center shrink-0">
                            <Mail className="size-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="block text-[9px] font-black uppercase text-muted tracking-wider">Email Address</span>
                            <span className="block text-xs font-bold text-foreground truncate">{profile.email}</span>
                          </div>
                        </a>

                        {/* Phone Action */}
                        {profile.contact && (
                          <a
                            href={`tel:${profile.contact}`}
                            className="flex items-center gap-3 rounded-xl border border-[rgba(209,199,189,0.6)] bg-white/50 p-3 hover:border-primary/40 hover:text-primary transition-all"
                          >
                            <div className="size-8 rounded-lg bg-[rgba(114,56,61,0.08)] text-primary flex items-center justify-center shrink-0">
                              <Phone className="size-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="block text-[9px] font-black uppercase text-muted tracking-wider">Phone Number</span>
                              <span className="block text-xs font-bold text-foreground truncate">{profile.contact}</span>
                            </div>
                          </a>
                        )}

                        {/* GitHub Profile */}
                        {profile.githubUrl && (
                          <a
                            href={profile.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 rounded-xl border border-[rgba(209,199,189,0.6)] bg-white/50 p-3 hover:border-primary/40 hover:text-primary transition-all"
                          >
                            <div className="size-8 rounded-lg bg-[rgba(114,56,61,0.08)] text-primary flex items-center justify-center shrink-0">
                              <Code2 className="size-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="block text-[9px] font-black uppercase text-muted tracking-wider">GitHub</span>
                              <span className="block text-xs font-bold text-foreground truncate">View GitHub Profile</span>
                            </div>
                          </a>
                        )}

                        {/* LinkedIn Profile */}
                        {profile.linkedinUrl && (
                          <a
                            href={profile.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 rounded-xl border border-[rgba(209,199,189,0.6)] bg-white/50 p-3 hover:border-primary/40 hover:text-primary transition-all"
                          >
                            <div className="size-8 rounded-lg bg-[rgba(114,56,61,0.08)] text-primary flex items-center justify-center shrink-0">
                              <ArrowUpRight className="size-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="block text-[9px] font-black uppercase text-muted tracking-wider">LinkedIn</span>
                              <span className="block text-xs font-bold text-foreground truncate">View LinkedIn Profile</span>
                            </div>
                          </a>
                        )}

                        {/* Resume */}
                        {profile.resumeUrl && (
                          <a
                            href={profile.resumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 rounded-xl border border-[rgba(209,199,189,0.6)] bg-white/50 p-3 hover:border-primary/40 hover:text-primary transition-all"
                          >
                            <div className="size-8 rounded-lg bg-[rgba(114,56,61,0.08)] text-primary flex items-center justify-center shrink-0">
                              <FileText className="size-4" />
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
