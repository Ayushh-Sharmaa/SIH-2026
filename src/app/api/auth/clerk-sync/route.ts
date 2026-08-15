import { NextResponse } from 'next/server';
import { auth, currentUser, clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { signToken, normalizeEmail, isAllowedCollegeEmail } from '@/lib/auth';
import { isUserBanned } from '@/lib/admin';
import { checkAuthRateLimit } from '@/lib/rateLimit';
import { onboardingRoleSchema } from '@/lib/validation';
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

import { verifyToken } from '@clerk/backend';

async function resolveClerkEmail(request?: Request): Promise<string | undefined> {
  let userId: string | undefined;

  // 1. Check Authorization Bearer header from client
  const authHeader = request?.headers?.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const bearerToken = authHeader.replace('Bearer ', '').trim();
    try {
      const verified = await verifyToken(bearerToken, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });
      if (verified?.sub) {
        userId = verified.sub;
        if (typeof (verified as Record<string, unknown>)?.email === 'string') {
          return (verified as Record<string, unknown>).email as string;
        }
      }
    } catch (err) {
      logger.warn('Clerk Bearer token verification failed.', err);
    }
  }

  // 2. Check Next.js auth() context
  try {
    const authState = await auth();
    if (!userId) {
      userId = authState?.userId ?? undefined;
    }
    const claims = authState?.sessionClaims as Record<string, unknown> | null;
    if (typeof claims?.email === 'string' && claims.email) {
      return claims.email;
    }
    if (typeof claims?.email_address === 'string' && claims.email_address) {
      return claims.email_address;
    }
  } catch (err) {
    logger.warn('Clerk auth() resolution failed.', err);
  }

  // 3. If we resolved userId, fetch directly from Clerk backend SDK
  if (userId) {
    try {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      const email =
        user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ||
        user.emailAddresses[0]?.emailAddress;
      if (email) return email;
    } catch (e) {
      logger.warn('Clerk client getUser() failed.', e);
    }
  }

  // 4. Fallback to currentUser()
  try {
    const clerkUser = await currentUser();
    const email =
      clerkUser?.emailAddresses?.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress ||
      clerkUser?.emailAddresses?.[0]?.emailAddress;
    if (email) return email;
  } catch (e) {
    logger.error('Clerk currentUser() failed.', e);
  }

  return undefined;
}

export async function GET(request: Request) {
  try {
    let email = await resolveClerkEmail(request);

    if (!email) {
      return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url));
    }

    email = normalizeEmail(email);

    // Hardened rate limiting checks
    const rateLimitResponse = await checkAuthRateLimit(request, email);
    if (rateLimitResponse) {
      return NextResponse.redirect(new URL('/login?error=rate_limited', request.url));
    }

    if (!isAllowedCollegeEmail(email)) {
      return NextResponse.redirect(new URL('/login?error=domain_not_allowed', request.url));
    }

    if (await isUserBanned(email)) {
      return NextResponse.redirect(new URL('/login?error=account_suspended', request.url));
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
    // The email MUST come from the verified Clerk session and nothing else.
    let email = await resolveClerkEmail(request);

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

    const body = await request.json().catch(() => ({}));
    
    // Parse/Validate input using Zod Schema
    const parsed = onboardingRoleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid sync parameter formats.' }, { status: 400 });
    }

    const { role } = parsed.data;

    if (!isAllowedCollegeEmail(email)) {
      return NextResponse.json(
        { error: 'Access restricted. Please use your official GL Bajaj email ID.' },
        { status: 403 }
      );
    }

    if (await isUserBanned(email)) {
      return NextResponse.json(
        { error: 'Account Suspended: Your access has been revoked by the system administrator.' },
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
    logger.error('Clerk POST sync failed', error);
    return NextResponse.json(
      { error: 'Failed to synchronize user account' },
      { status: 500 }
    );
  }
}
