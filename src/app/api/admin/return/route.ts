import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { isAuthorizedAdminEmail } from '@/lib/admin';
import {
  ADMIN_RETURN_COOKIE,
  clearAdminReturnCookie,
  setSessionCookie,
} from '@/lib/sessionCookie';
import { logger } from '@/lib/logger';

/**
 * Restores the admin session parked by `/api/admin/view-as`.
 *
 * The parked token is re-verified and re-authorised rather than trusted on
 * sight. Possession of the cookie is not the grant: an admin whose access was
 * revoked while they were in the sandbox must not be able to walk back into the
 * console just because their old token is still in the jar.
 */
export async function POST() {
  try {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get(ADMIN_RETURN_COOKIE)?.value;

    if (!adminToken) {
      return NextResponse.json({ error: 'No admin session to restore.' }, { status: 400 });
    }

    const decoded = verifyToken(adminToken);
    if (!decoded || !(await isAuthorizedAdminEmail(decoded.email))) {
      const denied = NextResponse.json(
        { error: 'Admin session is no longer valid.' },
        { status: 403 },
      );
      // Must actually expire, not merely be asked to. `cookies.delete(name)`
      // emits no Path, so the browser scoped the expiry to /api/admin while the
      // cookie itself was written at '/' — the two never matched and a revoked
      // admin's token survived here for its full seven days.
      clearAdminReturnCookie(denied.cookies);
      return denied;
    }

    const response = NextResponse.json({ success: true, redirectUrl: '/admin' });
    setSessionCookie(response.cookies, adminToken);
    clearAdminReturnCookie(response.cookies);

    return response;
  } catch (error) {
    logger.error('Admin return failed', error);
    return NextResponse.json({ error: 'Failed to restore admin session.' }, { status: 500 });
  }
}
