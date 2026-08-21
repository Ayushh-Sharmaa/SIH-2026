import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { isAuthorizedAdminEmail, getBannedEmails } from '@/lib/admin';
import { checkUserRateLimit } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const PAGE_SIZE = 50;

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !(await isAuthorizedAdminEmail(decoded.email))) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const rateLimitResponse = await checkUserRateLimit(request, decoded.userId);
    if (rateLimitResponse) return rateLimitResponse;

    const url = new URL(request.url);
    const search = url.searchParams.get('search')?.trim();
    const status = url.searchParams.get('status')?.trim();
    const trackId = url.searchParams.get('trackId')?.trim();
    const allFemale = url.searchParams.get('allFemale')?.trim() === 'true';
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const cursor = url.searchParams.get('cursor')?.trim() || null;

    const where: Prisma.TeamWhereInput = {};
    const andConditions: Prisma.TeamWhereInput[] = [];

    if (search) {
      andConditions.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { teamCode: { contains: search, mode: 'insensitive' } },
          { track: { name: { contains: search, mode: 'insensitive' } } },
          { track: { problemStatementCode: { contains: search, mode: 'insensitive' } } },
          { members: { some: { name: { contains: search, mode: 'insensitive' } } } },
          { members: { some: { user: { email: { contains: search, mode: 'insensitive' } } } } },
        ],
      });
    }

    if (status && status !== 'ALL') {
      if (status === 'FULL') {
        andConditions.push({
          OR: [
            { memberCount: { gte: 6 } },
            { status: { in: ['locked', 'approved', 'complete'] } },
          ],
        });
      } else if (status === 'FORMING') {
        andConditions.push({
          status: 'forming',
          memberCount: { lt: 6 },
        });
      } else {
        andConditions.push({ status: { equals: status, mode: 'insensitive' } });
      }
    }

    if (trackId && trackId !== 'ALL') {
      andConditions.push({
        OR: [
          { trackId },
          { track: { problemStatementCode: trackId } },
        ],
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const [total, rawTeams, bannedEmailList] = await Promise.all([
      prisma.team.count({ where }),
      prisma.team.findMany({
        where,
        select: {
          id: true,
          teamCode: true,
          name: true,
          status: true,
          memberCount: true,
          trackId: true,
          leaderId: true,
          skillsCovered: true,
          skillsNeeded: true,
          track: {
            select: {
              id: true,
              problemStatementCode: true,
              name: true,
              category: true,
            },
          },
          members: {
            select: {
              userId: true,
              name: true,
              rollNo: true,
              section: true,
              branch: true,
              year: true,
              gender: true,
              isDemo: true,
              teamId: true,
              teamStatus: true,
              skills: true,
              softSkills: true,
              languages: true,
              resumeUrl: true,
              githubUrl: true,
              linkedinUrl: true,
              user: {
                select: {
                  email: true,
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
      getBannedEmails(),
    ]);

    const bannedEmails = new Set(bannedEmailList.map((e) => e.toLowerCase()));

    let teams = rawTeams.map((team) => {
      const leader = team.members.find((m) => m.userId === team.leaderId) || team.members[0];
      const femaleCount = team.members.filter((m) => String(m.gender).toLowerCase() === 'female').length;
      const maleCount = team.members.filter((m) => String(m.gender).toLowerCase() === 'male').length;
      const isAllFemale = team.members.length > 0 && femaleCount === team.members.length;

      const members = team.members.map((sp) => {
        const email = sp.user?.email || '';
        return {
          id: sp.userId,
          userId: sp.userId,
          name: sp.name || 'Unnamed Student',
          email,
          rollNo: sp.rollNo || 'N/A',
          section: sp.section || 'N/A',
          branch: sp.branch || 'N/A',
          year: sp.year || 'N/A',
          gender: sp.gender || 'Not Specified',
          isDemo: sp.isDemo ?? false,
          teamName: team.name,
          teamCode: team.teamCode,
          teamId: team.id,
          teamStatus: sp.teamStatus || 'IN_TEAM',
          skills: sp.skills || [],
          softSkills: sp.softSkills || [],
          languages: sp.languages || [],
          resumeUrl: sp.resumeUrl || null,
          githubUrl: sp.githubUrl || null,
          linkedinUrl: sp.linkedinUrl || null,
          avatarUrl: `/api/avatar/${sp.userId}`,
          isBanned: bannedEmails.has(email.toLowerCase()),
          verified: true,
        };
      });

      return {
        id: team.id,
        teamCode: team.teamCode,
        name: team.name,
        status: team.status || 'forming',
        memberCount: team.members.length,
        maxCapacity: 6,
        trackId: team.trackId,
        trackCode: team.track?.problemStatementCode || team.trackId,
        trackName: team.track ? `${team.track.problemStatementCode} - ${team.track.name}` : team.trackId,
        leaderName: leader?.name || 'Unknown Leader',
        leaderEmail: leader?.user?.email || '',
        members,
        femaleCount,
        maleCount,
        isAllFemale,
        skillsCovered: team.skillsCovered || [],
        skillsNeeded: team.skillsNeeded || [],
      };
    });

    if (allFemale) {
      teams = teams.filter((t) => t.isAllFemale);
    }

    const nextCursor = rawTeams.length === PAGE_SIZE ? rawTeams[rawTeams.length - 1].id : null;

    return NextResponse.json({
      success: true,
      teams,
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        total,
        totalPages: Math.ceil(total / PAGE_SIZE),
        cursor: cursor || undefined,
        nextCursor,
      },
    });
  } catch (error) {
    logger.error('Admin teams search error', error);
    return NextResponse.json({ error: 'Failed to search teams.' }, { status: 500 });
  }
}
