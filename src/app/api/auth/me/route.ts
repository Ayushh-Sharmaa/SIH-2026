import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken, type SessionClaims } from '@/lib/auth';
import { checkPublicRateLimit } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';

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

    // There was an "auto-sync recovery" here: when no session cookie was
    // present, it read the Clerk session and minted a new one on the spot.
    //
    // It made signing out impossible. /api/auth/logout clears this app's cookie
    // but does not end the Clerk session, so the very next call to this
    // endpoint saw a live Clerk user and silently signed the person back in.
    // To the user that reads as "it says I'm logged in when I never logged in",
    // and as a sign-out button that does nothing.
    //
    // Establishing a session is the job of the sign-in routes, which is where
    // it can be done deliberately and visibly. A read-only session check must
    // not have the side effect of creating one.

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
      return NextResponse.json({ authenticated: false }, { status: 200 });
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
