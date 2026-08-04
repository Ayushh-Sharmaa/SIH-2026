'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wrench } from 'lucide-react';
import Icon from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { useSession } from '@/lib/session';
import { userFacingMessage } from '@/lib/errors';

/**
 * Shown while an admin is exploring the student or mentor dashboard through the
 * admin console, with a one-click route back to their own session.
 *
 * Deliberately `sticky` rather than `fixed`: it must occupy layout space so the
 * navbar below it shifts down instead of being covered. A `fixed` banner would
 * overlap the bar it is warning the user about.
 */
export default function ViewingAsBanner() {
  const router = useRouter();
  const { toast } = useToast();
  // Reads the shared session rather than issuing its own `/api/auth/me` request.
  // The original fetched on mount, which meant a second round trip for data the
  // provider had already loaded — and one that ran on every page, for every
  // user, purely to discover that almost none of them are impersonating.
  const { user, status, isViewingAs } = useSession();
  const [returning, setReturning] = useState(false);

  if (status !== 'authenticated' || !isViewingAs) return null;

  const viewingLabel = user?.role === 'MENTOR' ? 'Mentor' : 'Student';

  const handleReturn = async () => {
    if (returning) return;
    setReturning(true);
    try {
      const response = await fetch('/api/admin/return', {
        method: 'POST',
        credentials: 'same-origin',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not return to admin.');
      router.push(data.redirectUrl || '/admin');
    } catch (error) {
      // Was a native `alert()`: blocking, unstyled, impossible to theme, and
      // the only modal in the app that ignored the design system. The toast
      // system already handles focus and dismissal correctly.
      toast(userFacingMessage(error, 'Could not return to the admin console.'), 'error');
      setReturning(false);
    }
  };

  return (
    <div
      // role="status" rather than "alert": this is an ambient mode indicator,
      // not an interruption, so it should not seize a screen reader mid-sentence.
      role="status"
      className="surface-overlay sticky top-0 z-overlay flex flex-wrap items-center justify-center gap-3 border-b border-line-accent px-gutter py-2.5"
    >
      <span className="flex items-center gap-2 text-caption font-semibold text-accent">
        {/* No `label`, so the icon stays decorative and aria-hidden per the
            Icon contract — the adjacent text already carries the meaning, and
            naming it here would have a screen reader announce it twice.
            Replaces a 🛠️ emoji, which rendered in whatever face the OS supplied
            and matched nothing else on the site. */}
        <Icon icon={Wrench} size="sm" />
        Admin view — exploring the {viewingLabel} dashboard as the sandbox account
      </span>
      <button
        type="button"
        onClick={handleReturn}
        disabled={returning}
        aria-busy={returning}
        className="rounded-control border border-line-accent bg-[rgb(114_56_61_/_0.08)] px-3 py-1 text-label uppercase text-accent transition-colors duration-hover hover:bg-[rgb(114_56_61_/_0.16)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {returning ? 'Returning…' : 'Return to Admin'}
      </button>
    </div>
  );
}
