import React from 'react';
import Navbar from '@/components/layout/Navbar';
import { TracksSkeleton } from '@/components/ui';

export default function TracksLoading() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="flex-1">
        <TracksSkeleton />
      </main>
    </div>
  );
}
