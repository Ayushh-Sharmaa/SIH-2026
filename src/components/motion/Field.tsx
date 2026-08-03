'use client';

import { useId, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { DURATION, EASE } from './tokens';

const SHELL =
  'peer w-full rounded-xl border bg-[rgba(248,246,242,0.55)] px-4 pb-2 pt-6 text-sm text-foreground backdrop-blur-sm transition-[border-color,box-shadow,background-color] duration-250 outline-none placeholder-transparent';

const STATE = {
  idle: 'border-[rgba(209,199,189,0.75)] hover:border-[rgba(172,156,141,0.9)]',
  focus:
    'focus:border-primary focus:bg-[rgba(248,246,242,0.92)] focus:shadow-[0_0_0_4px_rgba(114,56,61,0.10)]',
  error: 'border-[rgba(114,56,61,0.55)] shadow-[0_0_0_4px_rgba(114,56,61,0.08)]',
};

const LABEL =
  'pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted transition-all duration-250 ' +
  'peer-focus:top-3.5 peer-focus:text-[10px] peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-[0.12em] peer-focus:text-primary ' +
  'peer-[:not(:placeholder-shown)]:top-3.5 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:font-bold peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-[0.12em]';

function FieldError({ message }: { message?: string }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.p
          role="alert"
          initial={{ opacity: 0, height: 0, y: -4 }}
          animate={{ opacity: 1, height: 'auto', y: 0 }}
          exit={{ opacity: 0, height: 0, y: -4 }}
          transition={{ duration: DURATION.hover, ease: EASE.outExpo }}
          className="mt-1.5 pl-1 text-[11px] font-semibold text-primary"
        >
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

export interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'placeholder'> {
  label: string;
  error?: string;
  hint?: string;
}

/** Text input with an animated floating label and validation shake. */
export function Field({ label, error, hint, className = '', id, ...props }: FieldProps) {
  const auto = useId();
  const fieldId = id ?? auto;

  return (
    <div className={className}>
      <motion.div
        className="relative"
        animate={error ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
        transition={{ duration: 0.4, ease: EASE.outExpo }}
      >
        <input
          id={fieldId}
          placeholder={label}
          aria-invalid={!!error}
          className={`${SHELL} ${error ? STATE.error : STATE.idle} ${STATE.focus}`}
          {...props}
        />
        <label htmlFor={fieldId} className={LABEL}>
          {label}
        </label>
      </motion.div>
      {hint && !error && <p className="mt-1.5 pl-1 text-[11px] text-muted">{hint}</p>}
      <FieldError message={error} />
    </div>
  );
}

export interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  children: ReactNode;
}

export function SelectField({ label, error, children, className = '', id, ...props }: SelectFieldProps) {
  const auto = useId();
  const fieldId = id ?? auto;
  const [focused, setFocused] = useState(false);

  return (
    <div className={className}>
      <div className="relative">
        <label
          htmlFor={fieldId}
          className={`pointer-events-none absolute left-4 top-3.5 text-[10px] font-bold uppercase tracking-[0.12em] transition-colors duration-250 ${
            focused ? 'text-primary' : 'text-muted'
          }`}
        >
          {label}
        </label>
        <select
          id={fieldId}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-invalid={!!error}
          className={`w-full appearance-none rounded-xl border bg-[rgba(248,246,242,0.55)] px-4 pb-2 pt-6 text-sm text-foreground outline-none backdrop-blur-sm transition-[border-color,box-shadow,background-color] duration-250 ${
            error ? STATE.error : STATE.idle
          } ${STATE.focus}`}
          {...props}
        >
          {children}
        </select>
        <motion.svg
          aria-hidden
          className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted"
          viewBox="0 0 24 24"
          fill="none"
          animate={{ rotate: focused ? 180 : 0 }}
          transition={{ duration: DURATION.hover, ease: EASE.outExpo }}
        >
          <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </motion.svg>
      </div>
      <FieldError message={error} />
    </div>
  );
}

export interface TextAreaFieldProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'placeholder'> {
  label: string;
  error?: string;
}

export function TextAreaField({ label, error, className = '', id, ...props }: TextAreaFieldProps) {
  const auto = useId();
  const fieldId = id ?? auto;

  return (
    <div className={className}>
      <div className="relative">
        <textarea
          id={fieldId}
          placeholder={label}
          aria-invalid={!!error}
          className={`${SHELL} ${error ? STATE.error : STATE.idle} ${STATE.focus} resize-y min-h-28`}
          {...props}
        />
        <label
          htmlFor={fieldId}
          className="pointer-events-none absolute left-4 top-4 text-sm text-muted transition-all duration-250 peer-focus:top-3 peer-focus:text-[10px] peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-[0.12em] peer-focus:text-primary peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:font-bold peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-[0.12em]"
        >
          {label}
        </label>
      </div>
      <FieldError message={error} />
    </div>
  );
}
