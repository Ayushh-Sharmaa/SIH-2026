import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { checkUserRateLimit } from '@/lib/rateLimit';
import { studentSearchQuerySchema, parseQuery } from '@/lib/validation';
import { sanitizeAvatarUrl } from '@/lib/avatar';
import { logger } from '@/lib/logger';
import { Prisma } from '@prisma/client';

import { resolveSkillVariants, resolveSoftSkillVariants, resolveLanguageVariants } from '@/lib/skills';

const PAGE_SIZE = 24;

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

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));

    const nameParam = parsedQuery.data.name?.trim();
    const skillQuery = parsedQuery.data.skill?.trim();
    const softSkillQuery = parsedQuery.data.softSkill?.trim();
    const languageQuery = parsedQuery.data.language?.trim();
    const trackIdQuery = parsedQuery.data.trackId?.trim();
    const collegeParam = parsedQuery.data.college?.trim();
    const branchParam = parsedQuery.data.branch?.trim();
    const yearParam = parsedQuery.data.year?.trim();
    const search = parsedQuery.data.search?.trim();

    // Construct database-side filter
    const where: Prisma.StudentProfileWhereInput = {
      isDemo: false,
      userId: { not: decoded.userId },
      teamId: null, // Only show students looking for teams
      user: { role: 'STUDENT' },
    };

    const andConditions: Prisma.StudentProfileWhereInput[] = [];

    if (search && search.length >= 2) {
      const searchSkillVariants = resolveSkillVariants(search);
      const searchSoftVariants = resolveSoftSkillVariants(search);
      const searchLangVariants = resolveLanguageVariants(search);

      andConditions.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { branch: { contains: search, mode: 'insensitive' } },
          { year: { contains: search, mode: 'insensitive' } },
          { skills: { hasSome: searchSkillVariants } },
          { softSkills: { hasSome: searchSoftVariants } },
          { languages: { hasSome: searchLangVariants } },
          { trackInterest: { some: { name: { contains: search, mode: 'insensitive' } } } },
          { trackInterest: { some: { problemStatementCode: { contains: search, mode: 'insensitive' } } } },
        ],
      });
    }

    if (nameParam) {
      andConditions.push({ name: { contains: nameParam, mode: 'insensitive' } });
    }

    if (branchParam) {
      andConditions.push({ branch: { contains: branchParam, mode: 'insensitive' } });
    }

    if (yearParam && yearParam !== 'All years') {
      andConditions.push({ year: { contains: yearParam, mode: 'insensitive' } });
    }

    if (skillQuery) {
      const skillVariants = resolveSkillVariants(skillQuery);
      andConditions.push({ skills: { hasSome: skillVariants } });
    }

    if (softSkillQuery && softSkillQuery !== 'All soft skills') {
      const softVariants = resolveSoftSkillVariants(softSkillQuery);
      andConditions.push({ softSkills: { hasSome: softVariants } });
    }

    if (languageQuery && languageQuery !== 'All languages') {
      const langVariants = resolveLanguageVariants(languageQuery);
      andConditions.push({ languages: { hasSome: langVariants } });
    }

    if (trackIdQuery) {
      andConditions.push({ trackInterest: { some: { id: trackIdQuery } } });
    }

    if (collegeParam) {
      andConditions.push({ user: { college: { contains: collegeParam, mode: 'insensitive' } } });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const cursor = url.searchParams.get('cursor')?.trim() || null;

    // Execute bounded database query with lightweight projection (zero N+1, zero private PII)
    const [total, students] = await Promise.all([
      prisma.studentProfile.count({ where }),
      prisma.studentProfile.findMany({
        where,
        select: {
          userId: true,
          name: true,
          year: true,
          branch: true,
          skills: true,
          languages: true,
          softSkills: true,
          avatarUrl: true,
          teamStatus: true,
          user: {
            select: {
              college: true,
            },
          },
          trackInterest: {
            select: {
              id: true,
              name: true,
              problemStatementCode: true,
            },
          },
        },
        orderBy: { userId: 'asc' },
        ...(cursor
          ? { cursor: { userId: cursor }, skip: 1, take: PAGE_SIZE }
          : { skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
      }),
    ]);

    const formatted = students.map((s) => ({
      userId: s.userId,
      name: s.name,
      year: s.year,
      branch: s.branch,
      skills: s.skills,
      languages: s.languages,
      softSkills: s.softSkills,
      avatarUrl: sanitizeAvatarUrl(s.avatarUrl, s.userId),
      teamStatus: s.teamStatus,
      college: s.user?.college || 'GL Bajaj Group of Institutions, Mathura',
      interests: s.trackInterest.map((t) => ({
        code: t.problemStatementCode,
        name: t.name,
      })),
    }));

    const nextCursor = students.length === PAGE_SIZE ? students[students.length - 1].userId : null;

    return NextResponse.json({
      success: true,
      students: formatted,
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        total,
        totalPages: Math.ceil(total / PAGE_SIZE),
        cursor: cursor || undefined,
        nextCursor,
      },
    });
  } catch (error) {
    logger.error('Database teammate search error', error);
    return NextResponse.json({ error: 'Failed to retrieve teammates.' }, { status: 500 });
  }
}
