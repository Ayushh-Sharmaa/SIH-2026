/**
 * ONE requestAnimationFrame loop for the whole application.
 *
 * The audit found four independent, permanently-running rAF loops mounted in
 * the root layout — Lenis (SmoothScroll), CustomCursor, framer-motion's spring
 * in ScrollProgress, and framer's own driver. Each scheduled its own frame
 * callback, so every displayed frame paid four separate JS entry points, four
 * scheduler wake-ups and four chances to miss the 16.6ms budget. None of them
 * stopped when idle, so a parked tab with no pointer movement and no scrolling
 * still burned a full rAF cycle forever.
 *
 * This module replaces them with a single loop that:
 *
 *   - runs only while at least one subscriber is registered,
 *   - stops itself the moment the last subscriber leaves,
 *   - suspends entirely when the document is hidden (background tabs and
 *     locked phones stop draining battery), and
 *   - hands every subscriber the same timestamp and the same clamped delta, so
 *     two animations driven from this ticker can never disagree about how much
 *     time passed between frames.
 *
 * Subscribers are invoked in insertion order and are isolated: one that throws
 * is removed rather than taking the loop down with it.
 */

export type TickFn = (time: number, delta: number) => void;

/**
 * Frame deltas are clamped to this ceiling (ms). Without it, returning to a
 * backgrounded tab delivers one enormous delta and every interpolation driven
 * by it jumps instead of easing. 64ms ≈ four frames at 60Hz.
 */
const MAX_DELTA = 64;

const subscribers = new Set<TickFn>();

let frame = 0;
let lastTime = 0;

function loop(time: number) {
  // First frame after a start or a resume has no meaningful predecessor.
  const delta = lastTime === 0 ? 16.67 : Math.min(time - lastTime, MAX_DELTA);
  lastTime = time;

  // Iterate a copy: a subscriber may unsubscribe itself (or another) mid-tick,
  // and mutating a Set while iterating it silently skips entries.
  for (const fn of [...subscribers]) {
    try {
      fn(time, delta);
    } catch {
      // A broken subscriber must not stall every other animation on the page.
      subscribers.delete(fn);
    }
  }

  frame = subscribers.size > 0 ? requestAnimationFrame(loop) : 0;
}

function start() {
  if (frame !== 0 || subscribers.size === 0) return;
  if (typeof document !== 'undefined' && document.hidden) return;
  // Reset rather than carry a stale timestamp across the idle gap.
  lastTime = 0;
  frame = requestAnimationFrame(loop);
}

function stop() {
  if (frame === 0) return;
  cancelAnimationFrame(frame);
  frame = 0;
}

if (typeof document !== 'undefined') {
  document.addEventListener(
    'visibilitychange',
    () => (document.hidden ? stop() : start()),
    { passive: true },
  );
}

/**
 * Registers a per-frame callback and returns its unsubscribe function.
 *
 * The loop starts on the first subscriber and stops on the last, so callers
 * never manage lifecycle themselves — returning this straight out of a
 * `useEffect` is the intended usage.
 */
export function subscribe(fn: TickFn): () => void {
  subscribers.add(fn);
  start();

  let done = false;
  return () => {
    // Guard against double-invocation: React 18+ StrictMode runs effect
    // cleanups twice in development, and deleting an already-deleted entry
    // would otherwise let a re-added subscriber be dropped.
    if (done) return;
    done = true;
    subscribers.delete(fn);
    if (subscribers.size === 0) stop();
  };
}

/** Number of live subscribers. Exposed for tests. */
export function subscriberCount(): number {
  return subscribers.size;
}

/** True while the shared loop is scheduled. Exposed for tests. */
export function isRunning(): boolean {
  return frame !== 0;
}
