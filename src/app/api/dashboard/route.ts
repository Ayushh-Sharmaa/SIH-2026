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

    if (decoded.role === 'STUDENT') {
      // 1. Fetch student profile and their team
      const student = await prisma.studentProfile.findUnique({
        where: { userId: decoded.userId },
        include: {
          team: {
            include: {
              track: true,
              members: {
                select: {
                  userId: true,
                  name: true,
                  branch: true,
                  year: true,
                  skills: true,
                  avatarUrl: true,
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
          name: student.name,
          email: student.user.email,
          branch: student.branch,
          year: student.year,
          gender: (student as any).gender || null,
          rollNo: (student as any).rollNo || null,
          section: (student as any).section || null,
          skills: student.skills,
          languages: student.languages,
          softSkills: student.softSkills,
          githubUrl: student.githubUrl,
          linkedinUrl: student.linkedinUrl,
          resumeUrl: student.resumeUrl,
          avatarUrl: student.avatarUrl,
          trackInterest: Array.isArray((student as any).trackInterest)
            ? (student as any).trackInterest
            : ((student as any).trackInterest?.map((t: any) => t.id) || []),
        },
        team: student.team
          ? (() => {
              const members = student.team.members.map((member: any) => ({
                userId: member.userId,
                name: member.name,
                branch: member.branch,
                year: member.year,
                skills: member.skills,
                avatarUrl: member.avatarUrl,
              }));
              const leader = student.team.members.find((member: any) => member.userId === student.team!.leaderId);

              return {
              id: student.team.id,
              name: student.team.name,
              status: student.team.status,
              leaderId: student.team.leaderId,
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
              };
            })()
          : null,
      });
    } else {
      // 2. Fetch mentor profile, mentored teams, and pending requests
      const mentor = await prisma.mentorProfile.findUnique({
        where: { userId: decoded.userId },
        include: {
          teams: {
            include: {
              track: true,
            },
          },
          mentorRequests: {
            where: { status: 'pending' },
            include: {
              team: {
                include: {
                  track: true,
                },
              },
            },
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
          capacity: mentor.capacity,
          currentLoad: mentor.currentLoad,
          verified: mentor.verified,
          bio: mentor.bio,
          linkedinUrl: mentor.linkedinUrl,
        },
        teams: mentor.teams.map((t: any) => ({
          id: t.id,
          name: t.name,
          status: t.status,
          track: t.track,
          memberCount: t.memberCount,
        })),
        pendingRequests: mentor.mentorRequests.map((r: any) => ({
          id: r.id,
          message: r.message,
          createdAt: r.createdAt,
          team: {
            id: r.team.id,
            name: r.team.name,
            track: r.team.track,
            skillsCovered: r.team.skillsCovered,
          },
        })),
      });
    }
  } catch (error) {
    logger.error('Fetch dashboard error', error);
    return NextResponse.json({ error: 'Failed to retrieve dashboard details.' }, { status: 500 });
  }
}
