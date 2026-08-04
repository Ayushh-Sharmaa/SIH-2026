import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      year,
      branch,
      gender,
      rollNo,
      section,
      skills,
      languages,
      softSkills,
      resumeUrl,
      githubUrl,
      linkedinUrl,
      avatarUrl,
      trackInterest, // Array of track IDs
    } = body;

    if (!name || !year || !branch) {
      return NextResponse.json({ error: 'Missing basic profile information' }, { status: 400 });
    }

    // Update the StudentProfile & connect track interests
    const updatedProfile = await prisma.studentProfile.update({
      where: { userId: decoded.userId },
      data: {
        name,
        year,
        branch,
        gender: gender || null,
        rollNo: rollNo || null,
        section: section || null,
        skills: skills || [],
        languages: languages || [],
        softSkills: softSkills || [],
        resumeUrl: resumeUrl || null,
        githubUrl: githubUrl || null,
        linkedinUrl: linkedinUrl || null,
        avatarUrl: avatarUrl || null,
        trackInterest: {
          set: (trackInterest || []).map((id: string) => ({ id })),
        },
      },
    });

    // If user is a team leader, update their team's selected track
    if (updatedProfile.teamId && Array.isArray(trackInterest) && trackInterest.length > 0) {
      const team = await prisma.team.findUnique({
        where: { id: updatedProfile.teamId },
      });
      if (team && team.leaderId === decoded.userId) {
        await prisma.team.update({
          where: { id: team.id },
          data: { trackId: trackInterest[0] },
        });
      }
    }

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (error) {
    logger.error('Update student profile error', error);
    return NextResponse.json({ error: 'Failed to update student profile.' }, { status: 500 });
  }
}
