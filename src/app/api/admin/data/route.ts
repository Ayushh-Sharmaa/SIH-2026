import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { getAdminEmails, isAuthorizedAdminEmail, isUserBanned } from '@/lib/mockDb';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'ADMIN' && !isAuthorizedAdminEmail(decoded.email))) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Load admin emails list
    const adminEmails = getAdminEmails();

    // Fetch all raw users, teams, students, mentors, tracks
    const allUsers = await prisma.user.findMany();
    const allStudentProfiles = await prisma.studentProfile.findMany();
    const allMentorProfiles = await prisma.mentorProfile.findMany();
    const allTeams = await prisma.team.findMany();
    const allTracks = await prisma.track.findMany();

    // Format Students list with full profile fields and ban status
    const students = allStudentProfiles.map((sp: any) => {
      const user = allUsers.find((u: any) => u.id === sp.userId);
      const team = allTeams.find((t: any) => t.id === sp.teamId);
      const email = user?.email || '';

      return {
        id: sp.id,
        userId: sp.userId,
        name: sp.name || 'Unnamed Student',
        email,
        rollNo: sp.rollNo || 'N/A',
        section: sp.section || 'N/A',
        branch: sp.branch || 'N/A',
        year: sp.year || 'N/A',
        gender: sp.gender || 'Not Specified',
        teamName: team?.name || null,
        teamId: sp.teamId || null,
        teamStatus: sp.teamStatus || 'LOOKING_FOR_TEAM',
        skills: sp.skills || [],
        softSkills: sp.softSkills || [],
        languages: sp.languages || [],
        resumeUrl: sp.resumeUrl || null,
        githubUrl: sp.githubUrl || null,
        linkedinUrl: sp.linkedinUrl || null,
        avatarUrl: sp.avatarUrl || null,
        isBanned: isUserBanned(email),
        verified: true,
      };
    });

    // Format Teams with member details, gender breakdown, and track info
    const teams = allTeams.map((team: any) => {
      const track = allTracks.find((t: any) => t.id === team.trackId || t.problemStatementCode === team.trackId);
      const members = students.filter((sp: any) => sp.teamId === team.id);
      const leader = students.find((sp: any) => sp.userId === team.leaderId);

      const femaleCount = members.filter((m: any) => String(m.gender).toLowerCase() === 'female').length;
      const maleCount = members.filter((m: any) => String(m.gender).toLowerCase() === 'male').length;
      const isAllFemale = members.length > 0 && femaleCount === members.length;

      return {
        id: team.id,
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

    // Format Problem Statement Stats (Participation across all 18 SIH Themes)
    const problemStatementStats = allTracks.map((track: any) => {
      const trackTeams = teams.filter(
        (t: any) => t.trackId === track.id || t.trackCode === track.problemStatementCode
      );
      return {
        id: track.id,
        code: track.problemStatementCode,
        name: track.name,
        category: track.category,
        organization: track.organization || 'Government / Industrial',
        description: track.description,
        teamCount: trackTeams.length,
        teams: trackTeams.map((t: any) => ({
          id: t.id,
          name: t.name,
          leaderName: t.leaderName,
          memberCount: t.memberCount,
          status: t.status,
          isAllFemale: t.isAllFemale,
        })),
      };
    });

    // Format Mentors list
    const mentors = allMentorProfiles.map((mp: any) => {
      const user = allUsers.find((u: any) => u.id === mp.userId);

      return {
        id: mp.id,
        userId: mp.userId,
        name: mp.name || 'Faculty Member',
        email: user?.email || '',
        designation: mp.designation || 'Faculty Mentor',
        organization: mp.organization || 'GL Bajaj Group of Institutions',
        capacity: mp.capacity || 2,
        currentLoad: mp.currentLoad || 0,
        verified: mp.verified ?? true,
        expertise: mp.expertise || [],
      };
    });

    // Calculate Platform Stats
    const stats = {
      totalStudents: students.length,
      totalTeams: teams.length,
      fullTeams: teams.filter((t: any) => t.memberCount >= 6 || t.status === 'locked' || t.status === 'approved').length,
      formingTeams: teams.filter((t: any) => t.status === 'forming').length,
      allFemaleTeams: teams.filter((t: any) => t.isAllFemale).length,
      totalMentors: mentors.length,
      verifiedMentors: mentors.filter((m: any) => m.verified).length,
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
  } catch (error: any) {
    logger.error('Admin data fetch error', error);
    return NextResponse.json({ error: 'Failed to load admin dashboard data.' }, { status: 500 });
  }
}
