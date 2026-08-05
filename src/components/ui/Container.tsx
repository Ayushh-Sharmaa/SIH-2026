import type { ElementType, ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * The horizontal grid every page aligns to.
 *
 * Replaces the `mx-auto max-w-7xl px-6 lg:px-8` string that was copy-pasted
 * across the codebase. Gutters are fluid (20px → 40px) so the page keeps
 * breathing room at 320px without wasting it at 1920px.
 */

const WIDTHS = {
  /** Smallest centered layouts — login, register, single inputs. */
  form: 'max-w-form',
  /** Settings drawers, filter rails, dialogue details. */
  panel: 'max-w-panel',
  /** Long-form reading. Caps by character count, not pixels. */
  prose: 'max-w-prose',
  /** Focused single-column content — forms, auth, empty states. */
  narrow: 'max-w-narrow',
  /** The default. Feature grids, section bodies. */
  content: 'max-w-content',
  /** Dashboards, tables, anything that earns the extra room. */
  wide: 'max-w-wide',
  /** Ultra-wide ceiling. Stops content stranding on 1920px+ displays. */
  full: 'max-w-ceiling',
} as const;

export interface ContainerProps {
  children: ReactNode;
  className?: string;
  width?: keyof typeof WIDTHS;
  as?: ElementType;
  /** Opt out of horizontal padding for full-bleed children. */
  bleed?: boolean;
}

export default function Container({
  children,
  className,
  width = 'content',
  as: Tag = 'div',
  bleed = false,
}: ContainerProps) {
  return (
    <Tag className={cn('mx-auto w-full', WIDTHS[width], !bleed && 'px-gutter', className)}>
      {children}
    </Tag>
  );
}
