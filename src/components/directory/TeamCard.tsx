'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { m } from 'framer-motion';
import { ArrowUpRight, Briefcase, ShieldAlert } from 'lucide-react';
import { TiltCard, SpotlightCard, PremiumButton } from '@/components/motion';

export interface TeamMember {
  userId: string;
  name: string;
  branch: string;
  year: string;
  avatarUrl?: string | null;
  roleInTeam: string;
}

export interface Team {
  id: string;
  teamCode: string;
  name: string;
  leaderId: string;
  memberCount: number;
  status: string; // 'forming' | 'locked'
  skillsCovered: string[];
  skillsNeeded: string[];
  whatsapp?: string | null;
  logoUrl?: string | null;
  track: {
    id: string;
    problemStatementCode: string;
    name: string;
    category: string;
  };
  secondaryTrack?: {
    id: string;
    problemStatementCode: string;
    name: string;
    category: string;
  } | null;
  recruitmentNotices?: {
    id: string;
    role: string;
    gender: string;
    abilities: string[];
    requirements?: string | null;
  }[];
  members: TeamMember[];
}

const AVATAR_WASHES = [
  'from-[#AC9C8D] to-[#D1C7BD]',
  'from-[#D1C7BD] to-[#D9D9D9]',
  'from-[#D9D9D9] to-[#AC9C8D]',
  'from-[#EFE9E1] to-[#D1C7BD]',
];

