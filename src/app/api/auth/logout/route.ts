import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { clearAdminReturnCookie, clearSessionCookie } from '@/lib/sessionCookie';

export async function POST() {
  try {
    const response = NextResponse.json({ success: true, message: 'Logged out successfully' });

    clearSessionCookie(response.cookies);

    // Also drop any parked admin session from /api/admin/view-as. Leaving it
    // behind meant an admin who signed out while viewing a sandbox dashboard
    // kept a valid admin JWT in the browser for its full seven days.
    clearAdminReturnCookie(response.cookies);

    return response;
  } catch (error) {
    logger.error('Logout error', error);
    return NextResponse.json({ error: 'An error occurred during logout.' }, { status: 500 });
  }
}
