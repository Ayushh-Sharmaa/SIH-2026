'use client';

import { useEffect, useState } from 'react';

/**
 * Reads the OS reduced-motion setting. Starts `false` so server and first
 * client render agree, then corrects in an effect.
 */
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handle = requestAnimationFrame(() => {
      setReduced(mq.matches);
    });
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => {
      cancelAnimationFrame(handle);
      mq.removeEventListener('change', onChange);
    };
  }, []);

  return reduced;
}

/** True on touch/coarse-pointer devices, where hover effects should not run. */
export function useIsCoarsePointer() {
  const [coarse, setCoarse] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)');
    const handle = requestAnimationFrame(() => {
      setCoarse(mq.matches);
    });
    const onChange = (e: MediaQueryListEvent) => setCoarse(e.matches);
    mq.addEventListener('change', onChange);
    return () => {
      cancelAnimationFrame(handle);
      mq.removeEventListener('change', onChange);
    };
  }, []);

  return coarse;
}
