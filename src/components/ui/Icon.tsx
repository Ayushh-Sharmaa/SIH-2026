'use client';

import { forwardRef } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * THE ICON SYSTEM — one family, one stroke, one set of sizes.
 *
 * The site previously hand-rolled inline SVG path data in at least three files,
 * at four different stroke widths (1.6 / 1.7 / 2 / 2.4), with the arrow-right
 * path duplicated verbatim across pages. Mixed stroke weights are the single
 * most visible tell of an unsystematised interface: icons of the same size read
 * as different weights of the same object.
 *
 * Everything is Lucide, and every icon renders at STROKE (1.75) unless it is
 * optically corrected. 1.75 sits between Lucide's default 2 (slightly heavy
 * beside a 600-weight heading) and 1.5 (which goes weak below 20px).
 *
 * Accessibility contract: icons are decorative by default and marked
 * aria-hidden. An icon that carries meaning on its own MUST be given a `label`,
 * which promotes it to role="img" with an accessible name.
 */

/** The one stroke width. Do not override without an optical reason. */
export const STROKE = 1.75;

/**
 * Sizes are tied to the type scale rather than being free numbers, so an icon
 * beside a label always shares its optical weight.
 */
const SIZES = {
  xs: 14, // inline with text-label
  sm: 16, // inline with text-caption / buttons
  md: 20, // the default — list rows, nav
  lg: 24, // card headers
  xl: 32, // feature tiles
  '2xl': 40, // empty states, hero accents
} as const;

export type IconSize = keyof typeof SIZES;

export interface IconProps {
  icon: LucideIcon;
  size?: IconSize;
  className?: string;
  /**
   * Accessible name. Provide this only when the icon is the sole carrier of
   * meaning — an icon beside a text label must stay decorative, or screen
   * readers announce the same thing twice.
   */
  label?: string;
  strokeWidth?: number;
}

const Icon = forwardRef<SVGSVGElement, IconProps>(function Icon(
  { icon: Glyph, size = 'md', className, label, strokeWidth = STROKE },
  ref,
) {
  return (
    <Glyph
      ref={ref}
      size={SIZES[size]}
      strokeWidth={strokeWidth}
      // Keeps the stroke visually constant when the icon is scaled by a parent
      // transform, which hover-scale effects do constantly.
      absoluteStrokeWidth
      className={cn('shrink-0', className)}
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
      focusable="false"
    />
  );
});

export default Icon;
