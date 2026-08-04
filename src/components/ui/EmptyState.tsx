'use client';

import type { ReactNode } from 'react';
import { m } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import Icon from './Icon';
import { EASE, DURATION, SPRING } from '@/components/motion/tokens';
import { usePrefersReducedMotion } from '@/components/motion/useReducedMotion';

/**
 * The "nothing here" surface.
 *
 * The audit found five admin list surfaces that render a completely blank
 * container when filtered to zero rows. A blank container is indistinguishable
 * from a broken one: the user cannot tell whether the filter matched nothing or
 * the request failed. Every list needs this.
 */
export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  /** Compact fits inside a panel; default stands alone on a page. */
  size?: 'compact' | 'default';
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  size = 'default',
}: EmptyStateProps) {
  const reduced = usePrefersReducedMotion();
  const compact = size === 'compact';

  return (
    <m.div
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
      animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: DURATION.reveal, ease: EASE.outExpo }}
      className={cn(
        'flex flex-col items-center justify-center rounded-card border border-dashed border-line-strong text-center',
        compact ? 'gap-3 px-6 py-10' : 'gap-4 px-8 py-16',
        className,
      )}
    >
      <m.span
        aria-hidden
        // A slow, shallow float keeps the surface from reading as a dead end
        // without demanding attention.
        animate={reduced ? undefined : { y: [0, -6, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className={cn(
          'grid place-items-center rounded-container border border-line bg-surface-sunken text-faint',
          compact ? 'size-12' : 'size-16',
        )}
      >
        <Icon icon={icon} size={compact ? 'lg' : 'xl'} />
      </m.span>

      <div className="max-w-prose">
        <p className={cn('text-ink', compact ? 'text-feature' : 'text-subheading')}>{title}</p>
        {description && <p className="mt-2 text-caption text-muted">{description}</p>}
      </div>

      {action && (
        <m.div
          initial={reduced ? undefined : { opacity: 0, scale: 0.96 }}
          animate={reduced ? undefined : { opacity: 1, scale: 1 }}
          transition={SPRING.overlay}
          className="mt-1"
        >
          {action}
        </m.div>
      )}
    </m.div>
  );
}
