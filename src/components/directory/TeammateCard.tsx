'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, GraduationCap, ShieldCheck, Layers } from 'lucide-react';
import { TiltCard, SpotlightCard, PremiumButton } from '@/components/motion';

export interface Student {
  userId: string;
  name: string;
  year: string;
  branch: string;
  skills: string[];
  languages: string[];
  softSkills: string[];
  avatarUrl?: string | null;
  college: string;
  teamStatus: string;
  interests: Array<{ code: string; name: string }>;
}

const AVATAR_WASHES = [
  'from-[#AC9C8D] to-[#D1C7BD]',
  'from-[#D1C7BD] to-[#D9D9D9]',
  'from-[#D9D9D9] to-[#AC9C8D]',
  'from-[#EFE9E1] to-[#D1C7BD]',
];

function ProfileAvatar({ avatarUrl, name }: { avatarUrl?: string | null; name: string }) {
  if (avatarUrl?.startsWith('data:image/') || avatarUrl?.startsWith('http')) {
    return (
      <Image
        unoptimized
        src={avatarUrl}
        alt={`${name}'s profile`}
        width={48}
        height={48}
        className="size-11 rounded-2xl object-cover border border-[rgba(209,199,189,0.7)]"
      />
    );
  }

  const wash = AVATAR_WASHES[name.length % AVATAR_WASHES.length];
  return (
    <span
      aria-label={`${name}'s profile`}
      className={`flex size-11 shrink-0 items-center justify-center rounded-2xl border border-[rgba(209,199,189,0.7)] bg-gradient-to-br ${wash} text-xs font-black text-foreground`}
    >
      {name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()}
    </span>
  );
}

export interface TeammateCardProps {
  student: Student;
  inviteState?: 'sending' | 'sent';
  onSendInvite: (student: Student) => void;
}

export default function TeammateCard({
  student,
  inviteState,
  onSendInvite,
}: TeammateCardProps) {
  return (
    <TiltCard intensity={3} className="h-full">
      <SpotlightCard className="h-full rounded-3xl" intensity={0.12}>
        <article className="surface-raised flex h-full flex-col justify-between rounded-3xl p-6 border border-[rgba(209,199,189,0.7)] shadow-e1 hover:shadow-e3 transition-shadow">
          <div>
            {/* Identity & Status */}
            <div className="flex items-start justify-between gap-3 mb-3.5">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <ProfileAvatar avatarUrl={student.avatarUrl} name={student.name} />
                <div className="min-w-0 flex-1">
                  <h3 className="text-feature font-bold text-foreground truncate">
                    {student.name}
                  </h3>
                  <p className="text-xs text-muted flex items-center gap-1 mt-0.5 truncate">
                    <GraduationCap className="size-3.5 shrink-0" />
                    <span className="truncate">
                      {student.branch || 'Student'} • {student.year || 'General'}
                    </span>
                  </p>
                </div>
              </div>

              <span className="shrink-0 inline-flex items-center gap-1 rounded-full border border-[rgba(172,156,141,0.5)] bg-[rgba(248,246,242,0.8)] px-2.5 py-0.5 text-[10px] font-bold text-primary uppercase tracking-wider">
                <ShieldCheck className="size-3" />
                <span>Available</span>
              </span>
            </div>

            {/* Theme Interests */}
            {student.interests && student.interests.length > 0 && (
              <div className="mb-3.5 rounded-2xl border border-[rgba(209,199,189,0.6)] bg-[rgba(248,246,242,0.6)] p-2.5">
                <div className="text-[10px] uppercase font-bold tracking-wider text-muted flex items-center gap-1 mb-1">
                  <Layers className="size-3 text-primary" />
                  <span>Theme Interests</span>
                </div>
                <div className="space-y-1">
                  {student.interests.slice(0, 2).map((interest, idx) => (
                    <div key={idx} className="text-xs text-foreground font-medium truncate">
                      <span className="font-semibold text-primary">{interest.code}</span> — {interest.name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Technical Skills */}
            {student.skills && student.skills.length > 0 && (
              <div className="mb-3">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted block mb-1">
                  Technical Skills
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {student.skills.slice(0, 5).map((sk) => (
                    <span
                      key={sk}
                      className="rounded-lg border border-[rgba(114,56,61,0.25)] bg-[rgba(114,56,61,0.07)] px-2 py-0.5 text-[11px] font-medium text-primary"
                    >
                      {sk}
                    </span>
                  ))}
                  {student.skills.length > 5 && (
                    <span className="rounded-lg border border-[rgba(209,199,189,0.7)] px-2 py-0.5 text-[11px] text-muted">
                      +{student.skills.length - 5}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Soft Skills & Languages */}
            {(student.softSkills?.length > 0 || student.languages?.length > 0) && (
              <div className="mb-3">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted block mb-1">
                  Soft Skills & Languages
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {student.softSkills?.slice(0, 2).map((ss) => (
                    <span
                      key={ss}
                      className="rounded-lg border border-[rgba(209,199,189,0.7)] bg-[rgba(239,233,225,0.7)] px-2 py-0.5 text-[11px] text-body"
                    >
                      {ss}
                    </span>
                  ))}
                  {student.languages?.slice(0, 2).map((lang) => (
                    <span
                      key={lang}
                      className="rounded-lg border border-[rgba(209,199,189,0.7)] bg-[rgba(239,233,225,0.7)] px-2 py-0.5 text-[11px] text-body"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="pt-3.5 border-t border-[rgba(209,199,189,0.5)] flex items-center justify-between gap-3">
            <Link
              href={`/students/${student.userId}`}
              className="text-xs font-bold text-muted hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <span>View Profile</span>
              <ArrowUpRight className="size-3" />
            </Link>

            <PremiumButton
              size="sm"
              variant={inviteState === 'sent' ? 'glass' : 'primary'}
              loading={inviteState === 'sending'}
              disabled={inviteState === 'sent' || inviteState === 'sending'}
              onClick={() => onSendInvite(student)}
              className={inviteState !== 'sent' ? 'bg-primary text-on-accent' : ''}
            >
              {inviteState === 'sent'
                ? 'Invited ✓'
                : inviteState === 'sending'
                ? 'Sending…'
                : 'Invite to Team'}
            </PremiumButton>
          </div>
        </article>
      </SpotlightCard>
    </TiltCard>
  );
}
