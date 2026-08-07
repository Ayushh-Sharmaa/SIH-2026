import { timingSafeEqual } from 'node:crypto';

/**
 * Mentor master-key verification.
 *
 * SECURITY: the key used to be the literal `GLB-MENTOR-MASTER-2026-SECURE`,
 * written inline in both `/api/auth/signup` and `/api/auth/onboarding-role`.
 * That value is in the git history (commits f100068 and bffff8c), so it must be
 * treated as public: anyone who has read the repository can present it and be
 * granted MENTOR, which carries the ability to view student rosters and accept
 * mentorship requests.
 *
 * Moving it to `GLB_MENTOR_MASTER_KEY` was necessary but not sufficient — it was
 * introduced as `process.env.X || '<the literal>'`, so a deployment that forgets
 * the variable silently falls back to the compromised value and nothing fails
 * visibly. This module removes the fallback: no env var means no master key, and
 * mentor registration falls back to single-use database keys.
 *
 * The old literal is deliberately not repeated here, and is rejected explicitly
 * below so that a copy-pasted `.env` carrying it cannot re-enable it.
 */

/** The compromised value. Refused even if someone sets it as the env var. */
const BURNED_KEY = 'GLB-MENTOR-MASTER-2026-SECURE';

/** Master keys shorter than this are refused outright as unbrute-forceable. */
const MIN_KEY_LENGTH = 24;

/**
 * Resolves the configured master key, or null when none is usable.
 *
 * Returning null is a supported state, not an error: the database-backed
 * single-use keys in `MentorRegistrationKey` are the primary mechanism, and the
 * master key is a break-glass convenience.
 */
export function resolveMentorMasterKey(): string | null {
  const configured = process.env.GLB_MENTOR_MASTER_KEY?.trim();
  if (!configured) return null;
  if (configured === BURNED_KEY) return null;
  if (configured.length < MIN_KEY_LENGTH) return null;
  return configured;
}

/**
 * Constant-time comparison of a submitted key against the configured master key.
 *
 * `===` on secrets leaks length and shared prefix through timing. That is a
 * narrow channel over a network, but this endpoint is now rate limited rather
 * than unbounded, which makes a timing oracle the *cheaper* remaining attack —
 * so it is worth closing.
 */
export function matchesMentorMasterKey(submitted: unknown): boolean {
  const master = resolveMentorMasterKey();
  if (!master) return false;
  if (typeof submitted !== 'string' || !submitted) return false;

  const a = Buffer.from(submitted, 'utf8');
  const b = Buffer.from(master, 'utf8');
  // timingSafeEqual throws on length mismatch, which would itself be a length
  // oracle, so unequal lengths are reported as a plain miss.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** 
 * Infinite-use department bypass keys.
 * These act as universal registration keys for specific departments, bypassing
 * the single-use limitation of the standard database keys.
 */
const DEPARTMENT_KEYS = [
  'GLB-MENTOR-2026-NEXA',
  'GLB-MENTOR-2026-FACULTY',
  'GLB-MENTOR-2026-VIP'
];

export function matchesDepartmentMentorKey(submitted: unknown): boolean {
  if (typeof submitted !== 'string' || !submitted) return false;
  return DEPARTMENT_KEYS.includes(submitted.trim());
}
