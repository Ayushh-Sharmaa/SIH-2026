'use client';

import { useRef, useState, type ReactNode, type MouseEvent } from 'react';
import Link from 'next/link';
import Magnetic from './Magnetic';

type Variant = 'primary' | 'glass' | 'ghost';

interface Ripple {
  id: number;
  x: number;
  y: number;
}

const BASE =
  'relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl font-bold tracking-tight transition-[background-color,border-color,box-shadow,transform] duration-250 disabled:opacity-60 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-primary text-[#FBF9F6] shadow-[0_2px_12px_rgba(114,56,61,0.22)] hover:shadow-[0_10px_28px_rgba(114,56,61,0.30)] hover:-translate-y-0.5 active:translate-y-0',
  glass:
    'border border-[rgba(209,199,189,0.55)] bg-[rgba(248,246,242,0.6)] text-foreground backdrop-blur-xl hover:bg-[rgba(248,246,242,0.86)] hover:border-[rgba(114,56,61,0.2)] hover:shadow-[0_8px_24px_rgba(50,45,41,0.10)] hover:-translate-y-0.5 active:translate-y-0',
  ghost:
    'text-foreground/80 hover:text-primary hover:bg-[rgba(172,156,141,0.14)]',
};

const SIZES = {
  sm: 'px-3.5 py-2 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
} as const;

export interface PremiumButtonProps {
  children: ReactNode;
  variant?: Variant;
  size?: keyof typeof SIZES;
  href?: string;
  onClick?: (e: MouseEvent<HTMLElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  magnetic?: boolean;
  title?: string;
  'aria-label'?: string;
}

/**
 * The single button used across the site: magnetic pull, click ripple,
 * sheen sweep on hover, and an inline loading spinner.
 */
export default function PremiumButton({
  children,
  variant = 'primary',
  size = 'md',
  href,
  onClick,
  type = 'button',
  disabled,
  loading,
  className = '',
  magnetic = true,
  ...rest
}: PremiumButtonProps) {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const nextId = useRef(0);

  const spawnRipple = (e: MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = nextId.current++;
    setRipples((r) => [...r, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    window.setTimeout(() => setRipples((r) => r.filter((item) => item.id !== id)), 620);
  };

  const handleClick = (e: MouseEvent<HTMLElement>) => {
    spawnRipple(e);
    onClick?.(e);
  };

  const classes = `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`;

  const inner = (
    <>
      <span aria-hidden className="btn-sheen" />
      {ripples.map((r) => (
        <span
          key={r.id}
          aria-hidden
          className="btn-ripple"
          style={{ left: r.x, top: r.y }}
        />
      ))}
      {loading && (
        <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
          <path
            d="M21 12a9 9 0 0 0-9-9"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      )}
      <span className="relative z-10">{children}</span>
    </>
  );

  const el = href ? (
    <Link href={href} className={classes} onClick={handleClick} {...rest}>
      {inner}
    </Link>
  ) : (
    <button
      type={type}
      className={classes}
      onClick={handleClick}
      disabled={disabled || loading}
      {...rest}
    >
      {inner}
    </button>
  );

  return magnetic ? <Magnetic as="span" className="inline-flex">{el}</Magnetic> : el;
}
