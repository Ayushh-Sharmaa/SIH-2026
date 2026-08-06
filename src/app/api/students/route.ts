import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { checkUserRateLimit } from '@/lib/rateLimit';
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

    // The teammate directory is filterable by skill, language and track, so an
    // unlimited caller can enumerate the whole student body one facet at a time.
    const limited = await checkUserRateLimit(request, decoded.userId);
    if (limited) return limited;

    const { searchParams } = new URL(request.url);
    const skillQuery = searchParams.get('skill')?.trim().toLowerCase();
    const softSkillQuery = searchParams.get('softSkill')?.trim();
    const languageQuery = searchParams.get('language')?.trim();
    const trackIdQuery = searchParams.get('trackId')?.trim();

    // One query, filtered in the database.
    //
    // This previously fetched every OPEN student with no `select` and no
    // `take`, filtered skills/languages in Node, and — when `trackId` was
    // supplied — issued a *second* full table scan and intersected the two in
    // memory. Postgres can do all of it with array containment on an indexed
    // column. `take` is the important part: without it the payload grows with
    // enrollment forever.
    //
    // `softSkill` and `language` are exact matches (`has`), so they move
    // straight into the where clause. `skill` is a substring search, which
    // Prisma cannot express over a String[], so it stays in Node — but now it
    // runs over an already-bounded result set rather than the whole table.
    const students = await prisma.studentProfile.findMany({
      where: {
        teamStatus: 'OPEN',
        userId: { not: decoded.userId }, // Do not include oneself in search results
        isDemo: false, // Sandbox rows are not real classmates
        branch: { not: '' },
        ...(softSkillQuery ? { softSkills: { has: softSkillQuery } } : {}),
        ...(languageQuery ? { languages: { has: languageQuery } } : {}),
        ...(trackIdQuery ? { trackInterest: { some: { id: trackIdQuery } } } : {}),
      },
      // `resumeUrl` is included: unlike the faculty emails in /api/mentors
      // (which no UI ever rendered), this is a link the student uploads
      // specifically so prospective teammates can find them, and the directory
      // renders it as a "Résumé" chip. It stays scoped to signed-in members of
      // a single-college platform.
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
      },
      take: 200,
    });

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
