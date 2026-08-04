import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
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
    const skillQuery = searchParams.get('skill')?.trim().toLowerCase();
    const softSkillQuery = searchParams.get('softSkill')?.trim();
    const languageQuery = searchParams.get('language')?.trim();
    const trackIdQuery = searchParams.get('trackId')?.trim();

    // Fetch all students who are looking for a team
    let students = await prisma.studentProfile.findMany({
      where: {
        teamStatus: 'OPEN',
        userId: { not: decoded.userId }, // Do not include oneself in search results
      },
    });

    // Client-side filtering for array fields to support clean fuzzy matching
    if (skillQuery) {
      students = students.filter((s: any) =>
        s.skills.some((sk: any) => sk.toLowerCase().includes(skillQuery))
      );
    }

    if (softSkillQuery) {
      students = students.filter((s: any) =>
        s.softSkills.includes(softSkillQuery)
      );
    }

    if (languageQuery) {
      students = students.filter((s: any) =>
        s.languages.includes(languageQuery)
      );
    }

    if (trackIdQuery) {
      // Fetch details including track interests relations
      const studentsWithTracks = await prisma.studentProfile.findMany({
        where: {
          teamStatus: 'OPEN',
          userId: { not: decoded.userId },
          trackInterest: {
            some: { id: trackIdQuery },
          },
        },
      });

      // Intersect with the already filtered ones
      const studentIds = new Set(studentsWithTracks.map((s: any) => s.userId));
      students = students.filter((s: any) => studentIds.has(s.userId));
    }

    return NextResponse.json({
      success: true,
      students: students.map((s: any) => ({
        userId: s.userId,
        name: s.name,
        year: s.year,
        branch: s.branch,
        skills: s.skills,
        languages: s.languages,
        softSkills: s.softSkills,
        resumeUrl: s.resumeUrl,
        githubUrl: s.githubUrl,
        linkedinUrl: s.linkedinUrl,
        avatarUrl: s.avatarUrl,
      })),
    });
  } catch (error) {
    logger.error('Search teammates error', error);
    return NextResponse.json({ error: 'Failed to retrieve teammates.' }, { status: 500 });
  }
}
