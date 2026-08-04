'use client';

import { useEffect, useRef } from 'react';
import { subscribe } from '@/lib/ticker';

type CursorMode = '' | 'is-link' | 'is-text' | 'is-view';

const LINK_SELECTOR = 'a, button, [role="button"], summary, [data-cursor="link"]';
const TEXT_SELECTOR =
  'input:not([type="checkbox"]):not([type="radio"]), textarea, select, [contenteditable="true"]';
const VIEW_SELECTOR = '[data-cursor="view"]';

/** Ring scale per mode. One source, so press-release cannot guess wrong. */
const SCALE_FOR_MODE: Record<CursorMode, number> = {
  '': 1,
  'is-link': 1.55,
  'is-text': 0.85,
  'is-view': 2.1,
};

const TRAIL_LENGTH = 10;
const TRAIL_RADIUS_BASE = 3.5;
const TRAIL_HEAD_FOLLOW = 0.42;
const TRAIL_LINK_FOLLOW = 0.38;

/** Per-frame interpolation factors. Lower trails further behind the pointer. */
const RING_FOLLOW = 0.16;
const SCALE_FOLLOW = 0.18;

/** Compression while the primary button is held. */
const PRESS_SCALE = 0.72;

/**
 * Sub-pixel threshold below which motion is invisible. Once every layer is
 * inside it, continuing to interpolate spends frames producing identical
 * pixels, so the loop releases itself.
 */
const SETTLE_EPSILON = 0.05;

/** Trail ink. The accent at very low alpha — decoration, never a text colour. */
const TRAIL_RGB = '114, 56, 61';

/**
 * Three-layer cursor: a canvas trail, a ring that lags and morphs to match what
 * is underneath, and a dot pinned exactly to the pointer.
 *
 * Four costs were removed from the previous version.
 *
 * **Hit-testing moved off the input event.** `pointermove` fires once per
 * hardware report — 125Hz on a plain mouse, up to 1000Hz on a gaming mouse.
 * Running three `closest()` ancestor walks inside that handler meant up to a
 * thousand DOM traversals a second, all but sixty of which were discarded
 * before anything could be painted. The handler now only records coordinates;
 * the hit test runs once per frame, where its result can actually be used.
 *
 * **The loop stops when everything settles.** It previously ran forever, so an
 * untouched page still cleared and repainted a full-viewport canvas 60 times a
 * second. The tick releases itself once the ring and every trail point have
 * converged, and re-arms on the next pointer event.
 *
 * **The canvas clear is now bounded.** `clearRect` over the whole viewport
 * dirties every pixel on screen each frame, forcing the compositor to re-upload
 * a full-screen texture to paint ten small dots. Only the rectangle the trail
 * actually occupied is cleared.
 *
 * **The canvas is device-pixel correct.** Its backing store was sized in CSS
 * pixels, so on any retina display the trail rendered at half resolution and
 * looked soft against the crisp ring beside it.
 *
 * No React state is used: state in a per-frame loop would re-render the tree 60
 * times a second. Positions are written straight to `style.transform`, which
 * the compositor handles without involving layout or paint.
 */
