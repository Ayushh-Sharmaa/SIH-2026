import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [genderGroups, teamsCount, allFemaleTeamsCount] = await Promise.all([
      prisma.studentProfile.groupBy({
        by: ['gender'],
        where: { isDemo: false },
        _count: { _all: true },
      }),
      prisma.team.count({
        where: { members: { some: { isDemo: false } } },
      }),
      prisma.team.count({
        where: {
          members: {
            some: { isDemo: false },
            none: {
              isDemo: false,
              NOT: { gender: { equals: 'female', mode: 'insensitive' } },
            },
          },
        },
      }),
    ]);

    const countGender = (gender: string) =>
      genderGroups
        .filter((group) => group.gender?.trim().toLowerCase() === gender)
        .reduce((total, group) => total + group._count._all, 0);
    const totalParticipants = genderGroups.reduce(
      (total, group) => total + group._count._all,
      0
    );
    const maleParticipants = countGender('male');
    const femaleParticipants = countGender('female');

    return NextResponse.json(
      {
        totalParticipants,
        teamsCount,
        maleParticipants,
        femaleParticipants,
        allFemaleTeams: allFemaleTeamsCount,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    console.error('[STATISTICS_API_ERROR]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
