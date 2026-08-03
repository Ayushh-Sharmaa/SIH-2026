import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, hashPassword, signToken } from '@/lib/auth';
import { isAuthorizedAdminEmail, isUserBanned } from '@/lib/mockDb';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const rawEmail = String(email).trim();
    const isAdminIntent = /\/admin$/i.test(rawEmail);
    const cleanEmail = rawEmail.replace(/\/admin$/i, '').toLowerCase().trim();

    if (isUserBanned(cleanEmail)) {
      return NextResponse.json(
        { error: 'Account Suspended: Your access has been revoked by the system administrator.' },
        { status: 403 }
      );
    }

    const isAuthorizedAdmin = isAuthorizedAdminEmail(cleanEmail);

    // If user attempted admin login via /admin shortcut or authorized admin email
    if (isAdminIntent || isAuthorizedAdmin) {
      if (!isAuthorizedAdmin) {
        return NextResponse.json(
          { error: 'Access Denied: This email address has not been granted Admin permissions.' },
          { status: 403 }
        );
      }

      // Check if admin user account exists
      let user = await prisma.user.findUnique({
        where: { email: cleanEmail },
        include: {
          studentProfile: { select: { name: true } },
          mentorProfile: { select: { name: true } },
        },
      });

      if (!user) {
        // Automatically provision Admin User account
        const passHash = await hashPassword(password);
        user = await prisma.user.create({
          data: {
            email: cleanEmail,
            passwordHash: passHash,
            role: 'ADMIN',
          },
        });
      } else {
        const isPasswordCorrect = await comparePassword(password, user.passwordHash);
        if (!isPasswordCorrect) {
          return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
        }
      }

      // Generate ADMIN Token
      const token = signToken({ userId: user.id, email: cleanEmail, role: 'ADMIN' });
      const response = NextResponse.json({
        success: true,
        redirectUrl: '/admin',
        user: {
          id: user.id,
          email: cleanEmail,
          role: 'ADMIN',
          name: user.studentProfile?.name || user.mentorProfile?.name || 'System Administrator',
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
    }

    // Standard Student or Mentor Login
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
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
    const userRole = user.role;
    const token = signToken({ userId: user.id, email: user.email, role: userRole });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: userRole,
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
    console.error('Login error:', error);
    return NextResponse.json({ error: 'An error occurred during authentication.' }, { status: 500 });
  }
}
