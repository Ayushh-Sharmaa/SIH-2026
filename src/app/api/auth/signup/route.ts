import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, signToken, normalizeEmail, isAllowedCollegeEmail } from '@/lib/auth';
import { ensureSandboxUser, parseSandboxRequest } from '@/lib/sandbox';
import { clientIp, createRateLimiter, tooManyRequests } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';

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

      sandboxResponse.cookies.set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });

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

    let isMentorVerified = false;
    if (role === 'MENTOR' && registrationKey) {
      const dbKey = await prisma.mentorRegistrationKey.findUnique({
        where: { key: registrationKey },
      });

      if (!dbKey || dbKey.isUsed) {
        return NextResponse.json({ error: 'Invalid or already used mentor registration key.' }, { status: 400 });
      }
      isMentorVerified = true;
    }

    const passwordHash = await hashPassword(password);

    const newUser = await prisma.$transaction(async (tx: any) => {
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
        await tx.mentorProfile.create({
          data: {
            userId: user.id,
            name,
            designation: '',
            organization: '',
            expertise: [],
            verified: isMentorVerified,
            registrationKey: registrationKey || null,
          },
        });

        if (registrationKey) {
          await tx.mentorRegistrationKey.update({
            where: { key: registrationKey },
            data: {
              isUsed: true,
              usedByUserId: user.id,
            },
          });
        }
      }

      return user;
    });

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

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error: any) {
    logger.error('Signup error', error);
    return NextResponse.json({ error: 'An error occurred during registration.' }, { status: 500 });
  }
}
