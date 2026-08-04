import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { isAuthorizedAdminEmail } from '@/lib/admin';

/**
 * Restores the admin session parked by /api/admin/view-as.
 */
export async function POST() {
  try {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('admin_token')?.value;

    if (!adminToken) {
      return NextResponse.json({ error: 'No admin session to restore.' }, { status: 400 });
    }

    const decoded = verifyToken(adminToken);
    if (!decoded || !(await isAuthorizedAdminEmail(decoded.email))) {
      // Stale or revoked - clear it out rather than restoring access
      const denied = NextResponse.json({ error: 'Admin session is no longer valid.' }, { status: 403 });
      denied.cookies.delete('admin_token');
      return denied;
    }

    const response = NextResponse.json({ success: true, redirectUrl: '/admin' });

    response.cookies.set('token', adminToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    response.cookies.delete('admin_token');

    return response;
  } catch (error: any) {
    console.error('Admin return error:', error);
    return NextResponse.json({ error: 'Failed to restore admin session.' }, { status: 500 });
  }
}
