'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import Icon from './Icon';
import { SPRING } from '@/components/motion/tokens';
import { usePrefersReducedMotion } from '@/components/motion/useReducedMotion';

/**
 * The notification system.
 *
 * Replaces four independent implementations — dashboard, admin, find-mentors
 * and find-teammates each hand-rolled a fixed bottom-centre banner with its own
 * timeout, its own markup and its own colours. Four copies means four places to
 * fix a bug and four subtly different behaviours for the same event.
 *
 * Announcements use `role="status"` (polite) for success/info and `role="alert"`
 * (assertive) for errors, so a screen reader interrupts only when something
 * actually went wrong.
 */

export type ToastTone = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
  /** Optional inline action, e.g. Undo. */
  action?: { label: string; onClick: () => void };
  duration: number;
}

const TONE: Record<ToastTone, { icon: LucideIcon; accent: string; ring: string }> = {
  success: { icon: CheckCircle2, accent: 'text-accent', ring: 'border-line-accent' },
  error: { icon: XCircle, accent: 'text-accent', ring: 'border-line-accent' },
  warning: { icon: AlertTriangle, accent: 'text-body', ring: 'border-line-strong' },
  info: { icon: Info, accent: 'text-muted', ring: 'border-line' },
};

interface ToastContextValue {
  toast: (message: string, tone?: ToastTone, options?: Partial<Pick<Toast, 'duration' | 'action'>>) => void;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Map<number, number>());

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback<ToastContextValue['toast']>(
    (message, tone = 'info', options = {}) => {
      const duration = options.duration ?? (tone === 'error' ? 6000 : 4000);
      const id = nextId.current++;

      setToasts((list) => {
        const next = [...list, { id, tone, message, action: options.action, duration }];
        // Cap the stack. Beyond three, the oldest is unreadable anyway and the
        // pile starts covering the page.
        return next.slice(-3);
      });

      timers.current.set(id, window.setTimeout(() => dismiss(id), duration));
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastViewport({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-toast flex flex-col items-center gap-2 p-4 sm:p-6"
      // The region is a live area; individual toasts carry their own role.
      aria-live="polite"
      aria-relevant="additions"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const reduced = usePrefersReducedMotion();
  const tone = TONE[toast.tone];

  return (
    <motion.div
      layout
      role={toast.tone === 'error' ? 'alert' : 'status'}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.96, filter: 'blur(6px)' }}
      animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.97, filter: 'blur(4px)' }}
      transition={reduced ? { duration: 0.15 } : SPRING.overlay}
      // Swipe to dismiss, matching the platform gesture on touch.
      drag={reduced ? false : 'x'}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.5}
      onDragEnd={(_, info) => {
        if (Math.abs(info.offset.x) > 90) onDismiss(toast.id);
      }}
      className={cn(
        'surface-overlay pointer-events-auto relative flex w-full max-w-md items-start gap-3 overflow-hidden rounded-panel px-4 py-3.5',
        tone.ring,
      )}
    >
      <Icon icon={tone.icon} size="sm" className={cn('mt-0.5', tone.accent)} />

      <p className="min-w-0 flex-1 text-caption text-body">{toast.message}</p>

      {toast.action && (
        <button
          type="button"
          onClick={() => {
            toast.action?.onClick();
            onDismiss(toast.id);
          }}
          className="shrink-0 text-label uppercase text-accent transition-opacity hover:opacity-70"
        >
          {toast.action.label}
        </button>
      )}

      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="-mr-1 shrink-0 rounded-control p-1 text-muted transition-colors hover:text-accent"
      >
        <Icon icon={X} size="xs" />
      </button>

      {/* Time-remaining bar. Purely decorative — the toast is already announced
          and dismissible by keyboard. */}
      {!reduced && (
        <motion.span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-accent/30"
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          // Linear is correct here: a countdown that eases would misrepresent
          // how much time is actually left.
          transition={{ duration: toast.duration / 1000, ease: 'linear' }}
        />
      )}
    </motion.div>
  );
}
