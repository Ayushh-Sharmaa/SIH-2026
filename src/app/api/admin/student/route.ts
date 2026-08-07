import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { checkUserRateLimit } from '@/lib/rateLimit';
import { adminStudentActionSchema } from '@/lib/validation';
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

    // Authenticated user rate limit check
    const rateLimitResponse = await checkUserRateLimit(request, decoded.userId);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json().catch(() => ({}));
    
    // Parse/Validate input using Zod Schema
    const parsed = adminStudentActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid parameters format.' }, { status: 400 });
    }

    const { email, action } = parsed.data;
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
      await unbanUserEmail(cleanEmail, decoded.email);
      return NextResponse.json({
        success: true,
        message: `Restored access for ${cleanEmail}. The user can sign in again.`,
      });
    }

    return NextResponse.json({ error: 'Unknown admin student action' }, { status: 400 });
  } catch (error) {
    logger.error('Admin student action error', error);
    return NextResponse.json({ error: 'Failed to process admin action.' }, { status: 500 });
  }
}
