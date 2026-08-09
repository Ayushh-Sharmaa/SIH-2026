import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { checkUserRateLimit } from '@/lib/rateLimit';
import { mentorSearchQuerySchema, parseQuery } from '@/lib/validation';
import { logger } from '@/lib/logger';
import { unstable_cache } from 'next/cache';

const getCachedMentors = unstable_cache(
  async () => {
    return prisma.mentorProfile.findMany({
      where: {
        verified: true,
      },
      select: {
        userId: true,
        name: true,
        designation: true,
        organization: true,
        expertise: true,
        capacity: true,
        currentLoad: true,
        bio: true,
        linkedinUrl: true,
        teams: {
          select: { id: true, teamCode: true, name: true },
          orderBy: { teamCode: 'asc' },
        },
      },
      take: 200,
    });
  },
  ['verified-mentors'],
  { revalidate: 900, tags: ['mentors'] }
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

    const parsedQuery = parseQuery(request.url, mentorSearchQuerySchema);
    if (!parsedQuery.success) {
      return NextResponse.json({ error: 'Invalid search filters.' }, { status: 400 });
    }

    const nameQuery = parsedQuery.data.name?.trim().toLowerCase();
    const expertiseQuery = parsedQuery.data.expertise?.trim().toLowerCase();
    const search = parsedQuery.data.search?.trim().toLowerCase();

    const mentors = await getCachedMentors();

    let filtered = mentors;

    if (search || nameQuery || expertiseQuery) {
      filtered = mentors.filter((m) => {
        const matchesTeamLookup = (value: string) => m.teams.some(
          (team) => team.teamCode.toLowerCase().includes(value) || team.name.toLowerCase().includes(value)
        );

        if (nameQuery && !m.name.toLowerCase().includes(nameQuery) && !matchesTeamLookup(nameQuery)) {
          return false;
        }

        if (expertiseQuery && !m.expertise.some((e) => e.toLowerCase().includes(expertiseQuery))) {
          return false;
        }

        if (search) {
          const matchesName = m.name.toLowerCase().includes(search);
          const matchesExpertise = m.expertise.some((e) => e.toLowerCase().includes(search));
          const matchesOrg = m.organization.toLowerCase().includes(search);
          const matchesDesig = m.designation.toLowerCase().includes(search);
          const matchesBio = m.bio?.toLowerCase().includes(search) || false;
          const matchesTeam = matchesTeamLookup(search);

          if (!matchesName && !matchesExpertise && !matchesOrg && !matchesDesig && !matchesBio && !matchesTeam) {
            return false;
          }
        }

        return true;
      });
    }

    return NextResponse.json({
      success: true,
      mentors: filtered,
    });
  } catch (error) {
    logger.error('Search mentors error', error);
    return NextResponse.json({ error: 'Failed to retrieve mentors.' }, { status: 500 });
  }
}
