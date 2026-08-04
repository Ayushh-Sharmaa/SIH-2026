'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import { subscribe } from '@/lib/ticker';

/**
 * Momentum scrolling via Lenis.
 *
 * Lenis is driven from the shared ticker (`@/lib/ticker`) rather than its own
 * `requestAnimationFrame` loop. That is what collapses the four independent
 * loops the root layout used to run into one: Lenis and the custom cursor now
 * share a single frame callback instead of scheduling two.
 *
 * Note that this subscription is held for the lifetime of the component, so
 * Lenis is stepped every frame whether or not the page is moving. Releasing the
 * subscription while idle and re-arming it on scroll input would take this to
 * zero cost on a stationary page; it is left running deliberately, since a
 * mid-gesture release can chop the momentum tail. The shared ticker still
 * suspends the whole loop when the tab is hidden, so a backgrounded tab costs
 * nothing either way.
 */

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

    const tick = (time: number) => {
      lenis.raf(time);
    };

    const unsubscribe = subscribe(tick);

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
      document.removeEventListener('click', onAnchorClick);
      unsubscribe();
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
