import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * A page section: atmosphere, vertical rhythm, and an optional texture layer.
 *
 * The brief asks for pages that each feel distinct while still reading as one
 * system. That holds only if variety is *enumerated* rather than improvised —
 * so the choices live here as a closed set. Two sections can differ in tone,
 * rhythm and pattern independently, which is 8 x 4 x 6 combinations, but every
 * one of them is built from the same six brand colours.
 *
 * House rule: adjacent sections must not share a `tone`. See docs/DesignSystem.md.
 */

/** Background compositions, defined in src/styles/patterns.css. */
const TONES = {
  /** Warm top-left light. Reserved for hero moments. */
  dawn: 'atmos-dawn',
  /** Cool wash falling from the top edge. */
  mist: 'atmos-mist',
  /** Diagonal sand gradient, warmest of the set. */
  dune: 'atmos-dune',
  /** Angled linen sweep from the left. */
  linen: 'atmos-linen',
  /** Pearl-heavy, light source on the right. */
  quarry: 'atmos-quarry',
  /** Accent-tinted glow from below. For closing CTAs. */
  ember: 'atmos-ember',
  /** Paper-warm, light from directly above. */
  vellum: 'atmos-vellum',
  /** Coolest neutral. Good for dense/data sections. */
  slate: 'atmos-slate',
  /** Inherit whatever is behind. */
  none: '',
} as const;

/** Vertical rhythm. Alternating these is what stops a page feeling metronomic. */
const RHYTHM = {
  flush: '',
  compact: 'py-section-compact',
  default: 'py-section',
  spacious: 'py-section-spacious',
} as const;

/** Texture overlays, defined in src/styles/patterns.css. */
const PATTERNS = {
  none: '',
  dots: 'pattern-dots',
  grid: 'pattern-grid',
  mesh: 'pattern-mesh',
  rays: 'pattern-rays',
  contour: 'pattern-contour',
} as const;

export type SectionTone = keyof typeof TONES;
export type SectionRhythm = keyof typeof RHYTHM;
export type SectionPattern = keyof typeof PATTERNS;

export interface SectionProps {
  children: ReactNode;
  className?: string;
  tone?: SectionTone;
  rhythm?: SectionRhythm;
  pattern?: SectionPattern;
  id?: string;
  /** Accessible name for the section, when it has no visible heading. */
  'aria-label'?: string;
  /** Points at the id of the heading that names this section. */
  'aria-labelledby'?: string;
}

export default function Section({
  children,
  className,
  tone = 'none',
  rhythm = 'default',
  pattern = 'none',
  id,
  ...aria
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn('relative isolate', TONES[tone], RHYTHM[rhythm], className)}
      {...aria}
    >
      {/* Texture sits above the atmosphere but beneath content, and never
          intercepts pointer events. */}
      {pattern !== 'none' && (
        <div
          aria-hidden
          className={cn('pointer-events-none absolute inset-0 z-decor', PATTERNS[pattern])}
        />
      )}
      <div className="relative z-content">{children}</div>
    </section>
  );
}
