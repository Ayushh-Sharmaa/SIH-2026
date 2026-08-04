'use client';

import { useEffect, useRef } from 'react';

/**
 * Traps keyboard focus inside a container while it is active, and returns focus
 * to whatever was focused before it opened.
 *
 * This is not optional polish. A dialog without a trap lets Tab walk the user
 * out into the page behind it, where they are interacting with content that is
 * visually obscured and `aria-hidden` to nothing — the classic "lost keyboard
 * user" failure. WCAG 2.4.3.
 *
 * Focusables are re-queried on every Tab rather than cached at mount, because
 * dialog content is frequently conditional (a form that reveals a field, a list
 * that loads) and a cached list goes stale immediately.
 */
export function useFocusTrap<T extends HTMLElement>(active: boolean) {
  const ref = useRef<T>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;
    const node = ref.current;
    if (!node) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;

    const SELECTOR = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    const focusables = () =>
      Array.from(node.querySelectorAll<HTMLElement>(SELECTOR)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );

    // Move focus in. Prefer an explicitly marked element, then the first
    // natural target, then the container itself.
    const initial =
      node.querySelector<HTMLElement>('[data-autofocus]') ?? focusables()[0] ?? node;
    initial.focus({ preventScroll: true });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const activeEl = document.activeElement;

      if (e.shiftKey && (activeEl === first || activeEl === node)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && activeEl === last) {
        e.preventDefault();
        first.focus();
      }
    };

    node.addEventListener('keydown', onKeyDown);
    return () => {
      node.removeEventListener('keydown', onKeyDown);
      // Restoring focus is the half everyone forgets: without it the user is
      // dumped at the top of the document after closing.
      previouslyFocused.current?.focus?.({ preventScroll: true });
    };
  }, [active]);

  return ref;
}

/**
 * Prevents background scroll while an overlay is open.
 *
 * Pads the body by the scrollbar's width so removing the scrollbar does not
 * shift the whole layout sideways — the visible "jump" when a modal opens.
 */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;

    const { body, documentElement } = document;
    const previousOverflow = body.style.overflow;
    const previousPadding = body.style.paddingRight;
    const scrollbar = window.innerWidth - documentElement.clientWidth;

    body.style.overflow = 'hidden';
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
    // Lenis watches this class and pauses its RAF loop.
    documentElement.classList.add('lenis-stopped');

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPadding;
      documentElement.classList.remove('lenis-stopped');
    };
  }, [active]);
}

/** Calls `onClose` on Escape while active. */
export function useEscapeKey(active: boolean, onClose: () => void) {
  useEffect(() => {
    if (!active) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [active, onClose]);
}
