import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { checkUserRateLimit } from '@/lib/rateLimit';
import { teamSearchQuerySchema, parseQuery } from '@/lib/validation';
import { logger } from '@/lib/logger';
import { unstable_cache } from 'next/cache';

const getCachedTeams = unstable_cache(
  async () => {
    return prisma.team.findMany({
      where: {
        status: 'forming',
      },
      select: {
        id: true,
        teamCode: true,
        name: true,
        memberCount: true,
        skillsCovered: true,
        skillsNeeded: true,
        trackId: true,
        track: {
          select: {
            id: true,
            name: true,
            problemStatementCode: true,
          }
        },
        joinRequests: {
          select: {
            studentId: true,
            status: true,
          }
        },
        invites: {
          select: {
            studentId: true,
            status: true,
          }
        }
      },
      take: 200,
    });
  },
  ['forming-teams'],
  { revalidate: 900, tags: ['teams'] }
);

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

    const parsedQuery = parseQuery(request.url, teamSearchQuerySchema);
    if (!parsedQuery.success) {
      return NextResponse.json({ error: 'Invalid search filters.' }, { status: 400 });
    }

    const nameQuery = parsedQuery.data.name?.toLowerCase();
    const skillQuery = parsedQuery.data.skill?.toLowerCase();
    const trackIdQuery = parsedQuery.data.trackId;

    let teams = await getCachedTeams();

    if (nameQuery) {
      teams = teams.filter((t) => t.name.toLowerCase().includes(nameQuery) || t.teamCode.toLowerCase().includes(nameQuery));
    }
    
    if (trackIdQuery) {
      teams = teams.filter((t) => t.trackId === trackIdQuery);
    }

    if (skillQuery) {
      teams = teams.filter((t) => t.skillsNeeded.some((sk) => sk.toLowerCase().includes(skillQuery)));
    }

    // Format the response so the frontend knows if the current user has already requested to join
    const formattedTeams = teams.map(t => {
      return {
        id: t.id,
        teamCode: t.teamCode,
        name: t.name,
        memberCount: t.memberCount,
        skillsCovered: t.skillsCovered,
        skillsNeeded: t.skillsNeeded,
        track: t.track,
        hasRequested: t.joinRequests.some(r => r.studentId === decoded.userId && r.status === 'pending'),
        hasBeenInvited: t.invites.some(i => i.studentId === decoded.userId && i.status === 'pending'),
      };
    });

    return NextResponse.json({
      success: true,
      teams: formattedTeams,
    });
  } catch (error) {
    logger.error('Search teams error', error);
    return NextResponse.json({ error: 'Failed to retrieve teams.' }, { status: 500 });
  }
}