export default function CustomCursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Only devices with a real hovering pointer get a custom cursor. On touch
    // there is nothing to replace, and under reduced motion a trailing element
    // is precisely the incidental movement the setting asks to remove.
    const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!hasFinePointer || prefersReducedMotion) return;

    const ring = ringRef.current;
    const dot = dotRef.current;
    const canvas = canvasRef.current;
    if (!ring || !dot || !canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    let devicePixelRatioValue = 1;

    const resizeCanvas = () => {
      // Cap at 2: beyond that the extra fill cost buys nothing the eye can
      // resolve on a 3.5px dot.
      devicePixelRatioValue = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * devicePixelRatioValue);
      canvas.height = Math.floor(window.innerHeight * devicePixelRatioValue);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      // Draw in CSS pixels; the transform maps them onto the backing store.
      context.setTransform(
        devicePixelRatioValue, 0, 0, devicePixelRatioValue, 0, 0,
      );
    };
    resizeCanvas();

    document.documentElement.classList.add('has-custom-cursor');

    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 2;
    let ringX = pointerX;
    let ringY = pointerY;

    let scale = 1;
    let mode: CursorMode = '';
    let isPressed = false;
    let isVisible = false;

    /** Element under the pointer, captured on move, consumed once per frame. */
    let pendingTarget: Element | null = null;
    let needsHitTest = false;

    const trail = Array.from({ length: TRAIL_LENGTH }, () => ({ x: pointerX, y: pointerY }));

    /** Bounds painted last frame, in CSS pixels, so only they need clearing. */
    let dirty = { minX: 0, minY: 0, maxX: 0, maxY: 0, valid: false };

    let unsubscribe: (() => void) | null = null;

    const targetScale = () => SCALE_FOR_MODE[mode] * (isPressed ? PRESS_SCALE : 1);

    const applyMode = (next: CursorMode, label = '') => {
      if (next === mode) return;
      ring.classList.remove('is-link', 'is-text', 'is-view');
      if (next) ring.classList.add(next);
      // textContent, not innerHTML: the label is a fixed literal today, but
      // assigning markup here would be an injection sink the moment it is ever
      // derived from page content.
      ring.textContent = label;
      mode = next;
    };

    const hitTest = (element: Element | null) => {
      if (!element?.closest) return applyMode('');
      if (element.closest(VIEW_SELECTOR)) return applyMode('is-view', 'View');
      if (element.closest(TEXT_SELECTOR)) return applyMode('is-text');
      if (element.closest(LINK_SELECTOR)) return applyMode('is-link');
      applyMode('');
    };

    const clearDirtyRegion = () => {
      if (!dirty.valid) return;
      // One pixel of slack absorbs anti-aliased edges, which spill just past
      // the geometric bounds of each arc.
      context.clearRect(
        dirty.minX - 1,
        dirty.minY - 1,
        dirty.maxX - dirty.minX + 2,
        dirty.maxY - dirty.minY + 2,
      );
      dirty.valid = false;
    };

    const drawTrail = () => {
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      const linkBoost = mode === 'is-link' ? 1.4 : 1;

      for (let i = 0; i < TRAIL_LENGTH; i++) {
        const ratio = i / TRAIL_LENGTH;
        const radius = TRAIL_RADIUS_BASE * (1 - ratio) * linkBoost;
        const alpha = (1 - ratio) * 0.22;
        const { x, y } = trail[i];

        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fillStyle = `rgba(${TRAIL_RGB}, ${alpha})`;
        context.fill();

        if (x - radius < minX) minX = x - radius;
        if (y - radius < minY) minY = y - radius;
        if (x + radius > maxX) maxX = x + radius;
        if (y + radius > maxY) maxY = y + radius;
      }

      dirty = { minX, minY, maxX, maxY, valid: true };
    };

    const tick = () => {
      if (needsHitTest) {
        hitTest(pendingTarget);
        needsHitTest = false;
      }

      const wanted = targetScale();
      ringX += (pointerX - ringX) * RING_FOLLOW;
      ringY += (pointerY - ringY) * RING_FOLLOW;
      scale += (wanted - scale) * SCALE_FOLLOW;

      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) scale(${scale})`;
      dot.style.transform = `translate3d(${pointerX}px, ${pointerY}px, 0)`;

      // Head chases the pointer; each remaining point chases its predecessor.
      trail[0].x += (pointerX - trail[0].x) * TRAIL_HEAD_FOLLOW;
      trail[0].y += (pointerY - trail[0].y) * TRAIL_HEAD_FOLLOW;
      for (let i = 1; i < TRAIL_LENGTH; i++) {
        trail[i].x += (trail[i - 1].x - trail[i].x) * TRAIL_LINK_FOLLOW;
        trail[i].y += (trail[i - 1].y - trail[i].y) * TRAIL_LINK_FOLLOW;
      }

      clearDirtyRegion();
      if (isVisible) drawTrail();

      // The tail is the last thing to converge, so testing it alone would be
      // enough — but testing all three is cheap and keeps the condition honest
      // if the follow factors are ever retuned.
      const tail = trail[TRAIL_LENGTH - 1];
      const settled =
        Math.abs(pointerX - ringX) < SETTLE_EPSILON &&
        Math.abs(pointerY - ringY) < SETTLE_EPSILON &&
        Math.abs(wanted - scale) < SETTLE_EPSILON &&
        Math.abs(pointerX - tail.x) < SETTLE_EPSILON &&
        Math.abs(pointerY - tail.y) < SETTLE_EPSILON;

      if (!settled) return;

      // Land exactly on target before releasing, so the next re-arm does not
      // start from a fractional offset that would show as a one-frame jump.
      ringX = pointerX;
      ringY = pointerY;
      scale = wanted;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) scale(${scale})`;

      unsubscribe?.();
      unsubscribe = null;
    };

    const ensureRunning = () => {
      if (!unsubscribe) unsubscribe = subscribe(tick);
    };

    const onPointerMove = (event: PointerEvent) => {
      pointerX = event.clientX;
      pointerY = event.clientY;

      if (!isVisible) {
        isVisible = true;
        ring.style.opacity = '1';
        dot.style.opacity = '1';
        canvas.style.opacity = '1';
        // Collapse every layer onto the pointer on first sight, so nothing
        // streaks in from the centre of the screen.
        ringX = pointerX;
        ringY = pointerY;
        for (const point of trail) {
          point.x = pointerX;
          point.y = pointerY;
        }
      }

      pendingTarget = event.target as Element | null;
      needsHitTest = true;
      ensureRunning();
    };

    const onPointerDown = () => {
      isPressed = true;
      ensureRunning();
    };

    const onPointerUp = () => {
      isPressed = false;
      ensureRunning();
    };

    const onPointerLeave = () => {
      isVisible = false;
      ring.style.opacity = '0';
      dot.style.opacity = '0';
      canvas.style.opacity = '0';
      clearDirtyRegion();
    };

    const onResize = () => {
      // Resizing resets the backing store, which also wipes what was drawn, so
      // the recorded dirty region no longer describes anything on screen.
      resizeCanvas();
      dirty.valid = false;
      ensureRunning();
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    // pointercancel fires when a gesture is interrupted by a system dialog or a
    // context menu. Without it the ring can stay stuck at its pressed scale.
    window.addEventListener('pointercancel', onPointerUp, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    document.addEventListener('mouseleave', onPointerLeave, { passive: true });

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('mouseleave', onPointerLeave);
      unsubscribe?.();
      document.documentElement.classList.remove('has-custom-cursor');
    };
  }, []);

  return (
    <>
      {/* Trail layer, beneath the ring and dot. */}
      <canvas ref={canvasRef} aria-hidden className="cursor-trail" style={{ opacity: 0 }} />
      <div ref={ringRef} aria-hidden className="cursor-ring" style={{ opacity: 0 }} />
      <div ref={dotRef} aria-hidden className="cursor-dot" style={{ opacity: 0 }} />
    </>
  );
}
