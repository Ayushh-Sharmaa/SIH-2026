'use client';

import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useEffect } from 'react';
import { usePrefersReducedMotion, useIsCoarsePointer } from './useReducedMotion';

/**
 * Layered ambient background: drifting aurora blobs plus an optional
 * cursor-following spotlight. Pure CSS transforms — no canvas, no WebGL,
 * so it stays cheap and degrades gracefully.
 */
export default function Aurora({
  spotlight = true,
  variant = 'warm',
  className = '',
}: {
  spotlight?: boolean;
  /** Tints the blobs differently per page so no two pages look alike. */
  variant?: 'warm' | 'cool' | 'taupe' | 'rose';
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const coarse = useIsCoarsePointer();

  const x = useMotionValue(-1000);
  const y = useMotionValue(-1000);
  const sx = useSpring(x, { stiffness: 60, damping: 20, mass: 0.8 });
  const sy = useSpring(y, { stiffness: 60, damping: 20, mass: 0.8 });

  useEffect(() => {
    if (!spotlight || reduced || coarse) return;
    const onMove = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [spotlight, reduced, coarse, x, y]);

  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div className={`aurora-field aurora-${variant} ${reduced ? 'aurora-static' : ''}`}>
        <span className="aurora-blob aurora-blob-1" />
        <span className="aurora-blob aurora-blob-2" />
        <span className="aurora-blob aurora-blob-3" />
      </div>

      {spotlight && !reduced && !coarse && (
        <motion.div className="spotlight" style={{ left: sx, top: sy }} />
      )}
    </div>
  );
}
