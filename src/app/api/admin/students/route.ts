import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { getBannedEmails, isAuthorizedAdminEmail } from '@/lib/admin';
import { checkUserRateLimit } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const PAGE_SIZE = 50;

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !(await isAuthorizedAdminEmail(decoded.email))) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const rateLimitResponse = await checkUserRateLimit(request, decoded.userId);
    if (rateLimitResponse) return rateLimitResponse;

    const url = new URL(request.url);
    const search = url.searchParams.get('search')?.trim();
    const year = url.searchParams.get('year')?.trim();
    const branch = url.searchParams.get('branch')?.trim();
    const section = url.searchParams.get('section')?.trim();
    const gender = url.searchParams.get('gender')?.trim();
    const status = url.searchParams.get('status')?.trim();
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const cursor = url.searchParams.get('cursor')?.trim() || null;

    const where: Prisma.StudentProfileWhereInput = {
      isDemo: false,
    };

    const andConditions: Prisma.StudentProfileWhereInput[] = [];

    if (search) {
      andConditions.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { rollNo: { contains: search, mode: 'insensitive' } },
          { branch: { contains: search, mode: 'insensitive' } },
          { section: { contains: search, mode: 'insensitive' } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
          { team: { name: { contains: search, mode: 'insensitive' } } },
          { team: { teamCode: { contains: search, mode: 'insensitive' } } },
        ],
      });
    }

    if (year && year !== 'ALL') {
      andConditions.push({ year: { contains: year, mode: 'insensitive' } });
    }

    if (branch && branch !== 'ALL') {
      andConditions.push({ branch: { contains: branch, mode: 'insensitive' } });
    }

    if (section && section !== 'ALL') {
      andConditions.push({ section: { equals: section, mode: 'insensitive' } });
    }

    if (gender && gender !== 'ALL') {
      andConditions.push({ gender: { equals: gender, mode: 'insensitive' } });
    }

    if (status && status !== 'ALL') {
      if (status === 'IN_TEAM') {
        andConditions.push({ teamId: { not: null } });
      } else if (status === 'OPEN') {
        andConditions.push({ teamId: null });
      }
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const [total, rawStudents, bannedEmailList] = await Promise.all([
      prisma.studentProfile.count({ where }),
      prisma.studentProfile.findMany({
        where,
        select: {
          userId: true,
          name: true,
          rollNo: true,
          section: true,
          branch: true,
          year: true,
          gender: true,
          isDemo: true,
          teamId: true,
          teamStatus: true,
          skills: true,
          softSkills: true,
          languages: true,
          resumeUrl: true,
          githubUrl: true,
          linkedinUrl: true,
          user: {
            select: {
              email: true,
            },
          },
          team: {
            select: {
              id: true,
              name: true,
              teamCode: true,
            },
          },
        },
        orderBy: { name: 'asc' },
        ...(cursor
          ? { cursor: { userId: cursor }, skip: 1, take: PAGE_SIZE }
          : { skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
      }),
      getBannedEmails(),
    ]);

    const bannedEmails = new Set(bannedEmailList.map((e) => e.toLowerCase()));

    const students = rawStudents.map((sp) => {
      const email = sp.user?.email || '';
      return {
        id: sp.userId,
        userId: sp.userId,
        name: sp.name || 'Unnamed Student',
        email,
        rollNo: sp.rollNo || 'N/A',
        section: sp.section || 'N/A',
        branch: sp.branch || 'N/A',
        year: sp.year || 'N/A',
        gender: sp.gender || 'Not Specified',
        isDemo: sp.isDemo ?? false,
        teamName: sp.team?.name || null,
        teamCode: sp.team?.teamCode || null,
        teamId: sp.teamId || null,
        teamStatus: sp.teamStatus || 'OPEN',
        skills: sp.skills || [],
        softSkills: sp.softSkills || [],
        languages: sp.languages || [],
        resumeUrl: sp.resumeUrl || null,
        githubUrl: sp.githubUrl || null,
        linkedinUrl: sp.linkedinUrl || null,
        avatarUrl: `/api/avatar/${sp.userId}`,
        isBanned: bannedEmails.has(email.toLowerCase()),
        verified: true,
      };
    });

    const nextCursor = rawStudents.length === PAGE_SIZE ? rawStudents[rawStudents.length - 1].userId : null;

    return NextResponse.json({
      success: true,
      students,
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
    logger.error('Admin students search error', error);
    return NextResponse.json({ error: 'Failed to search students.' }, { status: 500 });
  }
}
