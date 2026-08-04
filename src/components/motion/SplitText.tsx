'use client';

import { m, type Variants } from 'framer-motion';
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
  /**
   * Per-character gradient colors [from, to].
   * When set, each char receives a proportional color from the gradient.
   * Only works in `char` mode.
   */
  gradientColors?: [string, string];
}

/**
 * Masked per-word/per-char reveal.
 *
 * word mode  — each word slides out from behind overflow:hidden with a
 *              3D rotateX for a premium "from behind the stage" feel.
 *
 * char mode  — each character uses the same 3D reveal with an additional
 *              blur, scale, and optional per-character color gradient that
 *              sweeps across the text. The motion is dramatically more
 *              precise than word mode and reads as handcrafted.
 *
 * The full string stays available to screen readers via an aria-label on
 * the parent so the fragmented markup does not affect assistive tech.
 */
export default function SplitText({
  text,
  className,
  mode = 'word',
  delay = 0,
  stagger,
  onScroll = false,
  as = 'span',
  gradientColors,
}: SplitTextProps) {
  const reduced = usePrefersReducedMotion();
  const Tag = m[as];
  const units = mode === 'word' ? text.split(' ') : Array.from(text);
  const step = stagger ?? (mode === 'word' ? 0.055 : 0.018);

  const animateProps = onScroll
    ? { whileInView: 'visible' as const, viewport: { once: true, amount: 0.4 } }
    : { animate: 'visible' as const };

  if (reduced) {
    return (
      <Tag
        className={className}
        initial={{ opacity: 0 }}
        {...(onScroll
          ? { whileInView: { opacity: 1 }, viewport: { once: true, amount: 0.4 } }
          : { animate: { opacity: 1 } })}
        transition={{ duration: 0.3, delay }}
      >
        {text}
      </Tag>
    );
  }

  /** Word variant: confident 3D rise from behind the stage curtain */
  const wordChild: Variants = {
    hidden: { y: '110%', opacity: 0, rotateX: 40 },
    visible: {
      y: '0%',
      opacity: 1,
      rotateX: 0,
      transition: { duration: DURATION.hero, ease: EASE.outExpo },
    },
  };

  /**
   * Character variant: adds blur + scale atop the 3D rise for a more
   * granular cinematic feel. Scale pulls slightly from 0.7 so characters
   * feel like they snap into place rather than appearing at full size.
   */
  const charChild: Variants = {
    hidden: { y: '120%', opacity: 0, rotateX: 55, scale: 0.7, filter: 'blur(4px)' },
    visible: {
      y: '0%',
      opacity: 1,
      rotateX: 0,
      scale: 1,
      filter: 'blur(0px)',
      transition: { duration: DURATION.hero * 0.9, ease: EASE.outExpo },
    },
  };

  const child = mode === 'char' ? charChild : wordChild;

  /** Interpolate between two hex colors based on position ratio [0,1]. */
  function interpolateColor(from: string, to: string, ratio: number): string {
    const parse = (hex: string) => {
      const c = hex.replace('#', '');
      return [
        parseInt(c.slice(0, 2), 16),
        parseInt(c.slice(2, 4), 16),
        parseInt(c.slice(4, 6), 16),
      ];
    };
    try {
      const [r1, g1, b1] = parse(from);
      const [r2, g2, b2] = parse(to);
      const r = Math.round(r1 + (r2 - r1) * ratio);
      const g = Math.round(g1 + (g2 - g1) * ratio);
      const b = Math.round(b1 + (b2 - b1) * ratio);
      return `rgb(${r},${g},${b})`;
    } catch {
      return 'inherit';
    }
  }

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
      {units.map((unit, i) => {
        const charColor =
          gradientColors && mode === 'char' && units.length > 1
            ? interpolateColor(gradientColors[0], gradientColors[1], i / (units.length - 1))
            : undefined;

        return (
          <span
            key={`${unit}-${i}`}
            aria-hidden
            className="inline-block overflow-hidden align-bottom"
            style={{ perspective: 600 }}
          >
            <m.span
              variants={child}
              className="inline-block will-change-transform"
              style={charColor ? { color: charColor } : undefined}
            >
              {/* Non-breaking space for word gaps; zero-width joiner keeps
                  the character in the flow without adding visual space */}
              {mode === 'word'
                ? unit
                : unit === ' '
                  ? '\u00A0'
                  : unit}
            </m.span>
            {mode === 'word' && i < units.length - 1 ? ' ' : null}
          </span>
        );
      })}
    </Tag>
  );
}
