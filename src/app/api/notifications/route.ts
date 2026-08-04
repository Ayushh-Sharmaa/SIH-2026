import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function GET() {
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

    if (decoded.role === 'MENTOR') {
      const requests = await prisma.mentorRequest.findMany({
        where: {
          mentorId: decoded.userId,
          status: 'pending',
        },
        include: {
          team: {
            include: { track: true },
          },
        },
      });

      return NextResponse.json({
        success: true,
        notifications: requests.map((r: any) => ({
          id: r.id,
          type: 'mentor_request',
          title: 'New Mentorship Request',
          message: `${r.team.name} has requested you as a guide for track ${r.team.track.problemStatementCode}.`,
          messageText: r.message,
          teamName: r.team.name,
          createdAt: r.createdAt,
        })),
      });
    }

    // Role is STUDENT
    // Find invites for this student
    const invites = await prisma.teamInvite.findMany({
      where: {
        studentId: decoded.userId,
        status: 'pending',
      },
      include: {
        team: {
          include: { track: true },
        },
      },
    });

    const notifications: any[] = invites.map((inv: any) => ({
      id: inv.id,
      type: 'team_invite',
      title: 'New Team Invitation',
      message: `You have been invited to join team "${inv.team.name}" for track ${inv.team.track.problemStatementCode}.`,
      createdAt: inv.createdAt,
    }));

    // Check if user is a team leader to query incoming join requests
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: decoded.userId },
      include: { team: true },
    });

    if (profile?.teamId && profile.team?.leaderId === decoded.userId) {
      const joinRequests = await prisma.joinRequest.findMany({
        where: {
          teamId: profile.teamId,
          status: 'pending',
        },
        include: {
          student: true,
        },
      });

      const reqNotifications = joinRequests.map((req: any) => ({
        id: req.id,
        type: 'join_request',
        title: 'New Join Request',
        message: `${req.student.name} (${req.student.branch}, ${req.student.year}) has requested to join your team.`,
        messageText: req.message,
        createdAt: req.createdAt,
      }));

      notifications.push(...reqNotifications);
    }

    return NextResponse.json({
      success: true,
      notifications: notifications.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    });
  } catch (error) {
    logger.error('Fetch notifications error', error);
    return NextResponse.json({ error: 'Failed to retrieve notifications.' }, { status: 500 });
  }
}
