'use client';

import { useEffect, useRef, useState } from 'react';
import { animate, useInView } from 'framer-motion';
import { usePrefersReducedMotion } from './useReducedMotion';

interface CounterProps {
  to: number;
  from?: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  className?: string;
}

/** Counts up when scrolled into view. Writes to the DOM directly to avoid per-frame re-renders. */
export default function Counter({
  to,
  from = 0,
  duration = 1.8,
  suffix = '',
  prefix = '',
  decimals = 0,
  className,
}: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduced = usePrefersReducedMotion();
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!inView || done) return;
    setDone(true);

    const format = (v: number) =>
      `${prefix}${v.toLocaleString('en-IN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}${suffix}`;

    if (reduced) {
      if (ref.current) ref.current.textContent = format(to);
      return;
    }

    const controls = animate(from, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate(value) {
        if (ref.current) ref.current.textContent = format(value);
      },
    });

    return () => controls.stop();
  }, [inView, done, from, to, duration, prefix, suffix, decimals, reduced]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {from.toFixed(decimals)}
      {suffix}
    </span>
  );
}
