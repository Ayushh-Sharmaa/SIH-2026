import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { recalculateTeamSkills } from '@/lib/derived';
import { TeamStatus, Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';

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

    // Fetch caller's profile to check if they are a team leader
    const caller = await prisma.studentProfile.findUnique({
      where: { userId: decoded.userId },
      include: { team: { include: { members: true } } },
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

    // Verify target student exists and is open to joining
    const targetStudent = await prisma.studentProfile.findUnique({
      where: { userId: studentId },
    });

    if (!targetStudent) {
      return NextResponse.json({ error: 'Target student not found.' }, { status: 404 });
    }

    if (targetStudent.teamId) {
      return NextResponse.json({ error: 'This student is already in a team.' }, { status: 400 });
    }

    // Check duplicate invites
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

    const { inviteId, action } = await request.json(); // 'accept' or 'decline'
    if (!inviteId || (action !== 'accept' && action !== 'decline')) {
      return NextResponse.json({ error: 'Invite ID and valid action (accept/decline) are required.' }, { status: 400 });
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

    if (invite.status !== 'pending') {
      return NextResponse.json({ error: 'Invitation has already been processed.' }, { status: 400 });
    }

    if (action === 'decline') {
      await prisma.teamInvite.update({
        where: { id: inviteId },
        data: { status: 'declined' },
      });
      return NextResponse.json({ success: true, message: 'Invitation declined.' });
    }

    // Action is ACCEPT
    // Check if user is already in a team
    const student = await prisma.studentProfile.findUnique({
      where: { userId: decoded.userId },
    });

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
        data: { teamId: invite.teamId, teamStatus: TeamStatus.IN_TEAM },
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
          status: 'pending',
        },
        data: { status: 'declined' },
      });

      // Decline any pending invites for this student
      await tx.teamInvite.updateMany({
        where: {
          studentId: decoded.userId,
          status: 'pending',
        },
        data: { status: 'declined' },
      });
    });

    // Recalculate team skills
    await recalculateTeamSkills(invite.teamId);

    return NextResponse.json({ success: true, message: 'Joined team successfully.' });
  } catch (error) {
    logger.error('Respond team invite error', error);
    return NextResponse.json({ error: 'Failed to process invitation.' }, { status: 500 });
  }
}
