'use client';

import { useEffect, useRef } from 'react';

type CursorMode = '' | 'is-link' | 'is-text' | 'is-view';

const LINK_SELECTOR = 'a, button, [role="button"], summary, [data-cursor="link"]';
const TEXT_SELECTOR = 'input:not([type="checkbox"]):not([type="radio"]), textarea, select, [contenteditable="true"]';

/**
 * Two-layer cursor: a dot that tracks the pointer exactly and a ring that
 * lags behind with spring-like interpolation. The ring morphs based on what
 * is underneath. Everything is written straight to style — no React state in
 * the animation loop.
 */
export default function CustomCursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || reduced) return;

    const ring = ringRef.current;
    const dot = dotRef.current;
    if (!ring || !dot) return;

    document.documentElement.classList.add('has-custom-cursor');

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;
    let scale = 1;
    let targetScale = 1;
    let visible = false;
    let mode: CursorMode = '';

    const setMode = (next: CursorMode, label = '') => {
      if (next === mode) return;
      ring.classList.remove('is-link', 'is-text', 'is-view');
      if (next) ring.classList.add(next);
      ring.textContent = label;
      mode = next;
    };

    const onMove = (e: PointerEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!visible) {
        visible = true;
        ring.style.opacity = '1';
        dot.style.opacity = '1';
        // Jump the ring to the pointer so it does not fly in from the corner.
        ringX = mouseX;
        ringY = mouseY;
      }

      const target = e.target as Element | null;
      if (!target?.closest) return;

      if (target.closest('[data-cursor="view"]')) {
        setMode('is-view', 'View');
        targetScale = 2.1;
      } else if (target.closest(TEXT_SELECTOR)) {
        setMode('is-text');
        targetScale = 0.85;
      } else if (target.closest(LINK_SELECTOR)) {
        setMode('is-link');
        targetScale = 1.55;
      } else {
        setMode('');
        targetScale = 1;
      }
    };

    const hide = () => {
      visible = false;
      ring.style.opacity = '0';
      dot.style.opacity = '0';
    };

    const onDown = () => { targetScale *= 0.72; };
    const onUp = () => {
      // Recompute from the current mode rather than guessing an inverse.
      targetScale = mode === 'is-view' ? 2.1 : mode === 'is-link' ? 1.55 : mode === 'is-text' ? 0.85 : 1;
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    document.addEventListener('mouseleave', hide);

    let raf = 0;
    const tick = () => {
      ringX += (mouseX - ringX) * 0.16;
      ringY += (mouseY - ringY) * 0.16;
      scale += (targetScale - scale) * 0.18;

      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) scale(${scale})`;
      dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.removeEventListener('mouseleave', hide);
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove('has-custom-cursor');
    };
  }, []);

  return (
    <>
      <div ref={ringRef} aria-hidden className="cursor-ring" style={{ opacity: 0 }} />
      <div ref={dotRef} aria-hidden className="cursor-dot" style={{ opacity: 0 }} />
    </>
  );
}
