import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { signToken, verifyToken } from '@/lib/auth';
import { isAuthorizedAdminEmail } from '@/lib/admin';
import { ensureSandboxUser } from '@/lib/sandbox';

const WEEK = 60 * 60 * 24 * 7;

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: WEEK,
    path: '/',
  };
}

/**
 * Lets an authorized admin drop into the sandbox student or mentor account so
 * they can actually use those dashboards rather than read a static preview.
 *
 * The admin's own token is parked in `admin_token` so they can come back
 * without signing in again (see /api/admin/return).
 */
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !(await isAuthorizedAdminEmail(decoded.email))) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { role } = await request.json().catch(() => ({ role: 'STUDENT' }));
    const targetRole = role === 'MENTOR' ? 'MENTOR' : 'STUDENT';

    const { user, name } = await ensureSandboxUser(targetRole);
    const sandboxToken = signToken({ userId: user.id, email: user.email, role: targetRole });

    const response = NextResponse.json({
      success: true,
      redirectUrl: '/dashboard',
      viewingAs: targetRole,
      user: { id: user.id, email: user.email, role: targetRole, name },
    });

    // Park the admin session so it can be restored later
    response.cookies.set('admin_token', token, cookieOptions());
    response.cookies.set('token', sandboxToken, cookieOptions());

    return response;
  } catch (error: any) {
    console.error('Admin view-as error:', error);
    return NextResponse.json({ error: 'Failed to switch dashboard view.' }, { status: 500 });
  }
}
