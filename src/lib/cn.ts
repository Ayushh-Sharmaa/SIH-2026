/**
 * Joins class names, dropping falsy entries.
 *
 * Deliberately not tailwind-merge: these primitives put caller classes last so
 * they win on specificity ties, and adding a 6kB dependency to solve a problem
 * we do not have would be the wrong trade.
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
