import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { signToken, verifyToken } from '@/lib/auth';
import { checkUserRateLimit } from '@/lib/rateLimit';
import { adminViewAsSchema } from '@/lib/validation';
import { isAuthorizedAdminEmail } from '@/lib/admin';
import { ensureSandboxUser } from '@/lib/sandbox';
import {
  SESSION_COOKIE,
  setAdminReturnCookie,
  setSessionCookie,
} from '@/lib/sessionCookie';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !(await isAuthorizedAdminEmail(decoded.email))) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Authenticated user rate limit check
    const rateLimitResponse = await checkUserRateLimit(request, decoded.userId);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json().catch(() => ({}));
    
    // Parse/Validate input using Zod Schema
    const parsed = adminViewAsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid preview role request.' }, { status: 400 });
    }

    const targetRole = parsed.data.role;

    const { user, name } = await ensureSandboxUser(targetRole);
    const sandboxToken = signToken({ userId: user.id, email: user.email, role: targetRole });

    const response = NextResponse.json({
      success: true,
      redirectUrl: '/dashboard',
      viewingAs: targetRole,
      user: { id: user.id, email: user.email, role: targetRole, name },
    });

    setAdminReturnCookie(response.cookies, token);
    setSessionCookie(response.cookies, sandboxToken);

    return response;
  } catch (error) {
    logger.error('Admin view-as failed', error);
    return NextResponse.json({ error: 'Failed to switch dashboard view.' }, { status: 500 });
  }
}
