'use client';

import { useEffect, useRef } from 'react';

/**
 * Reading-progress bar.
 *
 * Previously built from framer-motion's `useScroll` + `useSpring`, which meant
 * a third permanently-running rAF loop in the root layout, a spring solver
 * stepping every frame whether or not the page had moved, and a React motion
 * value updating on every scroll event — all to drive a single `scaleX`.
 *
 * Where the browser supports scroll-driven animations the bar is now pure CSS
 * (`animation-timeline: scroll(root block)`, see base.css). That runs on the
 * compositor, off the main thread: it costs no JavaScript, cannot be delayed by
 * a busy main thread, and is already correct before React has hydrated.
 *
 * This component exists only to cover browsers that lack the feature. There it
 * installs one passive scroll listener that writes `scaleX` inside a rAF, so at
 * most one style write happens per painted frame however many scroll events
 * fire in between.
 */
export default function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    // The CSS rule and this listener would drive the same property. Detect the
    // exact feature the stylesheet gates on, so the two can never both be live
    // and fight each other for the transform.
    const hasScrollTimeline =
      typeof CSS !== 'undefined' &&
      typeof CSS.supports === 'function' &&
      CSS.supports('animation-timeline: scroll()');
    if (hasScrollTimeline) return;

    let frame = 0;

    const write = () => {
      frame = 0;
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const scrollable = scrollHeight - clientHeight;
      // A page shorter than the viewport has nothing to progress through.
      // Guarding also stops a division by zero putting NaN in the transform,
      // which would drop the element entirely rather than merely mis-size it.
      const progress = scrollable > 0 ? Math.min(scrollTop / scrollable, 1) : 0;
      bar.style.transform = `scaleX(${progress})`;
    };

    const onScroll = () => {
      // Coalesce: scroll fires many times between two painted frames, and only
      // the last value before a paint is ever seen.
      if (frame === 0) frame = requestAnimationFrame(write);
    };

    write();
    window.addEventListener('scroll', onScroll, { passive: true });
    // Resize changes both scrollHeight and clientHeight, so the ratio has to be
    // recomputed even though the scroll offset itself has not moved.
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      if (frame !== 0) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return <div ref={barRef} aria-hidden className="scroll-progress" />;
}
