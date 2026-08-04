import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken, signToken, normalizeEmail, isAllowedCollegeEmail, type SessionClaims } from '@/lib/auth';
import { currentUser } from '@clerk/nextjs/server';
import { logger } from '@/lib/logger';
import { setSessionCookie } from '@/lib/sessionCookie';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    // Set by /api/admin/view-as while an admin is exploring another dashboard
    const isViewingAs = !!cookieStore.get('admin_token')?.value;

    let decoded: SessionClaims | null = null;
    if (token) {
      decoded = verifyToken(token);
    }

    // Auto-sync recovery: if custom token cookie is missing but Clerk has a valid Google/OAuth session
    if (!decoded && !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
      try {
        const clerkUser = await currentUser();
        const email = normalizeEmail(clerkUser?.emailAddresses?.[0]?.emailAddress ?? '');
        // Same college-only restriction as email signup, so this recovery path
        // cannot be used to provision an outside Google account.
        if (email && isAllowedCollegeEmail(email)) {
          const withProfiles = { studentProfile: true, mentorProfile: true } as const;

          let user = await prisma.user.findUnique({
            where: { email },
            include: withProfiles,
          });

          if (!user) {
            const created = await prisma.user.create({
              data: {
                email,
                passwordHash: 'clerk_oauth_google_user',
                role: 'STUDENT',
              },
            });
            await prisma.studentProfile.create({
              data: {
                userId: created.id,
                name: email.split('@')[0] || 'Student User',
                year: '',
                branch: '',
              },
            });
            user = await prisma.user.findUnique({
              where: { id: created.id },
              include: withProfiles,
            });
          }

          if (user) {
            const newToken = signToken({ userId: user.id, email: user.email, role: user.role });
            decoded = { userId: user.id, email: user.email, role: user.role };

            setSessionCookie(cookieStore, newToken);
          }
        }
      } catch (err) {
        logger.error('Clerk session auto-sync check failed in me API', err);
      }
    }

    if (!decoded) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
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

    return NextResponse.json({
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
    });
  } catch (error) {
    logger.error('Session check error', error);
    return NextResponse.json({ error: 'Failed to verify session' }, { status: 500 });
  }
}
