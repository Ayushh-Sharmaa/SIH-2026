'use client';

import {
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { motion } from 'framer-motion';
import { Check, ChevronDown, Eye, EyeOff } from 'lucide-react';
import Icon from '@/components/ui/Icon';
import { DURATION, EASE } from './tokens';

/**
 * The form field system.
 *
 * Two things were structurally wrong before and are fixed here:
 *
 * 1. `aria-invalid` was set but the error text was never linked to the input.
 *    A screen reader announced "invalid" with no indication of why. Every
 *    message now has an id and is wired through `aria-describedby`.
 *
 * 2. The error reveal animated `height: 0 -> auto`, which forces Framer to
 *    measure and then tween a pixel height — layout on every frame. Replaced
 *    with a `grid-template-rows: 0fr -> 1fr` transition, which is pure CSS,
 *    needs no measurement, and still collapses correctly.
 */

const SHELL =
  'peer w-full rounded-panel border bg-surface-raised px-4 pb-2 pt-6 text-sm text-foreground backdrop-blur-sm outline-none transition-[border-color,box-shadow,background-color] duration-220 placeholder-transparent disabled:cursor-not-allowed disabled:opacity-60';

const STATE = {
  idle: 'border-line hover:border-line-strong',
  focus:
    'focus:border-accent focus:bg-surface-overlay focus:shadow-[0_0_0_4px_rgb(114_56_61/0.10)]',
  error: 'border-accent/55 shadow-[0_0_0_4px_rgb(114_56_61/0.08)]',
  success: 'border-line-strong shadow-[0_0_0_4px_rgb(172_156_141/0.14)]',
};

/** Floating label. Rises on focus or once the field holds a value. */
const LABEL = [
  'pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted',
  'transition-all duration-220',
  'peer-focus:top-3.5 peer-focus:-translate-y-0 peer-focus:text-label peer-focus:uppercase peer-focus:text-accent',
  'peer-[:not(:placeholder-shown)]:top-3.5 peer-[:not(:placeholder-shown)]:-translate-y-0',
  'peer-[:not(:placeholder-shown)]:text-label peer-[:not(:placeholder-shown)]:uppercase',
].join(' ');

/**
 * Collapsible message row. The 0fr → 1fr grid transition animates height
 * without any JavaScript measurement.
 */
function Collapse({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <div
      className="grid transition-[grid-template-rows] duration-200 ease-out-expo"
      style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
    >
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}

function Messages({
  errorId,
  hintId,
  error,
  hint,
}: {
  errorId: string;
  hintId: string;
  error?: string;
  hint?: string;
}) {
  return (
    <>
      <Collapse open={!!error}>
        {/* role="alert" announces the message the moment it appears. */}
        <p id={errorId} role="alert" className="mt-1.5 pl-1 text-caption font-semibold text-accent">
          {error}
        </p>
      </Collapse>
      {hint && !error && (
        <p id={hintId} className="mt-1.5 pl-1 text-caption text-muted">
          {hint}
        </p>
      )}
    </>
  );
}

/** Links whichever messages are actually present. */
function describedBy(error: string | undefined, hint: string | undefined, errorId: string, hintId: string) {
  const ids = [error && errorId, hint && !error && hintId].filter(Boolean);
  return ids.length ? ids.join(' ') : undefined;
}

export interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'placeholder'> {
  label: string;
  error?: string;
  hint?: string;
  /** Shows a confirmation tick once the value validates. */
  valid?: boolean;
  /** Adds a show/hide toggle. Only meaningful for type="password". */
  revealable?: boolean;
  /** Renders a live character counter. Requires maxLength. */
  counter?: boolean;
}

export function Field({
  label,
  error,
  hint,
  valid,
  revealable,
  counter,
  className = '',
  id,
  type = 'text',
  value,
  maxLength,
  ...props
}: FieldProps) {
  const auto = useId();
  const fieldId = id ?? auto;
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;
  const [revealed, setRevealed] = useState(false);

  const isPassword = type === 'password';
  const effectiveType = isPassword && revealed ? 'text' : type;
  const length = typeof value === 'string' ? value.length : 0;
  const hasAdornment = (isPassword && revealable) || valid;

  return (
    <div className={className}>
      <motion.div
        className="relative"
        // A short, hard-stopping shake: enough to register as rejection,
        // not enough to read as a glitch. Suppressed for reduced-motion
        // users by MotionProvider, since it is a transform.
        animate={error ? { x: [0, -5, 5, -3, 3, 0] } : { x: 0 }}
        transition={{ duration: 0.4, ease: EASE.inOut }}
      >
        <input
          id={fieldId}
          type={effectiveType}
          placeholder={label}
          value={value}
          maxLength={maxLength}
          aria-invalid={!!error}
          aria-describedby={describedBy(error, hint, errorId, hintId)}
          className={`${SHELL} ${
            error ? STATE.error : valid ? STATE.success : STATE.idle
          } ${STATE.focus} ${hasAdornment ? 'pr-12' : ''}`}
          {...props}
        />
        <label htmlFor={fieldId} className={LABEL}>
          {label}
        </label>

        {isPassword && revealable && (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            aria-label={revealed ? 'Hide password' : 'Show password'}
            aria-pressed={revealed}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-control p-1.5 text-muted transition-colors duration-200 hover:text-accent"
          >
            <Icon icon={revealed ? EyeOff : Eye} size="sm" />
          </button>
        )}

        {valid && !error && !isPassword && (
          <motion.span
            aria-hidden
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: DURATION.micro, ease: EASE.outBack }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-accent"
          >
            <Icon icon={Check} size="sm" strokeWidth={2.5} />
          </motion.span>
        )}
      </motion.div>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Messages errorId={errorId} hintId={hintId} error={error} hint={hint} />
        </div>
        {counter && maxLength && (
          <p
            aria-live="polite"
            className={`mt-1.5 shrink-0 text-caption tabular ${
              length >= maxLength ? 'text-accent' : 'text-faint'
            }`}
          >
            {length}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
}

export interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export function SelectField({
  label,
  error,
  hint,
  children,
  className = '',
  id,
  ...props
}: SelectFieldProps) {
  const auto = useId();
  const fieldId = id ?? auto;
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;
  const [focused, setFocused] = useState(false);

  return (
    <div className={className}>
      <div className="relative">
        {/* A select always shows a value, so its label sits raised permanently
            rather than floating. */}
        <label
          htmlFor={fieldId}
          className={`pointer-events-none absolute left-4 top-3.5 text-label uppercase transition-colors duration-220 ${
            focused ? 'text-accent' : 'text-muted'
          }`}
        >
          {label}
        </label>
        <select
          id={fieldId}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-invalid={!!error}
          aria-describedby={describedBy(error, hint, errorId, hintId)}
          className={`w-full appearance-none rounded-panel border bg-surface-raised px-4 pb-2 pt-6 pr-11 text-sm text-foreground outline-none backdrop-blur-sm transition-[border-color,box-shadow,background-color] duration-220 disabled:cursor-not-allowed disabled:opacity-60 ${
            error ? STATE.error : STATE.idle
          } ${STATE.focus}`}
          {...props}
        >
          {children}
        </select>
        <motion.span
          aria-hidden
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted"
          animate={{ rotate: focused ? 180 : 0 }}
          transition={{ duration: DURATION.hover, ease: EASE.outExpo }}
        >
          <Icon icon={ChevronDown} size="sm" />
        </motion.span>
      </div>
      <Messages errorId={errorId} hintId={hintId} error={error} hint={hint} />
    </div>
  );
}

export interface TextAreaFieldProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'placeholder'> {
  label: string;
  error?: string;
  hint?: string;
  counter?: boolean;
}

export function TextAreaField({
  label,
  error,
  hint,
  counter,
  className = '',
  id,
  value,
  maxLength,
  ...props
}: TextAreaFieldProps) {
  const auto = useId();
  const fieldId = id ?? auto;
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;
  const length = typeof value === 'string' ? value.length : 0;

  return (
    <div className={className}>
      <motion.div
        className="relative"
        animate={error ? { x: [0, -5, 5, -3, 3, 0] } : { x: 0 }}
        transition={{ duration: 0.4, ease: EASE.inOut }}
      >
        <textarea
          id={fieldId}
          placeholder={label}
          value={value}
          maxLength={maxLength}
          aria-invalid={!!error}
          aria-describedby={describedBy(error, hint, errorId, hintId)}
          className={`${SHELL} ${error ? STATE.error : STATE.idle} ${STATE.focus} min-h-28 resize-y`}
          {...props}
        />
        <label
          htmlFor={fieldId}
          className="pointer-events-none absolute left-4 top-4 text-sm text-muted transition-all duration-220 peer-focus:top-3 peer-focus:text-label peer-focus:uppercase peer-focus:text-accent peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-label peer-[:not(:placeholder-shown)]:uppercase"
        >
          {label}
        </label>
      </motion.div>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Messages errorId={errorId} hintId={hintId} error={error} hint={hint} />
        </div>
        {counter && maxLength && (
          <p
            aria-live="polite"
            className={`mt-1.5 shrink-0 text-caption tabular ${
              length >= maxLength ? 'text-accent' : 'text-faint'
            }`}
          >
            {length}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
}
