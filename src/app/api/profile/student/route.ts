import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import {
  MAX_TAGS,
  avatarDataUri,
  optionalText,
  requiredText,
  safeUrl,
  tagArray,
} from '@/lib/validate';
import { SIH_OFFICIAL_18_THEMES } from '@/lib/tracks';
import { logger } from '@/lib/logger';

const VALID_TRACK_IDS = new Set(SIH_OFFICIAL_18_THEMES.map((t) => t.id));

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

    const cleanName = requiredText(name);
    const cleanYear = requiredText(year, 40);
    const cleanBranch = requiredText(branch, 40);

    if (!cleanName || !cleanYear || !cleanBranch) {
      return NextResponse.json({ error: 'Missing basic profile information' }, { status: 400 });
    }

    // Only ids the platform actually publishes are accepted. Without this an
    // arbitrary string reaches the `trackInterest` relation connect and Prisma
    // raises a foreign-key error, which surfaces to the user as a generic 500.
    const cleanTrackIds = Array.isArray(trackInterest)
      ? [...new Set(trackInterest.filter((id: unknown): id is string => typeof id === 'string'))]
          .filter((id) => VALID_TRACK_IDS.has(id))
          .slice(0, MAX_TAGS)
      : [];

    // Update the StudentProfile & connect track interests
    const updatedProfile = await prisma.studentProfile.update({
      where: { userId: decoded.userId },
      data: {
        name: cleanName,
        year: cleanYear,
        branch: cleanBranch,
        gender: optionalText(gender, 40),
        rollNo: optionalText(rollNo, 40),
        section: optionalText(section, 10),
        skills: tagArray(skills),
        languages: tagArray(languages),
        softSkills: tagArray(softSkills),
        resumeUrl: safeUrl(resumeUrl),
        githubUrl: safeUrl(githubUrl),
        linkedinUrl: safeUrl(linkedinUrl),
        avatarUrl: avatarDataUri(avatarUrl),
        trackInterest: {
          set: cleanTrackIds.map((id: string) => ({ id })),
        },
      },
    });

    // If user is a team leader, update their team's selected track
    if (updatedProfile.teamId && cleanTrackIds.length > 0) {
      const team = await prisma.team.findUnique({
        where: { id: updatedProfile.teamId },
      });
      if (team && team.leaderId === decoded.userId) {
        await prisma.team.update({
          where: { id: team.id },
          data: { trackId: cleanTrackIds[0] },
        });
      }
    }

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (error) {
    logger.error('Update student profile error', error);
    return NextResponse.json({ error: 'Failed to update student profile.' }, { status: 500 });
  }
}
