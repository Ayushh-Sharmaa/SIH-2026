import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
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

    // Update the MentorProfile
    const updatedProfile = await prisma.mentorProfile.update({
      where: { userId: decoded.userId },
      data: {
        name,
        designation,
        organization,
        expertise: expertise || [],
        capacity: capacity ? parseInt(capacity) : 2,
        bio: bio || null,
        linkedinUrl: linkedinUrl || null,
      },
    });

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (error) {
    logger.error('Update mentor profile error', error);
    return NextResponse.json({ error: 'Failed to update mentor profile.' }, { status: 500 });
  }
}
