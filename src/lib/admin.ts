import { prisma } from './prisma';
import { normalizeEmail } from './auth';

/**
 * The one account that can never be removed and always has admin rights.
 * Everyone else must be granted access by an existing admin, and that grant
 * lives in the AdminEmail table (previously a JSON file, which silently
 * discarded every write on Vercel's read-only filesystem).
 */
export const SUPER_ADMIN_EMAIL = 'tanishk.bansal2025@glbajajgroup.org';

/** Users may type "<email>/admin" in the login box to signal admin intent. */
export function stripAdminSuffix(email: string): string {
  return normalizeEmail(String(email ?? '').replace(/\/admin$/i, ''));
}

export function isSuperAdmin(email: string): boolean {
  return stripAdminSuffix(email) === SUPER_ADMIN_EMAIL;
}

/** Super admin first, then granted admins in insertion order. */
export async function getAdminEmails(): Promise<string[]> {
  const rows = await prisma.adminEmail.findMany({ orderBy: { createdAt: 'asc' } });
  const granted = rows
    .map((r: { email: string }) => r.email)
    .filter((e: string) => e !== SUPER_ADMIN_EMAIL);
  return [SUPER_ADMIN_EMAIL, ...granted];
}

export async function isAuthorizedAdminEmail(email: string): Promise<boolean> {
  const clean = stripAdminSuffix(email);
  if (!clean) return false;
  if (clean === SUPER_ADMIN_EMAIL) return true;

  const row = await prisma.adminEmail.findUnique({ where: { email: clean } });
  return !!row;
}

export async function addAdminEmail(email: string, addedBy?: string): Promise<string[]> {
  const clean = normalizeEmail(email);
  if (clean && clean !== SUPER_ADMIN_EMAIL) {
    await prisma.adminEmail.upsert({
      where: { email: clean },
      update: {},
      create: { email: clean, addedBy: addedBy ? normalizeEmail(addedBy) : null },
    });

    // Promote the account immediately if it already exists
    await prisma.user.updateMany({ where: { email: clean }, data: { role: 'ADMIN' } });
  }
  return getAdminEmails();
}

export async function removeAdminEmail(email: string): Promise<string[]> {
  const clean = normalizeEmail(email);

  // The super admin is intentionally irrevocable
  if (clean === SUPER_ADMIN_EMAIL) {
    return getAdminEmails();
  }

  await prisma.adminEmail.deleteMany({ where: { email: clean } });
  await prisma.user.updateMany({
    where: { email: clean, role: 'ADMIN' },
    data: { role: 'STUDENT' },
  });

  return getAdminEmails();
}

export async function getBannedEmails(): Promise<string[]> {
  const rows = await prisma.bannedEmail.findMany({ orderBy: { createdAt: 'asc' } });
  return rows.map((r: { email: string }) => r.email);
}

export async function isUserBanned(email: string): Promise<boolean> {
  const clean = normalizeEmail(email);
  if (!clean) return false;
  const row = await prisma.bannedEmail.findUnique({ where: { email: clean } });
  return !!row;
}

export async function banUserEmail(
  email: string,
  bannedBy?: string,
  reason?: string
): Promise<string[]> {
  const clean = normalizeEmail(email);

  // Never allow the platform owner to be locked out
  if (clean && clean !== SUPER_ADMIN_EMAIL) {
    await prisma.bannedEmail.upsert({
      where: { email: clean },
      update: { reason: reason ?? null },
      create: {
        email: clean,
        reason: reason ?? null,
        bannedBy: bannedBy ? normalizeEmail(bannedBy) : null,
      },
    });
  }
  return getBannedEmails();
}

export async function unbanUserEmail(email: string): Promise<string[]> {
  const clean = normalizeEmail(email);
  await prisma.bannedEmail.deleteMany({ where: { email: clean } });
  return getBannedEmails();
}
