import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signToken, normalizeEmail, isAllowedCollegeEmail } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { setSessionCookie } from '@/lib/sessionCookie';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const stateStr = searchParams.get('state');

    if (!code) {
      return NextResponse.redirect(new URL('/login?error=oauth_no_code', request.url));
    }

    let role: 'STUDENT' | 'MENTOR' = 'STUDENT';
    if (stateStr) {
      try {
        const parsed = JSON.parse(stateStr);
        if (parsed.role === 'MENTOR') {
          role = 'MENTOR';
        }
      } catch {}
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/google/callback`;

    if (!clientId || !clientSecret) {
      logger.error('Google client ID or secret is not configured.');
      return NextResponse.redirect(new URL('/login?error=config_missing', request.url));
    }

    // Exchange authorization code for access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      const errorText = await tokenRes.text();
      logger.error('Google token exchange failed', errorText);
      return NextResponse.redirect(new URL('/login?error=token_exchange_failed', request.url));
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      logger.error('No access token returned from Google.');
      return NextResponse.redirect(new URL('/login?error=no_access_token', request.url));
    }

    // Get user details from Google userinfo API
    const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userinfoRes.ok) {
      const errorText = await userinfoRes.text();
      logger.error('Google userinfo fetch failed', errorText);
      return NextResponse.redirect(new URL('/login?error=userinfo_failed', request.url));
    }

    const googleUser = await userinfoRes.json();
    let email = googleUser.email;
    const name = googleUser.name || email.split('@')[0];

    if (!email) {
      return NextResponse.redirect(new URL('/login?error=no_email', request.url));
    }

    email = normalizeEmail(email);

    if (!isAllowedCollegeEmail(email)) {
      return NextResponse.redirect(new URL('/login?error=domain_not_allowed', request.url));
    }

    // Synchronize or create user in Prisma DB
    const withProfiles = { studentProfile: true, mentorProfile: true } as const;
    let user = await prisma.user.findUnique({
      where: { email },
      include: withProfiles,
    });

    if (!user) {
      // Create user and profile
      const created = await prisma.user.create({
        data: {
          email,
          passwordHash: 'oauth_google_user',
          role,
        },
      });

      if (role === 'STUDENT') {
        await prisma.studentProfile.create({
          data: {
            userId: created.id,
            name,
            year: '',
            branch: '',
            skills: [],
            languages: [],
            softSkills: [],
          },
        });
      } else {
        await prisma.mentorProfile.create({
          data: {
            userId: created.id,
            name,
            designation: '',
            organization: 'GL Bajaj Group of Institutions',
            expertise: [],
          },
        });
      }

      user = await prisma.user.findUnique({
        where: { id: created.id },
        include: withProfiles,
      });
    }

    if (!user) {
      throw new Error('Failed to load user account.');
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    let isOnboarded = false;
    if (user.role === 'STUDENT' && user.studentProfile?.branch) {
      isOnboarded = true;
    } else if (user.role === 'MENTOR' && user.mentorProfile?.designation) {
      isOnboarded = true;
    }

    const redirectPath = user.role === 'ADMIN' ? '/admin' : (isOnboarded ? '/dashboard' : '/onboarding');
    const response = NextResponse.redirect(new URL(redirectPath, request.url));

    setSessionCookie(response.cookies, token);

    return response;
  } catch (error) {
    logger.error('Google OAuth callback error', error);
    return NextResponse.redirect(new URL('/login?error=oauth_exception', request.url));
  }
}
