/**
 * The motion system's public surface.
 *
 * Durations and easings here mirror src/styles/tokens.css exactly. CSS owns
 * ambient and looping motion; Framer Motion owns anything stateful or
 * interruptible.
 */

export { default as Reveal, RevealGroup, RevealItem } from './Reveal';
export { default as SplitText } from './SplitText';
export { default as Magnetic, TiltCard } from './Magnetic';
export { default as Counter } from './Counter';
export { default as PremiumButton } from './PremiumButton';
export type { PremiumButtonProps } from './PremiumButton';
export { default as Aurora } from './Aurora';
export { default as MotionProvider } from './MotionProvider';
export { default as ParticleField } from './ParticleField';
export { default as SpotlightCard } from './SpotlightCard';
export { Field, SelectField, TextAreaField } from './Field';
export type { FieldProps, SelectFieldProps, TextAreaFieldProps } from './Field';
export { usePrefersReducedMotion, useIsCoarsePointer } from './useReducedMotion';

/* ── Tokens ──────────────────────────────────────────────────────────────── */
export {
  EASE,
  SPRING,
  DURATION,
  STAGGER,
  TRAVEL,
  staggerParent,
  staggerExit,
  childVariants,
  fade,
  fadeUp,
  blurUp,
  scaleIn,
  depthIn,
  maskUp,
  slideFrom,
  pressable,
  pressableSubtle,
  REDUCED,
  resolveVariants,
} from './tokens';
