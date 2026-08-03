import type { Transition, Variants } from 'framer-motion';

export const EASE = {
  outExpo: [0.16, 1, 0.3, 1],
  outQuint: [0.22, 1, 0.36, 1],
  inOut: [0.65, 0, 0.35, 1],
} as const;

export const SPRING = {
  soft: { type: 'spring', stiffness: 140, damping: 20, mass: 0.9 },
  snappy: { type: 'spring', stiffness: 380, damping: 30 },
  magnetic: { type: 'spring', stiffness: 260, damping: 18, mass: 0.6 },
} satisfies Record<string, Transition>;

export const DURATION = {
  micro: 0.15,
  hover: 0.25,
  card: 0.4,
  reveal: 0.65,
  hero: 0.9,
  page: 0.6,
} as const;

/** Parent that staggers its children. Pair with `childVariants`. */
export const staggerParent = (stagger = 0.07, delayChildren = 0): Variants => ({
  hidden: {},
  visible: {
    transition: { staggerChildren: stagger, delayChildren },
  },
});

export const childVariants: Variants = {
  hidden: { opacity: 0, y: 24, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: DURATION.reveal, ease: EASE.outExpo },
  },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: DURATION.reveal, ease: EASE.outExpo } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: { opacity: 1, scale: 1, transition: { duration: DURATION.card, ease: EASE.outExpo } },
};
