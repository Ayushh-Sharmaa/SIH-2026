'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, m } from 'framer-motion';
import { GraduationCap, ShieldCheck, ArrowUpRight, KeyRound, Sparkles, AlertCircle } from 'lucide-react';
import Icon from '@/components/ui/Icon';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useSession } from '@/lib/session';
import { Container } from '@/components/ui';
import {
  Aurora,
  PremiumButton,
  Reveal,
  SplitText,
  TiltCard,
  SpotlightCard,
  DURATION,
  EASE,
  SPRING,
} from '@/components/motion';
import { logger } from '@/lib/logger';

export default function OnboardingPage() {
  const router = useRouter();
  const { establish, refresh } = useSession();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [mentorKey, setMentorKey] = useState('');
  const [showMentorKeyInput, setShowMentorKeyInput] = useState(false);
  const [showKeyErrorPopup, setShowKeyErrorPopup] = useState(false);
  const [clickedRole, setClickedRole] = useState<'STUDENT' | 'MENTOR' | null>(null);

  const handleSelectStudent = async () => {
    if (clickedRole || submitting) return;
    setClickedRole('STUDENT');
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/onboarding-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'STUDENT' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to select student role');

      if (data.name) {
        establish({ name: data.name, role: 'STUDENT', isOnboarded: false });
      } else {
        await refresh();
      }

      router.push('/dashboard');
    } catch (err: unknown) {
      logger.error('Failed to select student role', err);
      setError('Failed to initialize student profile. Please try again.');
      setClickedRole(null);
      setSubmitting(false);
    }
  };

  const handleVerifyMentorKey = async () => {
    if (submitting) return;
    if (!mentorKey.trim()) {
      setError('Please enter your mentor registration key.');
      return;
    }
    setClickedRole('MENTOR');
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/onboarding-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'MENTOR', registrationKey: mentorKey.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setShowKeyErrorPopup(true);
        setClickedRole(null);
        setSubmitting(false);
        return;
      }

      if (data.name) {
        establish({ name: data.name, role: 'MENTOR', isOnboarded: false });
      } else {
        await refresh();
      }

      router.push('/dashboard');
    } catch (err: unknown) {
      logger.error('Mentor verification error', err);
      setError('Verification failed. Please check your network and try again.');
      setClickedRole(null);
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground flex flex-col justify-between">
      <Navbar />

      <main className="relative flex-1 py-12 md:py-20">
        <Aurora />
        <Container className="max-w-4xl">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[rgba(209,199,189,0.7)] bg-[rgba(248,246,242,0.8)] text-xs font-semibold text-primary mb-4">
                <Sparkles className="size-3.5" />
                <span>Smart India Hackathon 2026 Portal</span>
              </div>
              <h1 className="text-display text-foreground">
                <SplitText text="Welcome to SIH@GLBGOI" />
              </h1>
              <p className="mt-4 text-body text-muted text-base sm:text-lg">
                Select your path to get started. You can complete your profile details and preferences progressively directly on your dashboard.
              </p>
            </div>
          </Reveal>

          {error && (
            <m.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 rounded-2xl border border-[rgba(114,56,61,0.4)] bg-[rgba(114,56,61,0.08)] p-4 text-sm text-primary flex items-center gap-3"
            >
              <AlertCircle className="size-5 shrink-0" />
              <span>{error}</span>
            </m.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {/* Student Onboarding Option */}
            <TiltCard intensity={6} className="h-full">
              <SpotlightCard className="h-full rounded-3xl" intensity={0.16}>
                <div className="surface-raised h-full rounded-3xl p-8 flex flex-col justify-between border border-[rgba(209,199,189,0.6)] shadow-e2 transition-all duration-300 hover:shadow-e4">
                  <div>
                    <div className="size-14 rounded-2xl bg-[rgba(114,56,61,0.1)] border border-[rgba(114,56,61,0.2)] flex items-center justify-center text-primary mb-6">
                      <Icon icon={GraduationCap} size="lg" />
                    </div>
                    <span className="text-label uppercase tracking-widest text-primary font-bold">Path 01</span>
                    <h2 className="text-heading text-foreground mt-1 mb-3">Student Participant</h2>
                    <p className="text-body text-sm leading-relaxed mb-6">
                      Discover collaborators, form hackathon teams, showcase your technical skills, and connect with peers and mentors.
                    </p>
                    <ul className="space-y-2.5 text-xs text-muted mb-8">
                      <li className="flex items-center gap-2">
                        <span className="size-1.5 rounded-full bg-primary" />
                        <span>Build your technical skills and portfolio</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="size-1.5 rounded-full bg-primary" />
                        <span>Create a team as Leader or join an existing roster</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="size-1.5 rounded-full bg-primary" />
                        <span>Connect with verified faculty mentors</span>
                      </li>
                    </ul>
                  </div>

                  <PremiumButton
                    onClick={handleSelectStudent}
                    disabled={submitting}
                    className="w-full justify-center bg-primary text-on-accent"
                  >
                    {submitting && clickedRole === 'STUDENT' ? (
                      <span>Initializing Dashboard…</span>
                    ) : (
                      <>
                        <span>Continue as Student</span>
                        <ArrowUpRight className="size-4" />
                      </>
                    )}
                  </PremiumButton>
                </div>
              </SpotlightCard>
            </TiltCard>

            {/* Mentor Onboarding Option */}
            <TiltCard intensity={6} className="h-full">
              <SpotlightCard className="h-full rounded-3xl" intensity={0.16}>
                <div className="surface-raised h-full rounded-3xl p-8 flex flex-col justify-between border border-[rgba(209,199,189,0.6)] shadow-e2 transition-all duration-300 hover:shadow-e4">
                  <div>
                    <div className="size-14 rounded-2xl bg-[rgba(172,156,141,0.18)] border border-[rgba(172,156,141,0.4)] flex items-center justify-center text-foreground mb-6">
                      <Icon icon={ShieldCheck} size="lg" />
                    </div>
                    <span className="text-label uppercase tracking-widest text-muted font-bold">Path 02</span>
                    <h2 className="text-heading text-foreground mt-1 mb-3">Faculty / Mentor</h2>
                    <p className="text-body text-sm leading-relaxed mb-6">
                      Guide hackathon teams, review project proposals, provide technical mentorship, and monitor team milestones.
                    </p>

                    <AnimatePresence mode="wait">
                      {showMentorKeyInput ? (
                        <m.div
                          key="key-form"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4 mb-6"
                        >
                          <label className="block">
                            <span className="text-label uppercase text-muted block mb-1.5">
                              Mentor Registration Key
                            </span>
                            <div className="relative">
                              <input
                                type="text"
                                value={mentorKey}
                                onChange={(e) => setMentorKey(e.target.value)}
                                placeholder="Enter issued authorization key"
                                className="w-full rounded-xl border border-[rgba(209,199,189,0.8)] bg-[rgba(248,246,242,0.7)] px-4 py-2.5 pl-10 text-sm text-foreground placeholder:text-muted/60 outline-none focus:border-primary focus:bg-white"
                              />
                              <KeyRound className="absolute left-3 top-3 size-4 text-muted" />
                            </div>
                          </label>
                        </m.div>
                      ) : (
                        <ul className="space-y-2.5 text-xs text-muted mb-8">
                          <li className="flex items-center gap-2">
                            <span className="size-1.5 rounded-full bg-foreground" />
                            <span>Guide and advise participating teams</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="size-1.5 rounded-full bg-foreground" />
                            <span>Accept or review mentorship requests</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="size-1.5 rounded-full bg-foreground" />
                            <span>Requires faculty verification key</span>
                          </li>
                        </ul>
                      )}
                    </AnimatePresence>
                  </div>

                  {showMentorKeyInput ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowMentorKeyInput(false)}
                        className="px-4 py-2.5 rounded-xl border border-[rgba(209,199,189,0.7)] text-sm font-semibold text-body hover:bg-[rgba(209,199,189,0.2)]"
                      >
                        Back
                      </button>
                      <PremiumButton
                        onClick={handleVerifyMentorKey}
                        disabled={submitting}
                        className="flex-1 justify-center bg-foreground text-on-accent"
                      >
                        {submitting && clickedRole === 'MENTOR' ? (
                          <span>Verifying…</span>
                        ) : (
                          <>
                            <span>Verify & Enter</span>
                            <ArrowUpRight className="size-4" />
                          </>
                        )}
                      </PremiumButton>
                    </div>
                  ) : (
                    <PremiumButton
                      onClick={() => setShowMentorKeyInput(true)}
                      className="w-full justify-center border border-[rgba(209,199,189,0.8)] bg-[rgba(248,246,242,0.9)] text-foreground hover:border-primary"
                    >
                      <span>Continue as Mentor</span>
                      <ArrowUpRight className="size-4" />
                    </PremiumButton>
                  )}
                </div>
              </SpotlightCard>
            </TiltCard>
          </div>
        </Container>
      </main>

      {/* Invalid Key Error Modal */}
      <AnimatePresence>
        {showKeyErrorPopup && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-modal flex items-center justify-center p-4"
          >
            <div
              aria-hidden
              onClick={() => setShowKeyErrorPopup(false)}
              className="absolute inset-0 bg-[rgb(50_45_41/0.34)] backdrop-blur-md"
            />
            <m.div
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="surface-overlay relative w-full max-w-sm rounded-container p-6 text-foreground shadow-2xl border border-[rgba(209,199,189,0.6)]"
            >
              <div className="size-12 rounded-2xl bg-[rgba(114,56,61,0.1)] border border-[rgba(114,56,61,0.2)] flex items-center justify-center text-primary mb-4 mx-auto">
                <AlertCircle className="size-6" />
              </div>
              <h3 className="text-feature text-center text-foreground font-bold">Invalid Mentor Key</h3>
              <p className="text-xs text-muted text-center mt-2 leading-relaxed">
                The key you entered is incorrect or has already been used. Please contact the Hackathon SPOC / Administrator for a valid mentor registration key.
              </p>
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowKeyErrorPopup(false)}
                  className="px-6 py-2 rounded-xl bg-primary text-on-accent text-sm font-semibold hover:opacity-90"
                >
                  Try Again
                </button>
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
