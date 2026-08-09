'use client';

import React from 'react';
import { Container } from '@/components/ui';

// ── UTILITY SHIMMER CLASS ──
const SHIMMER = 'skeleton-shimmer relative overflow-hidden';

// ── REUSABLE CARD SKELETON ──
export function CardSkeleton() {
  return (
    <div className="surface-raised rounded-3xl border border-[rgba(209,199,189,0.7)] p-6 space-y-4 animate-pulse">
      <div className={`h-12 w-12 rounded-2xl ${SHIMMER}`} />
      <div className={`h-6 w-3/4 rounded-lg ${SHIMMER}`} />
      <div className="space-y-2">
        <div className={`h-4 w-full rounded ${SHIMMER}`} />
        <div className={`h-4 w-5/6 rounded ${SHIMMER}`} />
      </div>
    </div>
  );
}

// ── REUSABLE PAGE LOADER (SPINNER) ──
export function PageLoader() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 py-20">
      <div className="relative size-12">
        <div className="absolute inset-0 rounded-full border-4 border-[rgba(114,56,61,0.12)]" />
        <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin" />
      </div>
      <p className="text-xs font-bold uppercase tracking-widest text-muted">
        Loading workspace...
      </p>
    </div>
  );
}

// ── GLOBAL NAVIGATION LOADER PROGRESS BAR ──
export function NavigationLoader({ progress }: { progress: number }) {
  return (
    <div
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      className="fixed top-0 left-0 right-0 z-[100] h-0.5 w-full bg-transparent"
    >
      <div
        className="h-full bg-primary transition-all duration-200 ease-out shadow-[0_1px_8px_rgba(114,56,61,0.5)]"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// ── DASHBOARD LOADING SKELETON ──
export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background text-foreground animate-pulse">
      <Container width="wide" className="py-10 space-y-10">
        {/* Header Skeleton */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <div className={`size-20 rounded-2xl ${SHIMMER}`} />
            <div className="space-y-3">
              <div className={`h-7 w-60 rounded-lg ${SHIMMER}`} />
              <div className={`h-4 w-80 rounded ${SHIMMER}`} />
            </div>
          </div>
          <div className={`h-9 w-32 rounded-xl ${SHIMMER}`} />
        </div>

        {/* Stats Row Skeletons */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="surface-raised rounded-2xl border border-[rgba(209,199,189,0.7)] p-4 space-y-2"
            >
              <div className={`h-8 w-16 rounded-lg ${SHIMMER}`} />
              <div className={`h-3.5 w-24 rounded ${SHIMMER}`} />
            </div>
          ))}
        </div>

        {/* Bento Grid Content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Left panel skeleton */}
          <div className="lg:col-span-2 space-y-6">
            <div className="surface-raised rounded-3xl border border-[rgba(209,199,189,0.7)] p-6 space-y-4">
              <div className={`h-6 w-32 rounded-lg ${SHIMMER}`} />
              <div className="h-px bg-[rgba(209,199,189,0.4)]" />
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex justify-between items-center py-1">
                    <div className={`h-4 w-24 rounded ${SHIMMER}`} />
                    <div className={`h-4 w-12 rounded ${SHIMMER}`} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right panel skeleton */}
          <div className="lg:col-span-3 space-y-6">
            <div className="surface-raised rounded-3xl border border-[rgba(209,199,189,0.7)] p-6 space-y-4">
              <div className={`h-6 w-44 rounded-lg ${SHIMMER}`} />
              <div className="h-px bg-[rgba(209,199,189,0.4)]" />
              <div className="space-y-4">
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 rounded-2xl border border-[rgba(209,199,189,0.5)] p-4"
                  >
                    <div className={`size-10 rounded-xl ${SHIMMER}`} />
                    <div className="flex-1 space-y-2">
                      <div className={`h-4 w-1/3 rounded ${SHIMMER}`} />
                      <div className={`h-3 w-2/3 rounded ${SHIMMER}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}

// ── PROFILE LOADING SKELETON ──
export function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-background text-foreground animate-pulse">
      {/* Header section skeleton */}
      <section className="section-warm relative overflow-hidden pb-10 pt-8">
        <Container width="narrow" className="space-y-6">
          <div className={`h-5 w-16 rounded ${SHIMMER}`} />
          <div className="flex items-center gap-5">
            <div className={`size-20 rounded-2xl ${SHIMMER}`} />
            <div className="space-y-3">
              <div className={`h-8 w-48 rounded-lg ${SHIMMER}`} />
              <div className={`h-4 w-60 rounded ${SHIMMER}`} />
            </div>
          </div>
        </Container>
      </section>

      {/* Main content grid skeleton */}
      <section className="border-t border-[rgba(209,199,189,0.55)] surface-sunken py-12">
        <Container width="narrow" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Academic details card */}
            <div className="surface-raised rounded-3xl border border-[rgba(209,199,189,0.7)] p-6 space-y-5">
              <div className={`h-6 w-36 rounded-lg ${SHIMMER}`} />
              <div className="h-px bg-[rgba(209,199,189,0.4)]" />
              <div className="grid grid-cols-2 gap-4">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className={`h-3.5 w-16 rounded ${SHIMMER}`} />
                    <div className={`h-4.5 w-24 rounded ${SHIMMER}`} />
                  </div>
                ))}
              </div>
            </div>

            {/* Skill split chart card */}
            <div className="surface-raised rounded-3xl border border-[rgba(209,199,189,0.7)] p-6 space-y-5">
              <div className={`h-6 w-32 rounded-lg ${SHIMMER}`} />
              <div className="h-px bg-[rgba(209,199,189,0.4)]" />
              <div className="flex items-center gap-6">
                <div className={`size-24 rounded-full ${SHIMMER}`} />
                <div className="flex-1 space-y-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex justify-between items-center">
                      <div className={`h-3.5 w-20 rounded ${SHIMMER}`} />
                      <div className={`h-3.5 w-10 rounded ${SHIMMER}`} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Large full width skills card */}
          <div className="surface-raised rounded-3xl border border-[rgba(209,199,189,0.7)] p-6 space-y-5">
            <div className={`h-6 w-24 rounded-lg ${SHIMMER}`} />
            <div className="h-px bg-[rgba(209,199,189,0.4)]" />
            <div className="flex flex-wrap gap-2">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className={`h-7 w-20 rounded-full ${SHIMMER}`} />
              ))}
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}

// ── TEAM CARD SKELETON ──
export function TeamCardSkeleton() {
  return (
    <div className="surface-raised rounded-3xl border border-[rgba(209,199,189,0.7)] p-6 flex flex-col justify-between h-72 space-y-4 animate-pulse">
      <div className="space-y-3">
        <div className="flex items-center gap-4">
          <div className={`size-10 rounded-xl ${SHIMMER}`} />
          <div className="flex-1 space-y-2">
            <div className={`h-4.5 w-24 rounded ${SHIMMER}`} />
            <div className={`h-5 w-40 rounded-lg ${SHIMMER}`} />
          </div>
        </div>
        <div className="h-px bg-[rgba(209,199,189,0.4)]" />
        <div className="space-y-1.5">
          <div className={`h-4 w-full rounded ${SHIMMER}`} />
          <div className={`h-4 w-4/5 rounded ${SHIMMER}`} />
        </div>
      </div>
      <div className="flex items-center justify-between pt-2">
        <div className="flex -space-x-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`size-7 rounded-full border border-background ${SHIMMER}`} />
          ))}
        </div>
        <div className={`h-9 w-28 rounded-xl ${SHIMMER}`} />
      </div>
    </div>
  );
}

export function FindTeamsSkeleton() {
  return (
    <div className="min-h-screen bg-background text-foreground animate-pulse">
      <Container width="content" className="py-12 space-y-6">
        <div className={`h-10 w-64 rounded-xl ${SHIMMER}`} />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <TeamCardSkeleton key={i} />
          ))}
        </div>
      </Container>
    </div>
  );
}

// ── STUDENT CARD SKELETON ──
export function StudentCardSkeleton() {
  return (
    <div className="surface-raised rounded-3xl border border-[rgba(209,199,189,0.7)] p-6 flex flex-col justify-between h-64 space-y-4 animate-pulse">
      <div className="space-y-3">
        <div className="flex items-center gap-4">
          <div className={`size-12 rounded-xl ${SHIMMER}`} />
          <div className="flex-1 space-y-2">
            <div className={`h-5 w-36 rounded-lg ${SHIMMER}`} />
            <div className={`h-3.5 w-24 rounded ${SHIMMER}`} />
          </div>
        </div>
        <div className="h-px bg-[rgba(209,199,189,0.4)]" />
        <div className="flex flex-wrap gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`h-5 w-14 rounded-full ${SHIMMER}`} />
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className={`h-4.5 w-24 rounded ${SHIMMER}`} />
        <div className={`h-9 w-24 rounded-xl ${SHIMMER}`} />
      </div>
    </div>
  );
}

export function FindTeammatesSkeleton() {
  return (
    <div className="min-h-screen bg-background text-foreground animate-pulse">
      <Container width="content" className="py-12 space-y-6">
        <div className={`h-10 w-64 rounded-xl ${SHIMMER}`} />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <StudentCardSkeleton key={i} />
          ))}
        </div>
      </Container>
    </div>
  );
}

// ── MENTOR CARD SKELETON ──
export function MentorCardSkeleton() {
  return (
    <div className="surface-raised rounded-3xl border border-[rgba(209,199,189,0.7)] p-5 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 h-auto sm:h-40 animate-pulse">
      <div className="flex gap-4 items-center w-full sm:w-auto">
        <div className={`size-16 rounded-xl shrink-0 ${SHIMMER}`} />
        <div className="space-y-2 flex-1 sm:flex-none">
          <div className={`h-5.5 w-40 rounded-lg ${SHIMMER}`} />
          <div className={`h-4 w-32 rounded ${SHIMMER}`} />
          <div className={`h-3.5 w-52 rounded ${SHIMMER}`} />
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 sm:max-w-xs">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`h-5 w-16 rounded-full ${SHIMMER}`} />
        ))}
      </div>
      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
        <div className={`h-4 w-20 rounded ${SHIMMER}`} />
        <div className={`h-9.5 w-32 rounded-xl ${SHIMMER}`} />
      </div>
    </div>
  );
}

export function FindMentorsSkeleton() {
  return (
    <div className="min-h-screen bg-background text-foreground animate-pulse">
      <Container width="content" className="py-12 space-y-4">
        <div className={`h-10 w-64 rounded-xl ${SHIMMER}`} />
        <div className="space-y-4">
          {[0, 1, 2, 3].map((i) => (
            <MentorCardSkeleton key={i} />
          ))}
        </div>
      </Container>
    </div>
  );
}

// ── TRACK / PROBLEM STATEMENTS SKELETON ──
export function TrackSkeleton() {
  return (
    <div className="surface-raised rounded-2xl border border-[rgba(209,199,189,0.7)] p-5 space-y-4 animate-pulse">
      <div className="flex justify-between items-center">
        <div className={`h-6 w-20 rounded-md ${SHIMMER}`} />
        <div className={`h-5 w-24 rounded-full ${SHIMMER}`} />
      </div>
      <div className={`h-5 w-3/4 rounded ${SHIMMER}`} />
      <div className="space-y-2">
        <div className={`h-4 w-full rounded ${SHIMMER}`} />
        <div className={`h-4 w-5/6 rounded ${SHIMMER}`} />
      </div>
    </div>
  );
}

export function TracksSkeleton() {
  return (
    <div className="min-h-screen bg-background text-foreground animate-pulse">
      <Container width="content" className="py-12 space-y-8">
        <div className="space-y-3">
          <div className={`h-10 w-80 rounded-xl ${SHIMMER}`} />
          <div className={`h-4 w-[24rem] rounded ${SHIMMER}`} />
        </div>
        <div className="flex flex-wrap gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className={`h-8 w-24 rounded-full ${SHIMMER}`} />
          ))}
        </div>
        <div className="space-y-4">
          {[0, 1, 2, 3].map((i) => (
            <TrackSkeleton key={i} />
          ))}
        </div>
      </Container>
    </div>
  );
}

// ── ONBOARDING WIZARD SKELETON ──
export function OnboardingSkeleton() {
  return (
    <div className="min-h-screen bg-background text-foreground animate-pulse">
      <Container width="narrow" className="py-16 space-y-8">
        {/* Step Indicator Header */}
        <div className="flex justify-between items-center">
          <div className={`h-10 w-48 rounded-xl ${SHIMMER}`} />
          <div className={`h-5 w-28 rounded-md ${SHIMMER}`} />
        </div>
        <div className="h-1 bg-[rgba(209,199,189,0.4)] rounded-full">
          <div className={`h-full w-1/3 rounded-full bg-primary ${SHIMMER}`} />
        </div>

        {/* Wizard Form Area */}
        <div className="surface-raised rounded-3xl border border-[rgba(209,199,189,0.7)] p-6 sm:p-9 space-y-6">
          <div className={`h-7 w-56 rounded-lg ${SHIMMER}`} />
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <div className={`h-4.5 w-20 rounded ${SHIMMER}`} />
              <div className={`h-11 w-full rounded-xl border border-[rgba(209,199,189,0.5)] ${SHIMMER}`} />
            </div>
            <div className="space-y-2">
              <div className={`h-4.5 w-20 rounded ${SHIMMER}`} />
              <div className={`h-11 w-full rounded-xl border border-[rgba(209,199,189,0.5)] ${SHIMMER}`} />
            </div>
          </div>
          <div className="space-y-2">
            <div className={`h-4.5 w-32 rounded ${SHIMMER}`} />
            <div className={`h-24 w-full rounded-xl border border-[rgba(209,199,189,0.5)] ${SHIMMER}`} />
          </div>
          <div className="flex justify-between pt-4 border-t border-[rgba(209,199,189,0.4)]">
            <div className={`h-10 w-24 rounded-xl ${SHIMMER}`} />
            <div className={`h-10 w-32 rounded-xl ${SHIMMER}`} />
          </div>
        </div>
      </Container>
    </div>
  );
}

// ── TABLE SKELETON ──
export function TableSkeleton() {
  return (
    <div className="w-full space-y-4 animate-pulse">
      <div className="flex border-b border-[rgba(209,199,189,0.6)] pb-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-4 w-1/4 rounded ${SHIMMER} mx-2`} />
        ))}
      </div>
      {[0, 1, 2, 3].map((row) => (
        <div key={row} className="flex py-2 border-b border-[rgba(209,199,189,0.3)]">
          {[0, 1, 2, 3].map((col) => (
            <div key={col} className={`h-4.5 w-1/5 rounded ${SHIMMER} mx-2`} />
          ))}
        </div>
      ))}
    </div>
  );
}

// ── LIST SKELETON ──
export function ListSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex items-center justify-between p-3 rounded-xl border border-[rgba(209,199,189,0.4)] bg-white/20"
        >
          <div className="flex items-center gap-3">
            <div className={`size-8 rounded-lg ${SHIMMER}`} />
            <div className="space-y-1">
              <div className={`h-4 w-28 rounded ${SHIMMER}`} />
              <div className={`h-3 w-16 rounded ${SHIMMER}`} />
            </div>
          </div>
          <div className={`h-6 w-14 rounded-full ${SHIMMER}`} />
        </div>
      ))}
    </div>
  );
}
