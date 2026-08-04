import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { signToken, verifyToken } from '@/lib/auth';
import { isAuthorizedAdminEmail } from '@/lib/admin';
import { ensureSandboxUser } from '@/lib/sandbox';
import {
  SESSION_COOKIE,
  setAdminReturnCookie,
  setSessionCookie,
} from '@/lib/sessionCookie';
import { logger } from '@/lib/logger';

/** Roles an admin may preview. Anything else falls back to the safer of the two. */
type PreviewableRole = 'STUDENT' | 'MENTOR';

/**
 * Narrows an attacker-controlled request body to a role this endpoint is
 * willing to mint.
 *
 * The previous form was `const { role } = await request.json()` followed by
 * `role === 'MENTOR' ? 'MENTOR' : 'STUDENT'`. That was safe by accident rather
 * than by construction — and it threw a TypeError on a body of `null` or a bare
 * string, since neither can be destructured, turning a malformed request into a
 * 500. Validating the shape first makes both properties explicit.
 */
function parseRequestedRole(body: unknown): PreviewableRole {
  if (typeof body === 'object' && body !== null && 'role' in body) {
    if ((body as { role: unknown }).role === 'MENTOR') return 'MENTOR';
  }
  return 'STUDENT';
}

/**
 * Lets an authorised admin drop into the sandbox student or mentor account, so
 * they can exercise those dashboards rather than read a static preview.
 *
 * Worth being precise about what this is and is not: the target is always a
 * dedicated demo account produced by `ensureSandboxUser`, never a real user's.
 * That is what keeps this out of impersonation territory — it cannot be used to
 * read anyone's private data, so it needs no per-subject audit trail.
 *
 * The admin's own token is parked in a separate cookie so they can return
 * without signing in again. `/api/admin/return` re-authorises that token rather
 * than trusting possession of it.
 */
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !(await isAuthorizedAdminEmail(decoded.email))) {
      // One body for both "no valid token" and "valid but not an admin".
      // Distinguishing them would confirm to a caller that their token is
      // genuine and merely under-privileged.
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // A missing or malformed body is not an error; it just means the default
    // preview. `.catch` handles invalid JSON, `parseRequestedRole` handles JSON
    // that parses but is not the expected shape.
    const targetRole = parseRequestedRole(await request.json().catch(() => null));

    const { user, name } = await ensureSandboxUser(targetRole);
    const sandboxToken = signToken({ userId: user.id, email: user.email, role: targetRole });

    const response = NextResponse.json({
      success: true,
      redirectUrl: '/dashboard',
      viewingAs: targetRole,
      user: { id: user.id, email: user.email, role: targetRole, name },
    });

    // Order matters only for readability; both land in the same response.
    setAdminReturnCookie(response.cookies, token);
    setSessionCookie(response.cookies, sandboxToken);

    return response;
  } catch (error) {
    logger.error('Admin view-as failed', error);
    return NextResponse.json({ error: 'Failed to switch dashboard view.' }, { status: 500 });
  }
}
