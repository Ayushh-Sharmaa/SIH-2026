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
    const expertiseQuery = searchParams.get('expertise')?.trim().toLowerCase();

    // Fetch all verified mentors
    let mentors = await prisma.mentorProfile.findMany({
      where: {
        verified: true,
      },
      include: {
        user: { select: { email: true } },
      },
    });

    if (expertiseQuery) {
      mentors = mentors.filter((m: any) =>
        m.expertise.some((e: any) => e.toLowerCase().includes(expertiseQuery))
      );
    }

    return NextResponse.json({
      success: true,
      mentors: mentors.map((m: any) => ({
        userId: m.userId,
        name: m.name,
        designation: m.designation,
        organization: m.organization,
        expertise: m.expertise,
        capacity: m.capacity,
        currentLoad: m.currentLoad,
        bio: m.bio,
        linkedinUrl: m.linkedinUrl,
        email: m.user.email,
      })),
    });
  } catch (error) {
    logger.error('Search mentors error', error);
    return NextResponse.json({ error: 'Failed to retrieve mentors.' }, { status: 500 });
  }
}
