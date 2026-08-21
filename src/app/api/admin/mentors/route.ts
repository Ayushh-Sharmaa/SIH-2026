import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { isAuthorizedAdminEmail, getBannedEmails } from '@/lib/admin';
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
    const status = url.searchParams.get('status')?.trim();
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const cursor = url.searchParams.get('cursor')?.trim() || null;

    const where: Prisma.MentorProfileWhereInput = {
      isDemo: false,
    };

    const andConditions: Prisma.MentorProfileWhereInput[] = [];

    if (search) {
      andConditions.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { designation: { contains: search, mode: 'insensitive' } },
          { organization: { contains: search, mode: 'insensitive' } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
        ],
      });
    }

    if (status && status !== 'ALL') {
      if (status === 'VERIFIED') {
        andConditions.push({ verified: true });
      } else if (status === 'PENDING') {
        andConditions.push({ verified: false });
      }
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const [total, rawMentors, bannedEmailList] = await Promise.all([
      prisma.mentorProfile.count({ where }),
      prisma.mentorProfile.findMany({
        where,
        select: {
          userId: true,
          name: true,
          designation: true,
          organization: true,
          verified: true,
          isDemo: true,
          expertise: true,
          user: {
            select: {
              email: true,
            },
          },
          teams: {
            select: {
              id: true,
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

    const mentors = rawMentors.map((mp) => {
      const email = mp.user?.email || '';
      return {
        id: mp.userId,
        userId: mp.userId,
        name: mp.name || 'Faculty Member',
        email,
        designation: mp.designation || 'Faculty Mentor',
        organization: mp.organization || 'GL Bajaj Group of Institutions',
        guidedTeamsCount: mp.teams.length,
        verified: mp.verified ?? true,
        isDemo: mp.isDemo ?? false,
        isBanned: bannedEmails.has(email.toLowerCase()),
        expertise: mp.expertise || [],
      };
    });

    const nextCursor = rawMentors.length === PAGE_SIZE ? rawMentors[rawMentors.length - 1].userId : null;

    return NextResponse.json({
      success: true,
      mentors,
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
    logger.error('Admin mentors search error', error);
    return NextResponse.json({ error: 'Failed to search mentors.' }, { status: 500 });
  }
}
