import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { checkUserRateLimit } from '@/lib/rateLimit';
import { joinRequestSchema, respondJoinRequestSchema } from '@/lib/validation';
import { recalculateTeamSkills } from '@/lib/derived';
import { TeamStatus, Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';
import { queueNotification } from '@/lib/notifications';
import { revalidateTag } from 'next/cache';

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
    const parsed = joinRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request parameters.' }, { status: 400 });
    }

    const { teamId, message } = parsed.data;

    const student = await prisma.studentProfile.findUnique({
      where: { userId: decoded.userId },
    });

    if (!student || student.teamId) {
      return NextResponse.json({ error: 'You are already in a team or not onboarded.' }, { status: 400 });
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { members: true },
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found.' }, { status: 404 });
    }

    if (team.status !== 'forming' || team.members.length >= 6) {
      return NextResponse.json({ error: 'This team is full or locked.' }, { status: 400 });
    }

    const existing = await prisma.joinRequest.findFirst({
      where: {
        teamId: teamId,
        studentId: decoded.userId,
        status: 'pending',
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'You have already submitted a pending request to this team.' }, { status: 400 });
    }

    let newRequest;
    try {
      newRequest = await prisma.joinRequest.create({
        data: {
          teamId,
          studentId: decoded.userId,
          message: message || null,
          status: 'pending',
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return NextResponse.json({ error: 'You already have an active request for this team.' }, { status: 409 });
      }
      throw error;
    }

    // Notify Team Leader
    queueNotification(
      team.leaderId,
      'join_request_received',
      {
        title: 'New Join Request',
        message: `${student.name} has requested to join your team "${team.name}".`,
        teamId: team.id,
        teamName: team.name,
        studentId: decoded.userId,
        studentName: student.name,
        messageText: message?.trim(),
      }
    );

    return NextResponse.json({ success: true, message: 'Join request sent successfully.', requestId: newRequest.id });
  } catch (error) {
    logger.error('Create join request error', error);
    return NextResponse.json({ error: 'Failed to submit join request.' }, { status: 500 });
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
    const parsed = respondJoinRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid response parameters.' }, { status: 400 });
    }

    const { requestId, action } = parsed.data;

    const joinRequest = await prisma.joinRequest.findUnique({
      where: { id: requestId },
      include: { team: { include: { members: true } } },
    });

    if (!joinRequest) {
      return NextResponse.json({ error: 'Join request not found.' }, { status: 404 });
    }

    // Only the leader can manage incoming join requests
    if (joinRequest.team.leaderId !== decoded.userId) {
      return NextResponse.json({ error: 'Only the team leader can manage requests.' }, { status: 403 });
    }

    if (joinRequest.status === 'accepted' || joinRequest.status === 'declined') {
      return NextResponse.json({ error: 'This request has already been processed.' }, { status: 400 });
    }

    if (action === 'decline') {
      await prisma.joinRequest.update({
        where: { id: requestId },
        data: { status: 'declined' },
      });

      // Notify Student of Decline
      queueNotification(
        joinRequest.studentId,
        'join_request_response',
        {
          title: 'Join Request Declined',
          message: `Your request to join team "${joinRequest.team.name}" has been declined.`,
          teamId: joinRequest.teamId,
          teamName: joinRequest.team.name,
          status: 'declined',
        }
      );

      return NextResponse.json({ success: true, message: 'Request declined.' });
    }

    if (action === 'on_hold') {
      await prisma.joinRequest.update({
        where: { id: requestId },
        data: { status: 'on_hold' },
      });

      // Notify Student of Hold
      queueNotification(
        joinRequest.studentId,
        'join_request_response',
        {
          title: 'Join Request On Hold',
          message: `Your request to join team "${joinRequest.team.name}" has been placed on hold.`,
          teamId: joinRequest.teamId,
          teamName: joinRequest.team.name,
          status: 'on_hold',
        }
      );

      return NextResponse.json({ success: true, message: 'Request put on hold.' });
    }

    if (action === 'meeting_requested') {
      await prisma.joinRequest.update({
        where: { id: requestId },
        data: { status: 'meeting_requested' },
      });

      // Notify Student of Meeting request
      queueNotification(
        joinRequest.studentId,
        'join_request_response',
        {
          title: 'Meeting Requested',
          message: `The leader of team "${joinRequest.team.name}" has requested a meeting with you to discuss joining.`,
          teamId: joinRequest.teamId,
          teamName: joinRequest.team.name,
          status: 'meeting_requested',
        }
      );

      return NextResponse.json({ success: true, message: 'Meeting requested.' });
    }

    // Action is ACCEPT
    if (joinRequest.team.members.length >= 6) {
      return NextResponse.json({ error: 'Your team is already full (max 6 members).' }, { status: 400 });
    }

    const TEAM_FULL = 'TEAM_FULL';
    const ALREADY_PROCESSED = 'ALREADY_PROCESSED';
    const STUDENT_IN_TEAM = 'STUDENT_IN_TEAM';

    try {
      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Accept request: check that it is not already accepted
        const currentReq = await tx.joinRequest.findUnique({
          where: { id: requestId },
        });
        if (currentReq?.status === 'accepted') throw new Error(ALREADY_PROCESSED);

        const accepted = await tx.joinRequest.updateMany({
          where: { id: requestId, status: { notIn: ['accepted', 'declined'] } },
          data: { status: 'accepted' },
        });
        if (accepted.count !== 1) throw new Error(ALREADY_PROCESSED);

        // Claim a seat
        const seat = await tx.team.updateMany({
          where: { id: joinRequest.teamId, status: 'forming', memberCount: { lt: 6 } },
          data: { memberCount: { increment: 1 } },
        });
        if (seat.count !== 1) throw new Error(TEAM_FULL);

        // Add student to team
        const joined = await tx.studentProfile.updateMany({
          where: { userId: joinRequest.studentId, teamId: null },
          data: { teamId: joinRequest.teamId, teamStatus: TeamStatus.IN_TEAM },
        });
        if (joined.count !== 1) throw new Error(STUDENT_IN_TEAM);

        // Lock team if full
        const team = await tx.team.findUniqueOrThrow({
          where: { id: joinRequest.teamId },
          select: { memberCount: true },
        });
        if (team.memberCount >= 6) {
          await tx.team.update({
            where: { id: joinRequest.teamId },
            data: { status: 'locked' },
          });
        }

        // Decline all other pending requests for this student
        await tx.joinRequest.updateMany({
          where: {
            studentId: joinRequest.studentId,
            status: { in: ['pending', 'on_hold', 'meeting_requested'] },
            id: { not: requestId },
          },
          data: { status: 'declined' },
        });

        // Decline any pending invites for this student
        await tx.teamInvite.updateMany({
          where: {
            studentId: joinRequest.studentId,
            status: { in: ['pending', 'on_hold', 'waitlist'] },
          },
          data: { status: 'declined' },
        });
      });

      // Notify Student of Acceptance
      queueNotification(
        joinRequest.studentId,
        'join_request_response',
        {
          title: 'Join Request Approved',
          message: `Congratulations! Your request to join team "${joinRequest.team.name}" has been accepted.`,
          teamId: joinRequest.teamId,
          teamName: joinRequest.team.name,
          status: 'accepted',
        }
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === TEAM_FULL) {
          return NextResponse.json({ error: 'Your team is already full (max 6 members).' }, { status: 400 });
        }
        if (error.message === ALREADY_PROCESSED) {
          return NextResponse.json({ error: 'Request has already been processed.' }, { status: 400 });
        }
        if (error.message === STUDENT_IN_TEAM) {
          return NextResponse.json({ error: 'That student has already joined another team.' }, { status: 400 });
        }
      }
      throw error;
    }

    await recalculateTeamSkills(joinRequest.teamId);
    revalidateTag('students', { expire: 0 });
    revalidateTag('teams', { expire: 0 });

    return NextResponse.json({ success: true, message: 'Student successfully added to your team.' });
  } catch (error) {
    logger.error('Respond join request error', error);
    return NextResponse.json({ error: 'Failed to process request response.' }, { status: 500 });
  }
}
