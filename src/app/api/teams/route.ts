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
      return NextResponse.json({ error: 'Unauthorized. Only students can create teams.' }, { status: 401 });
    }

    const { name, trackId, whatsapp } = await request.json();
    if (!name?.trim() || !trackId?.trim()) {
      return NextResponse.json({ error: 'Team name and Track ID are required.' }, { status: 400 });
    }

    // Check if the student has a profile and is not already in a team
    const student = await prisma.studentProfile.findUnique({
      where: { userId: decoded.userId },
    });

    if (!student) {
      return NextResponse.json({ error: 'Please complete onboarding before creating a team.' }, { status: 400 });
    }

    if (student.teamId) {
      return NextResponse.json({ error: 'You are already a member of a team.' }, { status: 400 });
    }

    // Verify track exists
    const track = await prisma.track.findUnique({
      where: { id: trackId },
    });

    if (!track) {
      return NextResponse.json({ error: 'Selected Track does not exist.' }, { status: 404 });
    }

    // Create the team and associate the leader inside a transaction
    const newTeam = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Create the team
      const team = await tx.team.create({
        data: {
          name: name.trim(),
          trackId: trackId,
          leaderId: decoded.userId,
          status: 'forming',
          whatsapp: whatsapp?.trim() || null,
        },
      });

      // 2. Link student to team
      await tx.studentProfile.update({
        where: { userId: decoded.userId },
        data: {
          teamId: team.id,
          teamStatus: TeamStatus.IN_TEAM,
        },
      });

      return team;
    });

    // 3. Trigger skill recalculation
    await recalculateTeamSkills(newTeam.id);

    return NextResponse.json({
      success: true,
      message: 'Team created successfully.',
      teamId: newTeam.id,
    });
  } catch (error) {
    logger.error('Create team error', error);
    return NextResponse.json({ error: 'Failed to create team.' }, { status: 500 });
  }
}
