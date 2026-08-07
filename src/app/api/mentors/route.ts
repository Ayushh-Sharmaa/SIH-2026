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
    const nameQuery = searchParams.get('name')?.trim().toLowerCase();
    const expertiseQuery = searchParams.get('expertise')?.trim().toLowerCase();

    // Fetch all verified mentors
    const mentors = await prisma.mentorProfile.findMany({
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

    let filtered = mentors;

    if (search || nameQuery || expertiseQuery) {
      filtered = mentors.filter((m) => {
        if (nameQuery && !m.name.toLowerCase().includes(nameQuery)) {
          return false;
        }

        if (expertiseQuery && !m.expertise.some((e) => e.toLowerCase().includes(expertiseQuery))) {
          return false;
        }

        if (search) {
          const matchesName = m.name.toLowerCase().includes(search);
          const matchesExpertise = m.expertise.some((e) => e.toLowerCase().includes(search));
          const matchesOrg = m.organization.toLowerCase().includes(search);
          const matchesDesig = m.designation.toLowerCase().includes(search);
          const matchesBio = m.bio?.toLowerCase().includes(search) || false;

          if (!matchesName && !matchesExpertise && !matchesOrg && !matchesDesig && !matchesBio) {
            return false;
          }
        }

        return true;
      });
    }

    return NextResponse.json({
      success: true,
      mentors: filtered,
    });
  } catch (error) {
    logger.error('Search mentors error', error);
    return NextResponse.json({ error: 'Failed to retrieve mentors.' }, { status: 500 });
  }
}
