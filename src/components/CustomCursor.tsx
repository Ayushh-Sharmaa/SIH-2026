'use client';

import { useEffect, useRef, useState } from 'react';

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only on desktop
    if (typeof window === 'undefined' || window.matchMedia('(pointer: coarse)').matches) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const cursor = cursorRef.current;
    const dot = dotRef.current;
    if (!cursor || !dot) return;

    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!visible) setVisible(true);
      dot.style.left = `${mouseX - 2}px`;
      dot.style.top = `${mouseY - 2}px`;
    };

    const onMouseLeave = () => setVisible(false);
    const onMouseEnter = () => setVisible(true);

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);

    // Smooth follow for outer ring
    let animId: number;
    const animate = () => {
      cursorX += (mouseX - cursorX) * 0.12;
      cursorY += (mouseY - cursorY) * 0.12;
      cursor.style.left = `${cursorX - 10}px`;
      cursor.style.top = `${cursorY - 10}px`;
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);

    // Scale on interactive elements
    const interactiveEls = document.querySelectorAll('a, button, [role="button"], input, textarea, select, label');
    const onEnterInteractive = () => {
      cursor.style.transform = 'scale(1.6)';
      cursor.style.borderColor = 'rgba(114,56,61,0.4)';
    };
    const onLeaveInteractive = () => {
      cursor.style.transform = 'scale(1)';
      cursor.style.borderColor = '';
    };

    interactiveEls.forEach(el => {
      el.addEventListener('mouseenter', onEnterInteractive);
      el.addEventListener('mouseleave', onLeaveInteractive);
    });

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
      cancelAnimationFrame(animId);
      interactiveEls.forEach(el => {
        el.removeEventListener('mouseenter', onEnterInteractive);
        el.removeEventListener('mouseleave', onLeaveInteractive);
      });
    };
  }, [visible]);

  return (
    <>
      <div
        ref={cursorRef}
        className="cursor-glow hidden md:block"
        style={{ opacity: visible ? 1 : 0 }}
      />
      <div
        ref={dotRef}
        className="cursor-dot hidden md:block"
        style={{ opacity: visible ? 1 : 0 }}
      />
    </>
  );
}
