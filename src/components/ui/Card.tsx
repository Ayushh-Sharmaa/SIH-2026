'use client';

import type { ElementType, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { TiltCard } from '@/components/motion/Magnetic';

/**
 * The card.
 *
 * The audit counted multiple hand-rolled card implementations across pages,
 * each re-deciding its own surface, radius, padding and hover behaviour. This
 * consolidates them onto the surface tokens.
 *
 * `interactive` is deliberately separate from `tilt`: a card can be clickable
 * without tilting (dense lists), and decorative cards can tilt without being
 * clickable. Conflating them is how non-interactive elements end up with
 * pointer affordances.
 */

const SURFACES = {
  raised: 'surface-raised',
  glass: 'surface-glass',
  taupe: 'surface-taupe',
  sunken: 'surface-sunken',
} as const;

const PADDING = {
  none: '',
  sm: 'p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
} as const;

export interface CardProps {
  children: ReactNode;
  className?: string;
  surface?: keyof typeof SURFACES;
  padding?: keyof typeof PADDING;
  /** Adds hover elevation. Pointer-only, handled in CSS. */
  interactive?: boolean;
  /** Wraps in a 3D tilt with cursor-tracked specular highlight. */
  tilt?: boolean;
  tiltIntensity?: number;
  as?: ElementType;
  href?: string;
  onClick?: () => void;
}

export default function Card({
  children,
  className,
  surface = 'raised',
  padding = 'md',
  interactive = false,
  tilt = false,
  tiltIntensity = 7,
  as,
  href,
  onClick,
}: CardProps) {
  // Resolve the element from intent, so a clickable card is never a bare div.
  const Tag: ElementType = as ?? (href ? 'a' : onClick ? 'button' : 'div');

  const card = (
    <Tag
      href={href}
      onClick={onClick}
      // A button element defaults to type="submit" inside a form, which would
      // silently submit it.
      type={Tag === 'button' ? 'button' : undefined}
      className={cn(
        'relative flex h-full flex-col overflow-hidden rounded-card text-left',
        SURFACES[surface],
        PADDING[padding],
        interactive && 'lift cursor-pointer',
        className,
      )}
    >
      {children}
    </Tag>
  );

  if (!tilt) return card;

  return (
    <TiltCard className="h-full" intensity={tiltIntensity}>
      {card}
    </TiltCard>
  );
}
