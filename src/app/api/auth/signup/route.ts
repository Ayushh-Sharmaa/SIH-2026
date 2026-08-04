import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, signToken } from '@/lib/auth';
import { clientIp, createRateLimiter, tooManyRequests } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';

const ALLOWED_DOMAINS = ['glbajaj.org', 'glbajajgroup.org'];

/**
 * Account creation is expensive (a bcrypt hash at cost 12) and is the obvious
 * lever for filling the database with junk rows. Tighter than the login limit,
 * because a legitimate user signs up once.
 */
const bySignupIp = createRateLimiter({ limit: 5, windowMs: 60 * 60_000, prefix: 'signup:ip' });

/** Minimum that resists offline cracking if the table is ever dumped. */
const MIN_PASSWORD_LENGTH = 8;

export async function POST(request: Request) {
  try {
    const { email, password, role, name, registrationKey } = await request.json();

    if (!email || !password || !role || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const rateCheck = await bySignupIp(clientIp(request));
    if (!rateCheck.ok) {
      return tooManyRequests(
        rateCheck,
        'Too many accounts created from this connection. Please try again later.',
      );
    }

    if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Please choose a password of at least ${MIN_PASSWORD_LENGTH} characters.` },
        { status: 400 },
      );
    }

    if (role !== 'STUDENT' && role !== 'MENTOR') {
      return NextResponse.json({ error: 'Invalid role specified' }, { status: 400 });
    }

    // 1. Email domain check
    const emailDomain = email.split('@')[1]?.toLowerCase();
    if (!ALLOWED_DOMAINS.includes(emailDomain)) {
      return NextResponse.json({ error: 'Access restricted. Please use your official GL Bajaj email ID.' }, { status: 400 });
    }

    // 2. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists.' }, { status: 400 });
    }

    // 3. Validation for Mentors Key if provided
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

    // 4. Hash password
    const passwordHash = await hashPassword(password);

    // 5. Create user and profile in a transaction
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

    // 6. Generate token and set cookie
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
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    logger.error('Signup error', error);
    return NextResponse.json({ error: 'An error occurred during registration.' }, { status: 500 });
  }
}
