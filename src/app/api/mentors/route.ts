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

    // Keyed on the caller, not the IP: this is the mentor roster, and the
    // interesting abuse is one authenticated account paging it repeatedly to
    // rebuild the staff directory that the `select` above deliberately trims.
    const limited = await checkUserRateLimit(request, decoded.userId);
    if (limited) return limited;

    const { searchParams } = new URL(request.url);
    const expertiseQuery = searchParams.get('expertise')?.trim().toLowerCase();

    // Fetch all verified mentors
    //
    // Emails are deliberately not selected. Every faculty address used to be
    // returned to any caller holding a valid token — including the passwordless
    // sandbox account — which made this endpoint a one-request staff-email
    // harvest. Contact details belong behind an accepted mentor request.
    let mentors = await prisma.mentorProfile.findMany({
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
