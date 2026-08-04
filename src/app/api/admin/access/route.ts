import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { addAdminEmail, getAdminEmails, isAuthorizedAdminEmail, removeAdminEmail } from '@/lib/mockDb';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'ADMIN' && !isAuthorizedAdminEmail(decoded.email))) {
      return NextResponse.json({ error: 'Forbidden: Admin permissions required.' }, { status: 403 });
    }

    const body = await request.json();
    const { action, email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Valid email address is required.' }, { status: 400 });
    }

    const targetEmail = email.trim().toLowerCase();

    if (action === 'add') {
      const updatedList = addAdminEmail(targetEmail);
      return NextResponse.json({
        success: true,
        message: `Granted Admin Access to ${targetEmail}`,
        adminEmails: updatedList,
      });
    }

    if (action === 'remove') {
      if (targetEmail === 'tanishk.bansal2025@glbajajgroup.org') {
        return NextResponse.json(
          { error: 'Cannot revoke permissions from Primary Super Admin account.' },
          { status: 400 }
        );
      }
      const updatedList = removeAdminEmail(targetEmail);
      return NextResponse.json({
        success: true,
        message: `Revoked Admin Access from ${targetEmail}`,
        adminEmails: updatedList,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    logger.error('Admin access management error', error);
    return NextResponse.json({ error: 'Failed to update admin permissions.' }, { status: 500 });
  }
}
