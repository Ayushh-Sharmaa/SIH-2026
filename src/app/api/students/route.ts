import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { checkUserRateLimit } from '@/lib/rateLimit';
import { studentSearchQuerySchema, parseQuery } from '@/lib/validation';
import { logger } from '@/lib/logger';
import { unstable_cache } from 'next/cache';

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

    const parsedQuery = parseQuery(request.url, studentSearchQuerySchema);
    if (!parsedQuery.success) {
      return NextResponse.json({ error: 'Invalid search filters.' }, { status: 400 });
    }

    const nameParam = parsedQuery.data.name?.trim().toLowerCase();
    const skillQuery = parsedQuery.data.skill?.trim().toLowerCase();
    const softSkillQuery = parsedQuery.data.softSkill;
    const languageQuery = parsedQuery.data.language;
    const trackIdQuery = parsedQuery.data.trackId;
    const collegeParam = parsedQuery.data.college?.trim().toLowerCase();
    const branchParam = parsedQuery.data.branch?.trim().toLowerCase();
    const yearParam = parsedQuery.data.year?.trim().toLowerCase();
    const search = parsedQuery.data.search?.trim().toLowerCase();

    // Directly query database to always serve live, accurate data
    let students = await prisma.studentProfile.findMany({
      where: {
        isDemo: false,
        teamId: null,
        user: { role: 'STUDENT' },
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
        teamStatus: true,
        team: {
          select: {
            id: true,
            teamCode: true,
            name: true,
            status: true,
            leaderId: true,
            mentor: { select: { userId: true, name: true, designation: true, organization: true } },
          },
        },
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

    students = students.filter((s) => s.userId !== decoded.userId);
    if (softSkillQuery) {
      students = students.filter((s) => s.softSkills.includes(softSkillQuery));
    }
    if (languageQuery) {
      students = students.filter((s) => s.languages.includes(languageQuery));
    }
    if (trackIdQuery) {
      students = students.filter((s) => s.trackInterest?.some((t) => t.id === trackIdQuery));
    }

    // Apply secondary filters in JS for exact case-insensitive matches & search logic
    let filtered = students;

    if (nameParam || collegeParam || branchParam || yearParam || skillQuery || search) {
      filtered = students.filter((s) => {
        const collegeName = s.user?.college?.toLowerCase() || '';

        const teamCode = s.team?.teamCode.toLowerCase() || '';
        const teamName = s.team?.name.toLowerCase() || '';
        if (nameParam && !s.name.toLowerCase().includes(nameParam) && !teamCode.includes(nameParam) && !teamName.includes(nameParam)) {
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
          const matchesTeamCode = s.team?.teamCode.toLowerCase().includes(search) || false;
          const matchesTeamName = s.team?.name.toLowerCase().includes(search) || false;
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
            !matchesTeamCode &&
            !matchesTeamName &&
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
      team: s.team
        ? {
            id: s.team.id,
            teamCode: s.team.teamCode,
            name: s.team.name,
            status: s.team.status,
            leaderId: s.team.leaderId,
            mentor: s.team.mentor,
          }
        : null,
      college: s.user?.college || 'GL Bajaj Group of Institutions, Mathura',
      interests: s.trackInterest.map((t) => ({
        code: t.problemStatementCode,
        name: t.name,
      })),
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
