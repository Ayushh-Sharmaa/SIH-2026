import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/auth';

async function syncClerkUser(email: string, defaultRole: 'STUDENT' | 'MENTOR' = 'STUDENT') {
  let user = await prisma.user.findUnique({
    where: { email },
    include: {
      studentProfile: true,
      mentorProfile: true,
    },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        passwordHash: 'clerk_oauth_google_user',
        role: defaultRole,
      },
    });

    if (defaultRole === 'STUDENT') {
      await prisma.studentProfile.create({
        data: {
          userId: user.id,
          name: email.split('@')[0] || 'Student User',
          year: '',
          branch: '',
        },
      });
    } else {
      await prisma.mentorProfile.create({
        data: {
          userId: user.id,
          name: email.split('@')[0] || 'Mentor User',
          designation: '',
          organization: 'GL Bajaj Group of Institutions',
        },
      });
    }

    user = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        studentProfile: true,
        mentorProfile: true,
      },
    });
  }

  const token = signToken({ userId: user!.id, email: user!.email, role: user!.role });

  let isOnboarded = false;
  if (user!.role === 'STUDENT' && user!.studentProfile?.branch) {
    isOnboarded = true;
  } else if (user!.role === 'MENTOR' && user!.mentorProfile?.designation) {
    isOnboarded = true;
  }

  return { user: user!, token, isOnboarded };
}

export async function GET(request: Request) {
  try {
    let email: string | undefined;
    try {
      const clerkUser = await currentUser();
      email = clerkUser?.emailAddresses?.[0]?.emailAddress;
    } catch (e) {
      console.warn('Clerk currentUser check bypassed (keys missing or environment disabled).');
    }

    if (!email) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const { token, isOnboarded } = await syncClerkUser(email);

    const redirectPath = isOnboarded ? '/dashboard' : '/onboarding';
    const response = NextResponse.redirect(new URL(redirectPath, request.url));

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Clerk GET Sync error:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    let email = body.email;

    if (!email) {
      try {
        const clerkUser = await currentUser();
        email = clerkUser?.emailAddresses?.[0]?.emailAddress;
      } catch (e) {
        // Ignore Clerk error if Clerk keys are missing
      }
    }

    const role = body.role || 'STUDENT';

    if (!email) {
      return NextResponse.json(
        { error: 'Please enter your college email address in the input box below to sign up.' },
        { status: 400 }
      );
    }

    const { user, token } = await syncClerkUser(email, role);

    const name = user.studentProfile?.name || user.mentorProfile?.name || email.split('@')[0];

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
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
    console.error('Clerk POST Sync error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to synchronize user account' }, { status: 500 });
  }
}
