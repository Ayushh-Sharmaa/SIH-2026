'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Shown while an admin is exploring the student or mentor dashboard via the
 * admin console. Gives them a one-click route back to their own session.
 */
export default function ViewingAsBanner() {
  const router = useRouter();
  const [viewingAs, setViewingAs] = useState<string | null>(null);
  const [returning, setReturning] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (!cancelled && data?.authenticated && data?.isViewingAs) {
          setViewingAs(data.user?.role || 'USER');
        }
      } catch {
        // Banner is non-critical; stay hidden if the check fails
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!viewingAs) return null;

  const handleReturn = async () => {
    setReturning(true);
    try {
      const res = await fetch('/api/admin/return', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not return to admin');
      router.push(data.redirectUrl || '/admin');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
      setReturning(false);
    }
  };

  return (
    <div className="sticky top-0 z-50 flex flex-wrap items-center justify-center gap-3 bg-amber-500/15 border-b border-amber-500/40 px-4 py-2.5 text-xs backdrop-blur">
      <span className="font-bold text-amber-300">
        🛠️ Admin view - exploring the {viewingAs === 'MENTOR' ? 'Mentor' : 'Student'} dashboard as
        the sandbox account
      </span>
      <button
        type="button"
        onClick={handleReturn}
        disabled={returning}
        className="px-3 py-1 rounded-lg bg-amber-500/25 text-amber-200 border border-amber-500/50 font-bold hover:bg-amber-500/35 transition-all cursor-pointer disabled:opacity-50"
      >
        {returning ? 'Returning...' : 'Return to Admin'}
      </button>
    </div>
  );
}
