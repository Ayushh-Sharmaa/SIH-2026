/**
 * Turning an unknown thrown value into something safe to show a user.
 *
 * A `catch` annotated `any`, followed by `.message || 'fallback'`, appeared 28
 * times across the app. Three problems with that shape:
 *
 * 1. **`any` disables checking for the whole block.** Once `err` is `any`, every
 *    expression derived from it is unchecked too, so a later `err.response.data`
 *    typo compiles and throws at runtime inside the error handler — the one
 *    place that must not throw.
 *
 * 2. **Not everything thrown is an `Error`.** `throw 'nope'` and a rejected
 *    promise carrying a plain object both produce `undefined` from `.message`,
 *    which then renders as the literal string "undefined" in a toast, or falls
 *    through to the fallback for the wrong reason.
 *
 * 3. **It surfaces whatever the message happens to contain.** For errors this
 *    app constructs from an API response that is intended. For an error thrown
 *    by a driver or a parser it is not: those messages carry queries, file
 *    paths and internal identifiers.
 *
 * `userFacingMessage` handles all three: it accepts `unknown`, recognises only
 * shapes it can vouch for, and falls back to caller-supplied copy otherwise.
 */

/**
 * Longest message considered plausible as human-facing copy.
 *
 * Messages this app raises are short sentences written for a user. Driver,
 * parser and network stack traces run far longer. The cutoff is a heuristic,
 * not a guarantee, which is why it fails toward the caller's fallback.
 */
const MAX_USER_FACING_LENGTH = 200;

/**
 * Fragments that mark a message as internal regardless of length. Matched
 * case-insensitively.
 */
const INTERNAL_MESSAGE_MARKERS = [
  'prisma',
  'invalid `prisma',
  'econnrefused',
  'enotfound',
  'etimedout',
  'at async',
  'node_modules',
  '\n', // multi-line means a stack or a query dump, never intentional copy
];

/** True when the value is an `Error` (including subclasses and cross-realm). */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Extracts a message safe to show a user, or returns `fallback`.
 *
 * ```ts
 * catch (err) {
 *   setError(userFacingMessage(err, 'Could not save your profile.'));
 * }
 * ```
 */
export function userFacingMessage(error: unknown, fallback: string): string {
  const raw = isError(error)
    ? error.message
    : // A rejected fetch wrapper sometimes carries `{ error: '...' }` rather
      // than an Error. Read it, but hold it to the same checks below.
      typeof error === 'object' && error !== null && 'message' in error
      ? (error as { message: unknown }).message
      : undefined;

  if (typeof raw !== 'string') return fallback;

  const message = raw.trim();
  if (!message || message.length > MAX_USER_FACING_LENGTH) return fallback;

  const lowered = message.toLowerCase();
  if (INTERNAL_MESSAGE_MARKERS.some((marker) => lowered.includes(marker))) {
    return fallback;
  }

  return message;
}

/**
 * True when the message matches `needle`, used for branching on a known API
 * error ("already exists", and similar).
 *
 * A helper rather than `err.message?.includes(...)` at the call site because
 * that form silently evaluates to `undefined` — and therefore false — whenever
 * the thrown value is not an `Error`, which reads as "no match" rather than
 * "could not tell". Here the same outcome is at least explicit.
 */
export function errorMessageIncludes(error: unknown, needle: string): boolean {
  const message = isError(error) ? error.message : '';
  return message.toLowerCase().includes(needle.toLowerCase());
}
