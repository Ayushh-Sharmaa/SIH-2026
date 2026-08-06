import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken, signToken } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { setSessionCookie } from '@/lib/sessionCookie';

export async function POST(request: Request) {
  try {
    const { role, registrationKey } = await request.json();
    if (role !== 'STUDENT' && role !== 'MENTOR') {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { studentProfile: true, mentorProfile: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let isUsingDbKey = false;
    if (role === 'MENTOR') {
      const masterKey = 'GLB-MENTOR-MASTER-2026-SECURE';
      let isMentorVerified = false;
      if (registrationKey === masterKey) {
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
        return NextResponse.json({ error: 'invalid_key' }, { status: 400 });
      }
    }

    // Now update the user role and setup/ensure profile is created
    await prisma.$transaction(async (tx) => {
      // 1. Update user role
      await tx.user.update({
        where: { id: user.id },
        data: { role },
      });

      // 2. Manage registration key if DB key is used
      if (role === 'MENTOR' && isUsingDbKey && registrationKey) {
        await tx.mentorRegistrationKey.update({
          where: { key: registrationKey },
          data: { isUsed: true, usedByUserId: user.id },
        });
      }

      // 3. Ensure target profile exists
      if (role === 'STUDENT') {
        if (!user.studentProfile) {
          await tx.studentProfile.create({
            data: {
              userId: user.id,
              name: user.email.split('@')[0] || 'Student User',
              year: '',
              branch: '',
            },
          });
        }
      } else {
        if (!user.mentorProfile) {
          await tx.mentorProfile.create({
            data: {
              userId: user.id,
              name: user.email.split('@')[0] || 'Mentor User',
              designation: '',
              organization: 'GL Bajaj Group of Institutions',
            },
          });
        }
      }
    });

    // Generate new session cookie with updated role!
    const updatedToken = signToken({ userId: user.id, email: user.email, role });
    const response = NextResponse.json({ success: true });
    setSessionCookie(response.cookies, updatedToken);

    return response;
  } catch (error) {
    logger.error('Onboarding role update error', error);
    return NextResponse.json({ error: 'Failed to update onboarding role' }, { status: 500 });
  }
}
