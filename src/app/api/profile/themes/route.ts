import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { checkUserRateLimit } from '@/lib/rateLimit';
import { themesProfileSchema } from '@/lib/validation';
import { safeUrl } from '@/lib/validate';
import { logger } from '@/lib/logger';
import { revalidateTag } from 'next/cache';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const student = await prisma.studentProfile.findUnique({
      where: { userId: decoded.userId },
      select: {
        githubUrl: true,
        linkedinUrl: true,
        resumeUrl: true,
        trackInterest: {
          select: {
            id: true,
            name: true,
            problemStatementCode: true,
            category: true,
          },
        },
      },
    });

    if (!student) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    return NextResponse.json({
      success: true,
      themes: {
        githubUrl: student.githubUrl,
        linkedinUrl: student.linkedinUrl,
        resumeUrl: student.resumeUrl,
        trackInterest: student.trackInterest.map((t) => t.id),
        tracksDetailed: student.trackInterest,
      },
    });
  } catch (error) {
    logger.error('GET /api/profile/themes error', error);
    return NextResponse.json({ error: 'Failed to retrieve themes and links' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimitResponse = await checkUserRateLimit(request, decoded.userId);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json().catch(() => ({}));
    const parsed = themesProfileSchema.safeParse(body);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues[0]?.message || 'Invalid themes and links information.';
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { trackInterest, githubUrl, linkedinUrl, resumeUrl } = parsed.data;

    // Fetch valid track IDs from database (dynamic authoritative source)
    const validTracks = await prisma.track.findMany({
      where: { id: { in: trackInterest } },
      select: { id: true },
    });
    const validTrackIds = validTracks.map((t) => t.id);

    const updated = await prisma.$transaction(async (tx) => {
      const studentProfile = await tx.studentProfile.update({
        where: { userId: decoded.userId },
        data: {
          githubUrl: safeUrl(githubUrl),
          linkedinUrl: safeUrl(linkedinUrl),
          resumeUrl: safeUrl(resumeUrl),
          trackInterest: {
            set: validTrackIds.map((id) => ({ id })),
          },
        },
        select: {
          githubUrl: true,
          linkedinUrl: true,
          resumeUrl: true,
          teamId: true,
          trackInterest: {
            select: {
              id: true,
              name: true,
              problemStatementCode: true,
              category: true,
            },
          },
        },
      });

      // If user is a team leader and has chosen tracks, update team primary track
      if (studentProfile.teamId && validTrackIds.length > 0) {
        const team = await tx.team.findUnique({
          where: { id: studentProfile.teamId },
          select: { id: true, leaderId: true },
        });
        if (team && team.leaderId === decoded.userId) {
          await tx.team.update({
            where: { id: team.id },
            data: { trackId: validTrackIds[0] },
          });
        }
      }

      return studentProfile;
    });

    revalidateTag('students', { expire: 0 });
    revalidateTag('teams', { expire: 0 });

    return NextResponse.json({
      success: true,
      themes: {
        githubUrl: updated.githubUrl,
        linkedinUrl: updated.linkedinUrl,
        resumeUrl: updated.resumeUrl,
        trackInterest: updated.trackInterest.map((t) => t.id),
        tracksDetailed: updated.trackInterest,
      },
    });
  } catch (error) {
    logger.error('PATCH /api/profile/themes error', error);
    return NextResponse.json({ error: 'Failed to update themes and links' }, { status: 500 });
  }
}
