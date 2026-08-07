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
    const search = searchParams.get('search')?.trim().toLowerCase();
    const skillQuery = searchParams.get('skill')?.trim().toLowerCase();
    const softSkillQuery = searchParams.get('softSkill')?.trim();
    const languageQuery = searchParams.get('language')?.trim();
    const trackIdQuery = searchParams.get('trackId')?.trim();
    
    // Explicit filter inputs
    const nameParam = searchParams.get('name')?.trim().toLowerCase();
    const collegeParam = searchParams.get('college')?.trim().toLowerCase();
    const branchParam = searchParams.get('branch')?.trim().toLowerCase();
    const yearParam = searchParams.get('year')?.trim().toLowerCase();

    const where: import('@prisma/client').Prisma.StudentProfileWhereInput = {
      teamStatus: 'OPEN',
      userId: { not: decoded.userId }, // Exclude oneself
      isDemo: false,
      branch: { not: '' },
    };

    if (softSkillQuery) {
      where.softSkills = { has: softSkillQuery };
    }
    if (languageQuery) {
      where.languages = { has: languageQuery };
    }
    if (trackIdQuery) {
      where.trackInterest = { some: { id: trackIdQuery } };
    }

    const students = await prisma.studentProfile.findMany({
      where,
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
        teamStatus: true,
        trackInterest: {
          select: {
            id: true,
            name: true,
            problemStatementCode: true,
          },
        },
        user: {
          select: {
            college: true,
          },
        },
      },
      take: 200,
    });

    // Apply secondary filters in JS for exact case-insensitive matches & search logic
    let filtered = students;

    if (nameParam || collegeParam || branchParam || yearParam || skillQuery || search) {
      filtered = students.filter((s) => {
        const collegeName = s.user?.college?.toLowerCase() || '';

        if (nameParam && !s.name.toLowerCase().includes(nameParam)) {
          return false;
        }
        if (collegeParam && !collegeName.includes(collegeParam)) {
          return false;
        }
        if (branchParam && !s.branch.toLowerCase().includes(branchParam)) {
          return false;
        }
        if (yearParam && !s.year.toLowerCase().includes(yearParam)) {
          return false;
        }
        if (skillQuery && !s.skills.some((sk) => sk.toLowerCase().includes(skillQuery))) {
          return false;
        }

        if (search) {
          const matchesName = s.name.toLowerCase().includes(search);
          const matchesBranch = s.branch.toLowerCase().includes(search);
          const matchesYear = s.year.toLowerCase().includes(search);
          const matchesCollege = collegeName.includes(search);
          const matchesSkills = s.skills.some((sk) => sk.toLowerCase().includes(search));
          const matchesSoftSkills = s.softSkills.some((sk) => sk.toLowerCase().includes(search));
          const matchesLanguages = s.languages.some((sk) => sk.toLowerCase().includes(search));
          const matchesTracks = s.trackInterest.some(
            (t) => t.name.toLowerCase().includes(search) || t.problemStatementCode.toLowerCase().includes(search)
          );

          if (
            !matchesName &&
            !matchesBranch &&
            !matchesYear &&
            !matchesCollege &&
            !matchesSkills &&
            !matchesSoftSkills &&
            !matchesLanguages &&
            !matchesTracks
          ) {
            return false;
          }
        }

        return true;
      });
    }

    // Format output for UI
    const formatted = filtered.map((s) => ({
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
      teamStatus: s.teamStatus,
      college: s.user?.college || 'GL Bajaj Group of Institutions, Mathura',
      interests: s.trackInterest.map((t) => t.name),
    }));

    return NextResponse.json({
      success: true,
      students: formatted,
    });
  } catch (error) {
    logger.error('Search teammates error', error);
    return NextResponse.json({ error: 'Failed to retrieve teammates.' }, { status: 500 });
  }
}
