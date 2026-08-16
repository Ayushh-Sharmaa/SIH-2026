import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { checkUserRateLimit } from '@/lib/rateLimit';
import { createTeamSchema, deleteTeamSchema, updateTeamDetailsSchema } from '@/lib/validation';
import { nextTeamCode } from '@/lib/teamCode';
import { recalculateTeamSkills } from '@/lib/derived';
import { TeamStatus, Prisma } from '@prisma/client';
import { sanitizeAvatarUrl } from '@/lib/avatar';
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

    const limited = await checkUserRateLimit(request, decoded.userId);
    if (limited) return limited;

    const url = new URL(request.url);
    const search = url.searchParams.get('search')?.trim();
    const domain = url.searchParams.get('domain')?.trim();
    const skill = url.searchParams.get('skill')?.trim();
    const leader = url.searchParams.get('leader')?.trim();
    const size = url.searchParams.get('size')?.trim();
    const status = url.searchParams.get('status')?.trim().toLowerCase(); // 'open' or 'closed'
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const cursor = url.searchParams.get('cursor')?.trim() || null;
    const PAGE_SIZE = 24;

    const where: Prisma.TeamWhereInput = {};
    const andConditions: Prisma.TeamWhereInput[] = [];

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

    if (domain) {
      andConditions.push({
        track: {
          category: { contains: domain, mode: 'insensitive' },
        },
      });
    }

    if (skill) {
      andConditions.push({
        OR: [
          { skillsCovered: { has: skill } },
          { skillsNeeded: { has: skill } },
        ],
      });
    }

    if (leader) {
      andConditions.push({
        members: {
          some: {
            name: { contains: leader, mode: 'insensitive' },
          },
        },
      });
    }

    if (search && search.length >= 2) {
      andConditions.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { teamCode: { contains: search, mode: 'insensitive' } },
          { skillsCovered: { has: search } },
          { skillsNeeded: { has: search } },
          { track: { name: { contains: search, mode: 'insensitive' } } },
          { track: { problemStatementCode: { contains: search, mode: 'insensitive' } } },
          { secondaryTrack: { name: { contains: search, mode: 'insensitive' } } },
          { secondaryTrack: { problemStatementCode: { contains: search, mode: 'insensitive' } } },
          { members: { some: { name: { contains: search, mode: 'insensitive' } } } },
        ],
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const [total, teams, viewerProfile] = await Promise.all([
      prisma.team.count({ where }),
      prisma.team.findMany({
        where,
        select: {
          id: true,
          teamCode: true,
          name: true,
          leaderId: true,
          memberCount: true,
          status: true,
          skillsCovered: true,
          skillsNeeded: true,
          whatsapp: true,
          logoUrl: true,
          track: {
            select: {
              id: true,
              problemStatementCode: true,
              name: true,
              category: true,
            },
          },
          secondaryTrack: {
            select: {
              id: true,
              problemStatementCode: true,
              name: true,
              category: true,
            },
          },
          recruitmentNotices: {
            select: {
              id: true,
              role: true,
              gender: true,
              abilities: true,
              requirements: true,
            },
            take: 3,
          },
          members: {
            select: {
              userId: true,
              name: true,
              branch: true,
              year: true,
              avatarUrl: true,
              roleInTeam: true,
              user: {
                select: {
                  college: true,
                },
              },
            },
            take: 6,
          },
        },
        orderBy: { teamCode: 'asc' },
        ...(cursor
          ? { cursor: { id: cursor }, skip: 1, take: PAGE_SIZE }
          : { skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
      }),
      decoded.role === 'STUDENT'
        ? prisma.studentProfile.findUnique({
            where: { userId: decoded.userId },
            select: { teamId: true },
          })
        : Promise.resolve(null),
    ]);

    const nextCursor = teams.length === PAGE_SIZE ? teams[teams.length - 1].id : null;

    const formattedTeams = teams.map((team) => ({
      ...team,
      logoUrl: sanitizeAvatarUrl(team.logoUrl, team.id),
      members: team.members.map((m) => ({
        ...m,
        avatarUrl: sanitizeAvatarUrl(m.avatarUrl, m.userId),
      })),
    }));

    return NextResponse.json({
      success: true,
      teams: formattedTeams,
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        total,
        totalPages: Math.ceil(total / PAGE_SIZE),
        cursor: cursor || undefined,
        nextCursor,
      },
      viewer: {
        role: decoded.role,
        hasTeam: Boolean(viewerProfile?.teamId),
        canJoin: decoded.role === 'STUDENT' && !viewerProfile?.teamId,
      },
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
      select: { id: true },
    });
    if (!team) return NextResponse.json({ error: 'Team not found or you are not the leader.' }, { status: 403 });

    await prisma.$transaction(async (tx) => {
      await tx.studentProfile.updateMany({
        where: { teamId: team.id },
        data: { teamId: null, teamStatus: TeamStatus.OPEN, roleInTeam: 'Member' },
      });
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
