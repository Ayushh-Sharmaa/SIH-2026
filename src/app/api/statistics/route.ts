import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // 1. Fetch all onboarded non-demo students
    const students = await prisma.studentProfile.findMany({
      where: { isDemo: false },
      select: {
        gender: true,
      },
    });

    const totalParticipants = students.length;
    const maleParticipants = students.filter(
      (s) => s.gender?.trim().toLowerCase() === 'male'
    ).length;
    const femaleParticipants = students.filter(
      (s) => s.gender?.trim().toLowerCase() === 'female'
    ).length;

    // 2. Fetch all teams and their non-demo members
    const teams = await prisma.team.findMany({
      select: {
        id: true,
        members: {
          where: { isDemo: false },
          select: {
            gender: true,
          },
        },
      },
    });

    // A registered team is one that has at least one registered non-demo member
    const nonDemoTeams = teams.filter((t) => t.members.length > 0);
    const teamsCount = nonDemoTeams.length;

    // An all-female team has at least 1 member and every member is female
    const allFemaleTeamsCount = nonDemoTeams.filter((t) =>
      t.members.every((m) => m.gender?.trim().toLowerCase() === 'female')
    ).length;

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
