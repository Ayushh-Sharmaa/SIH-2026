import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { checkUserRateLimit } from '@/lib/rateLimit';
import { mentorProfileSchema } from '@/lib/validation';
import {
  MAX_TEXT,
  optionalText,
  safeUrl,
  tagArray,
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
      return NextResponse.json({ error: 'Invalid profile information format.' }, { status: 400 });
    }

    const {
      name,
      designation,
      organization,
      expertise,
      capacity,
      bio,
      linkedinUrl,
    } = parsed.data;

    // Update the MentorProfile
    const updatedProfile = await prisma.mentorProfile.update({
      where: { userId: decoded.userId },
      data: {
        name,
        designation,
        organization,
        expertise: tagArray(expertise),
        capacity,
        bio: optionalText(bio, MAX_TEXT),
        linkedinUrl: safeUrl(linkedinUrl),
      },
    });

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
        capacity: mentor.capacity,
        currentLoad: mentor.currentLoad,
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
