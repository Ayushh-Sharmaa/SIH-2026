import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { clearSessionCookie } from '@/lib/sessionCookie';

export async function POST() {
  try {
    const response = NextResponse.json({ success: true, message: 'Logged out successfully' });

    // Clear token cookie
    clearSessionCookie(response.cookies);

    return response;
  } catch (error) {
    logger.error('Logout error', error);
    return NextResponse.json({ error: 'An error occurred during logout.' }, { status: 500 });
  }
}
