'use client';

import { usePathname } from 'next/navigation';
import { m } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { DURATION, EASE } from '@/components/motion/tokens';

/**
 * Route transition.
 *
 * Three defects in the previous implementation, all of them user-visible:
 *
 * 1. `<AnimatePresence mode="wait">` meant the OUTGOING page had to finish its
 *    500ms exit before the incoming page was allowed to mount. Every single
 *    navigation therefore cost half a second of dead time in which nothing was
 *    on screen and nothing could be clicked. That is the largest single source
 *    of the "slow interactions" this pass was asked to fix, and it was pure
 *    waste — the new page had already been fetched and was ready to paint.
 *
 * 2. The wrapper animated `y`, `scale` and `filter`. Any of `transform`,
 *    `filter` or `perspective` on an ancestor makes it the containing block for
 *    `position: fixed` descendants (CSS Position 3 §4). The navbar is
 *    `fixed inset-x-0 top-0` and lives inside this wrapper, so for the length of
 *    every transition it silently stopped being viewport-fixed and rode along
 *    with the animating page. `opacity` creates a stacking context but NOT a
 *    containing block, which is why this now animates opacity alone.
 *
 * 3. Animating `filter: blur()` across a full-viewport subtree forces the
 *    compositor to re-rasterise the entire document on every frame of the
 *    transition — the most expensive thing that can be asked of it, and the
 *    cause of the stutter on route change. Per-section entrance richness
 *    belongs to `Reveal`, which animates small subtrees that raster cheaply.
 *
 * The first render deliberately does not animate. Fading the page up from
 * `opacity: 0` on a cold load would push Largest Contentful Paint out by the
 * full length of the animation, because a paint does not count toward LCP until
 * the element is actually visible. Cold load is therefore instant; only
 * client-side route changes are animated.
 */
export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // A ref, not state: recording that the first paint has happened must not
  // itself schedule a render.
  const isFirstRender = useRef(true);
  const [animateEntrance, setAnimateEntrance] = useState(false);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setAnimateEntrance(true);
  }, [pathname]);

  // Scroll handling is intentionally absent. Next's App Router already resets
  // scroll on forward navigation and restores the previous offset on back and
  // forward. The `window.scrollTo({ top: 0 })` that used to run here on every
  // pathname change defeated that restoration, so the browser's back button
  // always dumped the user at the top of the page they had returned to.
  //
  // Reduced motion is handled by MotionProvider's `reducedMotion="user"`, which
  // suppresses transform and layout animation. A short opacity fade is the
  // correct behaviour under reduced motion — the guidance is to remove travel,
  // not to make changes snap.

  return (
    <m.div
      key={pathname}
      // `false` on the first paint means no `opacity: 0` start, so LCP is not
      // delayed by this wrapper on a cold load.
      initial={animateEntrance ? { opacity: 0 } : false}
      animate={{ opacity: 1 }}
      transition={{ duration: DURATION.page, ease: EASE.outExpo }}
      // `dvh`, not `vh`: on mobile browsers `100vh` is the viewport with the URL
      // bar hidden, so a `min-h-screen` column overflows by the height of the
      // bar and produces a spurious scrollbar on every page.
      className="flex min-h-dvh flex-col"
    >
      {children}
    </m.div>
  );
}
