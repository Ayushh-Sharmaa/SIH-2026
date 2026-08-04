'use client';

import { m, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useRef, type ReactNode, type MouseEvent } from 'react';
import { SPRING } from './tokens';
import { usePrefersReducedMotion, useIsCoarsePointer } from './useReducedMotion';

interface MagneticProps {
  children: ReactNode;
  className?: string;
  /** Max px the element is pulled toward the cursor. Default 12. */
  strength?: number;
  as?: 'div' | 'span';
}

/**
 * Pulls its child toward the cursor while hovered. Disabled for coarse
 * pointers and reduced-motion users.
 */
export default function Magnetic({
  children,
  className,
  strength = 12,
  as = 'div',
}: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const coarse = useIsCoarsePointer();
  const disabled = reduced || coarse;

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, SPRING.magnetic);
  const sy = useSpring(y, SPRING.magnetic);

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    if (disabled || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    x.set((dx / (rect.width / 2)) * strength);
    y.set((dy / (rect.height / 2)) * strength);
  };

  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  const MotionTag = as === 'span' ? m.span : m.div;

  return (
    <MotionTag
      ref={ref}
      className={className}
      style={disabled ? undefined : { x: sx, y: sy }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {children}
    </MotionTag>
  );
}

/**
 * 3D tilt with a cursor-tracked specular highlight. The highlight is a
 * radial gradient positioned from CSS custom properties so it costs no
 * React re-renders.
 */
export function TiltCard({
  children,
  className = '',
  intensity = 7,
  glare = true,
}: {
  children: ReactNode;
  className?: string;
  intensity?: number;
  glare?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const coarse = useIsCoarsePointer();
  const disabled = reduced || coarse;

  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const smx = useSpring(mx, SPRING.soft);
  const smy = useSpring(my, SPRING.soft);

  const rotateX = useTransform(smy, [0, 1], [intensity, -intensity]);
  const rotateY = useTransform(smx, [0, 1], [-intensity, intensity]);

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    if (disabled || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    mx.set(px);
    my.set(py);
    ref.current.style.setProperty('--glare-x', `${px * 100}%`);
    ref.current.style.setProperty('--glare-y', `${py * 100}%`);
  };

  const onLeave = () => {
    mx.set(0.5);
    my.set(0.5);
  };

  return (
    <m.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`relative ${className}`}
      style={
        disabled
          ? undefined
          : { rotateX, rotateY, transformStyle: 'preserve-3d', transformPerspective: 1000 }
      }
      whileHover={disabled ? undefined : { y: -6, transition: SPRING.soft }}
    >
      {children}
      {glare && !disabled && (
        <span aria-hidden className="tilt-glare" />
      )}
    </m.div>
  );
}
