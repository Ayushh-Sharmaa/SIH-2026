'use client';

import { motion, type Variants } from 'framer-motion';
import type { ElementType, ReactNode } from 'react';
import { DURATION, EASE } from './tokens';
import { usePrefersReducedMotion } from './useReducedMotion';

type Direction = 'up' | 'down' | 'left' | 'right' | 'none';

const OFFSET: Record<Direction, { x: number; y: number }> = {
  up: { x: 0, y: 28 },
  down: { x: 0, y: -28 },
  left: { x: 32, y: 0 },
  right: { x: -32, y: 0 },
  none: { x: 0, y: 0 },
};

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

/**
 * Scroll-triggered entrance. Collapses to a plain fade when the user
 * prefers reduced motion.
 */
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
  const offset = OFFSET[direction];

  const variants: Variants = reduced
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.2 } },
      }
    : {
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

  return (
    <MotionTag
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
    >
      {children}
    </MotionTag>
  );
}

/**
 * Wraps a group whose children animate in sequence. Children should be
 * `<RevealItem>` (or any motion element using the `hidden`/`visible` names).
 */
export function RevealGroup({
  children,
  className,
  stagger = 0.08,
  delay = 0,
  amount = 0.15,
  once = true,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
  amount?: number;
  once?: boolean;
}) {
  return (
    <motion.div
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
    </motion.div>
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
  const offset = OFFSET[direction];

  const variants: Variants = reduced
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, x: offset.x, y: offset.y, filter: 'blur(8px)' },
        visible: {
          opacity: 1,
          x: 0,
          y: 0,
          filter: 'blur(0px)',
          transition: { duration: DURATION.reveal, ease: EASE.outExpo },
        },
      };

  return (
    <MotionTag className={className} variants={variants}>
      {children}
    </MotionTag>
  );
}
