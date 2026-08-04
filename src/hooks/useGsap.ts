'use client';

import { useEffect, useRef } from 'react';

/**
 * Wraps any element and runs a GSAP ScrollTrigger animation on it when the
 * element enters the viewport. Import GSAP lazily so the ~200KB bundle is
 * never included in the initial JS payload.
 *
 * This module re-exports a collection of ready-to-use hooks:
 *
 *   useParallaxY     — translates the element on the Y axis as the user scrolls
 *   useScrubReveal   — scrubs opacity + y from 0→1 as the element enters view
 *   useCounterScrub  — drives a number counter via scroll position
 */

type ParallaxOptions = {
  speed?: number;        // multiplier: 1 = moves at scroll speed, 0.5 = half
  start?: string;        // GSAP ScrollTrigger `start` value
  end?: string;          // GSAP ScrollTrigger `end` value
};

/** Translates an element on Y proportional to scroll progress. */
export function useParallaxY<T extends HTMLElement>(
  { speed = 0.3, start = 'top bottom', end = 'bottom top' }: ParallaxOptions = {}
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    let ctx: { revert?: () => void } | null = null;

    (async () => {
      const { gsap } = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      gsap.registerPlugin(ScrollTrigger);

      if (!ref.current) return;

      const el = ref.current;
      const rect = el.getBoundingClientRect();
      const travel = rect.height * speed * 0.6;

      ctx = gsap.context(() => {
        gsap.fromTo(
          el,
          { y: -travel },
          {
            y: travel,
            ease: 'none',
            scrollTrigger: {
              trigger: el,
              start,
              end,
              scrub: 1.2,
            },
          }
        );
      });
    })();

    return () => {
      ctx?.revert?.();
    };
  }, [speed, start, end]);

  return ref;
}

type ScrubRevealOptions = {
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  distance?: number;
  blur?: boolean;
  start?: string;
  end?: string;
  scrub?: boolean | number;
  stagger?: number;    // only used when the element has multiple children
};

/** Scrubs opacity + translate from hidden to visible as the element enters the viewport. */
export function useScrubReveal<T extends HTMLElement>(
  {
    direction = 'up',
    distance = 40,
    blur = true,
    start = 'top 90%',
    end = 'top 50%',
    scrub = 0.8,
  }: ScrubRevealOptions = {}
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    let ctx: { revert?: () => void } | null = null;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    (async () => {
      const { gsap } = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      gsap.registerPlugin(ScrollTrigger);

      if (!ref.current) return;
      const el = ref.current;

      const fromX = direction === 'left' ? distance : direction === 'right' ? -distance : 0;
      const fromY = direction === 'up' ? distance : direction === 'down' ? -distance : 0;

      ctx = gsap.context(() => {
        gsap.fromTo(
          el,
          {
            opacity: 0,
            x: fromX,
            y: fromY,
            filter: blur ? 'blur(10px)' : 'none',
          },
          {
            opacity: 1,
            x: 0,
            y: 0,
            filter: 'blur(0px)',
            ease: 'expo.out',
            scrollTrigger: {
              trigger: el,
              start,
              end,
              scrub,
            },
          }
        );
      });
    })();

    return () => {
      ctx?.revert?.();
    };
  }, [direction, distance, blur, start, end, scrub]);

  return ref;
}

type TextScrubOptions = {
  /**
   * When true, each word/char within the element is animated individually with
   * a stagger tied to scroll progress instead of all at once.
   */
  splitWords?: boolean;
  start?: string;
  end?: string;
};

/** Scrubs a heading's characters in sequentially as the section scrolls into view. */
export function useTextScrub<T extends HTMLElement>(
  {
    start = 'top 85%',
    end = 'top 40%',
  }: TextScrubOptions = {}
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    let ctx: { revert?: () => void } | null = null;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    (async () => {
      const { gsap } = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      gsap.registerPlugin(ScrollTrigger);

      if (!ref.current) return;
      const el = ref.current;

      // Collect all already-rendered motion.span children (from SplitText).
      // If none exist, animate the element itself.
      const children = el.querySelectorAll<HTMLElement>('.will-change-transform');
      const targets = children.length > 0 ? Array.from(children) : [el];

      ctx = gsap.context(() => {
        gsap.fromTo(
          targets,
          { opacity: 0.15, y: 20, filter: 'blur(6px)' },
          {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            stagger: 0.035,
            ease: 'expo.out',
            scrollTrigger: {
              trigger: el,
              start,
              end,
              scrub: 1,
            },
          }
        );
      });
    })();

    return () => {
      ctx?.revert?.();
    };
  }, [start, end]);

  return ref;
}
