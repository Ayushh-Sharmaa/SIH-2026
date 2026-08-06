import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { checkUserRateLimit } from '@/lib/rateLimit';
import { mentorSearchQuerySchema, parseQuery } from '@/lib/validation';
import { logger } from '@/lib/logger';


import { unstable_cache } from 'next/cache';

const getCachedMentors = unstable_cache(
  async () => {
    return prisma.mentorProfile.findMany({
      where: {
        verified: true,
      },
      select: {
        userId: true,
        name: true,
        designation: true,
        organization: true,
        expertise: true,
        capacity: true,
        currentLoad: true,
        bio: true,
        linkedinUrl: true,
      },
      take: 200,
    });
  },
  ['verified-mentors'],
  { revalidate: 900, tags: ['mentors'] }
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

    const parsedQuery = parseQuery(request.url, mentorSearchQuerySchema);
    if (!parsedQuery.success) {
      return NextResponse.json({ error: 'Invalid search filters.' }, { status: 400 });
    }
    const expertiseQuery = parsedQuery.data.expertise?.toLowerCase();
    const nameQuery = parsedQuery.data.name?.toLowerCase();

    let mentors = await getCachedMentors();

    if (nameQuery) {
      mentors = mentors.filter((m) => m.name.toLowerCase().includes(nameQuery));
    }

    if (expertiseQuery) {
      mentors = mentors.filter((m) =>
        m.expertise.some((e) => e.toLowerCase().includes(expertiseQuery))
      );
    }

    return NextResponse.json({
      success: true,
      mentors,
    });
  } catch (error) {
    logger.error('Search mentors error', error);
    return NextResponse.json({ error: 'Failed to retrieve mentors.' }, { status: 500 });
  }
}
