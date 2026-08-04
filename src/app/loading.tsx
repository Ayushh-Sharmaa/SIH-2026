/**
 * Route-level loading state.
 *
 * A skeleton rather than a spinner: it reserves the layout the real content
 * will occupy, so the swap does not shift the page. Server-rendered, so it
 * appears immediately during navigation.
 */
export default function Loading() {
  return (
    <main id="main" className="atmos-mist relative min-h-screen flex-1 py-section">
      <div className="mx-auto w-full max-w-content px-gutter">
        {/* Header block */}
        <div className="flex flex-col gap-4">
          <span className="skeleton-shimmer block h-3 w-28 rounded-pill" />
          <span className="skeleton-shimmer block h-10 w-full max-w-xl rounded-panel" />
          <span className="skeleton-shimmer block h-4 w-full max-w-md rounded-pill" />
        </div>

        {/* Content grid */}
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="surface-raised rounded-card p-6">
              <span className="skeleton-shimmer block size-12 rounded-panel" />
              <span className="skeleton-shimmer mt-5 block h-4 w-3/4 rounded-pill" />
              <span className="skeleton-shimmer mt-3 block h-3 w-full rounded-pill" />
              <span className="skeleton-shimmer mt-2 block h-3 w-5/6 rounded-pill" />
            </div>
          ))}
        </div>
      </div>

      <span className="sr-only" role="status">
        Loading page content
      </span>
    </main>
  );
}
