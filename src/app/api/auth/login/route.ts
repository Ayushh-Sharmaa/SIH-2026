import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, hashPassword, signToken, normalizeEmail } from '@/lib/auth';
import { isAuthorizedAdminEmail, isUserBanned, stripAdminSuffix } from '@/lib/admin';
import { ensureSandboxUser, parseSandboxRequest } from '@/lib/sandbox';
import { clientIp, createRateLimiter, tooManyRequests } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';
import { setSessionCookie } from '@/lib/sessionCookie';

function setTokenCookie(response: NextResponse, token: string) {
  setSessionCookie(response.cookies, token);
  return response;
}

const byIp = createRateLimiter({ limit: 10, windowMs: 60_000, prefix: 'login:ip' });
const byAccount = createRateLimiter({ limit: 5, windowMs: 15 * 60_000, prefix: 'login:acct' });

const DUMMY_HASH = '$2b$12$C6UzMDM.H6dfI/f/IKcEeO.Aq6M3xM.qXhLvI1nRJKtvXqM5FZ3Xq';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const rawEmail = String(email).trim();

    // Passwordless sandbox access
    const sandboxRole = parseSandboxRequest(rawEmail);
    if (sandboxRole) {
      const { user, name, role } = await ensureSandboxUser(sandboxRole);
      const token = signToken({ userId: user.id, email: user.email, role });

      return setTokenCookie(
        NextResponse.json({
          success: true,
          redirectUrl: '/dashboard',
          sandbox: true,
          user: { id: user.id, email: user.email, role, name },
        }),
        token
      );
    }

    if (!password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const isAdminIntent = /\/admin$/i.test(rawEmail);
    const cleanEmail = stripAdminSuffix(rawEmail);

    const ipCheck = await byIp(clientIp(request));
    if (!ipCheck.ok) {
      return tooManyRequests(ipCheck, 'Too many sign-in attempts. Please wait a moment and try again.');
    }

    const accountCheck = await byAccount(cleanEmail);
    if (!accountCheck.ok) {
      return tooManyRequests(
        accountCheck,
        'This account has had too many failed sign-in attempts. Please try again in a few minutes.'
      );
    }

    if (await isUserBanned(cleanEmail)) {
      return NextResponse.json(
        { error: 'Account Suspended: Your access has been revoked by the system administrator.' },
        { status: 403 }
      );
    }

    const isAuthorizedAdmin = await isAuthorizedAdminEmail(cleanEmail);

    if (isAdminIntent) {
      if (!isAuthorizedAdmin) {
        return NextResponse.json(
          { error: 'Access Denied: This email address has not been granted Admin permissions.' },
          { status: 403 }
        );
      }

      let user = await prisma.user.findUnique({
        where: { email: cleanEmail },
        include: {
          studentProfile: { select: { name: true } },
          mentorProfile: { select: { name: true } },
        },
      });

      if (!user) {
        await comparePassword(password, DUMMY_HASH);
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      }

      const isPasswordCorrect = await comparePassword(password, user.passwordHash);
      if (!isPasswordCorrect) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      }

      const token = signToken({ userId: user.id, email: cleanEmail, role: 'ADMIN' });

      return setTokenCookie(
        NextResponse.json({
          success: true,
          redirectUrl: '/admin',
          user: {
            id: user.id,
            email: cleanEmail,
            role: 'ADMIN',
            name:
              user.studentProfile?.name ||
              user.mentorProfile?.name ||
              'System Administrator',
          },
        }),
        token
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizeEmail(cleanEmail) },
      include: {
        studentProfile: { select: { name: true } },
        mentorProfile: { select: { name: true } },
      },
    });

    if (!user) {
      await comparePassword(password, DUMMY_HASH);
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const isPasswordCorrect = await comparePassword(password, user.passwordHash);
    if (!isPasswordCorrect) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const name = user.studentProfile?.name || user.mentorProfile?.name || 'User';
    const userRole = user.role === 'ADMIN' ? 'STUDENT' : user.role;
    const token = signToken({ userId: user.id, email: user.email, role: userRole });

    return setTokenCookie(
      NextResponse.json({
        success: true,
        user: { id: user.id, email: user.email, role: userRole, name },
      }),
      token
    );
  } catch (error) {
    logger.error('Login error', error);
    return NextResponse.json({ error: 'An error occurred during authentication.' }, { status: 500 });
  }
}
