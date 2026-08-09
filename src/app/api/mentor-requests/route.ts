import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { checkUserRateLimit } from '@/lib/rateLimit';
import { mentorRequestSchema } from '@/lib/validation';
import { logger } from '@/lib/logger';
import { queueNotification } from '@/lib/notifications';
import { Prisma } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Authenticated user rate limit check
    const rateLimitResponse = await checkUserRateLimit(request, decoded.userId);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json().catch(() => ({}));
    
    // Parse/Validate input using Zod Schema
    const parsed = mentorRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request parameters.' }, { status: 400 });
    }

    const { mentorId, message } = parsed.data;

    // Any student in a formed team can start the mentor conversation. Duplicate
    // team-level requests are still blocked below.
    const [caller, mentor] = await Promise.all([
      prisma.studentProfile.findUnique({
        where: { userId: decoded.userId },
        include: { team: { include: { track: true } } },
      }),
      prisma.mentorProfile.findUnique({
        where: { userId: mentorId },
        select: { userId: true, verified: true },
      }),
    ]);

    if (!caller || !caller.teamId) {
      return NextResponse.json({ error: 'You are not in a team.' }, { status: 400 });
    }

    const team = caller.team;
    if (!team) {
      return NextResponse.json({ error: 'Team record not found.' }, { status: 404 });
    }
    if (team.mentorId) {
      return NextResponse.json({ error: 'Your team already has an assigned mentor.' }, { status: 400 });
    }

    if (!mentor) {
      return NextResponse.json({ error: 'Target mentor not found.' }, { status: 404 });
    }

    if (!mentor.verified) {
      return NextResponse.json({ error: 'Target mentor is not verified yet by the administrators.' }, { status: 400 });
    }

    let newRequest;
    try {
      newRequest = await prisma.$transaction(async (tx) => {
        const claimableTeam = await tx.team.findFirst({
          where: { id: team.id, mentorId: null },
          select: { id: true },
        });
        if (!claimableTeam) throw new Error('TEAM_ALREADY_HAS_MENTOR');

        return tx.mentorRequest.create({
          data: {
            teamId: team.id,
            mentorId,
            message: message || null,
            status: 'pending',
          },
        });
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'TEAM_ALREADY_HAS_MENTOR') {
        return NextResponse.json({ error: 'Your team already has an assigned mentor.' }, { status: 409 });
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return NextResponse.json({ error: 'A request has already been sent to this mentor.' }, { status: 409 });
      }
      throw error;
    }

    // Notify mentor
    queueNotification(
      mentorId,
      'mentor_request_received',
      {
        title: 'New Mentorship Request',
        message: `Team "${team.name}" has requested you as a guide for track ${team.track?.problemStatementCode || 'N/A'}.`,
        teamId: team.id,
        teamName: team.name,
        leaderId: team.leaderId,
        requestedById: decoded.userId,
        requestedByName: caller.name,
        messageText: message?.trim(),
      }
    );

    return NextResponse.json({ success: true, message: 'Mentorship request sent successfully.', requestId: newRequest.id });
  } catch (error) {
    logger.error('Create mentor request error', error);
    return NextResponse.json({ error: 'Failed to request mentor guidance.' }, { status: 500 });
  }
}
