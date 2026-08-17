import { prisma } from './prisma';
import { normalizeEmail } from './auth';
import { logger } from './logger';

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

/**
 * Lifts a ban.
 *
 * `unbannedBy` mirrors `banUserEmail`'s `bannedBy` and is logged rather than
 * stored: the row is deleted, so there is nowhere on `BannedEmail` to keep it.
 * Without the parameter the admin route's audit argument was a type error, and
 * dropping the argument instead would have silently discarded the only record
 * of who restored the account.
 */
export async function unbanUserEmail(email: string, unbannedBy?: string): Promise<string[]> {
  const clean = normalizeEmail(email);
  await prisma.bannedEmail.deleteMany({ where: { email: clean } });
  logger.warn('Ban lifted', undefined, {
    email: clean,
    unbannedBy: unbannedBy ? normalizeEmail(unbannedBy) : 'unknown',
  });
  return getBannedEmails();
}

export interface WhitelistedPortalUser {
  email: string;
  role: 'STUDENT' | 'MENTOR';
  note: string | null;
  addedBy: string | null;
  createdAt: string;
}

// Safe delegate accessor ensuring IDE language servers and Prisma client agree
// regardless of local IDE TypeScript caching state
interface WhitelistedEmailRow {
  email: string;
  role: string;
  note: string | null;
  addedBy: string | null;
  createdAt: Date;
  updatedAt?: Date;
}

interface WhitelistedEmailDelegate {
  findMany(args?: { orderBy?: { createdAt: 'asc' | 'desc' } }): Promise<WhitelistedEmailRow[]>;
  findUnique(args: { where: { email: string } }): Promise<WhitelistedEmailRow | null>;
  upsert(args: {
    where: { email: string };
    update: { role: string; note: string | null };
    create: { email: string; role: string; note: string | null; addedBy: string | null };
  }): Promise<WhitelistedEmailRow>;
  deleteMany(args: { where: { email: string } }): Promise<{ count: number }>;
  updateMany(args: { where: { email: string }; data: { role: string } }): Promise<{ count: number }>;
}

const getWhitelistedEmailDb = (): WhitelistedEmailDelegate => {
  return (prisma as unknown as { whitelistedEmail: WhitelistedEmailDelegate }).whitelistedEmail;
};

export async function getWhitelistedEmails(): Promise<WhitelistedPortalUser[]> {
  const rows = await getWhitelistedEmailDb().findMany({ orderBy: { createdAt: 'asc' } });
  return rows.map((r: WhitelistedEmailRow) => ({
    email: r.email,
    role: (r.role === 'MENTOR' ? 'MENTOR' : 'STUDENT') as 'STUDENT' | 'MENTOR',
    note: r.note,
    addedBy: r.addedBy,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function getWhitelistedPortalEntry(email: string): Promise<WhitelistedPortalUser | null> {
  const clean = normalizeEmail(email);
  if (!clean) return null;
  const row = await getWhitelistedEmailDb().findUnique({ where: { email: clean } });
  if (!row) return null;
  return {
    email: row.email,
    role: (row.role === 'MENTOR' ? 'MENTOR' : 'STUDENT') as 'STUDENT' | 'MENTOR',
    note: row.note,
    addedBy: row.addedBy,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function isEmailWhitelistedForPortal(email: string): Promise<boolean> {
  const clean = normalizeEmail(email);
  if (!clean) return false;
  const row = await getWhitelistedEmailDb().findUnique({ where: { email: clean } });
  return !!row;
}

export async function addWhitelistedEmail(
  email: string,
  role: 'STUDENT' | 'MENTOR' = 'STUDENT',
  addedBy?: string,
  note?: string
): Promise<WhitelistedPortalUser[]> {
  const clean = normalizeEmail(email);
  if (clean) {
    await getWhitelistedEmailDb().upsert({
      where: { email: clean },
      update: {
        role,
        note: note ?? null,
      },
      create: {
        email: clean,
        role,
        note: note ?? null,
        addedBy: addedBy ? normalizeEmail(addedBy) : null,
      },
    });

    // If user already registered as non-admin, ensure their role is synced
    await prisma.user.updateMany({
      where: { email: clean, role: { not: 'ADMIN' } },
      data: { role },
    });
  }
  return getWhitelistedEmails();
}

export async function removeWhitelistedEmail(email: string): Promise<WhitelistedPortalUser[]> {
  const clean = normalizeEmail(email);
  if (clean) {
    await getWhitelistedEmailDb().deleteMany({ where: { email: clean } });
  }
  return getWhitelistedEmails();
}

export async function updateWhitelistedRole(
  email: string,
  role: 'STUDENT' | 'MENTOR'
): Promise<WhitelistedPortalUser[]> {
  const clean = normalizeEmail(email);
  if (clean) {
    await getWhitelistedEmailDb().updateMany({
      where: { email: clean },
      data: { role },
    });

    await prisma.user.updateMany({
      where: { email: clean, role: { not: 'ADMIN' } },
      data: { role },
    });
  }
  return getWhitelistedEmails();
}
