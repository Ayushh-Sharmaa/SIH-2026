/**
 * Boundary validation for request bodies.
 *
 * Prisma will happily persist a five-megabyte string or a thousand-element
 * array, so "the query succeeded" is not the same as "the input was sane".
 * These helpers cap what reaches the database.
 */

/** Longest single free-text field: bios, descriptions, request messages. */
export const MAX_TEXT = 2_000;
/** Longest short field: names, roll numbers, designations, URLs. */
export const MAX_SHORT = 200;
/** Most elements accepted in a tag array (skills, languages, soft skills). */
export const MAX_TAGS = 30;

/**
 * Trims and length-caps a required string, returning null when the value is
 * absent or not a string at all. A caller passing `{name: {}}` must get a 400,
 * not a Prisma type error surfacing as a 500.
 */
export function requiredText(value: unknown, max = MAX_SHORT): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > max) return null;
  return trimmed;
}

/** As `requiredText`, but an absent value is legal and yields null. */
export function optionalText(value: unknown, max = MAX_SHORT): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > max) return null;
  return trimmed;
}

/**
 * Normalises a tag array: drops non-strings, trims, removes blanks and
 * duplicates, caps element length and array size. Always returns an array, so
 * a malformed value degrades to empty rather than throwing.
 */
export function tagArray(value: unknown, max = MAX_TAGS): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  for (const item of value) {
    if (typeof item !== 'string') continue;
    const trimmed = item.trim();
    if (!trimmed || trimmed.length > MAX_SHORT) continue;
    seen.add(trimmed);
    if (seen.size >= max) break;
  }
  return [...seen];
}

/**
 * Accepts only http(s) URLs.
 *
 * The scheme allowlist is the point: `javascript:` and `data:` URLs reach the
 * DOM as `href` values on profile links. React blocks `javascript:` hrefs
 * today, but that is a framework implementation detail — the day a URL is
 * rendered outside React, or passed to `window.open`, it becomes a live XSS
 * vector. Rejecting at the boundary means the stored value is never dangerous
 * in the first place.
 */
export function safeUrl(value: unknown): string | null {
  const raw = optionalText(value, MAX_SHORT);
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

/** Clamps an integer to a range, returning null when it isn't one. */
export function boundedInt(value: unknown, min: number, max: number): number | null {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(n) || n < min || n > max) return null;
  return n;
}

/**
 * Base64 image data URI, as produced by the onboarding avatar FileReader.
 *
 * The 1.5 MB ceiling in the onboarding form is a client-side courtesy — it
 * lives in the browser and anyone can POST straight past it. Enforcing the size
 * here is what actually stops an unbounded blob landing in a Postgres row that
 * every roster query then reads. The cap is base64-inflated (~4/3 of the raw
 * bytes) so it matches the same 1.5 MB source file.
 */
const MAX_AVATAR_CHARS = Math.ceil(1_500_000 * 1.37);
const AVATAR_PATTERN = /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/]+=*$/;

/**
 * The one remote host allowed through: Google serves OAuth profile photos from
 * `*.googleusercontent.com`, and the Clerk sign-in flow stores that URL directly.
 *
 * Matched as a dot-anchored suffix, or the apex itself. A bare
 * `endsWith('googleusercontent.com')` also accepts
 * `evilgoogleusercontent.com` — an attacker-registrable domain — which would
 * let a crafted PATCH point every viewer's avatar at a host they control.
 */
const AVATAR_HOST = 'googleusercontent.com';

function isAllowedAvatarHost(hostname: string): boolean {
  return hostname === AVATAR_HOST || hostname.endsWith(`.${AVATAR_HOST}`);
}

export function avatarDataUri(value: unknown): string | null {
  if (typeof value !== 'string' || !value) return null;
  // `http:`/`https:` is a terminal branch: a remote URL is either an allowed
  // host or rejected. Previously a failed hostname check fell through to the
  // data-URI test below, which a URL can never satisfy — so the rejection
  // happened to hold, but only by accident. Returning here makes it explicit
  // and keeps a future edit to AVATAR_PATTERN from reopening the hole.
  if (value.startsWith('http://') || value.startsWith('https://')) {
    try {
      const parsed = new URL(value);
      // Plaintext http: would break the page's upgrade-insecure-requests CSP
      // and strip the transport guarantee the avatar arrived with.
      if (parsed.protocol !== 'https:') return null;
      return isAllowedAvatarHost(parsed.hostname) ? value : null;
    } catch {
      return null;
    }
  }
  if (value.length > MAX_AVATAR_CHARS) return null;
  if (!AVATAR_PATTERN.test(value)) return null;
  return value;
}
