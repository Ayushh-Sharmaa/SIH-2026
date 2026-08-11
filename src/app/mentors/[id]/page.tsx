'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft,
  ArrowUpRight,
  Award,
  BookOpen,
  Building2,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  Crown,
  FlaskConical,
  GraduationCap,
  Layers,
  Mail,
  Palette,
  PenLine,
  Phone,
  ShieldCheck,
  Terminal,
  User,
  Users,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
import Icon from '@/components/ui/Icon';
import { Container, ProfileSkeleton } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Aurora, PremiumButton, SpotlightCard } from '@/components/motion';
import { logger } from '@/lib/logger';

interface TeamSummary {
  id: string;
  teamCode: string;
  name: string;
  status: string;
  memberCount: number;
  track?: { name: string; problemStatementCode: string } | null;
}

interface MentorProfile {
  userId: string;
  name: string;
  designation: string;
  organization: string;
  college?: string | null;
  email?: string | null;
  contact?: string | null;
  expertise: string[];
  guidedTeamsCount: number;
  verified: boolean;
  bio?: string | null;
  linkedinUrl?: string | null;
  avatarUrl?: string | null;
  teams?: TeamSummary[];
}

export default function MentorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [profile, setProfile] = useState<MentorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast(`${label} copied`, 'info');
    setTimeout(() => setCopiedField(null), 2000);
  };

  useEffect(() => {
    async function loadMentor() {
      try {
        const res = await fetch(`/api/profile/mentor?userId=${params.id}`);
        const data = await res.json();
        if (data.success) {
          setProfile(data.profile);
        } else {
          toast(data.error || 'Failed to load mentor profile.', 'error');
        }
      } catch (err) {
        logger.error('Load target mentor profile error', err);
        toast('Failed to load mentor profile. Check your connection.', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadMentor();
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
          <h2 className="text-2xl font-bold text-foreground">Mentor Profile Not Found</h2>
          <p className="mt-2 text-sm text-muted">The requested mentor profile could not be located.</p>
          <PremiumButton variant="glass" className="mt-6" onClick={() => router.back()}>
            Back Previous
          </PremiumButton>
        </Container>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <Navbar />

      <main className="flex-1">
        {/* Banner */}
        <section className="section-dune relative overflow-hidden pb-10">
          <Aurora variant="taupe" spotlight={false} />
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
                {profile.avatarUrl ? (
                  <Image
                    unoptimized
                    src={profile.avatarUrl}
                    alt={`${profile.name}'s avatar`}
                    width={80}
                    height={80}
                    className="size-20 rounded-2xl object-cover shadow-md shrink-0"
                  />
                ) : (
                  <span className="flex size-20 shrink-0 items-center justify-center rounded-2xl border border-[rgba(209,199,189,0.7)] bg-gradient-to-br from-[#AC9C8D] to-[#D1C7BD] text-xl font-black text-foreground shadow-md">
                    {profile.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </span>
                )}

                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full border border-blue-600/30 bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-blue-700">
                      <ShieldCheck className="size-3" /> FACULTY MENTOR
                    </span>
                    {profile.verified && (
                      <span className="rounded-full border border-emerald-600/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                        Verified
                      </span>
                    )}
                  </div>

                  <h1 className="text-3xl font-extrabold leading-none tracking-tight text-foreground sm:text-4xl truncate">
                    {profile.name}
                  </h1>

                  <p className="text-sm font-semibold text-muted">
                    {profile.designation} · <span className="text-foreground">{profile.organization}</span>
                  </p>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* Content Details */}
        <section className="relative border-t border-[rgba(209,199,189,0.55)]">
          <div className="surface-sunken">
            <Container width="narrow" className="py-12 space-y-6">
              {/* Overview & Bio */}
              <div className="grid gap-6 md:grid-cols-2">
                <SpotlightCard className="rounded-3xl">
                  <div className="surface-raised rounded-3xl p-6 sm:p-7 space-y-5">
                    <h2 className="text-feature text-foreground">Mentor Info</h2>
                    <div className="h-px bg-gradient-to-r from-[rgba(172,156,141,0.55)] via-[rgba(209,199,189,0.35)] to-transparent" />

                    <dl className="space-y-3 text-sm">
                      <div>
                        <dt className="text-label uppercase text-muted text-xs">Designation</dt>
                        <dd className="mt-0.5 font-bold text-foreground">{profile.designation}</dd>
                      </div>
                      <div>
                        <dt className="text-label uppercase text-muted text-xs">Department / Organization</dt>
                        <dd className="mt-0.5 font-bold text-foreground">{profile.organization}</dd>
                      </div>
                      <div>
                        <dt className="text-label uppercase text-muted text-xs">Teams Guided</dt>
                        <dd className="mt-0.5 font-bold text-foreground">{profile.guidedTeamsCount} Teams</dd>
                      </div>
                      {profile.email && (
                        <div>
                          <dt className="text-label uppercase text-muted text-xs">Email Address</dt>
                          <dd className="mt-1 flex items-center justify-between gap-2 rounded-xl border border-[rgba(209,199,189,0.6)] bg-white/50 p-2.5">
                            <span className="font-bold text-foreground truncate text-xs">{profile.email}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(profile.email!, 'Email')}
                              className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[rgba(114,56,61,0.2)] bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary hover:bg-primary/20 transition-colors"
                            >
                              {copiedField === 'Email' ? (
                                <span className="flex items-center gap-1 text-emerald-700">
                                  <Check className="size-3" /> Copied
                                </span>
                              ) : (
                                <>
                                  <Copy className="size-3" /> Copy
                                </>
                              )}
                            </button>
                          </dd>
                        </div>
                      )}
                      {profile.contact && (
                        <div>
                          <dt className="text-label uppercase text-muted text-xs">Phone Number</dt>
                          <dd className="mt-1 flex items-center justify-between gap-2 rounded-xl border border-[rgba(209,199,189,0.6)] bg-white/50 p-2.5">
                            <span className="font-bold text-foreground truncate text-xs">{profile.contact}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(profile.contact!, 'Phone number')}
                              className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[rgba(114,56,61,0.2)] bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary hover:bg-primary/20 transition-colors"
                            >
                              {copiedField === 'Phone number' ? (
                                <span className="flex items-center gap-1 text-emerald-700">
                                  <Check className="size-3" /> Copied
                                </span>
                              ) : (
                                <>
                                  <Copy className="size-3" /> Copy
                                </>
                              )}
                            </button>
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </SpotlightCard>

                <SpotlightCard className="rounded-3xl">
                  <div className="surface-raised rounded-3xl p-6 sm:p-7 space-y-5">
                    <h2 className="text-feature text-foreground">Expertise &amp; Bio</h2>
                    <div className="h-px bg-gradient-to-r from-[rgba(172,156,141,0.55)] via-[rgba(209,199,189,0.35)] to-transparent" />

                    <div className="space-y-4">
                      {profile.expertise.length > 0 && (
                        <div>
                          <span className="block text-label uppercase text-muted text-xs mb-2">Areas of Expertise</span>
                          <div className="flex flex-wrap gap-1.5">
                            {profile.expertise.map((exp) => (
                              <span
                                key={exp}
                                className="rounded-md border border-[rgba(114,56,61,0.22)] bg-[rgba(114,56,61,0.08)] px-2.5 py-1 text-xs font-semibold text-primary"
                              >
                                {exp}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {profile.bio ? (
                        <div>
                          <span className="block text-label uppercase text-muted text-xs mb-1">Biography</span>
                          <p className="text-xs text-body leading-relaxed">{profile.bio}</p>
                        </div>
                      ) : (
                        <p className="text-xs italic text-muted">No bio provided.</p>
                      )}

                      {profile.linkedinUrl && (
                        <div className="pt-2">
                          <a
                            href={profile.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline"
                          >
                            <ArrowUpRight className="size-4" />
                            View LinkedIn Profile →
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </SpotlightCard>
              </div>

              {/* Teams Currently Being Mentored */}
              {profile.teams && profile.teams.length > 0 && (
                <SpotlightCard className="rounded-3xl">
                  <div className="surface-raised rounded-3xl p-6 sm:p-7 space-y-5">
                    <div className="flex items-center justify-between">
                      <h2 className="text-feature text-foreground">Teams Mentored by {profile.name}</h2>
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                        {profile.teams.length} Teams
                      </span>
                    </div>
                    <div className="h-px bg-gradient-to-r from-[rgba(172,156,141,0.55)] via-[rgba(209,199,189,0.35)] to-transparent" />

                    <div className="grid gap-3 sm:grid-cols-2">
                      {profile.teams.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => router.push(`/teams/${t.id}`)}
                          className="group cursor-pointer rounded-2xl border border-[rgba(209,199,189,0.6)] bg-white/40 p-4 transition-colors hover:border-primary/40"
                        >
                          <div className="flex justify-between items-center gap-2">
                            <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                              {t.name}
                            </span>
                            <span className="text-xs font-semibold text-muted">{t.teamCode}</span>
                          </div>
                          {t.track && (
                            <p className="mt-1 text-xs text-muted truncate">
                              {t.track.problemStatementCode}: {t.track.name}
                            </p>
                          )}
                          <div className="mt-3 flex items-center justify-between text-xs text-primary font-bold">
                            <span>{t.memberCount} Members</span>
                            <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </SpotlightCard>
              )}
            </Container>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
