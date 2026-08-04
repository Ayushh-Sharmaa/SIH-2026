'use client';

import { m } from 'framer-motion';
import { cn } from '@/lib/cn';
import { EASE } from '@/components/motion/tokens';
import { usePrefersReducedMotion } from '@/components/motion/useReducedMotion';

/**
 * Section separators that are not flat rules.
 *
 * A 1px full-width line reads cheap because it terminates hard at both edges.
 * Every variant here dissolves at its ends instead, so the separation is felt
 * without a visible stopping point.
 */

export type DividerVariant = 'line' | 'soft' | 'glow' | 'wave' | 'arc';

export interface DividerProps {
  variant?: DividerVariant;
  className?: string;
  /** Draw the line in from the centre when it scrolls into view. */
  animate?: boolean;
  /** Vertical rule for splitting side-by-side content. */
  vertical?: boolean;
}

export default function Divider({
  variant = 'line',
  className,
  animate = true,
  vertical = false,
}: DividerProps) {
  const reduced = usePrefersReducedMotion();
  const shouldAnimate = animate && !reduced;

  if (vertical) {
    return <span aria-hidden className={cn('divider-vertical', className)} />;
  }

  if (variant === 'wave' || variant === 'arc') {
    return <ShapeDivider variant={variant} className={className} animate={shouldAnimate} />;
  }

  const base =
    variant === 'glow' ? 'divider-glow' : variant === 'soft' ? 'divider-soft' : 'divider';

  if (!shouldAnimate) {
    return <hr aria-hidden className={cn(base, 'border-0', className)} />;
  }

  return (
    <m.hr
      aria-hidden
      className={cn(base, 'border-0', className)}
      initial={{ scaleX: 0, opacity: 0 }}
      whileInView={{ scaleX: 1, opacity: 1 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 0.9, ease: EASE.outExpo }}
      style={{ transformOrigin: 'center' }}
    />
  );
}

/**
 * SVG separators for transitions between two different atmospheres, where a
 * straight edge would make the colour change look like a seam.
 */
function ShapeDivider({
  variant,
  className,
  animate,
}: {
  variant: 'wave' | 'arc';
  className?: string;
  animate: boolean;
}) {
  const d =
    variant === 'wave'
      ? 'M0,32 C240,72 480,0 720,24 C960,48 1200,80 1440,40 L1440,80 L0,80 Z'
      : 'M0,80 C360,0 1080,0 1440,80 L1440,80 L0,80 Z';

  return (
    <div aria-hidden className={cn('pointer-events-none w-full leading-[0]', className)}>
      <svg
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        className="block h-10 w-full sm:h-14"
        role="presentation"
        focusable="false"
      >
        <defs>
          <linearGradient id={`div-${variant}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgb(209 199 189 / 0)" />
            <stop offset="50%" stopColor="rgb(209 199 189 / 0.55)" />
            <stop offset="100%" stopColor="rgb(209 199 189 / 0)" />
          </linearGradient>
        </defs>
        {animate ? (
          <m.path
            d={d}
            fill={`url(#div-${variant})`}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.9, ease: EASE.outExpo }}
          />
        ) : (
          <path d={d} fill={`url(#div-${variant})`} />
        )}
      </svg>
    </div>
  );
}
