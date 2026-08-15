import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { checkUserRateLimit } from '@/lib/rateLimit';
import { mentorSearchQuerySchema, parseQuery } from '@/lib/validation';
import { logger } from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

    const expertiseQuery = parsedQuery.data.expertise?.trim().toLowerCase();
    const nameQuery = parsedQuery.data.name?.trim().toLowerCase();
    const search = parsedQuery.data.search?.trim().toLowerCase();

    const [mentors, viewer] = await Promise.all([
      prisma.mentorProfile.findMany({
        where: {
          verified: true,
        },
        select: {
          userId: true,
          name: true,
          designation: true,
          organization: true,
          expertise: true,
          bio: true,
          linkedinUrl: true,
          avatarUrl: true,
          contact: true,
          user: { select: { email: true, college: true } },
          _count: { select: { teams: true } },
          teams: {
            select: { id: true, teamCode: true, name: true },
            orderBy: { teamCode: 'asc' },
          },
        },
        take: 200,
      }),
      decoded.role === 'STUDENT'
        ? prisma.studentProfile.findUnique({
            where: { userId: decoded.userId },
            select: {
              teamId: true,
              team: {
                select: {
                  mentorId: true,
                  mentorRequests: {
                    where: { status: { in: ['pending', 'keep_pending', 'meeting_requested'] } },
                    select: { mentorId: true },
                  },
                },
              },
            },
          })
        : Promise.resolve(null),
    ]);

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
          const matchesCollege = (m.user?.college || '').toLowerCase().includes(search);
          const matchesDesig = m.designation.toLowerCase().includes(search);
          const matchesBio = m.bio?.toLowerCase().includes(search) || false;
          const matchesTeam = matchesTeamLookup(search);

          if (!matchesName && !matchesExpertise && !matchesOrg && !matchesCollege && !matchesDesig && !matchesBio && !matchesTeam) {
            return false;
          }
        }

        return true;
      });
    }

    return NextResponse.json({
      success: true,
      mentors: filtered.map(({ _count, user, ...mentor }) => ({
        ...mentor,
        email: user?.email || null,
        college: user?.college || mentor.organization,
        guidedTeamsCount: _count.teams,
      })),
      eligibility: {
        role: decoded.role,
        canRequest: decoded.role === 'STUDENT' && Boolean(viewer?.teamId) && !viewer?.team?.mentorId,
        reason:
          decoded.role !== 'STUDENT'
            ? 'Only students can request mentorship.'
            : !viewer?.teamId
              ? 'Join or create a team first.'
              : viewer.team?.mentorId
                ? 'Your team already has an assigned mentor.'
                : null,
        existingMentorIds: viewer?.team?.mentorRequests.map((request) => request.mentorId) ?? [],
      },
    });
  } catch (error) {
    logger.error('Search mentors error', error);
    return NextResponse.json({ error: 'Failed to retrieve mentors.' }, { status: 500 });
  }
}
