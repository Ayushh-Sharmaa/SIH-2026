import React from 'react';
import Navbar from '@/components/layout/Navbar';
import { FindTeamsSkeleton } from '@/components/ui';

export default function FindTeamsLoading() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="flex-1">
        <FindTeamsSkeleton />
      </main>
    </div>
  );
}
