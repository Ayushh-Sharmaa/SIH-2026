'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import { subscribe } from '@/lib/ticker';

/**
 * Momentum scrolling via Lenis, driven on demand.
 *
 * The previous implementation opened a `requestAnimationFrame` loop on mount
 * and never closed it. Lenis only has work to do while the page is actually
 * moving, so on a stationary page — which is most of the time a user spends
 * reading — that loop woke the main thread 60 times a second to call
 * `lenis.raf()` and have it decide there was nothing to interpolate. On a
 * laptop that is a measurable, permanent battery draw; on a low-end phone it is
 * main-thread budget stolen from scrolling itself.
 *
 * This version subscribes to the shared ticker only when scroll input arrives,
 * and unsubscribes once Lenis has been still for a short grace period. An idle
 * page schedules no frames at all.
 */

/**
 * Frames Lenis must report itself still before the loop is released. Lenis can
 * read as not-scrolling for a frame or two mid-gesture between a wheel event
 * and the next, so releasing immediately would visibly chop momentum. ~20
 * frames is a third of a second at 60Hz: long enough to bridge those gaps,
 * short enough that idle cost returns to zero promptly.
 */
const IDLE_FRAMES_BEFORE_RELEASE = 20;

/** Extra clearance below the fixed navbar when jumping to an anchor. */
const ANCHOR_CLEARANCE = 20;

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Reduced-motion users keep the browser's native, instant scrolling. Lenis
    // is never constructed, so they also never pay for its bundle behaviour.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 1.8,
    });

    let unsubscribe: (() => void) | null = null;
    let idleFrames = 0;

    const release = () => {
      unsubscribe?.();
      unsubscribe = null;
    };

    const tick = (time: number) => {
      lenis.raf(time);

      // `isScrolling` covers both the wheel/touch gesture and the momentum tail
      // that outlives it, which is exactly the window in which frames matter.
      if (lenis.isScrolling) {
        idleFrames = 0;
        return;
      }

      if (++idleFrames >= IDLE_FRAMES_BEFORE_RELEASE) release();
    };

    const ensureRunning = () => {
      idleFrames = 0;
      if (!unsubscribe) unsubscribe = subscribe(tick);
    };

    // Any input that could move the page re-arms the loop. These are all
    // passive: none of them call preventDefault, and marking them so lets the
    // browser start compositor-driven scrolling without waiting on this
    // listener to return.
    const INPUT_EVENTS = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const;
    for (const type of INPUT_EVENTS) {
      window.addEventListener(type, ensureRunning, { passive: true });
    }
    // Programmatic scrolls (scrollTo, hash landings, anchor jumps) produce no
    // input event, so listen for the resulting scroll as well.
    window.addEventListener('scroll', ensureRunning, { passive: true });

    /**
     * Routes in-page anchor clicks through Lenis so they ease rather than jump.
     * Cannot be passive: it calls preventDefault to suppress the native jump.
     */
    const onAnchorClick = (event: MouseEvent) => {
      // Let modified clicks (new tab, download, middle-click) behave natively.
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as Element | null)?.closest?.('a[href^="#"]');
      if (!anchor) return;

      const hash = anchor.getAttribute('href');
      if (!hash || hash === '#') return;

      let target: Element | null = null;
      try {
        target = document.querySelector(hash);
      } catch {
        // A malformed fragment is not a valid selector. Fall through to the
        // browser's own handling rather than throwing inside a listener.
        return;
      }
      if (!target) return;

      event.preventDefault();

      // Derived from the navbar's single height definition rather than the
      // hardcoded -96 this used to carry, which overshot by 16-20px depending
      // on breakpoint.
      const navHeight =
        parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue('--nav-h'),
        ) || 76;

      ensureRunning();
      lenis.scrollTo(target as HTMLElement, { offset: -(navHeight + ANCHOR_CLEARANCE) });

      // Keep the URL and the document's focus target in step with the jump, so
      // the fragment is shareable and the next Tab press continues from the
      // destination rather than from the link.
      history.replaceState(null, '', hash);
      if (target instanceof HTMLElement) {
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }
    };
    document.addEventListener('click', onAnchorClick);

    return () => {
      for (const type of INPUT_EVENTS) window.removeEventListener(type, ensureRunning);
      window.removeEventListener('scroll', ensureRunning);
      document.removeEventListener('click', onAnchorClick);
      release();
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
