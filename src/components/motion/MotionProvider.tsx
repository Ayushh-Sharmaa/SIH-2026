'use client';

import { LazyMotion, MotionConfig, domMax } from 'framer-motion';
import type { ReactNode } from 'react';
import { DURATION, EASE } from './tokens';

/**
 * Global motion policy.
 *
 * `reducedMotion="user"` is the single highest-leverage accessibility control in
 * the app: it makes Framer Motion drop transform and layout animations for
 * anyone who has asked their OS for less motion, while still allowing opacity to
 * cross-fade. Without it every one of the site's Framer transitions would run at
 * full amplitude regardless of the user's setting — the CSS media query in
 * base.css cannot reach JS-driven animations.
 *
 * The default transition is the house curve, so a component that omits one still
 * lands on-system rather than falling back to Framer's default spring.
 *
 * ── Why LazyMotion ──────────────────────────────────────────────────────────
 *
 * Importing the `motion` component pulls in every feature Framer Motion has —
 * drag, layout projection, pan gestures, SVG path animation, scroll — whether
 * or not a page uses them, because `motion.div` cannot be tree-shaken down to
 * the subset actually referenced. The 24 files that imported it therefore put
 * the whole library in the bundle of every route.
 *
 * `LazyMotion` inverts that: components import the bare `m` component, which
 * ships almost nothing, and the feature bundle is supplied once, here.
 *
 * `domMax` rather than the smaller `domAnimation` because seven `layoutId`
 * pills across the navbar, tracks filter, admin tabs, onboarding stepper and
 * signup role selector are shared-layout animations, and layout projection
 * lives only in `domMax`. Dropping to `domAnimation` would silently turn those
 * into hard cuts.
 *
 * `strict` makes any remaining `motion.*` usage throw instead of quietly
 * loading the full bundle alongside this one — which would be worse than not
 * doing this at all, since the page would then carry both. Every route in this
 * app is statically generated, so `next build` renders all of them and turns
 * that runtime guard into a build-time one.
 */
export default function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domMax} strict>
      <MotionConfig
        reducedMotion="user"
        transition={{ duration: DURATION.reveal, ease: EASE.outExpo }}
      >
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
