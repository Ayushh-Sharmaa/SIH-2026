'use client';

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import Icon from './Icon';

/**
 * The chip / pill / tag.
 *
 * The audit found this pattern hand-rolled in at least four files with
 * different shapes (`rounded-md` vs `rounded-full`), different sizes (9px, 10px,
 * 11px) and different rgba alphas for the same three tone names. One component,
 * one set of tones.
 */

const TONES = {
  neutral: 'border-line bg-surface-sunken text-body',
  accent: 'border-line-strong bg-clay/20 text-ink',
  primary: 'border-line-accent bg-accent/10 text-accent',
  outline: 'border-line-strong bg-transparent text-muted',
} as const;

const SHAPES = {
  pill: 'rounded-pill px-2.5 py-1',
  square: 'rounded-control px-2 py-1',
} as const;

export interface BadgeProps {
  children: ReactNode;
  tone?: keyof typeof TONES;
  shape?: keyof typeof SHAPES;
  icon?: LucideIcon;
  className?: string;
  /** Uppercase micro-label styling for codes and statuses. */
  caps?: boolean;
}

export default function Badge({
  children,
  tone = 'neutral',
  shape = 'pill',
  icon,
  className,
  caps = false,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 border text-label whitespace-nowrap',
        caps ? 'uppercase' : 'normal-case tracking-normal',
        TONES[tone],
        SHAPES[shape],
        className,
      )}
    >
      {icon && <Icon icon={icon} size="xs" />}
      {children}
    </span>
  );
}
