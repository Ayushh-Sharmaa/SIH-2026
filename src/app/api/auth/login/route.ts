import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, hashPassword, signToken, normalizeEmail } from '@/lib/auth';
import { isAuthorizedAdminEmail, isUserBanned, stripAdminSuffix } from '@/lib/admin';
import { ensureSandboxUser, parseSandboxRequest } from '@/lib/sandbox';

function setTokenCookie(response: NextResponse, token: string) {
  response.cookies.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
  return response;
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const rawEmail = String(email).trim();

    // --- Passwordless sandbox access (BanTan@BanTan0607[/student|/mentor]) ---
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

    if (await isUserBanned(cleanEmail)) {
      return NextResponse.json(
        { error: 'Account Suspended: Your access has been revoked by the system administrator.' },
        { status: 403 }
      );
    }

    const isAuthorizedAdmin = await isAuthorizedAdminEmail(cleanEmail);

    // Admin login is ONLY allowed when /admin is explicitly appended to the
    // email, so the console stays hidden from the public sign-in form.
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
        // Automatically provision the Admin account on first sign-in
        const passHash = await hashPassword(password);
        const created = await prisma.user.create({
          data: { email: cleanEmail, passwordHash: passHash, role: 'ADMIN' },
        });
        user = await prisma.user.findUnique({
          where: { id: created.id },
          include: {
            studentProfile: { select: { name: true } },
            mentorProfile: { select: { name: true } },
          },
        });
      } else {
        const isPasswordCorrect = await comparePassword(password, user.passwordHash);
        if (!isPasswordCorrect) {
          return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
        }
      }

      const token = signToken({ userId: user!.id, email: cleanEmail, role: 'ADMIN' });

      return setTokenCookie(
        NextResponse.json({
          success: true,
          redirectUrl: '/admin',
          user: {
            id: user!.id,
            email: cleanEmail,
            role: 'ADMIN',
            name:
              user!.studentProfile?.name ||
              user!.mentorProfile?.name ||
              'System Administrator',
          },
        }),
        token
      );
    }

    // Standard Student or Mentor Login
    const user = await prisma.user.findUnique({
      where: { email: normalizeEmail(cleanEmail) },
      include: {
        studentProfile: { select: { name: true } },
        mentorProfile: { select: { name: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const isPasswordCorrect = await comparePassword(password, user.passwordHash);
    if (!isPasswordCorrect) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const name = user.studentProfile?.name || user.mentorProfile?.name || 'User';

    // An ADMIN signing in without the /admin suffix enters the standard portal,
    // so their session role is downgraded for this login.
    const userRole = user.role === 'ADMIN' ? 'STUDENT' : user.role;
    const token = signToken({ userId: user.id, email: user.email, role: userRole });

    return setTokenCookie(
      NextResponse.json({
        success: true,
        user: { id: user.id, email: user.email, role: userRole, name },
      }),
      token
    );
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'An error occurred during authentication.' }, { status: 500 });
  }
}
