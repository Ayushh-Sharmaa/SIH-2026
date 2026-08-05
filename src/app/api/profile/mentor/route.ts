import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import {
  boundedInt,
  MAX_TEXT,
  optionalText,
  requiredText,
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

    const body = await request.json();
    const {
      name,
      designation,
      organization,
      expertise,
      capacity,
      bio,
      linkedinUrl,
    } = body;

    if (!name || !designation || !organization) {
      return NextResponse.json({ error: 'Missing basic profile information' }, { status: 400 });
    }

    const cleanName = requiredText(name);
    const cleanDesignation = requiredText(designation);
    const cleanOrganization = requiredText(organization);

    if (!cleanName || !cleanDesignation || !cleanOrganization) {
      return NextResponse.json({ error: 'Missing basic profile information' }, { status: 400 });
    }

    // Capacity gates every mentor-request accept (`currentLoad >= capacity`).
    // Unbounded, a mentor could set it to 999999 and silently disable the gate
    // for themselves; `parseInt('abc')` also produced NaN, which Prisma
    // rejected as a 500 rather than a 400.
    const cleanCapacity = capacity === undefined || capacity === null || capacity === ''
      ? 2
      : boundedInt(capacity, 1, 10);

    if (cleanCapacity === null) {
      return NextResponse.json(
        { error: 'Capacity must be a whole number between 1 and 10.' },
        { status: 400 }
      );
    }

    // Update the MentorProfile
    const updatedProfile = await prisma.mentorProfile.update({
      where: { userId: decoded.userId },
      data: {
        name: cleanName,
        designation: cleanDesignation,
        organization: cleanOrganization,
        expertise: tagArray(expertise),
        capacity: cleanCapacity,
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
