'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { AnimatePresence, m } from 'framer-motion';
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
  ShieldAlert,
  ShieldCheck,
  Terminal,
  User,
  Users,
  UsersRound,
} from 'lucide-react';
import Icon from '@/components/ui/Icon';
import { Container, ProfileSkeleton } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useEscapeKey, useFocusTrap, useScrollLock } from '@/hooks/useFocusTrap';
import {
  Aurora,
  PremiumButton,
  SpotlightCard,
  DURATION,
  EASE,
} from '@/components/motion';
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

interface MentorEligibility {
  role: string;
  canRequest: boolean;
  reason: string | null;
  isRequested?: boolean;
  requestStatus?: string | null;
}

const AVATAR_WASHES = [
  'from-[#AC9C8D] to-[#D1C7BD]',
  'from-[#D1C7BD] to-[#D9D9D9]',
  'from-[#D9D9D9] to-[#AC9C8D]',
  'from-[#EFE9E1] to-[#D1C7BD]',
];

function MentorAvatar({
  avatarUrl,
  name,
  className = 'size-20 sm:size-24',
}: {
  avatarUrl?: string | null;
  name: string;
  className?: string;
}) {
  const [imageError, setImageError] = useState(false);

  if (avatarUrl && !imageError && (avatarUrl.startsWith('data:image/') || avatarUrl.startsWith('http'))) {
    return (
      <Image
        unoptimized
        src={avatarUrl}
        alt={`${name}'s avatar`}
        width={112}
        height={112}
        onError={() => setImageError(true)}
        className={`rounded-2xl object-cover shadow-md shrink-0 border border-[rgba(209,199,189,0.7)] ${className}`}
      />
    );
  }

  const wash = AVATAR_WASHES[name.length % AVATAR_WASHES.length];
  const initials =
    name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'M';

  return (
    <span
      aria-label={`${name}'s avatar`}
      className={`flex shrink-0 items-center justify-center rounded-2xl border border-[rgba(209,199,189,0.7)] bg-gradient-to-br ${wash} text-xl sm:text-2xl font-black text-foreground shadow-md ${className}`}
    >
      {initials}
    </span>
  );
}

function RequestMentorshipModal({
  mentorName,
  mentorDesignation,
  avatarUrl,
  onClose,
  onSubmit,
}: {
  mentorName: string;
  mentorDesignation?: string;
  avatarUrl?: string | null;
  onClose: () => void;
  onSubmit: (message: string) => Promise<void>;
}) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const panelRef = useFocusTrap<HTMLDivElement>(true);
  useScrollLock(true);
  useEscapeKey(true, onClose);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit(message);
    setLoading(false);
    onClose();
  };

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: DURATION.hover, ease: EASE.outExpo }}
      className="fixed inset-0 z-modal flex items-center justify-center p-4"
    >
      <div
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 bg-[rgb(50_45_41/0.34)] backdrop-blur-md"
      />
      <m.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="request-mentor-title"
        tabIndex={-1}
        initial={{ opacity: 0, y: 28, scale: 0.97, filter: 'blur(8px)' }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: 16, scale: 0.98, filter: 'blur(6px)' }}
        transition={{ duration: DURATION.card, ease: EASE.outExpo }}
        className="surface-overlay relative max-h-[88vh] w-full max-w-md overflow-y-auto rounded-container p-6 text-foreground shadow-[0_12px_40px_rgba(50,45,41,0.22)]"
      >
        <div className="flex items-center gap-3.5">
          <MentorAvatar avatarUrl={avatarUrl} name={mentorName} className="size-12" />
          <div className="min-w-0">
            <h3 id="request-mentor-title" className="text-feature text-foreground font-extrabold truncate">
              Request Mentorship
            </h3>
            <p className="text-xs text-muted truncate">
              from {mentorName} ({mentorDesignation || 'Faculty Mentor'})
            </p>
          </div>
        </div>

        <p className="mt-3 text-xs text-muted leading-relaxed">
          Introduce your team and project concept. Explain what kind of guidance you are looking for.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-label uppercase text-muted">Message (Optional)</span>
            <textarea
              rows={4}
              placeholder="e.g. Hello Professor! We are working on the SIH MedTech / HealthTech Theme. We have code ready for machine learning and would love your guidance on deployment and clinical validation."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-xl border border-[rgba(209,199,189,0.85)] bg-[rgba(248,246,242,0.75)] px-3.5 py-2 text-sm text-foreground outline-none transition-[border-color,box-shadow,background-color] duration-250 focus:border-primary focus:bg-[rgba(248,246,242,0.96)] focus:shadow-[0_0_0_4px_rgba(114,56,61,0.1)] resize-none"
            />
          </label>

          <div className="mt-6 flex justify-end gap-3">
            <PremiumButton variant="glass" size="sm" onClick={onClose} disabled={loading}>
              Cancel
            </PremiumButton>
            <PremiumButton type="submit" size="sm" loading={loading}>
              Send Request
            </PremiumButton>
          </div>
        </form>
      </m.div>
    </m.div>
  );
}