function ProfileAvatar({
  avatarUrl,
  name,
  size = 8,
}: {
  avatarUrl?: string | null;
  name: string;
  size?: number;
}) {
  const sizeClass = `size-${size}`;
  if (avatarUrl?.startsWith('data:image/') || avatarUrl?.startsWith('http')) {
    return (
      <Image
        unoptimized
        src={avatarUrl}
        alt={`${name}'s profile`}
        width={36}
        height={36}
        className={`${sizeClass} rounded-xl object-cover`}
      />
    );
  }

  const wash = AVATAR_WASHES[name.length % AVATAR_WASHES.length];
  return (
    <span
      aria-label={`${name}'s profile`}
      className={`flex ${sizeClass} shrink-0 items-center justify-center rounded-xl border border-[rgba(209,199,189,0.7)] bg-gradient-to-br ${wash} text-[10px] font-black text-foreground`}
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

export interface TeamCardProps {
  team: Team;
  userHasTeam: boolean;
  requestState?: 'sending' | 'sent';
  onRequestJoin: (team: Team) => void;
}

export default function TeamCard({
  team,
  userHasTeam,
  requestState,
  onRequestJoin,
}: TeamCardProps) {
  const router = useRouter();
  const isClosed = team.status !== 'forming' || team.memberCount >= 6;
  const leader = team.members.find((m) => m.userId === team.leaderId);

  return (
    <TiltCard intensity={3} className="h-full">
      <SpotlightCard className="h-full rounded-3xl" intensity={0.12}>
        <article className="surface-raised flex h-full flex-col justify-between rounded-3xl p-6 border border-[rgba(209,199,189,0.7)] shadow-e1 hover:shadow-e3 transition-shadow">
          <div>
            {/* Header: Logo, Name, Code, Status */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  onClick={() => router.push(`/teams/${team.id}`)}
                  className="size-11 shrink-0 overflow-hidden rounded-xl border border-[rgba(114,56,61,0.25)] bg-gradient-to-br from-[rgba(114,56,61,0.08)] to-[rgba(114,56,61,0.02)] flex items-center justify-center font-black text-primary text-xs cursor-pointer hover:border-primary transition-colors"
                >
                  {team.logoUrl ? (
                    <img src={team.logoUrl} alt="Logo" className="size-full object-cover" />
                  ) : (
                    team.name
                      .split(' ')
                      .map((w: string) => w[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase() || 'TM'
                  )}
                </div>
                <div className="min-w-0">
                  <h3
                    onClick={() => router.push(`/teams/${team.id}`)}
                    className="truncate text-feature font-bold text-foreground cursor-pointer hover:text-primary transition-colors"
                  >
                    {team.name}
                  </h3>
                  <span className="mt-0.5 block text-[10px] font-black uppercase tracking-[0.16em] text-primary">
                    {team.teamCode}
                  </span>
                </div>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                  isClosed
                    ? 'bg-[rgba(172,156,141,0.22)] text-muted'
                    : 'bg-[rgba(114,56,61,0.08)] text-primary border border-[rgba(114,56,61,0.2)]'
                }`}
              >
                {isClosed ? 'Closed' : 'Open'}
              </span>
            </div>

            {/* Themes */}
            <div className="mt-3 space-y-1 rounded-2xl border border-[rgba(209,199,189,0.5)] bg-[rgba(248,246,242,0.6)] p-2.5">
              <p className="flex items-center gap-1.5 text-caption font-bold text-primary">
                <Briefcase className="size-3 shrink-0" />
                <span className="text-[10px] font-black uppercase">Primary:</span>
                <span className="bg-primary/10 px-1.5 py-0.5 rounded text-[10px]">
                  {team.track.problemStatementCode}
                </span>
                <span className="truncate font-normal text-body">{team.track.name}</span>
              </p>
              {team.secondaryTrack && (
                <p className="flex items-center gap-1.5 text-caption font-bold text-muted">
                  <Briefcase className="size-3 shrink-0 opacity-60" />
                  <span className="text-[10px] font-black uppercase">Secondary:</span>
                  <span className="bg-muted/20 px-1.5 py-0.5 rounded text-[10px] text-body">
                    {team.secondaryTrack.problemStatementCode}
                  </span>
                  <span className="truncate font-normal text-muted">
                    {team.secondaryTrack.name}
                  </span>
                </p>
              )}
            </div>

            <div className="my-3.5 h-px bg-[rgba(209,199,189,0.5)]" />

            {/* Leader Info */}
            <div className="flex items-center justify-between">
              {leader ? (
                <div
                  onClick={() => router.push(`/students/${leader.userId}`)}
                  className="flex items-center gap-2.5 cursor-pointer group/leader"
                >
                  <ProfileAvatar avatarUrl={leader.avatarUrl} name={leader.name} size={7} />
                  <div className="min-w-0">
                    <span className="block text-caption font-bold text-foreground truncate group-hover/leader:text-primary transition-colors">
                      {leader.name}
                    </span>
                    <span className="block text-[9px] text-muted uppercase tracking-wider">
                      Team Leader
                    </span>
                  </div>
                </div>
              ) : (
                <span className="text-caption text-muted">No leader assigned</span>
              )}

              <span className="text-[10px] font-bold text-muted">
                {team.memberCount} / 6 Members
              </span>
            </div>

            {/* Member Slots dials */}
            <div className="mt-3.5">
              <div className="flex flex-wrap items-center gap-1.5">
                {Array.from({ length: 6 }).map((_, idx) => {
                  const mem = team.members[idx];
                  return mem ? (
                    <m.div
                      key={mem.userId}
                      whileHover={{ y: -2 }}
                      onClick={() => router.push(`/students/${mem.userId}`)}
                      className="group relative cursor-pointer"
                    >
                      <ProfileAvatar avatarUrl={mem.avatarUrl} name={mem.name} size={7} />
                      <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded bg-foreground px-2 py-1 text-[9px] font-black text-background opacity-0 transition-opacity duration-200 group-hover:opacity-100 whitespace-nowrap">
                        {mem.name} ({mem.roleInTeam || 'Member'})
                      </span>
                    </m.div>
                  ) : (
                    <div
                      key={`empty-${idx}`}
                      className="size-7 rounded-lg border border-dashed border-[rgba(172,156,141,0.65)] bg-[rgba(172,156,141,0.06)] flex items-center justify-center text-[10px] text-muted font-bold"
                      title="Empty slot"
                    >
                      +
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Skills cover */}
            {team.skillsCovered.length > 0 && (
              <div className="mt-3.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted block mb-1">
                  Skills covered
                </span>
                <div className="flex flex-wrap gap-1">
                  {team.skillsCovered.slice(0, 6).map((s) => (
                    <span
                      key={s}
                      className="rounded-md border border-[rgba(172,156,141,0.45)] bg-[rgba(172,156,141,0.14)] px-2 py-0.5 text-[10px] font-semibold text-foreground"
                    >
                      {s}
                    </span>
                  ))}
                  {team.skillsCovered.length > 6 && (
                    <span className="rounded-md border border-[rgba(209,199,189,0.7)] px-1.5 py-0.5 text-[10px] text-muted">
                      +{team.skillsCovered.length - 6}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Recruitment Notices */}
            {team.recruitmentNotices && team.recruitmentNotices.length > 0 && (
              <div className="mt-3.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary block mb-1">
                  Open Role Notice
                </span>
                <div className="space-y-1.5">
                  {team.recruitmentNotices.slice(0, 1).map((notice) => (
                    <div
                      key={notice.id}
                      className="rounded-xl border border-[rgba(209,199,189,0.6)] bg-[rgba(239,233,225,0.4)] p-2.5 text-[11px]"
                    >
                      <div className="flex items-center justify-between font-bold text-foreground">
                        <span>{notice.role}</span>
                        <span className="text-[9px] uppercase tracking-wider text-primary bg-primary/5 px-1.5 py-0.5 rounded">
                          {notice.gender === 'OPEN' ? 'Any Gender' : notice.gender}
                        </span>
                      </div>
                      {notice.abilities.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {notice.abilities.map((a: string) => (
                            <span
                              key={a}
                              className="bg-white/70 text-muted border border-[rgba(172,156,141,0.3)] px-1.5 py-0.2 rounded text-[9px]"
                            >
                              {a}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Join Actions */}
          <div className="mt-5 border-t border-[rgba(209,199,189,0.6)] pt-3.5 flex items-center justify-between gap-2">
            <Link
              href={`/teams/${team.id}`}
              className="px-3 py-1.5 rounded-xl border border-[rgba(209,199,189,0.8)] bg-white/60 text-xs font-bold text-body hover:border-primary hover:text-primary transition-all text-center inline-flex items-center gap-1"
            >
              <span>View Team</span>
              <ArrowUpRight className="size-3" />
            </Link>

            {userHasTeam ? (
              <span className="text-xs font-semibold text-muted flex items-center gap-1">
                <ShieldAlert className="size-3.5" /> Already in a team
              </span>
            ) : (
              <PremiumButton
                size="sm"
                variant={requestState === 'sent' ? 'glass' : 'primary'}
                loading={requestState === 'sending'}
                disabled={isClosed || Boolean(requestState)}
                onClick={() => onRequestJoin(team)}
              >
                {isClosed ? 'Full' : requestState === 'sent' ? 'Request Sent' : 'Join Team'}
              </PremiumButton>
            )}
          </div>
        </article>
      </SpotlightCard>
    </TiltCard>
  );
}
