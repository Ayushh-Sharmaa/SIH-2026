import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { checkUserRateLimit } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const resolvedParams = await params;
    const teamId = resolvedParams.id;

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required.' }, { status: 400 });
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        track: true,
        secondaryTrack: true,
        recruitmentNotices: {
          orderBy: { createdAt: 'desc' },
        },
        mentor: {
          select: {
            userId: true,
            name: true,
            designation: true,
            organization: true,
            expertise: true,
            avatarUrl: true,
            linkedinUrl: true,
          },
        },
        members: {
          select: {
            userId: true,
            name: true,
            year: true,
            branch: true,
            section: true,
            gender: true,
            rollNo: true,
            contact: true,
            skills: true,
            languages: true,
            softSkills: true,
            resumeUrl: true,
            githubUrl: true,
            linkedinUrl: true,
            avatarUrl: true,
            roleInTeam: true,
            user: {
              select: {
                email: true,
                college: true,
              },
            },
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found.' }, { status: 404 });
    }

    const isMemberOfTeam = team.members.some((m) => m.userId === decoded.userId);
    const isMentorOfTeam = team.mentorId === decoded.userId;
    const isAdmin = decoded.role === 'ADMIN';

    const leader = team.members.find((m) => m.userId === team.leaderId) || team.members[0];

    const formattedMembers = team.members.map((m) => {
      const isSelf = m.userId === decoded.userId;
      const canViewPrivate = isSelf || isMentorOfTeam || isAdmin;

      return {
        userId: m.userId,
        name: m.name,
        year: m.year,
        branch: m.branch,
        gender: m.gender,
        skills: m.skills,
        languages: m.languages,
        softSkills: m.softSkills,
        avatarUrl: m.avatarUrl,
        roleInTeam: m.roleInTeam,
        college: m.user.college,
        githubUrl: m.githubUrl,
        linkedinUrl: m.linkedinUrl,
        resumeUrl: m.resumeUrl,

        // Private fields restricted per Access Matrix
        rollNo: canViewPrivate ? m.rollNo : null,
        section: canViewPrivate ? m.section : null,
        email: canViewPrivate ? m.user.email : null,
        contact: canViewPrivate ? m.contact : null,
      };
    });

    const leaderContact = leader ? {
      name: leader.name,
      email: leader.user.email,
      contact: leader.contact,
    } : null;

    return NextResponse.json({
      success: true,
      team: {
        id: team.id,
        teamCode: team.teamCode,
        name: team.name,
        status: team.status,
        leaderId: team.leaderId,
        leaderName: leader?.name || 'N/A',
        memberCount: team.members.length,
        capacity: 6,
        whatsapp: (isMemberOfTeam || isMentorOfTeam || isAdmin) ? team.whatsapp : null,
        logoUrl: team.logoUrl,
        skillsCovered: team.skillsCovered,
        skillsNeeded: team.skillsNeeded,
        trackId: team.trackId,
        secondaryTrackId: team.secondaryTrackId,
        track: team.track,
        secondaryTrack: team.secondaryTrack,
        recruitmentNotices: team.recruitmentNotices,
        mentorId: team.mentorId,
        mentor: team.mentor,
        members: formattedMembers,
        isMentorOfTeam,
        isMemberOfTeam,
        leaderContact,
      },
    });
  } catch (error) {
    logger.error('Fetch team details error', error);
    return NextResponse.json({ error: 'Failed to retrieve team details.' }, { status: 500 });
  }
}
