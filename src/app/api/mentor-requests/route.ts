import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { mentorId, message } = await request.json();
    if (!mentorId) {
      return NextResponse.json({ error: 'Mentor ID is required.' }, { status: 400 });
    }

    // Fetch caller's profile to check if they are the leader of a team
    const caller = await prisma.studentProfile.findUnique({
      where: { userId: decoded.userId },
      include: { team: true },
    });

    if (!caller || !caller.teamId) {
      return NextResponse.json({ error: 'You are not in a team.' }, { status: 400 });
    }

    const team = caller.team;
    if (!team) {
      return NextResponse.json({ error: 'Team record not found.' }, { status: 404 });
    }
    if (team.leaderId !== decoded.userId) {
      return NextResponse.json({ error: 'Only the team leader can request a mentor.' }, { status: 403 });
    }

    if (team.mentorId) {
      return NextResponse.json({ error: 'Your team already has an assigned mentor.' }, { status: 400 });
    }

    // Verify mentor details
    const mentor = await prisma.mentorProfile.findUnique({
      where: { userId: mentorId },
    });

    if (!mentor) {
      return NextResponse.json({ error: 'Target mentor not found.' }, { status: 404 });
    }

    if (!mentor.verified) {
      return NextResponse.json({ error: 'Target mentor is not verified yet by the administrators.' }, { status: 400 });
    }

    if (mentor.currentLoad >= mentor.capacity) {
      return NextResponse.json({ error: 'Target mentor has reached their full guided capacity.' }, { status: 400 });
    }

    // Check duplicate requests
    const existing = await prisma.mentorRequest.findFirst({
      where: {
        teamId: team.id,
        mentorId: mentorId,
        status: 'pending',
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'A request has already been sent to this mentor.' }, { status: 400 });
    }

    const newRequest = await prisma.mentorRequest.create({
      data: {
        teamId: team.id,
        mentorId: mentorId,
        message: message?.trim(),
        status: 'pending',
      },
    });

    return NextResponse.json({ success: true, message: 'Mentorship request sent successfully.', requestId: newRequest.id });
  } catch (error) {
    logger.error('Create mentor request error', error);
    return NextResponse.json({ error: 'Failed to request mentor guidance.' }, { status: 500 });
  }
}
