'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProfileSkeleton } from '@/components/ui';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function SmartProfileRedirect() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    async function resolveRoute() {
      const id = params.id as string;
      if (!id) {
        router.replace('/dashboard');
        return;
      }

      try {
        // Try student profile first
        const studentRes = await fetch(`/api/profile/student?userId=${id}`);
        const studentData = await studentRes.json();
        if (studentData.success) {
          router.replace(`/students/${id}`);
          return;
        }

        // Try mentor profile next
        const mentorRes = await fetch(`/api/profile/mentor?userId=${id}`);
        const mentorData = await mentorRes.json();
        if (mentorData.success) {
          router.replace(`/mentors/${id}`);
          return;
        }

        // Default fallback to student route
        router.replace(`/students/${id}`);
      } catch {
        router.replace(`/students/${id}`);
      }
    }

    resolveRoute();
  }, [params.id, router]);

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
