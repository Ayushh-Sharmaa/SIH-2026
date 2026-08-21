import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { getAdminEmails, getBannedEmails, isAuthorizedAdminEmail, getWhitelistedEmails } from '@/lib/admin';
import { checkUserRateLimit } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !(await isAuthorizedAdminEmail(decoded.email))) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const rateLimitResponse = await checkUserRateLimit(request, decoded.userId);
    if (rateLimitResponse) return rateLimitResponse;

    const [
      adminEmails,
      bannedEmailList,
      whitelistedEmails,
      totalStudents,
      totalTeams,
      fullTeams,
      formingTeams,
      totalMentors,
      verifiedMentors,
      allTracks,
      initialStudentsRaw,
      initialTeamsRaw,
      initialMentorsRaw,
    ] = await Promise.all([
      getAdminEmails(),
      getBannedEmails(),
      getWhitelistedEmails(),
      prisma.studentProfile.count({ where: { isDemo: false } }),
      prisma.team.count(),
      prisma.team.count({
        where: {
          OR: [
            { memberCount: { gte: 6 } },
            { status: { in: ['locked', 'approved', 'complete'] } },
          ],
        },
      }),
      prisma.team.count({
        where: {
          status: 'forming',
          memberCount: { lt: 6 },
        },
      }),
      prisma.mentorProfile.count({ where: { isDemo: false } }),
      prisma.mentorProfile.count({ where: { isDemo: false, verified: true } }),
      prisma.track.findMany({
        select: {
          id: true,
          problemStatementCode: true,
          name: true,
          category: true,
          description: true,
          _count: {
            select: { teams: true },
          },
          teams: {
            select: {
              id: true,
              teamCode: true,
              name: true,
              memberCount: true,
              status: true,
              leaderId: true,
              members: {
                select: {
                  name: true,
                  gender: true,
                  userId: true,
                },
                take: 6,
              },
            },
            take: 10,
          },
        },
      }),
      prisma.studentProfile.findMany({
        where: { isDemo: false },
        select: {
          userId: true,
          name: true,
          rollNo: true,
          section: true,
          branch: true,
          year: true,
          gender: true,
          isDemo: true,
          teamId: true,
          teamStatus: true,
          skills: true,
          softSkills: true,
          languages: true,
          resumeUrl: true,
          githubUrl: true,
          linkedinUrl: true,
          user: { select: { email: true } },
          team: { select: { id: true, name: true, teamCode: true } },
        },
        orderBy: { name: 'asc' },
        take: 50,
      }),
      prisma.team.findMany({
        select: {
          id: true,
          teamCode: true,
          name: true,
          status: true,
          memberCount: true,
          trackId: true,
          leaderId: true,
          skillsCovered: true,
          skillsNeeded: true,
          track: {
            select: {
              id: true,
              problemStatementCode: true,
              name: true,
              category: true,
            },
          },
          members: {
            select: {
              userId: true,
              name: true,
              rollNo: true,
              section: true,
              branch: true,
              year: true,
              gender: true,
              isDemo: true,
              teamId: true,
              teamStatus: true,
              skills: true,
              softSkills: true,
              languages: true,
              resumeUrl: true,
              githubUrl: true,
              linkedinUrl: true,
              user: { select: { email: true } },
            },
            take: 6,
          },
        },
        orderBy: { teamCode: 'asc' },
        take: 50,
      }),
      prisma.mentorProfile.findMany({
        where: { isDemo: false },
        select: {
          userId: true,
          name: true,
          designation: true,
          organization: true,
          verified: true,
          isDemo: true,
          expertise: true,
          user: { select: { email: true } },
          teams: { select: { id: true } },
        },
        orderBy: { name: 'asc' },
        take: 50,
      }),
    ]);

    const bannedEmails = new Set(bannedEmailList.map((e) => e.toLowerCase()));

    const students = initialStudentsRaw.map((sp) => {
      const email = sp.user?.email || '';
      return {
        id: sp.userId,
        userId: sp.userId,
        name: sp.name || 'Unnamed Student',
        email,
        rollNo: sp.rollNo || 'N/A',
        section: sp.section || 'N/A',
        branch: sp.branch || 'N/A',
        year: sp.year || 'N/A',
        gender: sp.gender || 'Not Specified',
        isDemo: sp.isDemo ?? false,
        teamName: sp.team?.name || null,
        teamCode: sp.team?.teamCode || null,
        teamId: sp.teamId || null,
        teamStatus: sp.teamStatus || 'OPEN',
        skills: sp.skills || [],
        softSkills: sp.softSkills || [],
        languages: sp.languages || [],
        resumeUrl: sp.resumeUrl || null,
        githubUrl: sp.githubUrl || null,
        linkedinUrl: sp.linkedinUrl || null,
        avatarUrl: `/api/avatar/${sp.userId}`,
        isBanned: bannedEmails.has(email.toLowerCase()),
        verified: true,
      };
    });

    const teams = initialTeamsRaw.map((team) => {
      const leader = team.members.find((m) => m.userId === team.leaderId) || team.members[0];
      const femaleCount = team.members.filter((m) => String(m.gender).toLowerCase() === 'female').length;
      const maleCount = team.members.filter((m) => String(m.gender).toLowerCase() === 'male').length;
      const isAllFemale = team.members.length > 0 && femaleCount === team.members.length;

      const members = team.members.map((sp) => {
        const email = sp.user?.email || '';
        return {
          id: sp.userId,
          userId: sp.userId,
          name: sp.name || 'Unnamed Student',
          email,
          rollNo: sp.rollNo || 'N/A',
          section: sp.section || 'N/A',
          branch: sp.branch || 'N/A',
          year: sp.year || 'N/A',
          gender: sp.gender || 'Not Specified',
          isDemo: sp.isDemo ?? false,
          teamName: team.name,
          teamCode: team.teamCode,
          teamId: team.id,
          teamStatus: sp.teamStatus || 'IN_TEAM',
          skills: sp.skills || [],
          softSkills: sp.softSkills || [],
          languages: sp.languages || [],
          resumeUrl: sp.resumeUrl || null,
          githubUrl: sp.githubUrl || null,
          linkedinUrl: sp.linkedinUrl || null,
          avatarUrl: `/api/avatar/${sp.userId}`,
          isBanned: bannedEmails.has(email.toLowerCase()),
          verified: true,
        };
      });

      return {
        id: team.id,
        teamCode: team.teamCode,
        name: team.name,
        status: team.status || 'forming',
        memberCount: team.members.length,
        maxCapacity: 6,
        trackId: team.trackId,
        trackCode: team.track?.problemStatementCode || team.trackId,
        trackName: team.track ? `${team.track.problemStatementCode} - ${team.track.name}` : team.trackId,
        leaderName: leader?.name || 'Unknown Leader',
        leaderEmail: leader?.user?.email || '',
        members,
        femaleCount,
        maleCount,
        isAllFemale,
        skillsCovered: team.skillsCovered || [],
        skillsNeeded: team.skillsNeeded || [],
      };
    });

    const problemStatementStats = allTracks.map((track) => {
      return {
        id: track.id,
        code: track.problemStatementCode,
        name: track.name,
        category: track.category,
        organization: 'Government / Industrial',
        description: track.description,
        teamCount: track._count.teams,
        teams: track.teams.map((t) => {
          const leader = t.members.find((m) => m.userId === t.leaderId) || t.members[0];
          const femaleCount = t.members.filter((m) => String(m.gender).toLowerCase() === 'female').length;
          return {
            id: t.id,
            teamCode: t.teamCode,
            name: t.name,
            leaderName: leader?.name || 'N/A',
            memberCount: t.memberCount,
            status: t.status,
            isAllFemale: t.members.length > 0 && femaleCount === t.members.length,
          };
        }),
      };
    });

    const mentors = initialMentorsRaw.map((mp) => {
      const email = mp.user?.email || '';
      return {
        id: mp.userId,
        userId: mp.userId,
        name: mp.name || 'Faculty Member',
        email,
        designation: mp.designation || 'Faculty Mentor',
        organization: mp.organization || 'GL Bajaj Group of Institutions',
        guidedTeamsCount: mp.teams.length,
        verified: mp.verified ?? true,
        isDemo: mp.isDemo ?? false,
        isBanned: bannedEmails.has(email.toLowerCase()),
        expertise: mp.expertise || [],
      };
    });

    const stats = {
      totalStudents,
      totalTeams,
      fullTeams,
      formingTeams,
      allFemaleTeams: 0, // dynamic aggregation
      totalMentors,
      verifiedMentors,
      totalAuthorizedAdmins: adminEmails.length,
      totalWhitelistedUsers: whitelistedEmails.length,
      whitelistedStudents: whitelistedEmails.filter((w) => w.role === 'STUDENT').length,
      whitelistedMentors: whitelistedEmails.filter((w) => w.role === 'MENTOR').length,
    };

    return NextResponse.json({
      success: true,
      stats,
      adminEmails,
      whitelistedEmails,
      teams,
      students,
      mentors,
      problemStatementStats,
    });
  } catch (error) {
    logger.error('Admin data fetch error', error);
    return NextResponse.json({ error: 'Failed to load admin dashboard data.' }, { status: 500 });
  }
}
