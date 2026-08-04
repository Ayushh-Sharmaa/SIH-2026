'use client';

import { useEffect, useRef, type ReactNode, type MouseEvent } from 'react';
import { usePrefersReducedMotion, useIsCoarsePointer } from './useReducedMotion';

interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
  /** Spotlight radius in px. Default 320. */
  radius?: number;
  /** Spotlight opacity at peak. Default 0.12. */
  intensity?: number;
}

/**
 * Card wrapper that renders a cursor-tracked radial spotlight using only CSS
 * custom properties — no React re-renders on mouse move.
 *
 * Usage:
 *   <SpotlightCard className="rounded-3xl p-7">...</SpotlightCard>
 *
 * The spotlight pseudo-element is defined in surfaces.css (.spotlight-card).
 * Disabled on coarse pointers and for reduced-motion users.
 */
export default function SpotlightCard({
  children,
  className = '',
  radius = 320,
  intensity = 0.12,
}: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const coarse = useIsCoarsePointer();
  const disabled = reduced || coarse;

  useEffect(() => {
    if (disabled) return;
    const el = ref.current;
    if (!el) return;
    // Ensure the CSS vars are set so the spotlight doesn't flash to the wrong
    // position on first hover.
    el.style.setProperty('--spotlight-x', '-9999px');
    el.style.setProperty('--spotlight-y', '-9999px');
    el.style.setProperty('--spotlight-r', `${radius}px`);
    el.style.setProperty('--spotlight-i', String(intensity));
  }, [disabled, radius, intensity]);

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    if (disabled || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    ref.current.style.setProperty('--spotlight-x', `${e.clientX - rect.left}px`);
    ref.current.style.setProperty('--spotlight-y', `${e.clientY - rect.top}px`);
  };

  const onLeave = () => {
    if (!ref.current) return;
    ref.current.style.setProperty('--spotlight-x', '-9999px');
    ref.current.style.setProperty('--spotlight-y', '-9999px');
  };

  return (
    <div
      ref={ref}
      className={`spotlight-card ${className}`}
      onMouseMove={disabled ? undefined : onMove}
      onMouseLeave={disabled ? undefined : onLeave}
    >
      {children}
    </div>
  );
}
