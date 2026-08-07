import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { recalculateTeamSkills } from '@/lib/derived';
import { TeamStatus, Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim().toLowerCase();
    const domain = searchParams.get('domain')?.trim().toLowerCase();
    const skill = searchParams.get('skill')?.trim().toLowerCase();
    const leader = searchParams.get('leader')?.trim().toLowerCase();
    const size = searchParams.get('size')?.trim();
    const status = searchParams.get('status')?.trim().toLowerCase(); // 'open' or 'closed'

    const where: Prisma.TeamWhereInput = {};

    if (size) {
      const parsedSize = parseInt(size, 10);
      if (!isNaN(parsedSize)) {
        where.memberCount = parsedSize;
      }
    }

    if (status) {
      if (status === 'open') {
        where.status = 'forming';
        where.memberCount = { lt: 6 };
      } else if (status === 'closed') {
        where.OR = [
          { status: { not: 'forming' } },
          { memberCount: { gte: 6 } },
        ];
      }
    }

    const teams = await prisma.team.findMany({
      where,
      include: {
        track: true,
        members: {
          select: {
            userId: true,
            name: true,
            branch: true,
            year: true,
            avatarUrl: true,
            skills: true,
            roleInTeam: true,
            user: {
              select: {
                college: true,
              },
            },
          },
        },
      },
    });

    let filtered = teams;

    if (search || domain || skill || leader) {
      filtered = teams.filter((t) => {
        const teamLeader = t.members.find((m) => m.userId === t.leaderId);

        // 1. Leader filter
        if (leader && (!teamLeader || !teamLeader.name.toLowerCase().includes(leader))) {
          return false;
        }

        // 2. Domain filter
        if (domain && !t.track.category.toLowerCase().includes(domain) && !t.track.name.toLowerCase().includes(domain)) {
          return false;
        }

        // 3. Skill filter
        if (skill && !t.skillsCovered.some((s) => s.toLowerCase().includes(skill)) && !t.skillsNeeded.some((s) => s.toLowerCase().includes(skill))) {
          return false;
        }

        // 4. Search query
        if (search) {
          const matchesName = t.name.toLowerCase().includes(search);
          const matchesLeader = teamLeader ? teamLeader.name.toLowerCase().includes(search) : false;
          const matchesTrack = t.track.name.toLowerCase().includes(search) || t.track.problemStatementCode.toLowerCase().includes(search);
          const matchesDomain = t.track.category.toLowerCase().includes(search);
          const matchesSkills = t.skillsCovered.some((s) => s.toLowerCase().includes(search)) || t.skillsNeeded.some((s) => s.toLowerCase().includes(search));
          const matchesMembers = t.members.some((m) => m.name.toLowerCase().includes(search));
          const matchesCollege = t.members.some((m) => m.user.college.toLowerCase().includes(search));

          if (!matchesName && !matchesLeader && !matchesTrack && !matchesDomain && !matchesSkills && !matchesMembers && !matchesCollege) {
            return false;
          }
        }

        return true;
      });
    }

    return NextResponse.json({
      success: true,
      teams: filtered,
    });
  } catch (error) {
    logger.error('Search teams error', error);
    return NextResponse.json({ error: 'Failed to retrieve teams.' }, { status: 500 });
  }
}

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

    const student = await prisma.studentProfile.findUnique({
      where: { userId: decoded.userId },
    });

    if (!student) {
      return NextResponse.json({ error: 'Please complete onboarding before creating a team.' }, { status: 400 });
    }

    if (student.teamId) {
      return NextResponse.json({ error: 'You are already a member of a team.' }, { status: 400 });
    }

    const track = await prisma.track.findUnique({
      where: { id: trackId },
    });

    if (!track) {
      return NextResponse.json({ error: 'Selected Track does not exist.' }, { status: 404 });
    }

    const newTeam = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const team = await tx.team.create({
        data: {
          name: name.trim(),
          trackId: trackId,
          leaderId: decoded.userId,
          status: 'forming',
          whatsapp: whatsapp?.trim() || null,
        },
      });

      await tx.studentProfile.update({
        where: { userId: decoded.userId },
        data: {
          teamId: team.id,
          teamStatus: TeamStatus.IN_TEAM,
          roleInTeam: 'Leader',
        },
      });

      return team;
    });

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

    const body = await request.json();
    const { action, teamId, status, whatsapp, trackId, targetUserId, newRole } = body;

    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        leaderId: decoded.userId,
      },
      include: {
        members: true,
      },
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found or you are not the leader.' }, { status: 403 });
    }

    if (action === 'update_recruitment') {
      if (status !== 'forming' && status !== 'locked') {
        return NextResponse.json({ error: 'Invalid recruitment status.' }, { status: 400 });
      }

      if (status === 'forming' && team.members.length >= 6) {
        return NextResponse.json({ error: 'Cannot open recruitment. Team is already full.' }, { status: 400 });
      }

      await prisma.team.update({
        where: { id: teamId },
        data: { status },
      });

      return NextResponse.json({ success: true, message: `Recruitment ${status === 'forming' ? 'opened' : 'closed'}.` });
    }

    if (action === 'update_member_role') {
      if (!targetUserId || !newRole) {
        return NextResponse.json({ error: 'Target user ID and new role are required.' }, { status: 400 });
      }

      const isMember = team.members.some((m) => m.userId === targetUserId);
      if (!isMember) {
        return NextResponse.json({ error: 'User is not a member of your team.' }, { status: 400 });
      }

      await prisma.studentProfile.update({
        where: { userId: targetUserId },
        data: { roleInTeam: newRole },
      });

      return NextResponse.json({ success: true, message: 'Member role updated.' });
    }

    if (action === 'update_team_details') {
      const updateData: import('@prisma/client').Prisma.TeamUpdateInput = {};
      if (whatsapp !== undefined) {
        updateData.whatsapp = whatsapp?.trim() || null;
      }
      if (trackId !== undefined) {
        const track = await prisma.track.findUnique({ where: { id: trackId } });
        if (!track) {
          return NextResponse.json({ error: 'Invalid track ID.' }, { status: 400 });
        }
        updateData.trackId = trackId;
      }

      await prisma.team.update({
        where: { id: teamId },
        data: updateData,
      });

      return NextResponse.json({ success: true, message: 'Team details updated successfully.' });
    }

    return NextResponse.json({ error: 'Invalid action specified.' }, { status: 400 });
  } catch (error) {
    logger.error('Update team error', error);
    return NextResponse.json({ error: 'Failed to update team details.' }, { status: 500 });
  }
}
