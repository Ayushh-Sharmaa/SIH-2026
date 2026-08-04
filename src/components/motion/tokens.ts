import type { Transition, Variants } from 'framer-motion';

/**
 * MOTION TOKENS
 *
 * These mirror the custom properties in src/styles/tokens.css one-for-one.
 * CSS owns ambient and looping motion; Framer Motion owns anything stateful or
 * interruptible. When the two disagree the interface feels subtly broken, so
 * any change here must be made in tokens.css as well.
 *
 * Duration bands this scale is built to hit:
 *   micro 100-150 | hover 180-250 | control 180-220 | card 250-350
 *   reveal 400-700 | page 450-650 | hero 800-1200
 */

/* ── Easing ─────────────────────────────────────────────────────────────────
   Every curve ends on a decelerating tail. Nothing stops abruptly, and nothing
   uses `linear` except continuous ambient loops where constant velocity is the
   point (a marquee that eases would visibly stutter at its seam).
   ────────────────────────────────────────────────────────────────────────── */
export const EASE = {
  /** The house curve. Long, confident deceleration. Entrances and reveals. */
  outExpo: [0.16, 1, 0.3, 1],
  /** Slightly shorter tail. Hovers and small state changes. */
  outQuint: [0.22, 1, 0.36, 1],
  /** Symmetric. Things that leave and return along the same path. */
  inOut: [0.65, 0, 0.35, 1],
  /** Gentle overshoot. Use sparingly — only where a touch of life is earned. */
  outBack: [0.34, 1.35, 0.64, 1],
} as const;

/* ── Springs ────────────────────────────────────────────────────────────────
   Preferred over duration-based curves for anything that tracks a pointer or
   can be interrupted mid-flight, because a spring re-targets gracefully where
   a tween restarts.
   ────────────────────────────────────────────────────────────────────────── */
export const SPRING = {
  /** Weighted and calm. Card tilt, large panels. */
  soft: { type: 'spring', stiffness: 140, damping: 20, mass: 0.9 },
  /** Quick, no visible wobble. Layout shifts, active indicators. */
  snappy: { type: 'spring', stiffness: 380, damping: 30 },
  /** Light and eager. Cursor-following elements. */
  magnetic: { type: 'spring', stiffness: 260, damping: 18, mass: 0.6 },
  /** Deliberate settle for anything entering on top of existing content. */
  overlay: { type: 'spring', stiffness: 220, damping: 26, mass: 0.8 },
} satisfies Record<string, Transition>;

/* ── Durations (seconds) ─────────────────────────────────────────────────── */
export const DURATION = {
  instant: 0.1,
  micro: 0.14,
  hover: 0.2,
  control: 0.22,
  card: 0.32,
  reveal: 0.56,
  page: 0.56,
  hero: 0.9,
} as const;

/* ── Stagger ────────────────────────────────────────────────────────────────
   Total run time matters more than per-item delay: a 12-item list at 0.08s
   takes almost a second to finish, which reads as sluggish. Pick the preset
   by list length, not by feel.
   ────────────────────────────────────────────────────────────────────────── */
export const STAGGER = {
  /** Long lists (8+). Keeps the tail from dragging. */
  tight: 0.04,
  /** The default. Card grids, 3-6 items. */
  normal: 0.07,
  /** Short, high-value sequences. Hero lines, CTA pairs. */
  relaxed: 0.11,
} as const;

/* ── Distances ──────────────────────────────────────────────────────────────
   Travel scales with the element's visual weight. A caption sliding 32px looks
   unmoored; a hero panel sliding 8px looks stuck.
   ────────────────────────────────────────────────────────────────────────── */
export const TRAVEL = {
  sm: 12,
  md: 24,
  lg: 40,
} as const;

/* ═══ ORCHESTRATION ═══════════════════════════════════════════════════════ */

/** Parent that sequences its children. Pair with `childVariants`. */
export const staggerParent = (
  stagger: number = STAGGER.normal,
  delayChildren = 0,
): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: stagger, delayChildren } },
});

/**
 * Exit stagger runs in reverse so the element nearest the user's attention
 * leaves last — the list collapses toward its origin rather than away from it.
 */
