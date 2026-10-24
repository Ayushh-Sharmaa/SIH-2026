import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, hashPassword, signToken, normalizeEmail, deriveInitialDisplayName } from '@/lib/auth';
import { isAuthorizedAdminEmail, isUserBanned, stripAdminSuffix } from '@/lib/admin';
import { ensureSandboxUser, parseSandboxRequest } from '@/lib/sandbox';
import { checkAuthRateLimit, recordAuthFailure, recordAuthSuccess } from '@/lib/rateLimit';
import { loginSchema } from '@/lib/validation';
import { logger } from '@/lib/logger';
import { setSessionCookie } from '@/lib/sessionCookie';

function setTokenCookie(response: NextResponse, token: string) {
  setSessionCookie(response.cookies, token);
  return response;
}

const DUMMY_HASH = '$2b$12$C6UzMDM.H6dfI/f/IKcEeO.Aq6M3xM.qXhLvI1nRJKtvXqM5FZ3Xq';

export async function POST(request: Request) {
  let requestEmail: string | undefined;
  try {
    const body = await request.json().catch(() => ({}));
    
    // Parse/Validate input using Zod Schema
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid email or password format.' }, { status: 400 });
    }

    const { email, password } = parsed.data;
    requestEmail = email;

    // Passwordless sandbox access
    const sandboxRole = parseSandboxRequest(email);
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

    const isAdminIntent = /\/admin$/i.test(email);
    const cleanEmail = stripAdminSuffix(email);

    // Hardened rate limiting checks
    const rateLimitResponse = await checkAuthRateLimit(request, cleanEmail);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const [banned, isAuthorizedAdmin, user] = await Promise.all([
      isUserBanned(cleanEmail),
      isAdminIntent ? isAuthorizedAdminEmail(cleanEmail) : Promise.resolve(false),
      prisma.user.findUnique({
        where: { email: normalizeEmail(cleanEmail) },
        include: {
          studentProfile: { select: { name: true, branch: true } },
          mentorProfile: { select: { name: true, designation: true } },
        },
        // clerkId needed to detect OAuth-registered accounts
      }),
    ]);

    if (banned) {
      recordAuthFailure(request, cleanEmail);
      return NextResponse.json(
        { error: 'Account Suspended: Your access has been revoked by the system administrator.' },
        { status: 403 }
      );
    }

    if (isAdminIntent) {
      if (!isAuthorizedAdmin) {
        recordAuthFailure(request, cleanEmail);
        return NextResponse.json(
          { error: 'Access Denied: This email address has not been granted Admin permissions.' },
          { status: 403 }
        );
      }

      if (!user) {
        await comparePassword(password, DUMMY_HASH);
        recordAuthFailure(request, cleanEmail);
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      }

      const isPasswordCorrect = await comparePassword(password, user.passwordHash);
      if (!isPasswordCorrect) {
        recordAuthFailure(request, cleanEmail);
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      }

      // Reset failures on success
      recordAuthSuccess(request, cleanEmail);

      const token = signToken({ userId: user.id, email: cleanEmail, role: 'ADMIN' });

      return setTokenCookie(
        NextResponse.json({
          success: true,
          redirectUrl: '/admin',
          user: {
            id: user.id,
            email: cleanEmail,
            role: 'ADMIN',
            isOnboarded: true,
            name:
              user.studentProfile?.name ||
              user.mentorProfile?.name ||
              'System Administrator',
          },
        }),
        token
      );
    }

    const userCollege = typeof body.college === 'string' && body.college.trim() ? body.college.trim() : undefined;
    const collegeCode = typeof body.collegeCode === 'string' && body.collegeCode.trim() ? body.collegeCode.trim() : undefined;
    const finalCollege = userCollege ? (collegeCode ? `${userCollege} (${collegeCode})` : userCollege) : (collegeCode || undefined);

    if (!user) {
      if (isAdminIntent) {
        await comparePassword(password, DUMMY_HASH);
        recordAuthFailure(request, cleanEmail);
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      }

      // Seamless auto-enrollment for open access
      const passwordHash = await hashPassword(password);
      const displayName = deriveInitialDisplayName(null, cleanEmail);
      const assignedCollege = finalCollege || 'GL Bajaj Group of Institutions, Mathura';

      const newUser = await prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: {
            email: normalizeEmail(cleanEmail),
            passwordHash,
            role: 'STUDENT',
            college: assignedCollege,
          },
        });

        await tx.studentProfile.create({
          data: {
            userId: created.id,
            name: displayName,
            year: '',
            branch: '',
            skills: [],
            languages: [],
            softSkills: [],
          },
        });

        return created;
      });

      recordAuthSuccess(request, cleanEmail);
      const token = signToken({ userId: newUser.id, email: newUser.email, role: 'STUDENT' });

      return setTokenCookie(
        NextResponse.json({
          success: true,
          user: {
            id: newUser.id,
            email: newUser.email,
            role: 'STUDENT',
            name: displayName,
            isOnboarded: false,
            college: assignedCollege,
          },
        }),
        token
      );
    }

    const isPasswordCorrect = await comparePassword(password, user.passwordHash);
    if (!isPasswordCorrect) {
      recordAuthFailure(request, cleanEmail);
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    } else if (finalCollege && user.college !== finalCollege) {
      await prisma.user.update({
        where: { id: user.id },
        data: { college: finalCollege },
      });
    }

    // Reset failures on success
    recordAuthSuccess(request, cleanEmail);

    const name = user.studentProfile?.name || user.mentorProfile?.name || 'User';
    const userRole = user.role === 'ADMIN' ? 'STUDENT' : user.role;
    const isOnboarded =
      userRole === 'STUDENT'
        ? Boolean(user.studentProfile?.branch)
        : Boolean(user.mentorProfile?.designation);
    const token = signToken({ userId: user.id, email: user.email, role: userRole });

    return setTokenCookie(
      NextResponse.json({
        success: true,
        user: { id: user.id, email: user.email, role: userRole, name, isOnboarded, college: finalCollege || user.college },
      }),
      token
    );
  } catch (error) {
    if (requestEmail) {
      recordAuthFailure(request, requestEmail);
    }
    logger.error('Login error', error);
    return NextResponse.json({ error: 'An error occurred during authentication.' }, { status: 500 });
  }
}
