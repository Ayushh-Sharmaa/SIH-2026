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

    const { teamId, message } = await request.json();
    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required.' }, { status: 400 });
    }

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

    // Check if duplicate pending request exists
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

    const newRequest = await prisma.joinRequest.create({
      data: {
        teamId: teamId,
        studentId: decoded.userId,
        message: message?.trim(),
        status: 'pending',
      },
    });

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

    const { requestId, action } = await request.json(); // 'accept' or 'decline'
    if (!requestId || (action !== 'accept' && action !== 'decline')) {
      return NextResponse.json({ error: 'Request ID and valid action (accept/decline) are required.' }, { status: 400 });
    }

    const joinRequest = await prisma.joinRequest.findUnique({
      where: { id: requestId },
      include: { team: { include: { members: true } } },
    });

    if (!joinRequest) {
      return NextResponse.json({ error: 'Join request not found.' }, { status: 404 });
    }

    if (joinRequest.team.leaderId !== decoded.userId) {
      return NextResponse.json({ error: 'Only the team leader can manage join requests.' }, { status: 403 });
    }

    if (joinRequest.status !== 'pending') {
      return NextResponse.json({ error: 'Request has already been processed.' }, { status: 400 });
    }

    if (action === 'decline') {
      await prisma.joinRequest.update({
        where: { id: requestId },
        data: { status: 'declined' },
      });
      return NextResponse.json({ success: true, message: 'Request declined.' });
    }

    // Action is ACCEPT
    if (joinRequest.team.members.length >= 6) {
      return NextResponse.json({ error: 'Your team is already full (max 6 members).' }, { status: 400 });
    }

    // Process accept inside transaction
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Accept request
      await tx.joinRequest.update({
        where: { id: requestId },
        data: { status: 'accepted' },
      });

      // 2. Add student to team
      await tx.studentProfile.update({
        where: { userId: joinRequest.studentId },
        data: { teamId: joinRequest.teamId, teamStatus: TeamStatus.IN_TEAM },
      });

      // If team reaches 6 members, lock it
      if (joinRequest.team.members.length + 1 >= 6) {
        await tx.team.update({
          where: { id: joinRequest.teamId },
          data: { status: 'locked' },
        });
      }

      // Decline all other pending join requests for this student
      await tx.joinRequest.updateMany({
        where: {
          studentId: joinRequest.studentId,
          status: 'pending',
        },
        data: { status: 'declined' },
      });

      // Decline any pending invites for this student
      await tx.teamInvite.updateMany({
        where: {
          studentId: joinRequest.studentId,
          status: 'pending',
        },
        data: { status: 'declined' },
      });
    });

    // Recalculate team skills
    await recalculateTeamSkills(joinRequest.teamId);

    return NextResponse.json({ success: true, message: 'Student successfully added to your team.' });
  } catch (error) {
    logger.error('Respond join request error', error);
    return NextResponse.json({ error: 'Failed to process request response.' }, { status: 500 });
  }
}