export const staggerExit = (stagger: number = STAGGER.tight): Variants => ({
  exit: { transition: { staggerChildren: stagger, staggerDirection: -1 } },
});

/* ═══ ENTRANCE VARIANTS ═══════════════════════════════════════════════════ */

export const fade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: DURATION.reveal, ease: EASE.outExpo } },
  exit: { opacity: 0, transition: { duration: DURATION.hover, ease: EASE.inOut } },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: TRAVEL.md },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.reveal, ease: EASE.outExpo },
  },
  exit: { opacity: 0, y: -TRAVEL.sm, transition: { duration: DURATION.hover, ease: EASE.inOut } },
};

/** The house reveal: rise + defocus. Blur is what makes it read as depth. */
export const blurUp: Variants = {
  hidden: { opacity: 0, y: TRAVEL.md, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: DURATION.reveal, ease: EASE.outExpo },
  },
  exit: {
    opacity: 0,
    y: -TRAVEL.sm,
    filter: 'blur(6px)',
    transition: { duration: DURATION.hover, ease: EASE.inOut },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: DURATION.card, ease: EASE.outExpo },
  },
  exit: { opacity: 0, scale: 0.97, transition: { duration: DURATION.hover, ease: EASE.inOut } },
};

/** Depth entrance for overlays: arrives from slightly behind the viewer. */
export const depthIn: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: TRAVEL.sm, filter: 'blur(10px)' },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: SPRING.overlay,
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: 4,
    filter: 'blur(6px)',
    transition: { duration: DURATION.hover, ease: EASE.inOut },
  },
};

/**
 * Mask reveal: the element slides out from behind its own overflow-hidden
 * wrapper. Reads considerably more crafted than a fade because the edge stays
 * crisp throughout. The wrapper must set `overflow: hidden`.
 */
export const maskUp: Variants = {
  hidden: { y: '110%' },
  visible: {
    y: '0%',
    transition: { duration: DURATION.hero, ease: EASE.outExpo },
  },
};

export const slideFrom = (direction: 'left' | 'right' | 'up' | 'down'): Variants => {
  const sign = direction === 'left' || direction === 'up' ? -1 : 1;
  const horizontal = direction === 'left' || direction === 'right';

  // Built as explicit shapes rather than a computed key: a computed key widens
  // the object to an index signature, which no longer satisfies `Variant`.
  const from = horizontal ? { x: sign * TRAVEL.lg } : { y: sign * TRAVEL.lg };
  const settled = horizontal ? { x: 0 } : { y: 0 };
  const away = horizontal ? { x: sign * -TRAVEL.sm } : { y: sign * -TRAVEL.sm };

  return {
    hidden: { opacity: 0, ...from },
    visible: {
      opacity: 1,
      ...settled,
      transition: { duration: DURATION.reveal, ease: EASE.outExpo },
    },
    exit: {
      opacity: 0,
      ...away,
      transition: { duration: DURATION.hover, ease: EASE.inOut },
    },
  };
};

/** Default child of a `staggerParent`. */
export const childVariants: Variants = blurUp;

/* ═══ INTERACTION ═════════════════════════════════════════════════════════ */

/**
 * Hover/press feedback for anything pressable. Applied via whileHover/whileTap
 * so it is automatically skipped on touch, where hover has no meaning.
 */
export const pressable = {
  whileHover: { y: -2, transition: { duration: DURATION.hover, ease: EASE.outQuint } },
  whileTap: { scale: 0.97, y: 0, transition: { duration: DURATION.instant } },
} as const;

export const pressableSubtle = {
  whileHover: { scale: 1.03, transition: { duration: DURATION.hover, ease: EASE.outQuint } },
  whileTap: { scale: 0.97, transition: { duration: DURATION.instant } },
} as const;

/* ═══ REDUCED MOTION ══════════════════════════════════════════════════════ */

/**
 * Collapses any variant set to a plain opacity fade.
 *
 * Reduced-motion does not mean *no* transition — an instant swap is jarring in
 * its own way. It means no travel, no scale, no blur: the change is announced,
 * not performed.
 */
export const REDUCED: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

/** Picks the reduced variant when the user has asked for less motion. */
export function resolveVariants(variants: Variants, reduced: boolean): Variants {
  return reduced ? REDUCED : variants;
}
