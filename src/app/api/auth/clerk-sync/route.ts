import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { signToken, normalizeEmail, isAllowedCollegeEmail, deriveInitialDisplayName } from '@/lib/auth';
import { isUserBanned, getWhitelistedPortalEntry } from '@/lib/admin';
import { checkAuthRateLimit } from '@/lib/rateLimit';
import { onboardingRoleSchema } from '@/lib/validation';
import { clerkCircuitBreaker } from '@/lib/circuitBreaker';
import { logger } from '@/lib/logger';
import { setSessionCookie } from '@/lib/sessionCookie';

async function syncClerkUser(
  email: string,
  clerkUser: { firstName?: string | null; lastName?: string | null; fullName?: string | null; username?: string | null } | null,
  defaultRole: 'STUDENT' | 'MENTOR' = 'STUDENT'
) {
  const withProfiles = { studentProfile: true, mentorProfile: true } as const;

  let user = await prisma.user.findUnique({
    where: { email },
    include: withProfiles,
  });

  if (!user) {
    const initialName = deriveInitialDisplayName(clerkUser, email);

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
          name: initialName,
          year: '',
          branch: '',
        },
      });
    } else {
      await prisma.mentorProfile.create({
        data: {
          userId: created.id,
          name: initialName,
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
    let clerkUser: Awaited<ReturnType<typeof currentUser>> = null;
    try {
      clerkUser = await clerkCircuitBreaker.execute(
        () => currentUser(),
        async () => {
          logger.warn('Clerk API circuit breaker tripped open. Falling back.');
          return null;
        }
      );
      email = clerkUser?.emailAddresses?.[0]?.emailAddress;
    } catch (e) {
      logger.error('Clerk currentUser() failed.', e);
    }

    if (!email) {
      return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url));
    }

    email = normalizeEmail(email);

    // Hardened rate limiting checks
    const rateLimitResponse = await checkAuthRateLimit(request, email);
    if (rateLimitResponse) {
      return NextResponse.redirect(new URL('/login?error=rate_limited', request.url));
    }

    if (await isUserBanned(email)) {
      return NextResponse.redirect(new URL('/login?error=account_suspended', request.url));
    }

    const whitelisted = await getWhitelistedPortalEntry(email);
    const assignedRole = whitelisted?.role || 'STUDENT';
    const { token, isOnboarded } = await syncClerkUser(email, clerkUser, assignedRole);

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
    let email: string | undefined;
    let clerkUser: Awaited<ReturnType<typeof currentUser>> = null;
    try {
      clerkUser = await clerkCircuitBreaker.execute(
        () => currentUser(),
        async () => {
          logger.warn('Clerk API circuit breaker tripped open. Falling back.');
          return null;
        }
      );
      email = clerkUser?.emailAddresses?.[0]?.emailAddress;
    } catch (e) {
      logger.error('Clerk currentUser() failed.', e);
    }

    // Allow fallback to body.email when client is authenticated with Clerk in browser
    if (!email && body?.email && typeof body.email === 'string') {
      email = body.email;
    }

    if (!email) {
      return NextResponse.json(
        { error: 'No email found. Please sign in again.' },
        { status: 401 }
      );
    }

    email = normalizeEmail(email);

    // Hardened rate limiting checks
    const rateLimitResponse = await checkAuthRateLimit(request, email);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Parse role safely with default to STUDENT
    let requestedRole: 'STUDENT' | 'MENTOR' = 'STUDENT';
    if (body?.role === 'MENTOR' || body?.role === 'STUDENT') {
      requestedRole = body.role;
    }

    if (await isUserBanned(email)) {
      return NextResponse.json(
        { error: 'Account Suspended: Your access has been revoked by the system administrator.' },
        { status: 403 }
      );
    }

    const whitelisted = await getWhitelistedPortalEntry(email);
    const assignedRole = whitelisted?.role || requestedRole;
    const { user, token, isOnboarded } = await syncClerkUser(email, clerkUser, assignedRole);

    // Store optional college / institution if provided
    const collegeParam = body?.college || body?.collegeCode;
    if (collegeParam && typeof collegeParam === 'string' && collegeParam.trim()) {
      await prisma.user.update({
        where: { id: user.id },
        data: { college: collegeParam.trim() },
      });
    }

    const name = user.studentProfile?.name || user.mentorProfile?.name || deriveInitialDisplayName(clerkUser, email);

    const response = NextResponse.json({
      success: true,
      isOnboarded,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        college: user.college,
        name,
      },
    });

    setSessionCookie(response.cookies, token);

    return response;
  } catch (error) {
    logger.error('Clerk POST sync failed', error);
    return NextResponse.json(
      { error: 'Failed to synchronize user account' },
      { status: 500 }
    );
  }
}
