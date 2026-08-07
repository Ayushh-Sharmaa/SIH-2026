import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { recalculateTeamSkills } from '@/lib/derived';
import { TeamStatus, Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';
import { createNotification } from '@/lib/notifications';

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

    const { studentId } = await request.json();
    if (!studentId) {
      return NextResponse.json({ error: 'Student ID to invite is required.' }, { status: 400 });
    }

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

    const invite = await prisma.teamInvite.create({
      data: {
        teamId: team.id,
        studentId: studentId,
        status: 'pending',
      },
    });

    // Notify target student
    await createNotification(
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

    const { inviteId, action } = await request.json(); // 'accept', 'decline', 'on_hold', 'waitlist'
    if (!inviteId || !['accept', 'decline', 'on_hold', 'waitlist'].includes(action)) {
      return NextResponse.json({ error: 'Invite ID and a valid action are required.' }, { status: 400 });
    }

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
      await createNotification(
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
      await createNotification(
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
      await createNotification(
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

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Accept invite
      await tx.teamInvite.update({
        where: { id: inviteId },
        data: { status: 'accepted' },
      });

      // 2. Add member
      await tx.studentProfile.update({
        where: { userId: decoded.userId },
        data: { teamId: invite.teamId, teamStatus: TeamStatus.IN_TEAM, roleInTeam: 'Member' },
      });

      // If team reaches 6 members, lock it
      if (invite.team.members.length + 1 >= 6) {
        await tx.team.update({
          where: { id: invite.teamId },
          data: { status: 'locked' },
        });
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

    // Notify team leader of acceptance
    await createNotification(
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

    return NextResponse.json({ success: true, message: 'Joined team successfully.' });
  } catch (error) {
    logger.error('Respond team invite error', error);
    return NextResponse.json({ error: 'Failed to process invitation.' }, { status: 500 });
  }
}
