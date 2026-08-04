'use client';

import { Suspense, lazy, useEffect, useState } from 'react';

/**
 * Gate for pointer-only decoration.
 *
 * `CustomCursor` already refuses to run on touch devices and under reduced
 * motion, but it refused *after* being downloaded, parsed and hydrated. Every
 * phone visitor paid for a canvas trail they could never see.
 *
 * Importing it through `lazy` behind a media-query check moves it into its own
 * chunk that is only ever requested once the browser has confirmed a hovering,
 * fine pointer and no reduced-motion preference. Touch users and reduced-motion
 * users now fetch nothing at all.
 *
 * The queries are watched rather than sampled once, so plugging a mouse into a
 * tablet, or turning reduced motion on mid-session, takes effect immediately
 * instead of at the next full page load.
 */
const CustomCursor = lazy(() => import('./CustomCursor'));

const FINE_POINTER = '(hover: hover) and (pointer: fine)';
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

export default function PointerChrome() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const finePointer = window.matchMedia(FINE_POINTER);
    const reducedMotion = window.matchMedia(REDUCED_MOTION);

    const sync = () => setEnabled(finePointer.matches && !reducedMotion.matches);
    sync();

    finePointer.addEventListener('change', sync);
    reducedMotion.addEventListener('change', sync);
    return () => {
      finePointer.removeEventListener('change', sync);
      reducedMotion.removeEventListener('change', sync);
    };
  }, []);

  if (!enabled) return null;

  // No fallback: the native cursor stays visible until the chunk arrives, which
  // is the correct intermediate state. Rendering a placeholder would mean a
  // brief moment with neither a native nor a custom cursor on screen.
  return (
    <Suspense fallback={null}>
      <CustomCursor />
    </Suspense>
  );
}
