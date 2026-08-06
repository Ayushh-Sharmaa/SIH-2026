import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { checkUserRateLimit } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';


import { unstable_cache } from 'next/cache';

const getCachedStudents = unstable_cache(
  async () => {
    return prisma.studentProfile.findMany({
      where: {
        teamStatus: 'OPEN',
        isDemo: false,
        branch: { not: '' },
      },
      select: {
        userId: true,
        name: true,
        year: true,
        branch: true,
        skills: true,
        languages: true,
        softSkills: true,
        resumeUrl: true,
        githubUrl: true,
        linkedinUrl: true,
        avatarUrl: true,
        trackInterest: true, // Need this to filter by trackIdQuery in memory
      },
      take: 200,
    });
  },
  ['open-students'],
  { revalidate: 900, tags: ['students'] }
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

    const { searchParams } = new URL(request.url);
    const skillQuery = searchParams.get('skill')?.trim().toLowerCase();
    const softSkillQuery = searchParams.get('softSkill')?.trim();
    const languageQuery = searchParams.get('language')?.trim();
    const trackIdQuery = searchParams.get('trackId')?.trim();

    // Get base list from cache, filtering oneself out
    let students = await getCachedStudents();
    students = students.filter((s) => s.userId !== decoded.userId);

    // Apply exact match filters in memory
    if (softSkillQuery) {
      students = students.filter((s) => s.softSkills.includes(softSkillQuery));
    }
    if (languageQuery) {
      students = students.filter((s) => s.languages.includes(languageQuery));
    }
    if (trackIdQuery) {
      students = students.filter((s) => s.trackInterest?.some((t) => t.id === trackIdQuery));
    }

    const filtered = skillQuery
      ? students.filter((s) => s.skills.some((sk) => sk.toLowerCase().includes(skillQuery)))
      : students;

    return NextResponse.json({
      success: true,
      students: filtered,
    });
  } catch (error) {
    logger.error('Search teammates error', error);
    return NextResponse.json({ error: 'Failed to retrieve teammates.' }, { status: 500 });
  }
}
