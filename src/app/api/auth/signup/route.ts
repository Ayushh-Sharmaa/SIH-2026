import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { hashPassword, signToken, normalizeEmail, isAllowedCollegeEmail } from '@/lib/auth';
import { isUserBanned } from '@/lib/admin';
import { ensureSandboxUser, parseSandboxRequest } from '@/lib/sandbox';
import { clientIp, createRateLimiter, tooManyRequests } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';
import { setSessionCookie } from '@/lib/sessionCookie';

const bySignupIp = createRateLimiter({ limit: 5, windowMs: 60 * 60_000, prefix: 'signup:ip' });
const MIN_PASSWORD_LENGTH = 8;

export async function POST(request: Request) {
  try {
    const { email: rawEmail, password, role, name, registrationKey } = await request.json();

    if (!rawEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const sandboxRole = parseSandboxRequest(String(rawEmail));
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

    if (!password || !role || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const rateCheck = await bySignupIp(clientIp(request));
    if (!rateCheck.ok) {
      return tooManyRequests(
        rateCheck,
        'Too many accounts created from this connection. Please try again later.'
      );
    }

    if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Please choose a password of at least ${MIN_PASSWORD_LENGTH} characters.` },
        { status: 400 }
      );
    }

    if (role !== 'STUDENT' && role !== 'MENTOR') {
      return NextResponse.json({ error: 'Invalid role specified' }, { status: 400 });
    }

    const email = normalizeEmail(rawEmail);

    if (!isAllowedCollegeEmail(email)) {
      return NextResponse.json({ error: 'Access restricted. Please use your official GL Bajaj email ID.' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists.' }, { status: 400 });
    }

    // A revoked account must not be able to re-register itself back in.
    if (await isUserBanned(email)) {
      return NextResponse.json(
        { error: 'Account Suspended: Your access has been revoked by the system administrator.' },
        { status: 403 }
      );
    }

    const wantsMentorKey = role === 'MENTOR' && typeof registrationKey === 'string' && !!registrationKey;

    if (wantsMentorKey) {
      // Cheap pre-check purely so a mistyped key gets a clear 400 rather than a
      // rolled-back transaction. It is NOT what makes the claim safe -- the
      // authoritative check is the conditional updateMany inside the
      // transaction below.
      const dbKey = await prisma.mentorRegistrationKey.findUnique({
        where: { key: registrationKey },
      });

      if (!dbKey || dbKey.isUsed) {
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
          // Claim the key BEFORE trusting it, with `isUsed: false` in the where
          // clause so the database -- not the application -- decides the winner.
          //
          // Reading the key outside the transaction and writing it inside was a
          // time-of-check/time-of-use race: N concurrent signups with one leaked
          // key all passed the `isUsed` check before any of them performed the
          // write, so a single key minted N verified mentors. `usedByUserId`
          // being @unique did not catch it, because every write targeted the
          // same key row and simply overwrote the previous winner.
          let isMentorVerified = false;

          if (wantsMentorKey) {
            const claimed = await tx.mentorRegistrationKey.updateMany({
              where: { key: registrationKey, isUsed: false },
              data: { isUsed: true, usedByUserId: user.id },
            });

            if (claimed.count !== 1) throw new Error(KEY_TAKEN);
            isMentorVerified = true;
          }

          await tx.mentorProfile.create({
            data: {
              userId: user.id,
              name,
              designation: '',
              organization: '',
              expertise: [],
              verified: isMentorVerified,
              registrationKey: wantsMentorKey ? registrationKey : null,
            },
          });
        }

        return user;
      });
    } catch (error) {
      if (error instanceof Error && error.message === KEY_TAKEN) {
        return NextResponse.json(
          { error: 'Invalid or already used mentor registration key.' },
          { status: 400 }
        );
      }
      throw error;
    }

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
    logger.error('Signup error', error);
    return NextResponse.json({ error: 'An error occurred during registration.' }, { status: 500 });
  }
}
