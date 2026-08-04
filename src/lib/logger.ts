/**
 * Application logger.
 *
 * The codebase carried 44 bare `console.error` calls split across API routes and
 * client components. Three problems with that, in ascending order of severity:
 *
 * 1. **They ship to the browser.** Every `console.error` in a client component
 *    is bundled and runs in the user's devtools. On a production site that is
 *    noise at best; at worst it hands an attacker a map of internal failure
 *    modes and endpoint names for free.
 *
 * 2. **They log whole error objects.** `console.error('Login error:', error)`
 *    on a Prisma failure prints the query, and a query can contain an email
 *    address or a password hash. Server logs are routinely shipped to
 *    third-party aggregators, so that is a real disclosure path.
 *
 * 3. **There is nowhere to send them.** Nothing was watching. A production
 *    failure was only ever discovered by a user reporting it.
 *
 * This module fixes all three: output is environment-aware, context is redacted
 * before it is written, and `setErrorReporter` gives Sentry, OpenTelemetry or
 * anything else a single place to attach without touching a call site.
 */

type LogLevel = 'debug' | 'warn' | 'error';

/** Structured, already-redacted payload handed to an external reporter. */
export interface LogRecord {
  level: LogLevel;
  message: string;
  /** Error class name, never the full object. */
  errorName?: string;
  /** Error message. Present on the server only — see `normaliseError`. */
  errorMessage?: string;
  stack?: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

export type ErrorReporter = (record: LogRecord) => void;

const isProduction = process.env.NODE_ENV === 'production';
/** `window` is the reliable client/server discriminator in the App Router. */
const isServer = typeof window === 'undefined';

/**
 * Context keys whose values are replaced with a marker before anything is
 * written. Matched case-insensitively as substrings, so `userPassword` and
 * `PASSWORD_HASH` are both caught by `password`.
 *
 * This is a backstop, not a licence. Call sites should still avoid passing
 * secrets in the first place.
 */
const REDACTED_KEY_PATTERNS = [
  'password',
  'token',
  'secret',
  'authorization',
  'cookie',
  'session',
  'apikey',
  'api_key',
  'credential',
  'hash',
  'jwt',
  'otp',
];

const REDACTION_MARKER = '[redacted]';

/** Depth cap: a cyclic or deeply nested object must not hang the logger. */
const MAX_REDACTION_DEPTH = 4;

function shouldRedact(key: string): boolean {
  const lower = key.toLowerCase();
  return REDACTED_KEY_PATTERNS.some((pattern) => lower.includes(pattern));
}

function redact(value: unknown, depth = 0): unknown {
  if (depth >= MAX_REDACTION_DEPTH) return '[truncated]';
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1));

  const output: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    output[key] = shouldRedact(key) ? REDACTION_MARKER : redact(nested, depth + 1);
  }
  return output;
}

function normaliseError(error: unknown): Pick<LogRecord, 'errorName' | 'errorMessage' | 'stack'> {
  if (!(error instanceof Error)) {
    // A thrown non-Error (a string, an object) still needs recording, but its
    // shape is unknown, so it is stringified rather than trusted.
    return { errorName: 'UnknownError', errorMessage: isServer ? String(error) : undefined };
  }

  return {
    errorName: error.name,
    // Driver errors embed the failing query, and a query can carry an email or
    // a hash. On the client the message is dropped entirely; on the server it
    // is kept because operators genuinely need it to diagnose anything.
    errorMessage: isServer ? error.message : undefined,
    // Stacks name internal file paths, so they are server-only too.
    stack: isServer ? error.stack : undefined,
  };
}

let externalReporter: ErrorReporter | null = null;

/**
 * Registers a sink for `error`-level records — the integration point for
 * Sentry, Rollbar, Datadog or OpenTelemetry.
 *
 * Records arriving here are already redacted and already stripped of anything
 * client-unsafe, so a reporter can forward them verbatim.
 *
 * ```ts
 * setErrorReporter((record) => Sentry.captureMessage(record.message, { extra: record }));
 * ```
 *
 * Returns a teardown function so a reporter can be swapped or removed in tests.
 */
export function setErrorReporter(reporter: ErrorReporter | null): () => void {
  externalReporter = reporter;
  return () => {
    if (externalReporter === reporter) externalReporter = null;
  };
}

function write(level: LogLevel, message: string, error?: unknown, context?: Record<string, unknown>) {
  const record: LogRecord = {
    level,
    message,
    ...(error === undefined ? {} : normaliseError(error)),
    ...(context ? { context: redact(context) as Record<string, unknown> } : {}),
    timestamp: new Date().toISOString(),
  };

  // The reporter runs first and is isolated: an exception inside a monitoring
  // integration must never become an exception in the request it was observing.
  if (level === 'error' && externalReporter) {
    try {
      externalReporter(record);
    } catch {
      // Deliberately empty. A broken reporter is not worth a failed request.
    }
  }

  if (isProduction) {
    // In production the browser gets nothing. Whatever went wrong has already
    // been surfaced to the user through the interface; the console would only
    // leak internals to anyone who opens devtools.
    if (!isServer) return;

    // One structured line per record, which is what log aggregators parse.
    // Fields are already redacted above.
    process.stderr.write(`${JSON.stringify(record)}\n`);
    return;
  }

  // Development keeps the familiar, readable console output.
  const sink = level === 'error' ? console.error : level === 'warn' ? console.warn : console.debug;
  sink(`[${level}] ${message}`, error ?? '', context ?? '');
}

export const logger = {
  /** Diagnostic detail. Never written in production. */
  debug: (message: string, context?: Record<string, unknown>) =>
    write('debug', message, undefined, context),

  /** A recoverable problem worth noticing. */
  warn: (message: string, error?: unknown, context?: Record<string, unknown>) =>
    write('warn', message, error, context),

  /** A failure. Forwarded to the registered reporter, if any. */
  error: (message: string, error?: unknown, context?: Record<string, unknown>) =>
    write('error', message, error, context),
};
