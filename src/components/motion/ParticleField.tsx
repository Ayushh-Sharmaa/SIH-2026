'use client';

import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion, useIsCoarsePointer } from './useReducedMotion';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  targetAlpha: number;
}

const LINK_DIST = 120; // px — max distance to draw a line between particles
const MOUSE_REPEL = 90; // px — repulsion radius around mouse
const PARTICLE_COLOR = '172, 156, 141'; // RGB of --color-clay
const LINE_COLOR = '172, 156, 141';

function createParticles(count: number, w: number, h: number): Particle[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.35,
    vy: (Math.random() - 0.5) * 0.35,
    radius: Math.random() * 1.5 + 0.8,
    alpha: Math.random() * 0.55 + 0.25,
    targetAlpha: Math.random() * 0.55 + 0.25,
  }));
}

/**
 * GPU-composited canvas particle network. Mouse pushes particles away, drawing
 * connective lines that fade with distance. Everything runs off-thread via
 * requestAnimationFrame; React never re-renders during the animation loop.
 *
 * Respects reduced-motion (static dots only) and coarse pointers (lower density,
 * no mouse interaction).
 */
export default function ParticleField({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();
  const coarse = useIsCoarsePointer();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Density: fewer particles on mobile and reduced-motion
    const density = coarse ? 0.000025 : 0.00006;

    let w = 0;
    let h = 0;
    let particles: Particle[] = [];
    let mouseX = -9999;
    let mouseY = -9999;
    let raf = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * window.devicePixelRatio);
      canvas.height = Math.round(h * window.devicePixelRatio);
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      const count = Math.round(w * h * density);
      particles = createParticles(count, w, h);
    };

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };

    const onLeave = () => {
      mouseX = -9999;
      mouseY = -9999;
    };

    const tick = () => {
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (!reduced) {
          // Mouse repulsion
          const dx = p.x - mouseX;
          const dy = p.y - mouseY;
          const distMouse = Math.sqrt(dx * dx + dy * dy);
          if (distMouse < MOUSE_REPEL) {
            const force = (1 - distMouse / MOUSE_REPEL) * 0.9;
            p.vx += (dx / distMouse) * force * 0.5;
            p.vy += (dy / distMouse) * force * 0.5;
          }

          // Gentle velocity damping
          p.vx *= 0.985;
          p.vy *= 0.985;

          // Drift
          p.x += p.vx;
          p.y += p.vy;

          // Wrap edges
          if (p.x < 0) p.x += w;
          if (p.x > w) p.x -= w;
          if (p.y < 0) p.y += h;
          if (p.y > h) p.y -= h;

          // Alpha pulse
          p.alpha += (p.targetAlpha - p.alpha) * 0.04;
          if (Math.abs(p.alpha - p.targetAlpha) < 0.01) {
            p.targetAlpha = Math.random() * 0.55 + 0.25;
          }
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${PARTICLE_COLOR}, ${p.alpha})`;
        ctx.fill();

        // Draw lines to nearby particles
        if (!reduced) {
          for (let j = i + 1; j < particles.length; j++) {
            const q = particles[j];
            const dx2 = p.x - q.x;
            const dy2 = p.y - q.y;
            const dist = Math.sqrt(dx2 * dx2 + dy2 * dy2);
            if (dist < LINK_DIST) {
              const lineAlpha = (1 - dist / LINK_DIST) * 0.18;
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(q.x, q.y);
              ctx.strokeStyle = `rgba(${LINE_COLOR}, ${lineAlpha})`;
              ctx.lineWidth = 0.7;
              ctx.stroke();
            }
          }
        }
      }

      raf = requestAnimationFrame(tick);
    };

    resize();

    if (!coarse) {
      canvas.addEventListener('pointermove', onMove, { passive: true });
      canvas.addEventListener('pointerleave', onLeave, { passive: true });
    }

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      ro.disconnect();
    };
  }, [reduced, coarse]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      style={{ mixBlendMode: 'multiply' }}
    />
  );
}
