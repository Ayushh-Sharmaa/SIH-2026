'use client';

import { motion, type Variants } from 'framer-motion';
import type { ElementType, ReactNode } from 'react';
import { DURATION, EASE, STAGGER, TRAVEL, REDUCED } from './tokens';
import { usePrefersReducedMotion } from './useReducedMotion';

/**
 * Scroll-triggered entrance.
 *
 * Note on reduced motion: MotionProvider sets `reducedMotion="user"`, which
 * suppresses transform and layout animation globally — but NOT `filter`. The
 * blur-in used here is a filter, so it still has to be handled explicitly.
 * That is why these components keep their own reduced-motion branch.
 */

type Direction = 'up' | 'down' | 'left' | 'right' | 'none';

const OFFSET: Record<Direction, { x: number; y: number }> = {
  up: { x: 0, y: TRAVEL.md },
  down: { x: 0, y: -TRAVEL.md },
  left: { x: TRAVEL.lg, y: 0 },
  right: { x: -TRAVEL.lg, y: 0 },
  none: { x: 0, y: 0 },
};

function buildVariants({
  direction,
  blur,
  scale,
  duration,
  delay,
  reduced,
}: {
  direction: Direction;
  blur: boolean;
  scale: boolean;
  duration: number;
  delay: number;
  reduced: boolean;
}): Variants {
  if (reduced) return REDUCED;

  const offset = OFFSET[direction];
  return {
    hidden: {
      opacity: 0,
      x: offset.x,
      y: offset.y,
      ...(blur ? { filter: 'blur(10px)' } : null),
      ...(scale ? { scale: 0.95 } : null),
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      ...(blur ? { filter: 'blur(0px)' } : null),
      ...(scale ? { scale: 1 } : null),
      transition: { duration, delay, ease: EASE.outExpo },
    },
  };
}

export interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Entrance direction. Default `up`. */
  direction?: Direction;
  delay?: number;
  duration?: number;
  /** Adds a blur-in. Default true. */
  blur?: boolean;
  scale?: boolean;
  /** How much must be visible before firing (0–1). Default 0.15. */
  amount?: number;
  once?: boolean;
  as?: ElementType;
}

export default function Reveal({
  children,
  className,
  direction = 'up',
  delay = 0,
  duration = DURATION.reveal,
  blur = true,
  scale = false,
  amount = 0.15,
  once = true,
  as = 'div',
}: RevealProps) {
  const reduced = usePrefersReducedMotion();
  const MotionTag = motion[as as 'div'] ?? motion.div;

  return (
    <MotionTag
      className={className}
      variants={buildVariants({ direction, blur, scale, duration, delay, reduced })}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
    >
      {children}
    </MotionTag>
  );
}

/**
 * Sequences its children. Children must be `<RevealItem>` (or any motion
 * element using the same `hidden`/`visible` variant names).
 */
export function RevealGroup({
  children,
  className,
  stagger = STAGGER.normal,
  delay = 0,
  amount = 0.15,
  once = true,
  as = 'div',
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
  amount?: number;
  once?: boolean;
  as?: ElementType;
}) {
  const MotionTag = motion[as as 'div'] ?? motion.div;

  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
    >
      {children}
    </MotionTag>
  );
}

export function RevealItem({
  children,
  className,
  direction = 'up',
  as = 'div',
}: {
  children: ReactNode;
  className?: string;
  direction?: Direction;
  as?: ElementType;
}) {
  const reduced = usePrefersReducedMotion();
  const MotionTag = motion[as as 'div'] ?? motion.div;

  return (
    <MotionTag
      className={className}
      variants={buildVariants({
        direction,
        blur: true,
        scale: false,
        duration: DURATION.reveal,
        delay: 0,
        reduced,
      })}
    >
      {children}
    </MotionTag>
  );
}
