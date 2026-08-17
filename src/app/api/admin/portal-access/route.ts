import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { checkUserRateLimit } from '@/lib/rateLimit';
import { adminPortalAccessSchema } from '@/lib/validation';
import {
  isAuthorizedAdminEmail,
  addWhitelistedEmail,
  removeWhitelistedEmail,
  updateWhitelistedRole,
  getWhitelistedEmails,
} from '@/lib/admin';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
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

    const rateLimitResponse = await checkUserRateLimit(request, decoded.userId);
    if (rateLimitResponse) return rateLimitResponse;

    const list = await getWhitelistedEmails();
    return NextResponse.json({ success: true, whitelistedEmails: list });
  } catch (error) {
    logger.error('Fetch whitelisted portal emails error', error);
    return NextResponse.json({ error: 'Failed to fetch portal access whitelist.' }, { status: 500 });
  }
}

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

    // Parse & Validate input
    const parsed = adminPortalAccessSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid parameters format.' }, { status: 400 });
    }

    const { action, email, role, note } = parsed.data;
    const targetEmail = email.trim().toLowerCase();

    if (action === 'add') {
      const assignedRole = role === 'MENTOR' ? 'MENTOR' : 'STUDENT';
      const updatedList = await addWhitelistedEmail(targetEmail, assignedRole, decoded.email, note);
      return NextResponse.json({
        success: true,
        message: `Granted ${assignedRole} portal access to ${targetEmail}`,
        whitelistedEmails: updatedList,
      });
    }

    if (action === 'remove') {
      const updatedList = await removeWhitelistedEmail(targetEmail);
      return NextResponse.json({
        success: true,
        message: `Revoked portal access from ${targetEmail}`,
        whitelistedEmails: updatedList,
      });
    }

    if (action === 'update_role') {
      const assignedRole = role === 'MENTOR' ? 'MENTOR' : 'STUDENT';
      const updatedList = await updateWhitelistedRole(targetEmail, assignedRole);
      return NextResponse.json({
        success: true,
        message: `Updated portal role for ${targetEmail} to ${assignedRole}`,
        whitelistedEmails: updatedList,
      });
    }

    return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 });
  } catch (error) {
    logger.error('Admin portal access management error', error);
    return NextResponse.json({ error: 'Failed to update portal access permissions.' }, { status: 500 });
  }
}