export default function MentorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [profile, setProfile] = useState<MentorProfile | null>(null);
  const [eligibility, setEligibility] = useState<MentorEligibility | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestState, setRequestState] = useState<'idle' | 'sending' | 'sent'>('idle');

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast(`${label} copied`, 'info');
    setTimeout(() => setCopiedField(null), 2000);
  };

  useEffect(() => {
    const rawId = params?.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!id || id === 'undefined') {
      return;
    }

    async function loadMentor() {
      try {
        const res = await fetch(`/api/profile/mentor?userId=${id}`);
        const data = await res.json();
        if (data.success) {
          setProfile(data.profile);
          if (data.eligibility) {
            setEligibility(data.eligibility);
            if (data.eligibility.isRequested) {
              setRequestState('sent');
            }
          }
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
  }, [params?.id, toast]);

  const submitMentorRequest = async (message: string) => {
    if (!profile) return;
    setRequestState('sending');

    try {
      const res = await fetch('/api/mentor-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mentorId: profile.userId, message }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to request mentor.');
      }

      setRequestState('sent');
      toast(`Mentorship request sent to ${profile.name}!`, 'success');
    } catch (err: unknown) {
      setRequestState('idle');
      toast(err instanceof Error ? err.message : 'Failed to submit request.', 'error');
    }
  };

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
          <PremiumButton
            variant="glass"
            className="mt-6"
            onClick={() => router.push('/team-formation/browse-mentors')}
          >
            Browse All Mentors
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
        {/* Banner Section */}
        <section className="section-dune relative overflow-hidden pb-10">
          <Aurora variant="taupe" spotlight={false} />
          <Container width="narrow" className="relative pt-8">
            <button
              onClick={() => router.push('/team-formation/browse-mentors')}
              className="group mb-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted transition-colors hover:text-primary"
            >
              <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
              Browse Mentors
            </button>

            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4 sm:gap-5">
                <MentorAvatar
                  avatarUrl={profile.avatarUrl}
                  name={profile.name}
                  className="size-20 sm:size-24"
                />

                <div className="min-w-0 space-y-1.5">
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

                  <h1 className="text-2xl font-extrabold leading-none tracking-tight text-foreground sm:text-4xl truncate">
                    {profile.name}
                  </h1>

                  <p className="text-xs sm:text-sm font-semibold text-muted flex items-center gap-1.5 flex-wrap">
                    <span>{profile.designation || 'Faculty Member'}</span>
                    <span>·</span>
                    <span className="text-foreground flex items-center gap-1">
                      <Building2 className="size-3.5 text-muted" />
                      {profile.organization || profile.college || 'GL Bajaj Group of Institutions'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Mentorship Request Action */}
              <div className="flex items-center gap-3 shrink-0 pt-2 sm:pt-0">
                {eligibility?.canRequest ? (
                  <PremiumButton
                    size="md"
                    variant={requestState === 'sent' ? 'glass' : 'primary'}
                    disabled={requestState === 'sent'}
                    magnetic={false}
                    onClick={() => setShowRequestModal(true)}
                  >
                    {requestState === 'sent' ? 'Mentorship Requested' : 'Request Mentorship'}
                  </PremiumButton>
                ) : eligibility?.reason ? (
                  <span className="text-xs text-muted flex items-center gap-1.5 rounded-xl border border-[rgba(209,199,189,0.7)] bg-white/40 px-3 py-2">
                    <ShieldAlert className="size-3.5 text-muted shrink-0" />
                    {eligibility.reason}
                  </span>
                ) : null}
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
                  <div className="surface-raised rounded-3xl p-6 sm:p-7 space-y-5 border border-[rgba(209,199,189,0.7)]">
                    <h2 className="text-feature text-foreground font-extrabold">Mentor Information</h2>
                    <div className="h-px bg-gradient-to-r from-[rgba(172,156,141,0.55)] via-[rgba(209,199,189,0.35)] to-transparent" />

                    <dl className="space-y-3.5 text-sm">
                      <div>
                        <dt className="text-label uppercase text-muted text-xs">Designation</dt>
                        <dd className="mt-0.5 font-bold text-foreground">{profile.designation || 'Faculty Member'}</dd>
                      </div>
                      <div>
                        <dt className="text-label uppercase text-muted text-xs">Department / Institution</dt>
                        <dd className="mt-0.5 font-bold text-foreground">{profile.organization || profile.college || 'GL Bajaj Group of Institutions'}</dd>
                      </div>
                      <div>
                        <dt className="text-label uppercase text-muted text-xs">Teams Guided</dt>
                        <dd className="mt-0.5 font-bold text-foreground">{profile.guidedTeamsCount} {profile.guidedTeamsCount === 1 ? 'Team' : 'Teams'}</dd>
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
                          <dt className="text-label uppercase text-muted text-xs">Phone / Contact</dt>
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
                  <div className="surface-raised rounded-3xl p-6 sm:p-7 space-y-5 border border-[rgba(209,199,189,0.7)]">
                    <h2 className="text-feature text-foreground font-extrabold">Expertise &amp; Bio</h2>
                    <div className="h-px bg-gradient-to-r from-[rgba(172,156,141,0.55)] via-[rgba(209,199,189,0.35)] to-transparent" />

                    <div className="space-y-4">
                      {profile.expertise && profile.expertise.length > 0 && (
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

                      <div>
                        <span className="block text-label uppercase text-muted text-xs mb-1">Biography</span>
                        <p className="text-xs text-body leading-relaxed whitespace-pre-line">
                          {profile.bio || 'Experienced faculty mentor available to assist student hackathon teams with system design, solution architecture, code reviews, and jury evaluation readiness.'}
                        </p>
                      </div>

                      {profile.linkedinUrl && (
                        <div className="pt-2">
                          <a
                            href={profile.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
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
                  <div className="surface-raised rounded-3xl p-6 sm:p-7 space-y-5 border border-[rgba(209,199,189,0.7)]">
                    <div className="flex items-center justify-between">
                      <h2 className="text-feature text-foreground font-extrabold">Teams Mentored by {profile.name}</h2>
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                        {profile.teams.length} {profile.teams.length === 1 ? 'Team' : 'Teams'}
                      </span>
                    </div>
                    <div className="h-px bg-gradient-to-r from-[rgba(172,156,141,0.55)] via-[rgba(209,199,189,0.35)] to-transparent" />

                    <div className="grid gap-3 sm:grid-cols-2">
                      {profile.teams.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => router.push(`/teams/${t.id}`)}
                          className="group cursor-pointer rounded-2xl border border-[rgba(209,199,189,0.6)] bg-white/40 p-4 transition-all hover:border-primary hover:shadow-sm"
                        >
                          <div className="flex justify-between items-center gap-2">
                            <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                              {t.name}
                            </span>
                            <span className="rounded-md bg-muted/15 px-2 py-0.5 text-xs font-black text-foreground">
                              {t.teamCode}
                            </span>
                          </div>
                          {t.track && (
                            <p className="mt-1.5 text-xs text-muted truncate">
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

      {/* Mentorship Request Modal */}
      <AnimatePresence>
        {showRequestModal && (
          <RequestMentorshipModal
            mentorName={profile.name}
            mentorDesignation={profile.designation}
            avatarUrl={profile.avatarUrl}
            onClose={() => setShowRequestModal(false)}
            onSubmit={submitMentorRequest}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

