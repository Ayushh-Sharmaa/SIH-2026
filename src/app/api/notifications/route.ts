import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { logger } from '@/lib/logger';

interface NotificationResponse {
  id: string;
  dbId?: string;
  type: string;
  title: string;
  message: string;
  messageText?: string | null;
  teamName?: string;
  read: boolean;
  createdAt: Date;
}

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

    const notifications: NotificationResponse[] = [];
    const dbNotificationsPromise = prisma.notification.findMany({
      where: { userId: decoded.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const actionablePromise =
      decoded.role === 'MENTOR'
        ? prisma.mentorRequest
            .findMany({
              where: { mentorId: decoded.userId, status: 'pending' },
              select: {
                id: true,
                message: true,
                createdAt: true,
                team: {
                  select: {
                    name: true,
                    track: { select: { problemStatementCode: true } },
                  },
                },
              },
              take: 50,
            })
            .then((mentorRequests) => ({ mentorRequests, invites: [], joinRequests: [] }))
        : Promise.all([
            prisma.teamInvite.findMany({
              where: { studentId: decoded.userId, status: 'pending' },
              select: {
                id: true,
                createdAt: true,
                team: {
                  select: {
                    name: true,
                    track: { select: { problemStatementCode: true } },
                  },
                },
              },
              take: 50,
            }),
            prisma.joinRequest.findMany({
              where: {
                status: 'pending',
                team: { leaderId: decoded.userId },
              },
              select: {
                id: true,
                message: true,
                createdAt: true,
                student: { select: { name: true, branch: true, year: true } },
              },
              take: 50,
            }),
          ]).then(([invites, joinRequests]) => ({ mentorRequests: [], invites, joinRequests }));

    const [dbNotifications, actionable] = await Promise.all([
      dbNotificationsPromise,
      actionablePromise,
    ]);

    dbNotifications.forEach((n) => {
      const payload = n.payload as Record<string, unknown>;
      notifications.push({
        id: n.id,
        dbId: n.id,
        type: n.type,
        title: (payload.title as string) || 'Notification Update',
        message: (payload.message as string) || '',
        messageText: (payload.messageText as string) || null,
        teamName: (payload.teamName as string) || undefined,
        read: n.read,
        createdAt: n.createdAt,
      });
    });

    if (decoded.role === 'MENTOR') {
      actionable.mentorRequests.forEach((r) => {
        notifications.push({
          id: r.id,
          type: 'mentor_request',
          title: 'New Mentorship Request',
          message: `${r.team.name} has requested you as a guide for track ${r.team.track.problemStatementCode}.`,
          messageText: r.message,
          teamName: r.team.name,
          read: false,
          createdAt: r.createdAt,
        });
      });
    } else {
      actionable.invites.forEach((inv) => {
        notifications.push({
          id: inv.id,
          type: 'team_invite',
          title: 'New Team Invitation',
          message: `You have been invited to join team "${inv.team.name}" for track ${inv.team.track.problemStatementCode}.`,
          read: false,
          createdAt: inv.createdAt,
        });
      });

      actionable.joinRequests.forEach((req) => {
          notifications.push({
            id: req.id,
            type: 'join_request',
            title: 'New Join Request',
            message: `${req.student.name} (${req.student.branch}, ${req.student.year}) has requested to join your team.`,
            messageText: req.message,
            read: false,
            createdAt: req.createdAt,
          });
      });
    }

    // Sort all merged notifications by createdAt descending
    const sorted = notifications.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({
      success: true,
      notifications: sorted,
    });
  } catch (error) {
    logger.error('Fetch notifications error', error);
    return NextResponse.json({ error: 'Failed to retrieve notifications.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
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

    const body = await request.json();
    const { notificationId } = body;

    if (notificationId) {
      await prisma.notification.updateMany({
        where: { id: notificationId, userId: decoded.userId },
        data: { read: true },
      });
    } else {
      await prisma.notification.updateMany({
        where: { userId: decoded.userId, read: false },
        data: { read: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Mark notification read error', error);
    return NextResponse.json({ error: 'Failed to mark notification as read.' }, { status: 500 });
  }
}
