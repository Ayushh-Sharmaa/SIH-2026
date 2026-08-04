'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * The uppercase micro-label that introduces a section.
 *
 * Replaces the `text-[10px] font-bold uppercase tracking-[0.2em] text-primary`
 * string repeated across the site at four different sizes and three different
 * tracking values. Size, weight and tracking now come from the `text-label`
 * token, so the treatment is identical everywhere by construction.
 *
 * The dot is not decoration: it gives the label a fixed optical start point, so
 * stacked labels align even when their text lengths differ.
 */
export interface EyebrowProps {
  children: ReactNode;
  className?: string;
  /** Hide the leading dot when the label sits inside a tight control. */
  bare?: boolean;
  as?: 'span' | 'p' | 'div';
}

export default function Eyebrow({
  children,
  className,
  bare = false,
  as: Tag = 'span',
}: EyebrowProps) {
  return (
    <Tag className={cn('inline-flex items-center gap-2 text-label uppercase text-accent', className)}>
      {!bare && (
        <span aria-hidden className="size-1 shrink-0 rounded-full bg-accent/70" />
      )}
      {children}
    </Tag>
  );
}
