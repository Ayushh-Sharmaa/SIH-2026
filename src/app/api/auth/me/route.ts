import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        studentProfile: {
          select: {
            name: true,
            branch: true,
            year: true,
          },
        },
        mentorProfile: {
          select: {
            name: true,
            designation: true,
            verified: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    const profile = user.studentProfile || user.mentorProfile;
    const name = profile?.name || 'User';

    // A user is considered onboarded if they have filled their academic details (Student) or professional details (Mentor)
    let isOnboarded = false;
    if (user.role === 'STUDENT' && user.studentProfile?.branch) {
      isOnboarded = true;
    } else if (user.role === 'MENTOR' && user.mentorProfile?.designation) {
      isOnboarded = true;
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name,
        isOnboarded,
        verified: user.mentorProfile?.verified ?? true,
      },
    });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json({ error: 'Failed to verify session' }, { status: 500 });
  }
}
