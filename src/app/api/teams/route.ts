import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { checkUserRateLimit } from '@/lib/rateLimit';
import { createTeamSchema, deleteTeamSchema, updateTeamDetailsSchema } from '@/lib/validation';
import { nextTeamCode } from '@/lib/teamCode';
import { recalculateTeamSkills } from '@/lib/derived';
import { TeamStatus, Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';
import { revalidateTag } from 'next/cache';

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
        secondaryTrack: true,
        recruitmentNotices: true,
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
          const matchesTeamCode = t.teamCode.toLowerCase().includes(search);
          const matchesLeader = teamLeader ? teamLeader.name.toLowerCase().includes(search) : false;
          const matchesTrack =
            t.track.name.toLowerCase().includes(search) ||
            t.track.problemStatementCode.toLowerCase().includes(search) ||
            (t.secondaryTrack && (
              t.secondaryTrack.name.toLowerCase().includes(search) ||
              t.secondaryTrack.problemStatementCode.toLowerCase().includes(search)
            ));
          const matchesDomain = t.track.category.toLowerCase().includes(search);
          const matchesSkills = t.skillsCovered.some((s) => s.toLowerCase().includes(search)) || t.skillsNeeded.some((s) => s.toLowerCase().includes(search));
          const matchesMembers = t.members.some((m) => m.name.toLowerCase().includes(search));
          const matchesCollege = t.members.some((m) => m.user.college.toLowerCase().includes(search));

          if (!matchesName && !matchesTeamCode && !matchesLeader && !matchesTrack && !matchesDomain && !matchesSkills && !matchesMembers && !matchesCollege) {
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

    // Authenticated user rate limit check
    const rateLimitResponse = await checkUserRateLimit(request, decoded.userId);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json().catch(() => ({}));
    
    // Parse/Validate input using Zod Schema
    const parsed = createTeamSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid team creation parameters.' }, { status: 400 });
    }

    const {
      name,
      trackId,
      secondaryTrackId,
      whatsapp,
      logoUrl,
      customMentorName,
      customMentorDesignation,
      customMentorMobile,
      customMentorEmail,
      customPsCode,
      customPsName,
      customPsCategory,
      customSecondaryPsCode,
      customSecondaryPsName,
      customSecondaryPsCategory,
    } = parsed.data;

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

    let finalTrackId = trackId;
    if (trackId === 'custom' && customPsCode) {
      const code = customPsCode.trim().toUpperCase();
      let track = await prisma.track.findUnique({
        where: { problemStatementCode: code },
      });
      if (!track) {
        track = await prisma.track.create({
          data: {
            problemStatementCode: code,
            name: customPsName || 'Custom Problem Statement',
            category: customPsCategory || 'Software',
            description: 'Created dynamically for team formation.',
          },
        });
      }
      finalTrackId = track.id;
    } else {
      const track = await prisma.track.findUnique({
        where: { id: trackId },
      });

      if (!track) {
        return NextResponse.json({ error: 'Selected Track does not exist.' }, { status: 404 });
      }
    }

    let finalSecondaryTrackId: string | null = null;
    if (secondaryTrackId && secondaryTrackId !== 'none') {
      if (secondaryTrackId === 'custom' && customSecondaryPsCode) {
        const code = customSecondaryPsCode.trim().toUpperCase();
        let track = await prisma.track.findUnique({
          where: { problemStatementCode: code },
        });
        if (!track) {
          track = await prisma.track.create({
            data: {
              problemStatementCode: code,
              name: customSecondaryPsName || 'Custom Problem Statement',
              category: customSecondaryPsCategory || 'Software',
              description: 'Created dynamically for team formation.',
            },
          });
        }
        finalSecondaryTrackId = track.id;
      } else {
        const track = await prisma.track.findUnique({
          where: { id: secondaryTrackId },
        });
        if (track) {
          finalSecondaryTrackId = track.id;
        }
      }
    }

    const newTeam = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const team = await tx.team.create({
        data: {
          teamCode: await nextTeamCode(tx),
          name,
          trackId: finalTrackId,
          secondaryTrackId: finalSecondaryTrackId,
          leaderId: decoded.userId,
          status: 'forming',
          whatsapp: whatsapp || null,
          logoUrl: logoUrl || null,
          customMentorName: customMentorName || null,
          customMentorDesignation: customMentorDesignation || null,
          customMentorMobile: customMentorMobile || null,
          customMentorEmail: customMentorEmail || null,
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
    revalidateTag('teams', { expire: 0 });
    revalidateTag('students', { expire: 0 });

    // Dummy comment to trigger IDE diagnostics refresh
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
    const { action, teamId, status, targetUserId, newRole } = body;

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

      revalidateTag('teams', { expire: 0 });

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
      const parsed = updateTeamDetailsSchema.safeParse(body);
      if (!parsed.success) return NextResponse.json({ error: 'Invalid team details.' }, { status: 400 });
      const details = parsed.data;
      const track = await prisma.track.findUnique({ where: { id: details.trackId } });
      if (!track) return NextResponse.json({ error: 'Invalid track ID.' }, { status: 400 });

      let finalSecondaryTrackId: string | null = null;
      if (details.secondaryTrackId && details.secondaryTrackId !== 'none') {
        if (details.secondaryTrackId === 'custom' && details.customSecondaryPsCode) {
          const code = details.customSecondaryPsCode.trim().toUpperCase();
          let track = await prisma.track.findUnique({
            where: { problemStatementCode: code },
          });
          if (!track) {
            track = await prisma.track.create({
              data: {
                problemStatementCode: code,
                name: details.customSecondaryPsName || 'Custom Problem Statement',
                category: details.customSecondaryPsCategory || 'Software',
                description: 'Created dynamically for team formation.',
              },
            });
          }
          finalSecondaryTrackId = track.id;
        } else {
          const track = await prisma.track.findUnique({
            where: { id: details.secondaryTrackId },
          });
          if (track) {
            finalSecondaryTrackId = track.id;
          }
        }
      }

      await prisma.team.update({
        where: { id: teamId },
        data: {
          name: details.name,
          trackId: details.trackId,
          secondaryTrackId: finalSecondaryTrackId,
          whatsapp: details.whatsapp?.trim() || null,
          logoUrl: details.logoUrl?.trim() || null,
          customMentorName: details.customMentorName?.trim() || null,
          customMentorDesignation: details.customMentorDesignation?.trim() || null,
          customMentorMobile: details.customMentorMobile?.trim() || null,
          customMentorEmail: details.customMentorEmail?.trim() || null,
        },
      });

      await recalculateTeamSkills(teamId);

      revalidateTag('teams', { expire: 0 });
      revalidateTag('students', { expire: 0 });
      revalidateTag('mentors', { expire: 0 });

      return NextResponse.json({ success: true, message: 'Team details updated successfully.' });
    }

    return NextResponse.json({ error: 'Invalid action specified.' }, { status: 400 });
  } catch (error) {
    logger.error('Update team error', error);
    return NextResponse.json({ error: 'Failed to update team details.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const token = (await cookies()).get('token')?.value;
    const decoded = token ? verifyToken(token) : null;
    if (!decoded || decoded.role !== 'STUDENT') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const limited = await checkUserRateLimit(request, decoded.userId);
    if (limited) return limited;
    const parsed = deleteTeamSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) return NextResponse.json({ error: 'Team ID is required.' }, { status: 400 });

    const team = await prisma.team.findFirst({
      where: { id: parsed.data.teamId, leaderId: decoded.userId },
      select: { id: true, mentorId: true },
    });
    if (!team) return NextResponse.json({ error: 'Team not found or you are not the leader.' }, { status: 403 });

    await prisma.$transaction(async (tx) => {
      await tx.studentProfile.updateMany({
        where: { teamId: team.id },
        data: { teamId: null, teamStatus: TeamStatus.OPEN, roleInTeam: 'Member' },
      });
      if (team.mentorId) {
        await tx.mentorProfile.updateMany({
          where: { userId: team.mentorId, currentLoad: { gt: 0 } },
          data: { currentLoad: { decrement: 1 } },
        });
      }
      await tx.team.delete({ where: { id: team.id } });
    });
    revalidateTag('teams', { expire: 0 });
    revalidateTag('students', { expire: 0 });
    revalidateTag('mentors', { expire: 0 });
    return NextResponse.json({ success: true, message: 'Team deleted successfully.' });
  } catch (error) {
    logger.error('Delete team error', error);
    return NextResponse.json({ error: 'Failed to delete team.' }, { status: 500 });
  }
}
