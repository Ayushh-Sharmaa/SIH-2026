import React from 'react';
import Navbar from '@/components/layout/Navbar';
import { OnboardingSkeleton } from '@/components/ui';

export default function OnboardingLoading() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="flex-1">
        <OnboardingSkeleton />
      </main>
    </div>
  );
}
