'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { DURATION, EASE } from '@/components/motion/tokens';

/**
 * Branded first-paint curtain. Shown once per browser session, so returning to
 * the site mid-session is instant rather than ceremonial.
 *
 * Three defects in the previous implementation:
 *
 * **It held for a flat 1500ms regardless of readiness.** Largest Contentful
 * Paint is the last contentful paint recorded before the first interaction, so
 * a curtain that hides the hero until t=1500ms and then fades for another 700ms
 * put a hard floor of roughly 2.2s under LCP — on its own enough to miss the
 * 2.5s target on a fast connection, and to miss it badly on a slow one. The
 * hold is now bounded by what the page is actually doing: it leaves as soon as
 * the document and its fonts are ready, with a floor low enough to avoid a
 * flash and a ceiling that guarantees it can never strand the user.
 *
 * **It locked body scroll.** Setting `overflow: hidden` on the body removes the
 * scrollbar, which widens the layout viewport and reflows every element on the
 * page — a Cumulative Layout Shift on load, and a second one when the lock is
 * released. The lock also bought nothing: the curtain is `fixed inset-0` and
 * already covers everything that could be scrolled. It is simply gone.
 *
 * **It animated `filter: blur()` across the full viewport on exit.** A blur on
 * a full-screen element cannot be composited — it forces a re-raster of every
 * pixel on screen, every frame, at exactly the moment the browser is also
 * trying to paint the real page underneath. The exit is now opacity and scale,
 * which the compositor runs on the GPU without touching layout or paint, and
 * which reads as the same soft dissolve.
 */

/** Below this the curtain reads as a flicker rather than an intro. */
const MINIMUM_VISIBLE_MS = 550;

/**
 * Hard ceiling. If readiness never resolves — a stalled font request, a hung
 * third-party script — the curtain must still leave. It is decoration; it is
 * never allowed to become the reason the site appears broken.
 */
const MAXIMUM_VISIBLE_MS = 1200;

const SESSION_KEY = 'sih-intro-shown';

export default function LoadingScreen() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // sessionStorage throws in some privacy modes and in sandboxed frames.
    // Failing to read it must not take the page down, and the safe fallback is
    // to skip the intro entirely rather than risk showing it on every route.
    let alreadyShown = true;
    try {
      alreadyShown = sessionStorage.getItem(SESSION_KEY) !== null;
    } catch {
      alreadyShown = true;
    }
    if (alreadyShown) return;

    const markShown = () => {
      try {
        sessionStorage.setItem(SESSION_KEY, '1');
      } catch {
        // Nothing to do: the intro simply may show again next navigation.
      }
    };

    // Reduced motion gets no curtain at all. An unavoidable full-screen overlay
    // is not something a user who asked for less motion should have to sit
    // through, and the content behind it is ready either way.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      markShown();
      return;
    }

    setVisible(true);
    const shownAt = performance.now();

    let floorTimer = 0;
    let ceilingTimer = 0;
    let dismissed = false;

    const dismiss = () => {
      if (dismissed) return;
      dismissed = true;
      window.clearTimeout(floorTimer);
      window.clearTimeout(ceilingTimer);
      markShown();
      setVisible(false);
    };

    /** Dismiss now if the floor has elapsed, otherwise wait out the remainder. */
    const dismissRespectingFloor = () => {
      if (dismissed) return;
      const remaining = MINIMUM_VISIBLE_MS - (performance.now() - shownAt);
      if (remaining <= 0) dismiss();
      else floorTimer = window.setTimeout(dismiss, remaining);
    };

    // Readiness is "document parsed and fonts resolved". Fonts matter because
    // lifting the curtain before they swap in shows the fallback face for a
    // frame and then reflows — the exact swap the metric-matched fallback in
    // the layout exists to prevent.
    const readiness: Promise<unknown>[] = [];

    if (document.readyState !== 'complete') {
      readiness.push(
        new Promise<void>((resolve) =>
          window.addEventListener('load', () => resolve(), { once: true }),
        ),
      );
    }
    // `document.fonts` is absent in older Safari; optional chaining keeps this
    // a progressive enhancement rather than a hard dependency.
    if (document.fonts?.ready) readiness.push(document.fonts.ready);

    Promise.all(readiness).then(dismissRespectingFloor).catch(dismissRespectingFloor);

    ceilingTimer = window.setTimeout(dismiss, MAXIMUM_VISIBLE_MS);

    return () => {
      window.clearTimeout(floorTimer);
      window.clearTimeout(ceilingTimer);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="intro"
          // aria-hidden: assistive technology should reach the real content
          // immediately rather than announce a decorative curtain.
          aria-hidden
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: DURATION.page, ease: EASE.outExpo }}
          className="fixed inset-0 z-boot flex items-center justify-center bg-canvas"
        >
          <div className="flex flex-col items-center gap-7">
            <motion.svg
              viewBox="0 0 100 100"
              className="size-16"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, ease: EASE.outExpo }}
            >
              <defs>
                <linearGradient id="introGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--color-accent)" />
                  <stop offset="100%" stopColor="var(--color-clay)" />
                </linearGradient>
              </defs>
              <motion.polygon
                points="50,10 87,31 87,71 50,92 13,71 13,31"
                fill="none"
                stroke="url(#introGrad)"
                strokeWidth="3"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.9, ease: EASE.outExpo }}
              />
              <motion.circle
                cx="50"
                cy="50"
                r="13"
                fill="url(#introGrad)"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.35, ease: EASE.outExpo }}
                style={{ transformOrigin: 'center' }}
              />
            </motion.svg>

            <div className="h-px w-40 overflow-hidden rounded-pill bg-clay/30">
              <motion.div
                className="h-full bg-gradient-to-r from-accent to-clay"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1, ease: EASE.outExpo }}
                style={{ transformOrigin: 'left' }}
              />
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.45 }}
              // Tracking is widened past the token here because the wordmark is
              // set alone and reads as a monogram rather than a label.
              className="text-label uppercase tracking-[0.32em] text-muted"
            >
              SIH@GLBGOI
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
