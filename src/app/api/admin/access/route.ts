import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { checkUserRateLimit } from '@/lib/rateLimit';
import { adminAccessSchema } from '@/lib/validation';
import { addAdminEmail, isAuthorizedAdminEmail, removeAdminEmail, SUPER_ADMIN_EMAIL } from '@/lib/admin';
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

    // Authenticated user rate limit check
    const rateLimitResponse = await checkUserRateLimit(request, decoded.userId);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json().catch(() => ({}));
    
    // Parse/Validate input using Zod Schema
    const parsed = adminAccessSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid parameters format.' }, { status: 400 });
    }

    const { action, email } = parsed.data;
    const targetEmail = email.trim().toLowerCase();

    if (action === 'add') {
      const updatedList = await addAdminEmail(targetEmail, decoded.email);
      return NextResponse.json({
        success: true,
        message: `Granted Admin Access to ${targetEmail}`,
        adminEmails: updatedList,
      });
    }

    if (action === 'remove') {
      if (targetEmail === SUPER_ADMIN_EMAIL) {
        return NextResponse.json(
          { error: 'Cannot revoke permissions from Primary Super Admin account.' },
          { status: 400 }
        );
      }
      const updatedList = await removeAdminEmail(targetEmail);
      return NextResponse.json({
        success: true,
        message: `Revoked Admin Access from ${targetEmail}`,
        adminEmails: updatedList,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    logger.error('Admin access management error', error);
    return NextResponse.json({ error: 'Failed to update admin permissions.' }, { status: 500 });
  }
}
