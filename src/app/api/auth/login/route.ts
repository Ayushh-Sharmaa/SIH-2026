import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, signToken } from '@/lib/auth';
import { isAuthorizedAdminEmail, isUserBanned } from '@/lib/mockDb';
import { clientIp, createRateLimiter, tooManyRequests } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';

/**
 * Keyed on IP *and* email. IP alone is spoofable behind an untrusted proxy; email
 * alone lets one host spray the whole user table. Requiring both to stay under
 * budget closes each hole the other leaves.
 */
const byIp = createRateLimiter({ limit: 10, windowMs: 60_000, prefix: 'login:ip' });
const byAccount = createRateLimiter({ limit: 5, windowMs: 15 * 60_000, prefix: 'login:acct' });

/**
 * A bcrypt hash of a value nothing can match.
 *
 * When no account exists we still run a comparison against this, so the response
 * time does not reveal whether the address is registered. Without it the route is
 * an account-enumeration oracle: a miss returns immediately, a hit pays ~200ms of
 * bcrypt. Generated at module load, never used as a real credential.
 */
const DUMMY_HASH = '$2b$12$C6UzMDM.H6dfI/f/IKcEeO.Aq6M3xM.qXhLvI1nRJKtvXqM5FZ3Xq';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const rawEmail = String(email).trim();
    const isAdminIntent = /\/admin$/i.test(rawEmail);
    const cleanEmail = rawEmail.replace(/\/admin$/i, '').toLowerCase().trim();

    // Rate limit before touching the database, so a flood costs us nothing.
    const ipCheck = await byIp(clientIp(request));
    if (!ipCheck.ok) {
      return tooManyRequests(ipCheck, 'Too many sign-in attempts. Please wait a moment and try again.');
    }

    const accountCheck = await byAccount(cleanEmail);
    if (!accountCheck.ok) {
      return tooManyRequests(
        accountCheck,
        'This account has had too many failed sign-in attempts. Please try again in a few minutes.',
      );
    }

    if (isUserBanned(cleanEmail)) {
      return NextResponse.json(
        { error: 'Account Suspended: Your access has been revoked by the system administrator.' },
        { status: 403 }
      );
    }

    const isAuthorizedAdmin = isAuthorizedAdminEmail(cleanEmail);

    // Admin login is ONLY allowed if they explicitly appended /admin in the email field
    if (isAdminIntent) {
      if (!isAuthorizedAdmin) {
        return NextResponse.json(
          { error: 'Access Denied: This email address has not been granted Admin permissions.' },
          { status: 403 }
        );
      }

      // Look up the admin account. `const` now that it is never reassigned —
      // it used to be overwritten by the auto-provisioning branch.
      const user = await prisma.user.findUnique({
        where: { email: cleanEmail },
        include: {
          studentProfile: { select: { name: true } },
          mentorProfile: { select: { name: true } },
        },
      });

      // SECURITY: this used to auto-provision an ADMIN account when none
      // existed, using whatever password was supplied. Combined with the
      // super-admin address being hardcoded in the source, anyone could claim
      // the admin account simply by being first to log in with it. Admin
      // accounts must be created deliberately, never as a side effect of a
      // failed sign-in.
      if (!user) {
        // Burn the same bcrypt cost a real comparison would, so response time
        // does not reveal whether this admin address is registered. Same message
        // and status as a wrong password, for the same reason.
        await comparePassword(password, DUMMY_HASH);
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      }

      const isPasswordCorrect = await comparePassword(password, user.passwordHash);
      if (!isPasswordCorrect) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      }

      // Generate ADMIN Token
      const token = signToken({ userId: user.id, email: cleanEmail, role: 'ADMIN' });
      const response = NextResponse.json({
        success: true,
        redirectUrl: '/admin',
        user: {
          id: user.id,
          email: cleanEmail,
          role: 'ADMIN',
          name: user.studentProfile?.name || user.mentorProfile?.name || 'System Administrator',
        },
      });

      response.cookies.set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });

      return response;
    }

    // Standard Student or Mentor Login
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: {
        studentProfile: { select: { name: true } },
        mentorProfile: { select: { name: true } },
      },
    });

    if (!user) {
      // Equalises response time with the found-user path — see DUMMY_HASH.
      await comparePassword(password, DUMMY_HASH);
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const isPasswordCorrect = await comparePassword(password, user.passwordHash);
    if (!isPasswordCorrect) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const name = user.studentProfile?.name || user.mentorProfile?.name || 'User';
    // If they are an ADMIN in the database but logged in without /admin intent,
    // downgrade their session role to STUDENT so they enter the standard portal.
    const userRole = user.role === 'ADMIN' ? 'STUDENT' : user.role;
    const token = signToken({ userId: user.id, email: user.email, role: userRole });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: userRole,
        name,
      },
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error: any) {
    logger.error('Login error', error);
    return NextResponse.json({ error: 'An error occurred during authentication.' }, { status: 500 });
  }
}
