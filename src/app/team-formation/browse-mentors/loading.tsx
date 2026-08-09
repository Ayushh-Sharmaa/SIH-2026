import React from 'react';
import Navbar from '@/components/layout/Navbar';
import { FindMentorsSkeleton } from '@/components/ui';

export default function FindMentorsLoading() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="flex-1">
        <FindMentorsSkeleton />
      </main>
    </div>
  );
}
