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

export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (decoded.role !== 'MENTOR') {
      return NextResponse.json({ error: 'Forbidden. Mentor access required.' }, { status: 403 });
    }

    const rateLimitResponse = await checkUserRateLimit(request, decoded.userId);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json().catch(() => ({}));
    const { section, name, designation, organization, contact, expertise, bio, linkedinUrl, avatarUrl } = body;

    const updateData: Record<string, any> = {};

    if (section === 'personal' || section === 'identity') {
      if (typeof name === 'string' && name.trim()) updateData.name = name.trim();
      if (typeof designation === 'string') updateData.designation = designation.trim();
      if (typeof organization === 'string') updateData.organization = organization.trim();
      if (typeof contact !== 'undefined') updateData.contact = optionalText(contact, 40);
      if (typeof avatarUrl !== 'undefined') updateData.avatarUrl = avatarDataUri(avatarUrl);
    } else if (section === 'expertise') {
      if (Array.isArray(expertise)) updateData.expertise = tagArray(expertise);
    } else if (section === 'bio' || section === 'links') {
      if (typeof bio !== 'undefined') updateData.bio = optionalText(bio, MAX_TEXT);
      if (typeof linkedinUrl !== 'undefined') updateData.linkedinUrl = safeUrl(linkedinUrl);
    } else {
      // General selective update
      if (typeof name === 'string' && name.trim()) updateData.name = name.trim();
      if (typeof designation === 'string') updateData.designation = designation.trim();
      if (typeof organization === 'string') updateData.organization = organization.trim();
      if (typeof contact !== 'undefined') updateData.contact = optionalText(contact, 40);
      if (Array.isArray(expertise)) updateData.expertise = tagArray(expertise);
      if (typeof bio !== 'undefined') updateData.bio = optionalText(bio, MAX_TEXT);
      if (typeof linkedinUrl !== 'undefined') updateData.linkedinUrl = safeUrl(linkedinUrl);
      if (typeof avatarUrl !== 'undefined') updateData.avatarUrl = avatarDataUri(avatarUrl);
    }

    const updatedProfile = await prisma.mentorProfile.update({
      where: { userId: decoded.userId },
      data: updateData,
    });

    const identityComplete = Boolean(
      updatedProfile.name?.trim() && updatedProfile.designation?.trim() && updatedProfile.organization?.trim()
    );
    const expertiseComplete = Boolean(updatedProfile.expertise && updatedProfile.expertise.length > 0);
    const bioComplete = Boolean(updatedProfile.bio?.trim() && updatedProfile.linkedinUrl?.trim());

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
      completion: {
        identityComplete,
        expertiseComplete,
        bioComplete,
      },
    });
  } catch (error) {
    logger.error('Patch mentor profile error', error);
    return NextResponse.json({ error: 'Failed to update mentor section.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (decoded.role !== 'MENTOR') {
      return NextResponse.json({ error: 'Forbidden. Mentor access required.' }, { status: 403 });
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
      contact,
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
          contact: optionalText(contact, 40),
          expertise: tagArray(expertise),
          bio: optionalText(bio, MAX_TEXT),
          linkedinUrl: safeUrl(linkedinUrl),
          avatarUrl: avatarDataUri(avatarUrl),
        },
      });
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
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Authenticated user rate limit check
    const rateLimitResponse = await checkUserRateLimit(request, decoded.userId);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { searchParams } = new URL(request.url);
    const rawTargetUserId = searchParams.get('userId')?.trim();
    const targetUserId = (rawTargetUserId && rawTargetUserId !== 'undefined' && rawTargetUserId !== 'null') ? rawTargetUserId : null;
    const queryId = targetUserId || decoded.userId;

    const [mentor, viewer] = await Promise.all([
      prisma.mentorProfile.findUnique({
        where: { userId: queryId },
        include: {
          _count: { select: { teams: true } },
          user: { select: { email: true, college: true } },
          teams: {
            select: {
              id: true,
              teamCode: true,
              name: true,
              status: true,
              memberCount: true,
              track: { select: { name: true, problemStatementCode: true } },
            },
          },
        },
      }),
      decoded.role === 'STUDENT'
        ? prisma.studentProfile.findUnique({
            where: { userId: decoded.userId },
            select: {
              teamId: true,
              team: {
                select: {
                  mentorId: true,
                  mentorRequests: {
                    where: { mentorId: queryId, status: { in: ['pending', 'keep_pending', 'meeting_requested', 'accepted'] } },
                    select: { id: true, status: true },
                  },
                },
              },
            },
          })
        : Promise.resolve(null),
    ]);

    if (!mentor) {
      return NextResponse.json({ error: 'Mentor profile not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      profile: {
        userId: mentor.userId,
        name: mentor.name,
        designation: mentor.designation,
        organization: mentor.organization,
        college: mentor.user?.college || mentor.organization,
        email: mentor.user?.email || null,
        contact: mentor.contact || null,
        expertise: mentor.expertise,
        guidedTeamsCount: mentor._count.teams,
        verified: mentor.verified,
        bio: mentor.bio,
        linkedinUrl: mentor.linkedinUrl,
        avatarUrl: mentor.avatarUrl,
        teams: mentor.teams,
      },
      eligibility: {
        role: decoded.role,
        canRequest: decoded.role === 'STUDENT' && Boolean(viewer?.teamId) && !viewer?.team?.mentorId,
        reason:
          decoded.role !== 'STUDENT'
            ? 'Only students can request mentorship.'
            : !viewer?.teamId
              ? 'Join or create a team first.'
              : viewer.team?.mentorId
                ? 'Your team already has an assigned mentor.'
                : null,
        isRequested: Boolean(viewer?.team?.mentorRequests && viewer.team.mentorRequests.length > 0),
        requestStatus: viewer?.team?.mentorRequests?.[0]?.status || null,
      },
    });
  } catch (error) {
    logger.error('Get mentor profile error', error);
    return NextResponse.json({ error: 'Failed to retrieve mentor profile.' }, { status: 500 });
  }
}
