import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page not found',
};

/**
 * 404. A server component by design — there is no reason to ship JavaScript to
 * render a dead end, and it renders instantly as a result.
 */
export default function NotFound() {
  return (
    <main
      id="main"
      className="atmos-ember relative flex min-h-screen flex-1 items-center justify-center px-gutter py-section"
    >
      <div className="relative z-content mx-auto flex max-w-narrow flex-col items-center text-center">
        <p className="text-label uppercase text-accent">Error 404</p>

        <h1 className="mt-4 text-title text-ink">This page took a wrong turn.</h1>

        <p className="mt-5 max-w-prose text-lead text-body">
          The link may be out of date, or the page may have moved. Everything else is still
          where you left it.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-pill bg-accent px-6 py-3 text-sm font-semibold text-on-accent shadow-accent transition-transform duration-200 hover:-translate-y-0.5"
          >
            Back to home
          </Link>
          <Link
            href="/dashboard"
            className="surface-glass rounded-pill px-6 py-3 text-sm font-semibold text-ink transition-transform duration-200 hover:-translate-y-0.5"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
