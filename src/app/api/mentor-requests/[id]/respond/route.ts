import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'MENTOR') {
      return NextResponse.json({ error: 'Unauthorized. Only mentors can respond to requests.' }, { status: 401 });
    }

    const { action } = await request.json(); // 'accept' or 'decline'
    if (action !== 'accept' && action !== 'decline') {
      return NextResponse.json({ error: 'Invalid action specified. Must be accept or decline.' }, { status: 400 });
    }

    // 1. Fetch the request
    const mentorRequest = await prisma.mentorRequest.findUnique({
      where: { id },
      include: {
        team: true,
        mentor: true,
      },
    });

    if (!mentorRequest) {
      return NextResponse.json({ error: 'Mentor request not found.' }, { status: 404 });
    }

    if (mentorRequest.mentorId !== decoded.userId) {
      return NextResponse.json({ error: 'You are not authorized to respond to this request.' }, { status: 403 });
    }

    if (mentorRequest.status !== 'pending') {
      return NextResponse.json({ error: 'This request has already been processed.' }, { status: 400 });
    }

    if (action === 'decline') {
      await prisma.mentorRequest.update({
        where: { id },
        data: { status: 'declined' },
      });
      return NextResponse.json({ success: true, message: 'Request declined successfully.' });
    }

    // Action is ACCEPT
    // 2. Verification check
    if (!mentorRequest.mentor.verified) {
      return NextResponse.json({ error: 'Your profile is not verified yet. Verified mentors are required.' }, { status: 400 });
    }

    // 3. Capacity check
    if (mentorRequest.mentor.currentLoad >= mentorRequest.mentor.capacity) {
      return NextResponse.json({ error: 'You have reached your mentoring capacity limit.' }, { status: 400 });
    }

    // 4. Update request status, link team, and increment current load inside transaction
    await prisma.$transaction(async (tx: any) => {
      // Set request as accepted
      await tx.mentorRequest.update({
        where: { id },
        data: { status: 'accepted' },
      });

      // Link mentor to team
      await tx.team.update({
        where: { id: mentorRequest.teamId },
        data: { mentorId: decoded.userId },
      });

      // Increment mentor load
      await tx.mentorProfile.update({
        where: { userId: decoded.userId },
        data: { currentLoad: { increment: 1 } },
      });

      // Decline other pending mentor requests for this team
      await tx.mentorRequest.updateMany({
        where: {
          teamId: mentorRequest.teamId,
          status: 'pending',
        },
        data: { status: 'declined' },
      });
    });

    return NextResponse.json({ success: true, message: 'Request accepted successfully.' });
  } catch (error) {
    logger.error('Respond mentor request error', error);
    return NextResponse.json({ error: 'Failed to process request.' }, { status: 500 });
  }
}
