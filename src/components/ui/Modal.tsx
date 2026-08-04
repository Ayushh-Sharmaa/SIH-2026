'use client';

import { useCallback, useId, type ReactNode } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import Icon from './Icon';
import { DURATION, EASE, SPRING } from '@/components/motion/tokens';
import { usePrefersReducedMotion } from '@/components/motion/useReducedMotion';
import { useEscapeKey, useFocusTrap, useScrollLock } from '@/hooks/useFocusTrap';

/**
 * The dialog primitive.
 *
 * Replaces three inline overlays in admin/page.tsx that had no focus trap, no
 * Escape handler, no scroll lock and no focus return — a keyboard user could
 * Tab straight out of the dialog into the obscured page behind it.
 *
 * Everything a dialog owes the user is handled here so no call site can forget
 * one: trap, restore, Escape, scroll lock, backdrop dismissal, labelling.
 */

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
} as const;

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  size?: keyof typeof SIZES;
  className?: string;
  /** Hide the header close button — the caller must then supply its own. */
  hideClose?: boolean;
  /** Block backdrop and Escape dismissal for destructive confirmations. */
  dismissible?: boolean;
}

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'lg',
  className,
  hideClose = false,
  dismissible = true,
}: ModalProps) {
  const reduced = usePrefersReducedMotion();
  const titleId = useId();
  const descId = useId();

  const handleClose = useCallback(() => {
    if (dismissible) onClose();
  }, [dismissible, onClose]);

  const panelRef = useFocusTrap<HTMLDivElement>(open);
  useScrollLock(open);
  useEscapeKey(open, handleClose);

  return (
    <AnimatePresence>
      {open && (
        <m.div
          className="fixed inset-0 z-modal flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: DURATION.hover, ease: EASE.outExpo }}
        >
          {/* Backdrop is its own element rather than a parent click handler, so
              a click that starts inside the panel and ends outside cannot
              accidentally dismiss. */}
          <div
            aria-hidden
            onClick={handleClose}
            className="absolute inset-0 bg-[rgb(50_45_41/0.34)] backdrop-blur-md"
          />

          <m.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descId : undefined}
            tabIndex={-1}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.97, filter: 'blur(8px)' }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98, filter: 'blur(6px)' }}
            transition={reduced ? { duration: 0.15 } : SPRING.overlay}
            className={cn(
              'surface-overlay relative flex max-h-[88vh] w-full flex-col rounded-container',
              SIZES[size],
              className,
            )}
          >
            <header className="flex items-start justify-between gap-4 border-b border-line px-6 pt-6 pb-4">
              <div className="min-w-0">
                <h2 id={titleId} className="text-subheading text-ink">
                  {title}
                </h2>
                {description && (
                  <p id={descId} className="mt-1.5 text-caption text-muted">
                    {description}
                  </p>
                )}
              </div>

              {!hideClose && (
                <m.button
                  type="button"
                  onClick={onClose}
                  aria-label="Close dialog"
                  whileHover={reduced ? undefined : { scale: 1.08, rotate: 90 }}
                  whileTap={reduced ? undefined : { scale: 0.92 }}
                  transition={SPRING.snappy}
                  className="grid size-9 shrink-0 place-items-center rounded-control border border-line text-muted transition-colors hover:border-line-accent hover:text-accent"
                >
                  <Icon icon={X} size="sm" />
                </m.button>
              )}
            </header>

            {children && <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>}

            {footer && (
              <footer className="flex flex-wrap items-center justify-end gap-3 border-t border-line px-6 pt-4 pb-6">
                {footer}
              </footer>
            )}
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
