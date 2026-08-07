import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { checkUserRateLimit } from '@/lib/rateLimit';
import { respondMentorRequestSchema } from '@/lib/validation';
import { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';
import { createNotification } from '@/lib/notifications';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'MENTOR') {
      return NextResponse.json({ error: 'Unauthorized. Only mentors can respond to requests.' }, { status: 401 });
    }

    // Authenticated user rate limit check
    const rateLimitResponse = await checkUserRateLimit(request, decoded.userId);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json().catch(() => ({}));
    
    // Parse/Validate input using Zod Schema
    const parsed = respondMentorRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request parameters.' }, { status: 400 });
    }

    const { action } = parsed.data;

    // 1. Fetch the request
    const mentorRequest = await prisma.mentorRequest.findUnique({
      where: { id },
      include: {
        team: true,
        mentor: true,
      },
    });

    if (!mentorRequest) {
      return NextResponse.json({ error: 'Mentor request not found.' }, { status: 404 });
    }

    if (mentorRequest.mentorId !== decoded.userId) {
      return NextResponse.json({ error: 'You are not authorized to respond to this request.' }, { status: 403 });
    }

    if (mentorRequest.status === 'accepted' || mentorRequest.status === 'declined') {
      return NextResponse.json({ error: 'This request has already been finalized.' }, { status: 400 });
    }

    if (action === 'decline') {
      await prisma.mentorRequest.update({
        where: { id },
        data: { status: 'declined' },
      });

      // Notify team leader
      await createNotification(
        mentorRequest.team.leaderId,
        'mentor_response',
        {
          title: 'Mentorship Request Declined',
          message: `${mentorRequest.mentor.name} has declined your mentorship request for team "${mentorRequest.team.name}".`,
          teamId: mentorRequest.teamId,
          teamName: mentorRequest.team.name,
          mentorId: decoded.userId,
          mentorName: mentorRequest.mentor.name,
          status: 'declined',
        }
      );

      return NextResponse.json({ success: true, message: 'Request declined successfully.' });
    }

    if (action === 'meeting_requested') {
      await prisma.mentorRequest.update({
        where: { id },
        data: { status: 'meeting_requested' },
      });

      // Notify team leader
      await createNotification(
        mentorRequest.team.leaderId,
        'mentor_response',
        {
          title: 'Mentorship Request Meeting',
          message: `${mentorRequest.mentor.name} has requested a meeting to discuss mentorship with team "${mentorRequest.team.name}".`,
          teamId: mentorRequest.teamId,
          teamName: mentorRequest.team.name,
          mentorId: decoded.userId,
          mentorName: mentorRequest.mentor.name,
          status: 'meeting_requested',
        }
      );

      return NextResponse.json({ success: true, message: 'Meeting requested successfully.' });
    }

    if (action === 'keep_pending') {
      await prisma.mentorRequest.update({
        where: { id },
        data: { status: 'keep_pending' },
      });

      // Notify team leader
      await createNotification(
        mentorRequest.team.leaderId,
        'mentor_response',
        {
          title: 'Mentorship Request Pending',
          message: `${mentorRequest.mentor.name} has marked your request as pending review.`,
          teamId: mentorRequest.teamId,
          teamName: mentorRequest.team.name,
          mentorId: decoded.userId,
          mentorName: mentorRequest.mentor.name,
          status: 'keep_pending',
        }
      );

      return NextResponse.json({ success: true, message: 'Request kept pending.' });
    }

    // Action is ACCEPT
    if (!mentorRequest.mentor.verified) {
      return NextResponse.json({ error: 'Your profile is not verified yet. Verified mentors are required.' }, { status: 400 });
    }

    if (mentorRequest.mentor.currentLoad >= mentorRequest.mentor.capacity) {
      return NextResponse.json({ error: 'You have reached your mentoring capacity limit.' }, { status: 400 });
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.mentorRequest.update({
        where: { id },
        data: { status: 'accepted' },
      });

      await tx.team.update({
        where: { id: mentorRequest.teamId },
        data: { mentorId: decoded.userId },
      });

      await tx.mentorProfile.update({
        where: { userId: decoded.userId },
        data: { currentLoad: { increment: 1 } },
      });

      // Decline other pending mentor requests for this team
      await tx.mentorRequest.updateMany({
        where: {
          teamId: mentorRequest.teamId,
          status: { in: ['pending', 'keep_pending', 'meeting_requested'] },
          id: { not: id },
        },
        data: { status: 'declined' },
      });
    });

    // Notify team leader of acceptance
    await createNotification(
      mentorRequest.team.leaderId,
      'mentor_response',
      {
        title: 'Mentorship Request Approved',
        message: `${mentorRequest.mentor.name} has approved your mentorship request and is now your team guide!`,
        teamId: mentorRequest.teamId,
        teamName: mentorRequest.team.name,
        mentorId: decoded.userId,
        mentorName: mentorRequest.mentor.name,
        status: 'accepted',
      }
    );

    return NextResponse.json({ success: true, message: 'Request accepted successfully.' });
  } catch (error) {
    logger.error('Respond mentor request error', error);
    return NextResponse.json({ error: 'Failed to process request.' }, { status: 500 });
  }
}
