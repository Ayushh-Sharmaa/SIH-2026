import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { checkUserRateLimit } from '@/lib/rateLimit';
import { teamInviteSchema, respondTeamInviteSchema } from '@/lib/validation';
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
    const parsed = teamInviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid invite parameters.' }, { status: 400 });
    }

    const { studentId } = parsed.data;

    // Fetch caller's profile to check if they are a team leader
    const caller = await prisma.studentProfile.findUnique({
      where: { userId: decoded.userId },
      include: { team: { include: { members: true, track: true } } },
    });

    if (!caller || !caller.teamId) {
      return NextResponse.json({ error: 'You are not in a team.' }, { status: 400 });
    }

    const team = caller.team;
    if (!team) {
      return NextResponse.json({ error: 'Team record not found.' }, { status: 404 });
    }
    if (team.leaderId !== decoded.userId) {
      return NextResponse.json({ error: 'Only the team leader can invite members.' }, { status: 403 });
    }

    if (team.members.length >= 6) {
      return NextResponse.json({ error: 'Your team is already full (max 6 members).' }, { status: 400 });
    }

    const targetStudent = await prisma.studentProfile.findUnique({
      where: { userId: studentId },
    });

    if (!targetStudent) {
      return NextResponse.json({ error: 'Target student not found.' }, { status: 404 });
    }

    if (targetStudent.teamId) {
      return NextResponse.json({ error: 'This student is already in a team.' }, { status: 400 });
    }

    const existing = await prisma.teamInvite.findFirst({
      where: {
        teamId: team.id,
        studentId: studentId,
        status: 'pending',
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'An invitation is already pending for this student.' }, { status: 400 });
    }

    let invite;
    try {
      invite = await prisma.teamInvite.create({
        data: {
          teamId: team.id,
          studentId,
          status: 'pending',
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return NextResponse.json({ error: 'An invitation is already active for this student.' }, { status: 409 });
      }
      throw error;
    }

    // Notify target student
    queueNotification(
      studentId,
      'team_invite_received',
      {
        title: 'New Team Invitation',
        message: `You have been invited to join team "${team.name}" for track ${team.track.problemStatementCode}.`,
        teamId: team.id,
        teamName: team.name,
        inviteId: invite.id,
      }
    );

    return NextResponse.json({ success: true, message: 'Invitation sent successfully.', inviteId: invite.id });
  } catch (error) {
    logger.error('Create team invite error', error);
    return NextResponse.json({ error: 'Failed to send invitation.' }, { status: 500 });
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
    const parsed = respondTeamInviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid invitation response parameters.' }, { status: 400 });
    }

    const { inviteId, action } = parsed.data;

    const invite = await prisma.teamInvite.findUnique({
      where: { id: inviteId },
      include: { team: { include: { members: true } } },
    });

    if (!invite) {
      return NextResponse.json({ error: 'Invitation not found.' }, { status: 404 });
    }

    if (invite.studentId !== decoded.userId) {
      return NextResponse.json({ error: 'This invitation was not sent to you.' }, { status: 403 });
    }

    if (invite.status === 'accepted' || invite.status === 'declined') {
      return NextResponse.json({ error: 'Invitation has already been finalized.' }, { status: 400 });
    }

    const student = await prisma.studentProfile.findUnique({
      where: { userId: decoded.userId },
    });

    if (action === 'decline') {
      await prisma.teamInvite.update({
        where: { id: inviteId },
        data: { status: 'declined' },
      });

      // Notify team leader
      queueNotification(
        invite.team.leaderId,
        'invite_response',
        {
          title: 'Invitation Declined',
          message: `${student?.name} has declined your invitation to join team "${invite.team.name}".`,
          teamId: invite.teamId,
          teamName: invite.team.name,
          studentId: decoded.userId,
          studentName: student?.name,
          status: 'declined',
        }
      );

      return NextResponse.json({ success: true, message: 'Invitation declined.' });
    }

    if (action === 'on_hold') {
      await prisma.teamInvite.update({
        where: { id: inviteId },
        data: { status: 'on_hold' },
      });

      // Notify team leader
      queueNotification(
        invite.team.leaderId,
        'invite_response',
        {
          title: 'Invitation On Hold',
          message: `${student?.name} has put your invitation to join team "${invite.team.name}" on hold.`,
          teamId: invite.teamId,
          teamName: invite.team.name,
          studentId: decoded.userId,
          studentName: student?.name,
          status: 'on_hold',
        }
      );

      return NextResponse.json({ success: true, message: 'Invitation put on hold.' });
    }

    if (action === 'waitlist') {
      await prisma.teamInvite.update({
        where: { id: inviteId },
        data: { status: 'waitlist' },
      });

      // Notify team leader
      queueNotification(
        invite.team.leaderId,
        'invite_response',
        {
          title: 'Invitation Put on Waitlist',
          message: `${student?.name} has kept your invitation to join team "${invite.team.name}" in their waitlist.`,
          teamId: invite.teamId,
          teamName: invite.team.name,
          studentId: decoded.userId,
          studentName: student?.name,
          status: 'waitlist',
        }
      );

      return NextResponse.json({ success: true, message: 'Invitation kept on waitlist.' });
    }

    // Action is ACCEPT
    if (student?.teamId) {
      return NextResponse.json({ error: 'You are already in a team.' }, { status: 400 });
    }

    if (invite.team.members.length >= 6) {
      return NextResponse.json({ error: 'Target team is full.' }, { status: 400 });
    }

    const TEAM_FULL = 'TEAM_FULL';
    const ALREADY_PROCESSED = 'INVITE_ALREADY_PROCESSED';
    const STUDENT_IN_TEAM = 'STUDENT_IN_TEAM';

    try {
      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const accepted = await tx.teamInvite.updateMany({
          where: { id: inviteId, status: { in: ['pending', 'on_hold', 'waitlist'] } },
          data: { status: 'accepted' },
        });
        if (accepted.count !== 1) throw new Error(ALREADY_PROCESSED);

        // Claiming the seat and incrementing the stored count in one guarded
        // update prevents simultaneous invite accepts from overfilling a team.
        const seat = await tx.team.updateMany({
          where: { id: invite.teamId, status: 'forming', memberCount: { lt: 6 } },
          data: { memberCount: { increment: 1 } },
        });
        if (seat.count !== 1) throw new Error(TEAM_FULL);

        const joined = await tx.studentProfile.updateMany({
          where: { userId: decoded.userId, teamId: null },
          data: { teamId: invite.teamId, teamStatus: TeamStatus.IN_TEAM, roleInTeam: 'Member' },
        });
        if (joined.count !== 1) throw new Error(STUDENT_IN_TEAM);

        const updatedTeam = await tx.team.findUniqueOrThrow({
          where: { id: invite.teamId },
          select: { memberCount: true },
        });
        if (updatedTeam.memberCount >= 6) {
          await tx.team.update({ where: { id: invite.teamId }, data: { status: 'locked' } });
        }

      // Decline all other pending join requests for this student
      await tx.joinRequest.updateMany({
        where: {
          studentId: decoded.userId,
          status: { in: ['pending', 'on_hold', 'meeting_requested'] },
        },
        data: { status: 'declined' },
      });

      // Decline any pending invites for this student
      await tx.teamInvite.updateMany({
        where: {
          studentId: decoded.userId,
          status: { in: ['pending', 'on_hold', 'waitlist'] },
          id: { not: inviteId },
        },
        data: { status: 'declined' },
      });
      });
    } catch (error) {
      if (error instanceof Error && error.message === TEAM_FULL) {
        return NextResponse.json({ error: 'Target team is full or recruitment is closed.' }, { status: 409 });
      }
      if (error instanceof Error && error.message === ALREADY_PROCESSED) {
        return NextResponse.json({ error: 'Invitation has already been finalized.' }, { status: 409 });
      }
      if (error instanceof Error && error.message === STUDENT_IN_TEAM) {
        return NextResponse.json({ error: 'You have already joined another team.' }, { status: 409 });
      }
      throw error;
    }

    // Notify team leader of acceptance
    queueNotification(
      invite.team.leaderId,
      'invite_response',
      {
        title: 'Invitation Accepted',
        message: `${student?.name} has accepted your invitation and joined team "${invite.team.name}"!`,
        teamId: invite.teamId,
        teamName: invite.team.name,
        studentId: decoded.userId,
        studentName: student?.name,
        status: 'accepted',
      }
    );

    await recalculateTeamSkills(invite.teamId);
    revalidateTag('students', { expire: 0 });
    revalidateTag('teams', { expire: 0 });

    return NextResponse.json({ success: true, message: 'Joined team successfully.' });
  } catch (error) {
    logger.error('Respond team invite error', error);
    return NextResponse.json({ error: 'Failed to process invitation.' }, { status: 500 });
  }
}
