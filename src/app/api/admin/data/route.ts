import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { getAdminEmails, getBannedEmails, isAuthorizedAdminEmail } from '@/lib/admin';
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
    if (!decoded || !(await isAuthorizedAdminEmail(decoded.email))) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const rateLimitResponse = await checkUserRateLimit(request, decoded.userId);
    if (rateLimitResponse) return rateLimitResponse;

    const adminEmails = await getAdminEmails();
    const bannedEmails = new Set(await getBannedEmails());

    const allUsers = await prisma.user.findMany();
    const allStudentProfiles = await prisma.studentProfile.findMany({
      where: { isDemo: false }
    });
    const allMentorProfiles = await prisma.mentorProfile.findMany({
      where: { isDemo: false }
    });
    const allTeams = await prisma.team.findMany();
    const allTracks = await prisma.track.findMany();

    const students = allStudentProfiles.map((sp) => {
      const user = allUsers.find((u) => u.id === sp.userId);
      const team = allTeams.find((t) => t.id === sp.teamId);
      const email = user?.email || '';

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
        teamName: team?.name || null,
        teamCode: team?.teamCode || null,
        teamId: sp.teamId || null,
        teamStatus: sp.teamStatus || 'OPEN',
        skills: sp.skills || [],
        softSkills: sp.softSkills || [],
        languages: sp.languages || [],
        resumeUrl: sp.resumeUrl || null,
        githubUrl: sp.githubUrl || null,
        linkedinUrl: sp.linkedinUrl || null,
        avatarUrl: sp.avatarUrl || null,
        isBanned: bannedEmails.has(email.toLowerCase()),
        verified: true,
      };
    });

    const teams = allTeams.map((team) => {
      const track = allTracks.find((t) => t.id === team.trackId || t.problemStatementCode === team.trackId);
      const members = students.filter((sp) => sp.teamId === team.id);
      const leader = students.find((sp) => sp.userId === team.leaderId);

      const femaleCount = members.filter((m) => String(m.gender).toLowerCase() === 'female').length;
      const maleCount = members.filter((m) => String(m.gender).toLowerCase() === 'male').length;
      const isAllFemale = members.length > 0 && femaleCount === members.length;

      return {
        id: team.id,
        teamCode: team.teamCode,
        name: team.name,
        status: team.status || 'forming',
        memberCount: members.length,
        maxCapacity: 6,
        trackId: team.trackId,
        trackCode: track?.problemStatementCode || team.trackId,
        trackName: track ? `${track.problemStatementCode} - ${track.name}` : team.trackId,
        leaderName: leader?.name || 'Unknown Leader',
        leaderEmail: leader?.email || '',
        members,
        femaleCount,
        maleCount,
        isAllFemale,
        skillsCovered: team.skillsCovered || [],
        skillsNeeded: team.skillsNeeded || [],
      };
    });

    const problemStatementStats = allTracks.map((track) => {
      const trackTeams = teams.filter(
        (t) => t.trackId === track.id || t.trackCode === track.problemStatementCode
      );
      return {
        id: track.id,
        code: track.problemStatementCode,
        name: track.name,
        category: track.category,
        organization: 'Government / Industrial',
        description: track.description,
        teamCount: trackTeams.length,
        teams: trackTeams.map((t) => ({
          id: t.id,
          teamCode: t.teamCode,
          name: t.name,
          leaderName: t.leaderName,
          memberCount: t.memberCount,
          status: t.status,
          isAllFemale: t.isAllFemale,
        })),
      };
    });

    const mentors = allMentorProfiles.map((mp) => {
      const user = allUsers.find((u) => u.id === mp.userId);

      return {
        id: mp.userId,
        userId: mp.userId,
        name: mp.name || 'Faculty Member',
        email: user?.email || '',
        designation: mp.designation || 'Faculty Mentor',
        organization: mp.organization || 'GL Bajaj Group of Institutions',
        capacity: mp.capacity || 2,
        currentLoad: mp.currentLoad || 0,
        verified: mp.verified ?? true,
        isDemo: mp.isDemo ?? false,
        isBanned: bannedEmails.has((user?.email || '').toLowerCase()),
        expertise: mp.expertise || [],
      };
    });

    const stats = {
      totalStudents: students.length,
      totalTeams: teams.length,
      fullTeams: teams.filter((t) => t.memberCount >= 6 || t.status === 'locked' || t.status === 'approved').length,
      formingTeams: teams.filter((t) => t.status === 'forming').length,
      allFemaleTeams: teams.filter((t) => t.isAllFemale).length,
      totalMentors: mentors.length,
      verifiedMentors: mentors.filter((m) => m.verified).length,
      totalAuthorizedAdmins: adminEmails.length,
    };

    return NextResponse.json({
      success: true,
      stats,
      adminEmails,
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
