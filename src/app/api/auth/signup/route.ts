import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { hashPassword, signToken, normalizeEmail, isAllowedCollegeEmail } from '@/lib/auth';
import { isUserBanned } from '@/lib/admin';
import { ensureSandboxUser, parseSandboxRequest } from '@/lib/sandbox';
import { checkAuthRateLimit, recordAuthFailure, recordAuthSuccess } from '@/lib/rateLimit';
import { matchesMentorMasterKey } from '@/lib/mentorKey';
import { signupSchema } from '@/lib/validation';
import { logger } from '@/lib/logger';
import { setSessionCookie } from '@/lib/sessionCookie';

export async function POST(request: Request) {
  let requestEmail: string | undefined;
  try {
    const body = await request.json().catch(() => ({}));
    
    // Parse/Validate input using Zod Schema
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Missing required fields or invalid format.' }, { status: 400 });
    }

    const { email: rawEmail, password, role, name, registrationKey } = parsed.data;
    requestEmail = rawEmail;

    const sandboxRole = parseSandboxRequest(rawEmail);
    if (sandboxRole) {
      const { user, name: sandboxName, role: resolvedRole } = await ensureSandboxUser(sandboxRole);
      const token = signToken({ userId: user.id, email: user.email, role: resolvedRole });

      const sandboxResponse = NextResponse.json({
        success: true,
        redirectUrl: '/dashboard',
        sandbox: true,
        user: { id: user.id, email: user.email, role: resolvedRole, name: sandboxName },
      });

      setSessionCookie(sandboxResponse.cookies, token);
      return sandboxResponse;
    }

    // Hardened rate limiting checks
    const rateLimitResponse = await checkAuthRateLimit(request, rawEmail);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const email = normalizeEmail(rawEmail);

    if (!isAllowedCollegeEmail(email)) {
      recordAuthFailure(request, email);
      return NextResponse.json({ error: 'Access restricted. Please use your official GL Bajaj email ID.' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      recordAuthFailure(request, email);
      return NextResponse.json({ error: 'User with this email already exists.' }, { status: 400 });
    }

    // A revoked account must not be able to re-register itself back in.
    if (await isUserBanned(email)) {
      recordAuthFailure(request, email);
      return NextResponse.json(
        { error: 'Account Suspended: Your access has been revoked by the system administrator.' },
        { status: 403 }
      );
    }

    let isMentorVerified = false;
    let isUsingDbKey = false;

    if (role === 'MENTOR') {
      if (matchesMentorMasterKey(registrationKey)) {
        isMentorVerified = true;
      } else if (registrationKey) {
        const dbKey = await prisma.mentorRegistrationKey.findUnique({
          where: { key: registrationKey },
        });
        if (dbKey && !dbKey.isUsed) {
          isMentorVerified = true;
          isUsingDbKey = true;
        }
      }

      if (!isMentorVerified) {
        recordAuthFailure(request, email);
        return NextResponse.json({ error: 'Invalid or already used mentor registration key.' }, { status: 400 });
      }
    }

    const passwordHash = await hashPassword(password);

    // Thrown inside the transaction to roll it back when the key was claimed by
    // a concurrent request between the pre-check and the write.
    const KEY_TAKEN = 'MENTOR_KEY_ALREADY_CLAIMED';

    let newUser;
    try {
      newUser = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const user = await tx.user.create({
          data: {
            email,
            passwordHash,
            role,
          },
        });

        if (role === 'STUDENT') {
          await tx.studentProfile.create({
            data: {
              userId: user.id,
              name,
              year: '',
              branch: '',
              skills: [],
              languages: [],
              softSkills: [],
            },
          });
        } else {
          if (isUsingDbKey && registrationKey) {
            const claimed = await tx.mentorRegistrationKey.updateMany({
              where: { key: registrationKey, isUsed: false },
              data: { isUsed: true, usedByUserId: user.id },
            });

            if (claimed.count !== 1) throw new Error(KEY_TAKEN);
          }

          await tx.mentorProfile.create({
            data: {
              userId: user.id,
              name,
              designation: '',
              organization: 'GL Bajaj Group of Institutions',
              expertise: [],
              verified: isMentorVerified,
            },
          });
        }

        return user;
      });
    } catch (error) {
      recordAuthFailure(request, email);
      if (error instanceof Error && error.message === KEY_TAKEN) {
        return NextResponse.json(
          { error: 'Invalid or already used mentor registration key.' },
          { status: 400 }
        );
      }
      throw error;
    }

    // Reset failures on success
    recordAuthSuccess(request, email);

    const token = signToken({ userId: newUser.id, email: newUser.email, role: newUser.role });

    const response = NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        name,
      },
    });

    setSessionCookie(response.cookies, token);

    return response;
  } catch (error) {
    if (requestEmail) {
      recordAuthFailure(request, requestEmail);
    }
    logger.error('Signup error', error);
    return NextResponse.json({ error: 'An error occurred during registration.' }, { status: 500 });
  }
}
