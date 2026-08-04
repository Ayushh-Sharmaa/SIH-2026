/**
 * Sandbox helpers safe to import from client components: no Prisma, no
 * server-only environment access. The server still has the final say on
 * whether the sandbox is enabled (see ENABLE_SANDBOX_ACCOUNT in sandbox.ts).
 */
export const SANDBOX_BASE_EMAIL = 'bantan@bantan0607';

export type SandboxRole = 'STUDENT' | 'MENTOR';

/** Splits "BanTan@BanTan0607/mentor" into its base address and requested role. */
export function parseSandboxInput(rawEmail: string): SandboxRole | null {
  const raw = String(rawEmail ?? '').trim().toLowerCase();
  if (!raw) return null;

  const match = raw.match(/^(.*?)(?:\/(student|mentor))?$/);
  if (!match) return null;

  if (match[1].trim() !== SANDBOX_BASE_EMAIL) return null;

  return match[2] === 'mentor' ? 'MENTOR' : 'STUDENT';
}

/** True when the typed address is the sandbox account, so the UI can skip password checks. */
export function looksLikeSandboxEmail(rawEmail: string): boolean {
  return parseSandboxInput(rawEmail) !== null;
}
