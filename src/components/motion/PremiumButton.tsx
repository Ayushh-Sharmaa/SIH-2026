'use client';

import { useEffect, useRef, useState, type ReactNode, type MouseEvent } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Check } from 'lucide-react';
import Icon from '@/components/ui/Icon';
import Magnetic from './Magnetic';
import { SPRING } from './tokens';
import { usePrefersReducedMotion } from './useReducedMotion';

/**
 * The button.
 *
 * One component covers every affordance in the app, so press feedback, focus
 * treatment, loading and disabled behaviour cannot drift between call sites.
 *
 * On `loading` and `success` the button holds its rendered width: the resting
 * label stays in flow but invisible, and the transient state is overlaid.
 * Buttons that resize when their label changes make the surrounding layout jump
 * at exactly the moment the user is watching for confirmation.
 */

type Variant = 'primary' | 'secondary' | 'glass' | 'outline' | 'ghost' | 'destructive';

interface Ripple {
  id: number;
  x: number;
  y: number;
}

const BASE =
  'relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-pill font-semibold ' +
  'transition-[background-color,border-color,box-shadow,transform,opacity] duration-220 ease-out-expo ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ' +
  'disabled:pointer-events-none disabled:opacity-55';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-accent text-on-accent shadow-accent hover:-translate-y-0.5 hover:shadow-e4 active:translate-y-0',
  secondary:
    'border border-line-strong bg-clay/25 text-ink hover:bg-clay/35 hover:-translate-y-0.5 active:translate-y-0',
  glass:
    'surface-glass text-ink hover:border-line-accent hover:-translate-y-0.5 hover:shadow-e3 active:translate-y-0',
  outline:
    'border border-line-accent text-accent hover:bg-accent/10 hover:-translate-y-0.5 active:translate-y-0',
  ghost: 'text-body hover:bg-clay/15 hover:text-accent',
  // The palette has no red, so destructive reads through a heavier ring rather
  // than hue. Always pair it with a confirmation step.
  destructive:
    'bg-accent text-on-accent shadow-accent ring-2 ring-accent/25 hover:-translate-y-0.5 hover:shadow-e4 active:translate-y-0',
};

const SIZES = {
  sm: 'px-4 py-2 text-caption',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
  /** Square target for a lone icon. 44px clears the minimum tap size. */
  icon: 'size-11 p-0',
} as const;

export interface PremiumButtonProps {
  children?: ReactNode;
  variant?: Variant;
  size?: keyof typeof SIZES;
  href?: string;
  onClick?: (e: MouseEvent<HTMLElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  loading?: boolean;
  /** Briefly swaps the label for a tick. Set it; it reverts on its own. */
  success?: boolean;
  className?: string;
  magnetic?: boolean;
  title?: string;
  'aria-label'?: string;
}

export default function PremiumButton({
  children,
  variant = 'primary',
  size = 'md',
  href,
  onClick,
  type = 'button',
  disabled,
  loading,
  success,
  className = '',
  magnetic = true,
  ...rest
}: PremiumButtonProps) {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [elapsed, setElapsed] = useState(false);
  const [lastSuccess, setLastSuccess] = useState(success);
  const nextId = useRef(0);
  const reduced = usePrefersReducedMotion();

  // Derived from the prop rather than mirrored into state, so there is no
  // synchronous setState inside an effect (which triggers a cascading render).
  // Adjusting state during render is the pattern React sanctions for resetting
  // when a prop changes.
  if (success !== lastSuccess) {
    setLastSuccess(success);
    setElapsed(false);
  }

  const showSuccess = Boolean(success) && !elapsed;

  // Hold the confirmation long enough to register, then return to rest. The
  // setState here runs from a timer, so it is asynchronous and safe.
  useEffect(() => {
    if (!success) return;
    const t = window.setTimeout(() => setElapsed(true), 1600);
    return () => window.clearTimeout(t);
  }, [success]);

  const spawnRipple = (e: MouseEvent<HTMLElement>) => {
    if (reduced) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const id = nextId.current++;
    setRipples((r) => [...r, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    window.setTimeout(() => setRipples((r) => r.filter((item) => item.id !== id)), 620);
  };

  const handleClick = (e: MouseEvent<HTMLElement>) => {
    spawnRipple(e);
    onClick?.(e);
  };

  const busy = Boolean(loading) || showSuccess;
  const classes = `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`;

  const inner = (
    <>
      <span aria-hidden className="btn-sheen" />
      {ripples.map((r) => (
        <span key={r.id} aria-hidden className="btn-ripple" style={{ left: r.x, top: r.y }} />
      ))}

      <span className={busy ? 'invisible' : 'relative z-10 inline-flex items-center gap-2'}>
        {children}
      </span>

      <AnimatePresence>
        {loading && !showSuccess && (
          <motion.span
            key="spinner"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 z-10 grid place-items-center"
          >
            <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
              <path
                d="M21 12a9 9 0 0 0-9-9"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </motion.span>
        )}

        {showSuccess && (
          <motion.span
            key="success"
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.5 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={reduced ? { duration: 0.15 } : SPRING.snappy}
            className="absolute inset-0 z-10 grid place-items-center"
          >
            <Icon icon={Check} size="sm" strokeWidth={2.5} />
          </motion.span>
        )}
      </AnimatePresence>
    </>
  );

  const el = href ? (
    <Link
      href={href}
      className={classes}
      onClick={handleClick}
      aria-disabled={disabled || undefined}
      {...rest}
    >
      {inner}
    </Link>
  ) : (
    <button
      type={type}
      className={classes}
      onClick={handleClick}
      disabled={disabled || loading}
      // Announces the pending state rather than leaving it purely visual.
      aria-busy={loading || undefined}
      {...rest}
    >
      {inner}
    </button>
  );

  // Magnetic already no-ops on coarse pointers and for reduced-motion users.
  return magnetic ? (
    <Magnetic as="span" className="inline-flex">
      {el}
    </Magnetic>
  ) : (
    el
  );
}
