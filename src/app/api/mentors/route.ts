import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { checkUserRateLimit } from '@/lib/rateLimit';
import { mentorSearchQuerySchema, parseQuery } from '@/lib/validation';
import { sanitizeAvatarUrl } from '@/lib/avatar';
import { resolveSkillVariants } from '@/lib/skills';
import { logger } from '@/lib/logger';
import { Prisma } from '@prisma/client';

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

    const nameQuery = parsedQuery.data.name?.trim();
    const expertiseQuery = parsedQuery.data.expertise?.trim();
    const search = parsedQuery.data.search?.trim();

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const cursor = url.searchParams.get('cursor')?.trim() || null;
    const PAGE_SIZE = 24;

    const where: Prisma.MentorProfileWhereInput = {};
    const andConditions: Prisma.MentorProfileWhereInput[] = [];

    if (nameQuery) {
      andConditions.push({
        OR: [
          { name: { contains: nameQuery, mode: 'insensitive' } },
          { designation: { contains: nameQuery, mode: 'insensitive' } },
          { organization: { contains: nameQuery, mode: 'insensitive' } },
          {
            teams: {
              some: {
                OR: [
                  { name: { contains: nameQuery, mode: 'insensitive' } },
                  { teamCode: { contains: nameQuery, mode: 'insensitive' } },
                ],
              },
            },
          },
        ],
      });
    }

    if (expertiseQuery) {
      const expertiseVariants = resolveSkillVariants(expertiseQuery);
      andConditions.push({
        OR: [
          { expertise: { hasSome: expertiseVariants } },
          { bio: { contains: expertiseQuery, mode: 'insensitive' } },
          { designation: { contains: expertiseQuery, mode: 'insensitive' } },
        ],
      });
    }

    if (search) {
      const searchVariants = resolveSkillVariants(search);
      andConditions.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { designation: { contains: search, mode: 'insensitive' } },
          { organization: { contains: search, mode: 'insensitive' } },
          { bio: { contains: search, mode: 'insensitive' } },
          { expertise: { hasSome: searchVariants } },
          {
            teams: {
              some: {
                OR: [
                  { name: { contains: search, mode: 'insensitive' } },
                  { teamCode: { contains: search, mode: 'insensitive' } },
                ],
              },
            },
          },
        ],
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const [total, mentors, viewer] = await Promise.all([
      prisma.mentorProfile.count({ where }),
      prisma.mentorProfile.findMany({
        where,
        select: {
          userId: true,
          name: true,
          designation: true,
          organization: true,
          expertise: true,
          bio: true,
          linkedinUrl: true,
          avatarUrl: true,
          _count: { select: { teams: true } },
          teams: {
            select: { id: true, teamCode: true, name: true },
            take: 5,
            orderBy: { teamCode: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
        ...(cursor
          ? { cursor: { userId: cursor }, skip: 1, take: PAGE_SIZE }
          : { skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
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

    const nextCursor = mentors.length === PAGE_SIZE ? mentors[mentors.length - 1].userId : null;

    // Explicit DTO omitting private contact number and private emails
    const mentorResults = mentors.map((m) => ({
      userId: m.userId,
      name: m.name,
      designation: m.designation,
      organization: m.organization,
      college: m.organization,
      expertise: m.expertise,
      bio: m.bio,
      linkedinUrl: m.linkedinUrl,
      avatarUrl: sanitizeAvatarUrl(m.avatarUrl, m.userId),
      assignedTeamsCount: m._count.teams,
      assignedTeams: m.teams,
    }));

    return NextResponse.json({
      success: true,
      mentors: mentorResults,
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        total,
        totalPages: Math.ceil(total / PAGE_SIZE),
        cursor: cursor || undefined,
        nextCursor,
      },
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
