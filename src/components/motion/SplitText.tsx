'use client';

import { motion, type Variants } from 'framer-motion';
import { DURATION, EASE } from './tokens';
import { usePrefersReducedMotion } from './useReducedMotion';

interface SplitTextProps {
  text: string;
  className?: string;
  /** Animate whole words or individual letters. Default `word`. */
  mode?: 'word' | 'char';
  delay?: number;
  stagger?: number;
  /** Fire on scroll into view instead of on mount. */
  onScroll?: boolean;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
}

/**
 * Masked per-word/per-char reveal. Each unit slides out from behind an
 * `overflow-hidden` wrapper, which reads far more premium than a plain fade.
 * The full string stays available to screen readers via an sr-only copy.
 */
export default function SplitText({
  text,
  className,
  mode = 'word',
  delay = 0,
  stagger,
  onScroll = false,
  as = 'span',
}: SplitTextProps) {
  const reduced = usePrefersReducedMotion();
  const Tag = motion[as];
  const units = mode === 'word' ? text.split(' ') : Array.from(text);
  const step = stagger ?? (mode === 'word' ? 0.055 : 0.022);

  const animateProps = onScroll
    ? { whileInView: 'visible' as const, viewport: { once: true, amount: 0.4 } }
    : { animate: 'visible' as const };

  if (reduced) {
    return (
      <Tag className={className} initial={{ opacity: 0 }} {...(onScroll
        ? { whileInView: { opacity: 1 }, viewport: { once: true, amount: 0.4 } }
        : { animate: { opacity: 1 } })} transition={{ duration: 0.3, delay }}>
        {text}
      </Tag>
    );
  }

  const child: Variants = {
    hidden: { y: '110%', opacity: 0, rotateX: 40 },
    visible: {
      y: '0%',
      opacity: 1,
      rotateX: 0,
      transition: { duration: DURATION.hero, ease: EASE.outExpo },
    },
  };

  return (
    <Tag
      className={className}
      initial="hidden"
      {...animateProps}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: step, delayChildren: delay } },
      }}
      aria-label={text}
    >
      {units.map((unit, i) => (
        <span
          key={`${unit}-${i}`}
          aria-hidden
          className="inline-block overflow-hidden align-bottom"
          style={{ perspective: 600 }}
        >
          <motion.span variants={child} className="inline-block will-change-transform">
            {unit === ' ' ? ' ' : unit}
          </motion.span>
          {mode === 'word' && i < units.length - 1 ? ' ' : null}
        </span>
      ))}
    </Tag>
  );
}
