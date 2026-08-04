import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { signToken, normalizeEmail, isAllowedCollegeEmail } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { setSessionCookie } from '@/lib/sessionCookie';

async function syncClerkUser(email: string, defaultRole: 'STUDENT' | 'MENTOR' = 'STUDENT') {
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
        role: defaultRole,
      },
    });

    if (defaultRole === 'STUDENT') {
      await prisma.studentProfile.create({
        data: {
          userId: created.id,
          name: email.split('@')[0] || 'Student User',
          year: '',
          branch: '',
        },
      });
    } else {
      await prisma.mentorProfile.create({
        data: {
          userId: created.id,
          name: email.split('@')[0] || 'Mentor User',
          designation: '',
          organization: 'GL Bajaj Group of Institutions',
        },
      });
    }

    user = await prisma.user.findUnique({
      where: { id: created.id },
      include: withProfiles,
    });
  }

  if (!user) {
    throw new Error('Failed to load the synchronized Clerk user.');
  }

  const token = signToken({ userId: user.id, email: user.email, role: user.role });

  let isOnboarded = false;
  if (user.role === 'STUDENT' && user.studentProfile?.branch) {
    isOnboarded = true;
  } else if (user.role === 'MENTOR' && user.mentorProfile?.designation) {
    isOnboarded = true;
  }

  return { user, token, isOnboarded };
}

export async function GET(request: Request) {
  try {
    let email: string | undefined;
    try {
      const clerkUser = await currentUser();
      email = clerkUser?.emailAddresses?.[0]?.emailAddress;
    } catch (e) {
      logger.error('Clerk currentUser() failed.', e);
    }

    if (!email) {
      return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url));
    }

    email = normalizeEmail(email);

    if (!isAllowedCollegeEmail(email)) {
      return NextResponse.redirect(new URL('/login?error=domain_not_allowed', request.url));
    }

    const { token, isOnboarded } = await syncClerkUser(email);

    const redirectPath = isOnboarded ? '/dashboard' : '/onboarding';
    const response = NextResponse.redirect(new URL(redirectPath, request.url));

    setSessionCookie(response.cookies, token);

    return response;
  } catch (error) {
    logger.error('Clerk GET Sync error', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    let email = body.email;

    if (!email) {
      try {
        const clerkUser = await currentUser();
        email = clerkUser?.emailAddresses?.[0]?.emailAddress;
      } catch (e) {
        logger.error('Clerk currentUser() failed.', e);
      }
    }

    const role = body.role || 'STUDENT';

    if (!email) {
      return NextResponse.json(
        { error: 'Please enter your college email address in the input box below to sign up.' },
        { status: 400 }
      );
    }

    email = normalizeEmail(email);

    if (!isAllowedCollegeEmail(email)) {
      return NextResponse.json(
        { error: 'Access restricted. Please use your official GL Bajaj email ID.' },
        { status: 403 }
      );
    }

    const { user, token } = await syncClerkUser(email, role);

    const name = user.studentProfile?.name || user.mentorProfile?.name || email.split('@')[0];

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name,
      },
    });

    setSessionCookie(response.cookies, token);

    return response;
  } catch (error) {
    logger.error('Clerk POST Sync error', error);
    const errMsg = error instanceof Error ? error.message : 'Failed to synchronize user account';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
