import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { revalidateTag } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { checkUserRateLimit } from '@/lib/rateLimit';
import { mentorProfileSchema } from '@/lib/validation';
import {
  MAX_TEXT,
  optionalText,
  safeUrl,
  tagArray,
  avatarDataUri,
} from '@/lib/validate';
import { logger } from '@/lib/logger';

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'MENTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Authenticated user rate limit check
    const rateLimitResponse = await checkUserRateLimit(request, decoded.userId);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json().catch(() => ({}));
    
    // Parse/Validate input using Zod Schema
    const parsed = mentorProfileSchema.safeParse(body);
    if (!parsed.success) {
      logger.error('Mentor profile validation failed', parsed.error.format(), { body });
      const errorMsg = parsed.error.issues[0]?.message || 'Invalid profile information format.';
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const {
      name,
      designation,
      organization,
      expertise,
      bio,
      linkedinUrl,
      avatarUrl,
      college,
    } = parsed.data;

    const updatedProfile = await prisma.$transaction(async (tx) => {
      if (college) {
        await tx.user.update({ where: { id: decoded.userId }, data: { college } });
      }
      return tx.mentorProfile.update({
        where: { userId: decoded.userId },
        data: {
          name,
          designation,
          organization,
          expertise: tagArray(expertise),
          bio: optionalText(bio, MAX_TEXT),
          linkedinUrl: safeUrl(linkedinUrl),
          avatarUrl: avatarDataUri(avatarUrl),
        },
      });
    });

    revalidateTag('mentors', { expire: 0 });
    revalidateTag('teams', { expire: 0 });

    // Dummy comment to trigger IDE diagnostics refresh
    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (error) {
    logger.error('Update mentor profile error', error);
    return NextResponse.json({ error: 'Failed to update mentor profile.' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'MENTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Authenticated user rate limit check
    const rateLimitResponse = await checkUserRateLimit(request, decoded.userId);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const mentor = await prisma.mentorProfile.findUnique({
      where: { userId: decoded.userId },
      include: { _count: { select: { teams: true } } },
    });

    if (!mentor) {
      return NextResponse.json({ error: 'Mentor profile not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      profile: {
        name: mentor.name,
        designation: mentor.designation,
        organization: mentor.organization,
        expertise: mentor.expertise,
        guidedTeamsCount: mentor._count.teams,
        verified: mentor.verified,
        bio: mentor.bio,
        linkedinUrl: mentor.linkedinUrl,
      },
    });
  } catch (error) {
    logger.error('Get mentor profile error', error);
    return NextResponse.json({ error: 'Failed to retrieve mentor profile.' }, { status: 500 });
  }
}
