'use client';

import { useEffect } from 'react';
import Link from 'next/link';

/**
 * Route-level error boundary.
 *
 * Catches render and data errors within the app segment and offers recovery
 * rather than a blank screen. `reset()` re-renders the segment, which is often
 * enough for a transient fetch failure.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Wire this to real error reporting when it exists.
    console.error('Route error:', error);
  }, [error]);

  return (
    <main
      id="main"
      className="atmos-quarry relative flex min-h-screen flex-1 items-center justify-center px-gutter py-section"
    >
      <div className="relative z-content mx-auto flex max-w-narrow flex-col items-center text-center">
        <p className="text-label uppercase text-accent">Something broke</p>

        <h1 className="mt-4 text-title text-ink">We hit an unexpected error.</h1>

        <p className="mt-5 max-w-prose text-lead text-body">
          This is on us, not you. Try again — and if it keeps happening, let the SIH cell at
          GL Bajaj know.
        </p>

        {error.digest && (
          <p className="mt-4 font-mono text-caption text-faint">Reference: {error.digest}</p>
        )}

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-pill bg-accent px-6 py-3 text-sm font-semibold text-on-accent shadow-accent transition-transform duration-200 hover:-translate-y-0.5"
          >
            Try again
          </button>
          <Link
            href="/"
            className="surface-glass rounded-pill px-6 py-3 text-sm font-semibold text-ink transition-transform duration-200 hover:-translate-y-0.5"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
