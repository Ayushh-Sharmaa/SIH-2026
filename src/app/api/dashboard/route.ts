import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { checkUserRateLimit } from '@/lib/rateLimit';
import { dashboardQuerySchema, parseQuery } from '@/lib/validation';
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

    // The dashboard aggregates several tables per call, so it is the most
    // expensive authenticated GET in the app — worth a per-user ceiling.
    const limited = await checkUserRateLimit(request, decoded.userId);
    if (limited) return limited;

    const parsedQuery = parseQuery(request.url, dashboardQuerySchema);
    if (!parsedQuery.success) {
      return NextResponse.json({ error: 'Invalid dashboard query.' }, { status: 400 });
    }
    // Only meaningful for ADMIN; the branch below is what enforces that.
    const roleOverride = parsedQuery.data.role;

    // Admin Role Preview Switcher Mode
    if (decoded.role === 'ADMIN') {
      if (roleOverride === 'MENTOR') {
        const [mentors, allTeams] = await Promise.all([
          prisma.mentorProfile.findMany({ take: 1 }),
          prisma.team.findMany(),
        ]);
        const mentor = mentors[0] || {
          name: 'Faculty Mentor Preview',
          designation: 'Associate Professor & Mentor',
          organization: 'GL Bajaj Group of Institutions',
          expertise: ['AI/ML', 'Full Stack Development', 'System Architecture'],
          verified: true,
          bio: 'Admin Preview Mode: Exploring Faculty Mentor Dashboard Features.',
        };
        return NextResponse.json({
          success: true,
          role: 'MENTOR',
          isAdminPreview: true,
          profile: {
            name: mentor.name,
            designation: mentor.designation,
            organization: mentor.organization,
            expertise: mentor.expertise,
            guidedTeamsCount:
              'userId' in mentor ? allTeams.filter((team) => team.mentorId === mentor.userId).length : 0,
            verified: mentor.verified,
            bio: mentor.bio,
            linkedinUrl: mentor.linkedinUrl || 'https://linkedin.com',
          },
          teams: allTeams.slice(0, 2).map((t) => ({
            id: t.id,
            name: t.name,
            status: t.status,
            track: t.trackId,
            memberCount: t.memberCount,
          })),
          pendingRequests: [
            {
              id: 'demo-req-1',
              message: 'Hello Professor! We would love your guidance on our Smart India Hackathon project.',
              status: 'pending',
              createdAt: new Date().toISOString(),
              team: {
                id: 'demo-team-1',
                name: 'TechShak',
                track: 'PS-MEDTECH',
                skillsCovered: ['React', 'Python', 'Node.js', 'Machine Learning'],
                members: [{ name: 'Preview Student', branch: 'CSE', year: '3rd Year', avatarUrl: null }],
              },
            },
          ],
        });
      }

      // Default Admin Student Preview Mode
      const students = await prisma.studentProfile.findMany();
      const firstStudent = students[0];

      return NextResponse.json({
        success: true,
        role: 'STUDENT',
        isAdminPreview: true,
        profile: {
          userId: decoded.userId,
          name: firstStudent?.name || 'Admin Student Preview',
          email: decoded.email,
          branch: firstStudent?.branch || 'CSE',
          year: firstStudent?.year || '3rd Year',
          gender: firstStudent?.gender || 'Male',
          rollNo: firstStudent?.rollNo || 'GLB-2026-001',
          section: firstStudent?.section || 'A',
          skills: firstStudent?.skills || ['React', 'Node.js', 'Python', 'Git'],
          languages: firstStudent?.languages || ['English (Fluent)', 'Hindi (Fluent)'],
          softSkills: firstStudent?.softSkills || ['PPT Making', 'Public Speaking/Presenting'],
          githubUrl: firstStudent?.githubUrl || 'https://github.com',
          linkedinUrl: firstStudent?.linkedinUrl || 'https://linkedin.com',
          resumeUrl: firstStudent?.resumeUrl || null,
          avatarUrl: firstStudent?.avatarUrl || null,
          trackInterest: ['sih-theme-1', 'sih-theme-2'],
        },
        team: firstStudent?.teamId
          ? {
              id: firstStudent.teamId,
              teamCode: 'SIH100',
              name: 'TechShak',
              status: 'forming',
              leaderId: decoded.userId,
              memberCount: 1,
              skillsCovered: ['React', 'Python', 'Node.js'],
              skillsNeeded: ['UI/UX Design', 'Database'],
              track: { id: 'sih-theme-1', problemStatementCode: 'PS-MEDTECH', name: 'MedTech / BioTech / HealthTech' },
              members: [
                {
                  userId: decoded.userId,
                  name: firstStudent.name,
                  branch: firstStudent.branch,
                  year: firstStudent.year,
                  skills: firstStudent.skills,
                  avatarUrl: firstStudent.avatarUrl,
                  roleInTeam: 'Leader',
                },
              ],
              leaderContact: {
                name: firstStudent.name,
                email: decoded.email,
                whatsapp: '+91 9876543210',
              },
              mentor: null,
              joinRequests: [],
              invites: [],
              mentorRequests: [],
            }
          : null,
        receivedInvites: [],
        sentRequests: [],
      });
    }

    if (decoded.role === 'STUDENT') {
      const student = await prisma.studentProfile.findUnique({
        where: { userId: decoded.userId },
        include: {
          user: { select: { email: true } },
          trackInterest: true,
          joinRequests: {
            include: {
              team: {
                include: { track: true },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
          teamInvites: {
            include: {
              team: {
                include: { track: true },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
          team: {
            include: {
              track: true,
              secondaryTrack: true,
              recruitmentNotices: {
                orderBy: { createdAt: 'asc' },
              },
              members: {
                select: {
                  userId: true,
                  name: true,
                  branch: true,
                  year: true,
                  skills: true,
                  avatarUrl: true,
                  roleInTeam: true,
                  user: { select: { email: true } },
                },
              },
              mentor: {
                select: {
                  name: true,
                  designation: true,
                  organization: true,
                },
              },
              joinRequests: {
                include: {
                  student: {
                    select: {
                      userId: true,
                      name: true,
                      branch: true,
                      year: true,
                      skills: true,
                      avatarUrl: true,
                    },
                  },
                },
                orderBy: { createdAt: 'desc' },
              },
              invites: {
                include: {
                  student: {
                    select: {
                      userId: true,
                      name: true,
                      branch: true,
                      year: true,
                      skills: true,
                      avatarUrl: true,
                    },
                  },
                },
                orderBy: { createdAt: 'desc' },
              },
              mentorRequests: {
                include: {
                  mentor: true,
                },
                orderBy: { createdAt: 'desc' },
              },
            },
          },
        },
      });

      if (!student) {
        return NextResponse.json({ error: 'Student profile not found.' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        role: 'STUDENT',
        profile: {
          userId: student.userId,
          name: student.name,
          email: student.user.email,
          branch: student.branch,
          year: student.year,
          gender: student.gender,
          rollNo: student.rollNo,
          section: student.section,
          skills: student.skills,
          languages: student.languages,
          softSkills: student.softSkills,
          githubUrl: student.githubUrl,
          linkedinUrl: student.linkedinUrl,
          resumeUrl: student.resumeUrl,
          avatarUrl: student.avatarUrl,
          trackInterest: student.trackInterest.map((t) => t.id),
        },
        team: student.team
          ? (() => {
              const members = student.team.members.map((member) => ({
                userId: member.userId,
                name: member.name,
                branch: member.branch,
                year: member.year,
                skills: member.skills,
                avatarUrl: member.avatarUrl,
                roleInTeam: member.roleInTeam,
              }));
              const leader = student.team.members.find((member) => member.userId === student.team!.leaderId);

              return {
                id: student.team.id,
                teamCode: student.team.teamCode,
                name: student.team.name,
                status: student.team.status,
                leaderId: student.team.leaderId,
                mentorId: student.team.mentorId,
                whatsapp: student.team.whatsapp,
                logoUrl: student.team.logoUrl,
                customMentorName: student.team.customMentorName,
                customMentorDesignation: student.team.customMentorDesignation,
                customMentorMobile: student.team.customMentorMobile,
                customMentorEmail: student.team.customMentorEmail,
                memberCount: student.team.memberCount,
                skillsCovered: student.team.skillsCovered,
                skillsNeeded: student.team.skillsNeeded,
                track: student.team.track,
                members,
                leaderContact: leader
                  ? {
                      name: leader.name,
                      email: leader.user?.email || null,
                      whatsapp: student.team.whatsapp || null,
                    }
                  : null,
                mentor: student.team.mentor,
                joinRequests: student.team.leaderId === decoded.userId
                  ? student.team.joinRequests.map((r) => ({
                      id: r.id,
                      status: r.status,
                      message: r.message,
                      createdAt: r.createdAt,
                      student: r.student,
                    }))
                  : [],
                invites: student.team.leaderId === decoded.userId
                  ? student.team.invites.map((i) => ({
                      id: i.id,
                      status: i.status,
                      createdAt: i.createdAt,
                      student: i.student,
                    }))
                  : [],
                mentorRequests: student.team.mentorRequests.map((r) => ({
                  id: r.id,
                  status: r.status,
                  message: r.message,
                  createdAt: r.createdAt,
                  mentor: {
                    userId: r.mentor.userId,
                    name: r.mentor.name,
                    designation: r.mentor.designation,
                    organization: r.mentor.organization,
                  },
                })),
              };
            })()
          : null,
        receivedInvites: student.teamInvites.map((i) => ({
          id: i.id,
          status: i.status,
          createdAt: i.createdAt,
          team: {
            id: i.team.id,
            name: i.team.name,
            track: i.team.track,
          },
        })),
        sentRequests: student.joinRequests.map((r) => ({
          id: r.id,
          status: r.status,
          message: r.message,
          createdAt: r.createdAt,
          team: {
            id: r.team.id,
            name: r.team.name,
            track: r.team.track,
          },
        })),
      });
    } else {
      // Fetch mentor profile, mentored teams, and pending requests
      const mentor = await prisma.mentorProfile.findUnique({
        where: { userId: decoded.userId },
        include: {
          teams: {
            include: {
              track: true,
            },
          },
          mentorRequests: {
            where: { status: { in: ['pending', 'keep_pending', 'meeting_requested'] } },
            include: {
              team: {
                include: {
                  track: true,
                  members: {
                    select: {
                      name: true,
                      branch: true,
                      year: true,
                      avatarUrl: true,
                    },
                  },
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!mentor) {
        return NextResponse.json({ error: 'Mentor profile not found.' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        role: 'MENTOR',
        profile: {
          name: mentor.name,
          designation: mentor.designation,
          organization: mentor.organization,
          expertise: mentor.expertise,
          guidedTeamsCount: mentor.teams.length,
          verified: mentor.verified,
          bio: mentor.bio,
          linkedinUrl: mentor.linkedinUrl,
        },
        teams: mentor.teams.map((t) => ({
          id: t.id,
          teamCode: t.teamCode,
          name: t.name,
          status: t.status,
          track: t.track,
          memberCount: t.memberCount,
        })),
        pendingRequests: mentor.mentorRequests.map((r) => ({
          id: r.id,
          message: r.message,
          status: r.status,
          createdAt: r.createdAt,
          team: {
            id: r.team.id,
            teamCode: r.team.teamCode,
            name: r.team.name,
            track: r.team.track,
            skillsCovered: r.team.skillsCovered,
            members: r.team.members,
          },
        })),
      });
    }
  } catch (error) {
    logger.error('Fetch dashboard error', error);
    return NextResponse.json({ error: 'Failed to retrieve dashboard details.' }, { status: 500 });
  }
}
