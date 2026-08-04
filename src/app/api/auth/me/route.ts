import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken, signToken } from '@/lib/auth';
import { currentUser } from '@clerk/nextjs/server';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    let decoded: any = null;
    if (token) {
      decoded = verifyToken(token);
    }

    // Auto-sync recovery: if custom token cookie is missing but Clerk has a valid Google/OAuth session
    if (!decoded && !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
      try {
        const clerkUser = await currentUser();
        const email = clerkUser?.emailAddresses?.[0]?.emailAddress;
        if (email) {
          let user = await prisma.user.findUnique({
            where: { email },
            include: {
              studentProfile: true,
              mentorProfile: true,
            },
          });

          if (!user) {
            user = await prisma.user.create({
              data: {
                email,
                passwordHash: 'clerk_oauth_google_user',
                role: 'STUDENT',
              },
            });
            await prisma.studentProfile.create({
              data: {
                userId: user.id,
                name: email.split('@')[0] || 'Student User',
                year: '',
                branch: '',
              },
            });
            user = await prisma.user.findUnique({
              where: { id: user.id },
              include: {
                studentProfile: true,
                mentorProfile: true,
              },
            });
          }

          if (user) {
            const newToken = signToken({ userId: user.id, email: user.email, role: user.role });
            decoded = { userId: user.id, email: user.email, role: user.role };

            cookieStore.set('token', newToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'strict',
              maxAge: 60 * 60 * 24 * 7,
              path: '/',
            });
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
