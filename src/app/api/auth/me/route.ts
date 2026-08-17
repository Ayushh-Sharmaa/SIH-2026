import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken, type SessionClaims } from '@/lib/auth';
import { checkPublicRateLimit } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';

import { clearSessionCookie } from '@/lib/sessionCookie';

export async function GET(request: Request) {
  try {
    const rateLimitResponse = await checkPublicRateLimit(request);
    if (rateLimitResponse) return rateLimitResponse;

    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    // Set by /api/admin/view-as while an admin is exploring another dashboard
    const isViewingAs = !!cookieStore.get('admin_token')?.value;

    let decoded: SessionClaims | null = null;
    if (token) {
      decoded = verifyToken(token);
    }

    if (!decoded) {
      return NextResponse.json(
        { authenticated: false },
        {
          status: 200,
          headers: { 'Cache-Control': 'no-store, max-age=0, must-revalidate' },
        }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        studentProfile: {
          select: {
            name: true,
            branch: true,
            year: true,
          },
        },
        mentorProfile: {
          select: {
            name: true,
            designation: true,
            verified: true,
          },
        },
      },
    });

    if (!user) {
      const res = NextResponse.json({ authenticated: false, error: 'User deleted' }, { status: 200 });
      clearSessionCookie(res.cookies);
      return res;
    }

    const profile = user.studentProfile || user.mentorProfile;
    const name = profile?.name || 'User';

    // A user is considered onboarded if they have filled their academic details (Student) or professional details (Mentor)
    let isOnboarded = false;
    if (user.role === 'STUDENT' && user.studentProfile?.branch) {
      isOnboarded = true;
    } else if (user.role === 'MENTOR' && user.mentorProfile?.designation) {
      isOnboarded = true;
    }

    return NextResponse.json(
      {
        authenticated: true,
        isViewingAs,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          name,
          isOnboarded,
          verified: user.mentorProfile?.verified ?? true,
        },
      },
      {
        headers: { 'Cache-Control': 'no-store, max-age=0, must-revalidate' },
      }
    );
  } catch (error) {
    logger.error('Session check error', error);
    return NextResponse.json({ error: 'Failed to verify session' }, { status: 500 });
  }
}
