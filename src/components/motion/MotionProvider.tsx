'use client';

import { MotionConfig } from 'framer-motion';
import type { ReactNode } from 'react';
import { DURATION, EASE } from './tokens';

/**
 * Global motion policy.
 *
 * `reducedMotion="user"` is the single highest-leverage accessibility control
 * in the app: it makes Framer Motion drop transform and layout animations for
 * anyone who has asked their OS for less motion, while still allowing opacity
 * to cross-fade. Without it every one of the site's Framer transitions runs at
 * full amplitude regardless of the user's setting — the CSS media query in
 * base.css cannot reach JS-driven animations.
 *
 * The default transition here is the house curve, so any component that omits
 * one still lands on-system instead of falling back to Framer's default spring.
 */
export default function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig
      reducedMotion="user"
      transition={{ duration: DURATION.reveal, ease: EASE.outExpo }}
    >
      {children}
    </MotionConfig>
  );
}
