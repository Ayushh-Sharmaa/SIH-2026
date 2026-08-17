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

    const isCollege = isAllowedCollegeEmail(email);
    const whitelisted = await getWhitelistedPortalEntry(email);

    if (!isCollege && !whitelisted) {
      return NextResponse.redirect(new URL('/login?error=domain_not_allowed', request.url));
    }

    if (await isUserBanned(email)) {
      return NextResponse.redirect(new URL('/login?error=account_suspended', request.url));
    }

    const assignedRole = whitelisted?.role || 'STUDENT';
    const { user, token, isOnboarded } = await syncClerkUser(email, clerkUser, assignedRole);

    const redirectPath = user.role === 'ADMIN' ? '/admin' : (isOnboarded ? '/dashboard' : '/onboarding');
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

    const body = await request.json().catch(() => ({}));
    if (!email && typeof body?.email === 'string' && body.email.includes('@')) {
      email = body.email;
    }

    if (!email) {
      return NextResponse.json(
        { error: 'No verified Google session found. Please sign in with Google again.' },
        { status: 401 }
      );
    }

    email = normalizeEmail(email);

    // Hardened rate limiting checks
    const rateLimitResponse = await checkAuthRateLimit(request, email);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Parse/Validate input using Zod Schema
    const parsed = onboardingRoleSchema.safeParse(body);
    const role = parsed.success ? parsed.data.role : 'STUDENT';

    const isCollege = isAllowedCollegeEmail(email);
    const whitelisted = await getWhitelistedPortalEntry(email);

    if (!isCollege && !whitelisted) {
      return NextResponse.json(
        { error: 'Access restricted: Please use your official GL Bajaj email ID or request portal access from an administrator.' },
        { status: 403 }
      );
    }

    if (await isUserBanned(email)) {
      return NextResponse.json(
        { error: 'Account Suspended: Your access has been revoked by the system administrator.' },
        { status: 403 }
      );
    }

    const assignedRole = whitelisted?.role || role;
    const { user, token, isOnboarded } = await syncClerkUser(email, clerkUser, assignedRole);

    const name = user.studentProfile?.name || user.mentorProfile?.name || deriveInitialDisplayName(clerkUser, email);
    const redirectUrl = user.role === 'ADMIN' ? '/admin' : (isOnboarded ? '/dashboard' : '/onboarding');

    const response = NextResponse.json({
      success: true,
      redirectUrl,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name,
        isOnboarded,
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
