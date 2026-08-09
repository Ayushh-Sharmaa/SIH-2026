import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { checkUserRateLimit } from '@/lib/rateLimit';
import { teamMemberActionSchema } from '@/lib/validation';
import { recalculateTeamSkills } from '@/lib/derived';
import { TeamStatus, Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';
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
    const parsed = teamMemberActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid membership action format.' }, { status: 400 });
    }

    const { action, targetUserId } = parsed.data;

    // Fetch caller's profile to find their teamId
    const caller = await prisma.studentProfile.findUnique({
      where: { userId: decoded.userId },
    });

    if (!caller || !caller.teamId) {
      return NextResponse.json({ error: 'You are not in a team.' }, { status: 400 });
    }

    const teamId = caller.teamId;

    // Fetch the team including members
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { members: true },
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found.' }, { status: 404 });
    }

    if (action === 'leave') {
      const isLeader = team.leaderId === decoded.userId;

      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        if (isLeader) {
          // If they are the only member, delete the team
          if (team.members.length <= 1) {
            // Delete team
            await tx.team.delete({ where: { id: teamId } });
          } else {
            // Transfer leadership to the next member
            const nextLeader = team.members.find((m) => m.userId !== decoded.userId);
            if (nextLeader) {
              await tx.team.update({
                where: { id: teamId },
                data: { leaderId: nextLeader.userId },
              });
            }
          }
        }

        // Set student's team to null
        await tx.studentProfile.update({
          where: { userId: decoded.userId },
          data: { teamId: null, teamStatus: TeamStatus.OPEN },
        });
      });

      // Recalculate skills for remaining team (if still exists)
      if (team.members.length > 1) {
        await recalculateTeamSkills(teamId);
        // If team was locked, reopen it
        if (team.status === 'locked' || team.status === 'complete') {
          await prisma.team.update({
            where: { id: teamId },
            data: { status: 'forming' },
          });
        }
      }

      revalidateTag('students', { expire: 0 });
      revalidateTag('teams', { expire: 0 });

      return NextResponse.json({ success: true, message: 'You have left the team.' });
    }

    // Action is KICK
    if (team.leaderId !== decoded.userId) {
      return NextResponse.json({ error: 'Only the team leader can kick members.' }, { status: 403 });
    }

    if (!targetUserId) {
      return NextResponse.json({ error: 'Target user ID to kick is required.' }, { status: 400 });
    }

    if (targetUserId === decoded.userId) {
      return NextResponse.json({ error: 'You cannot kick yourself. Please leave the team instead.' }, { status: 400 });
    }

    const targetMember = team.members.find((m) => m.userId === targetUserId);
    if (!targetMember) {
      return NextResponse.json({ error: 'Target user is not a member of your team.' }, { status: 400 });
    }

    await prisma.studentProfile.update({
      where: { userId: targetUserId },
      data: { teamId: null, teamStatus: TeamStatus.OPEN },
    });

    // Recalculate skills
    await recalculateTeamSkills(teamId);

    // Reopen team status if locked
    if (team.status === 'locked' || team.status === 'complete') {
      await prisma.team.update({
        where: { id: teamId },
        data: { status: 'forming' },
      });
    }

    revalidateTag('students', { expire: 0 });
    revalidateTag('teams', { expire: 0 });

    return NextResponse.json({ success: true, message: 'Member kicked successfully.' });
  } catch (error) {
    logger.error('Roster membership action error', error);
    return NextResponse.json({ error: 'Failed to process membership action.' }, { status: 500 });
  }
}
