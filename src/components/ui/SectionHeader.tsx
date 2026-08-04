'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import Eyebrow from './Eyebrow';
import Reveal, { RevealGroup, RevealItem } from '@/components/motion/Reveal';
import SplitText from '@/components/motion/SplitText';

/**
 * Eyebrow → heading → description, in that order, every time.
 *
 * The brief asks that every section follow one hierarchy. Encoding it as a
 * component is the only way that survives contact with ten pages: the order
 * cannot be got wrong, the type tokens cannot drift, and the measure stays
 * capped so descriptions never run past a comfortable reading width.
 */

const ALIGN = {
  start: 'items-start text-left',
  center: 'items-center text-center mx-auto',
} as const;

const LEVEL = {
  /** Page-level. One per page. */
  h1: 'text-title',
  /** Section-level. The common case. */
  h2: 'text-heading',
  /** Sub-section. */
  h3: 'text-subheading',
} as const;

export interface SectionHeaderProps {
  title: string;
  eyebrow?: string;
  description?: ReactNode;
  className?: string;
  align?: keyof typeof ALIGN;
  as?: keyof typeof LEVEL;
  /** Reveal the title word-by-word as it scrolls in. */
  split?: boolean;
  /** Emphasised tail of the title, rendered in the accent gradient. */
  accent?: string;
  id?: string;
  children?: ReactNode;
}

export default function SectionHeader({
  title,
  eyebrow,
  description,
  className,
  align = 'start',
  as = 'h2',
  split = true,
  accent,
  id,
  children,
}: SectionHeaderProps) {
  const Heading = as;

  return (
    <RevealGroup
      stagger={0.08}
      className={cn('flex max-w-narrow flex-col gap-4', ALIGN[align], className)}
    >
      {eyebrow && (
        <RevealItem>
          <Eyebrow>{eyebrow}</Eyebrow>
        </RevealItem>
      )}

      <RevealItem>
        <Heading id={id} className={cn(LEVEL[as], 'text-balance text-ink')}>
          {split ? <SplitText text={title} as="span" onScroll /> : title}
          {accent && (
            <>
              {' '}
              <span className="text-gradient-luxe">{accent}</span>
            </>
          )}
        </Heading>
      </RevealItem>

      {description && (
        <RevealItem>
          {/* Capped at prose width so the line length stays readable no matter
              how wide the parent container is. */}
          <p className={cn('max-w-prose text-lead text-body', align === 'center' && 'mx-auto')}>
            {description}
          </p>
        </RevealItem>
      )}

      {children && <RevealItem>{children}</RevealItem>}
    </RevealGroup>
  );
}

export { Reveal };
