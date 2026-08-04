import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { banUserEmail, isAuthorizedAdminEmail, unbanUserEmail, SUPER_ADMIN_EMAIL } from '@/lib/admin';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !(await isAuthorizedAdminEmail(decoded.email))) {
      return NextResponse.json({ error: 'Forbidden: Admin permissions required.' }, { status: 403 });
    }

    const { email, action } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Student email is required.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (action === 'ban' || action === 'remove') {
      if (cleanEmail === SUPER_ADMIN_EMAIL) {
        return NextResponse.json({ error: 'Cannot ban Super Admin account.' }, { status: 400 });
      }
      await banUserEmail(cleanEmail, decoded.email);
      return NextResponse.json({
        success: true,
        message: `Suspended access for ${cleanEmail}. The user will be blocked from signing in.`,
      });
    }

    if (action === 'restore' || action === 'unban') {
      await unbanUserEmail(cleanEmail);
      return NextResponse.json({
        success: true,
        message: `Restored access for ${cleanEmail}. The user can now sign in normally.`,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    logger.error('Admin student update error', error);
    return NextResponse.json({ error: 'Failed to update student access.' }, { status: 500 });
  }
}
