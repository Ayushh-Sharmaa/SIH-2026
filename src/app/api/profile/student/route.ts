import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

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

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (error) {
    console.error('Update student profile error:', error);
    return NextResponse.json({ error: 'Failed to update student profile.' }, { status: 500 });
  }
}
