import React from 'react';
import Navbar from '@/components/layout/Navbar';
import { FindTeammatesSkeleton } from '@/components/ui';

export default function FindTeammatesLoading() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="flex-1">
        <FindTeammatesSkeleton />
      </main>
    </div>
  );
}
