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

    const limited = await checkUserRateLimit(request, decoded.userId);
    if (limited) return limited;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        studentProfile: {
          select: {
            userId: true,
            name: true,
            year: true,
            branch: true,
            gender: true,
            rollNo: true,
            section: true,
            category: true,
            contact: true,
            avatarUrl: true,
            skills: true,
            languages: true,
            softSkills: true,
            githubUrl: true,
            linkedinUrl: true,
            resumeUrl: true,
            teamId: true,
            teamStatus: true,
            trackInterest: {
              select: {
                id: true,
                name: true,
                problemStatementCode: true,
              },
            },
            team: {
              select: {
                id: true,
                teamCode: true,
                name: true,
                status: true,
                leaderId: true,
                memberCount: true,
                mentorId: true,
                track: {
                  select: {
                    id: true,
                    problemStatementCode: true,
                    name: true,
                  },
                },
                secondaryTrack: {
                  select: {
                    id: true,
                    problemStatementCode: true,
                    name: true,
                  },
                },
                recruitmentNotices: {
                  select: { id: true },
                  take: 1,
                },
              },
            },
          },
        },
        mentorProfile: {
          select: {
            userId: true,
            name: true,
            designation: true,
            organization: true,
            expertise: true,
            verified: true,
            bio: true,
            linkedinUrl: true,
            avatarUrl: true,
            contact: true,
            _count: {
              select: {
                teams: true,
                mentorRequests: {
                  where: { status: { in: ['pending', 'meeting_requested'] } },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Mentor bootstrap path
    if (user.role === 'MENTOR' && user.mentorProfile) {
      const mentor = user.mentorProfile;
      const identityComplete = Boolean(
        mentor.name?.trim() && mentor.designation?.trim() && mentor.organization?.trim()
      );
      const expertiseComplete = Boolean(mentor.expertise && mentor.expertise.length > 0);
      const bioComplete = Boolean(mentor.bio?.trim() && mentor.linkedinUrl?.trim());
      const onboardingComplete = identityComplete && expertiseComplete;

      return NextResponse.json({
        success: true,
        role: 'MENTOR',
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: mentor.name,
          designation: mentor.designation,
          organization: mentor.organization,
          expertise: mentor.expertise,
          verified: mentor.verified,
          bio: mentor.bio,
          linkedinUrl: mentor.linkedinUrl,
          avatarUrl: mentor.avatarUrl,
          contact: mentor.contact || null,
          identityComplete,
          expertiseComplete,
          bioComplete,
          onboardingComplete,
        },
        stats: {
          assignedTeamsCount: mentor._count.teams,
          pendingRequestsCount: mentor._count.mentorRequests,
        },
      });
    }

    const student = user.studentProfile;
    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    // Calculate section completion statuses
    const personalInfoComplete = Boolean(
      student.name?.trim() && student.year?.trim() && student.branch?.trim()
    );
    const skillsComplete = Boolean(
      (student.skills && student.skills.length > 0) ||
      (student.languages && student.languages.length > 0)
    );
    const themesComplete = Boolean(
      (student.trackInterest && student.trackInterest.length > 0) ||
      student.githubUrl ||
      student.linkedinUrl
    );
    const onboardingComplete = personalInfoComplete && skillsComplete && themesComplete;

    const team = student.team;
    const isLeader = team ? team.leaderId === student.userId : false;
    const openSeats = team ? Math.max(0, 6 - team.memberCount) : 6;
    const hasRecruitmentNotice = team ? team.recruitmentNotices.length > 0 : false;

    return NextResponse.json({
      success: true,
      role: 'STUDENT',
      user: {
        id: user.id,
        email: user.email,
        name: student.name,
        branch: student.branch,
        year: student.year,
        avatarUrl: student.avatarUrl,
        teamStatus: student.teamStatus,
        teamId: student.teamId,
      },
      completion: {
        personalInfoComplete,
        skillsComplete,
        themesComplete,
        onboardingComplete,
      },
      teamSummary: team
        ? {
            id: team.id,
            teamCode: team.teamCode,
            name: team.name,
            status: team.status,
            isLeader,
            memberCount: team.memberCount,
            openSeats,
            hasMentor: Boolean(team.mentorId),
            hasRecruitmentNotice,
            primaryTrack: team.track,
            secondaryTrack: team.secondaryTrack,
          }
        : null,
      skillsSummary: {
        skills: student.skills,
        languages: student.languages,
        softSkills: student.softSkills,
      },
      themesSummary: {
        tracks: student.trackInterest,
        githubUrl: student.githubUrl,
        linkedinUrl: student.linkedinUrl,
        resumeUrl: student.resumeUrl,
      },
      personalSummary: {
        name: student.name,
        gender: student.gender,
        rollNo: student.rollNo,
        year: student.year,
        branch: student.branch,
        section: student.section,
        category: student.category,
        contact: student.contact,
        avatarUrl: student.avatarUrl,
      },
    });
  } catch (error) {
    logger.error('GET /api/dashboard/bootstrap error', error);
    return NextResponse.json({ error: 'Failed to bootstrap dashboard' }, { status: 500 });
  }
}
