import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { checkUserRateLimit } from '@/lib/rateLimit';
import { sanitizeAvatarUrl } from '@/lib/avatar';
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

    const limited = await checkUserRateLimit(request, decoded.userId);
    if (limited) return limited;

    // Mentor Stage 2 data loader
    if (decoded.role === 'MENTOR') {
      const [assignedTeams, mentorRequests] = await Promise.all([
        prisma.team.findMany({
          where: { mentorId: decoded.userId },
          select: {
            id: true,
            teamCode: true,
            name: true,
            status: true,
            memberCount: true,
            leaderId: true,
            track: {
              select: { id: true, name: true, problemStatementCode: true },
            },
            secondaryTrack: {
              select: { id: true, name: true, problemStatementCode: true },
            },
            members: {
              select: {
                userId: true,
                name: true,
                branch: true,
                year: true,
                avatarUrl: true,
                roleInTeam: true,
                contact: true,
                user: { select: { email: true } },
              },
              take: 6,
            },
          },
          orderBy: { teamCode: 'asc' },
        }),
        prisma.mentorRequest.findMany({
          where: { mentorId: decoded.userId },
          select: {
            id: true,
            status: true,
            message: true,
            createdAt: true,
            team: {
              select: {
                id: true,
                teamCode: true,
                name: true,
                memberCount: true,
                track: {
                  select: { id: true, name: true, problemStatementCode: true },
                },
                members: {
                  select: {
                    userId: true,
                    name: true,
                    branch: true,
                    year: true,
                    avatarUrl: true,
                    roleInTeam: true,
                  },
                  take: 6,
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        }),
      ]);

      const formattedTeams = assignedTeams.map((team) => ({
        ...team,
        members: team.members.map((m) => ({
          ...m,
          avatarUrl: sanitizeAvatarUrl(m.avatarUrl, m.userId),
        })),
      }));

      const formattedRequests = mentorRequests.map((req) => ({
        ...req,
        team: req.team
          ? {
              ...req.team,
              members: req.team.members.map((m) => ({
                ...m,
                avatarUrl: sanitizeAvatarUrl(m.avatarUrl, m.userId),
              })),
            }
          : null,
      }));

      return NextResponse.json({
        success: true,
        role: 'MENTOR',
        teams: formattedTeams,
        mentorRequests: formattedRequests,
      });
    }

    const student = await prisma.studentProfile.findUnique({
      where: { userId: decoded.userId },
      select: {
        userId: true,
        teamId: true,
        joinRequests: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            team: {
              select: {
                id: true,
                teamCode: true,
                name: true,
                track: {
                  select: { id: true, name: true, problemStatementCode: true },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        teamInvites: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            team: {
              select: {
                id: true,
                teamCode: true,
                name: true,
                track: {
                  select: { id: true, name: true, problemStatementCode: true },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        team: {
          select: {
            id: true,
            teamCode: true,
            name: true,
            status: true,
            leaderId: true,
            memberCount: true,
            whatsapp: true,
            logoUrl: true,
            customMentorName: true,
            customMentorDesignation: true,
            customMentorMobile: true,
            customMentorEmail: true,
            track: {
              select: {
                id: true,
                name: true,
                problemStatementCode: true,
                category: true,
              },
            },
            secondaryTrack: {
              select: {
                id: true,
                name: true,
                problemStatementCode: true,
                category: true,
              },
            },
            mentor: {
              select: {
                userId: true,
                name: true,
                designation: true,
                organization: true,
                verified: true,
                avatarUrl: true,
              },
            },
            recruitmentNotices: {
              select: {
                id: true,
                role: true,
                gender: true,
                abilities: true,
                requirements: true,
                createdAt: true,
              },
              orderBy: { createdAt: 'desc' },
              take: 3,
            },
            members: {
              select: {
                userId: true,
                name: true,
                branch: true,
                year: true,
                avatarUrl: true,
                skills: true,
                roleInTeam: true,
              },
              take: 6,
            },
            joinRequests: {
              select: {
                id: true,
                status: true,
                message: true,
                createdAt: true,
                student: {
                  select: {
                    userId: true,
                    name: true,
                    branch: true,
                    year: true,
                    avatarUrl: true,
                    skills: true,
                  },
                },
              },
              orderBy: { createdAt: 'desc' },
              take: 10,
            },
            invites: {
              select: {
                id: true,
                status: true,
                createdAt: true,
                student: {
                  select: {
                    userId: true,
                    name: true,
                    branch: true,
                    year: true,
                    avatarUrl: true,
                    skills: true,
                  },
                },
              },
              orderBy: { createdAt: 'desc' },
              take: 10,
            },
            mentorRequests: {
              select: {
                id: true,
                status: true,
                message: true,
                createdAt: true,
                mentor: {
                  select: {
                    userId: true,
                    name: true,
                    designation: true,
                    organization: true,
                  },
                },
              },
              orderBy: { createdAt: 'desc' },
              take: 5,
            },
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const sanitizedTeam = student.team
      ? {
          ...student.team,
          logoUrl: sanitizeAvatarUrl(student.team.logoUrl, student.team.id),
          members: student.team.members?.map((m) => ({
            ...m,
            avatarUrl: sanitizeAvatarUrl(m.avatarUrl, m.userId),
          })),
          joinRequests: student.team.joinRequests?.map((r) => ({
            ...r,
            student: r.student
              ? {
                  ...r.student,
                  avatarUrl: sanitizeAvatarUrl(r.student.avatarUrl, r.student.userId),
                }
              : null,
          })),
        }
      : null;

    return NextResponse.json({
      success: true,
      teamDetails: sanitizedTeam,
      receivedInvites: student.teamInvites,
      sentRequests: student.joinRequests,
    });
  } catch (error) {
    logger.error('GET /api/dashboard/team-details error', error);
    return NextResponse.json({ error: 'Failed to retrieve team details' }, { status: 500 });
  }
}
