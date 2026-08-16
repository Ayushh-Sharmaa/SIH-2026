import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { checkUserRateLimit } from '@/lib/rateLimit';
import { skillsProfileSchema } from '@/lib/validation';
import { tagArray } from '@/lib/validate';
import { logger } from '@/lib/logger';
import { revalidateTag } from 'next/cache';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const student = await prisma.studentProfile.findUnique({
      where: { userId: decoded.userId },
      select: {
        skills: true,
        languages: true,
        softSkills: true,
      },
    });

    if (!student) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    return NextResponse.json({ success: true, skills: student });
  } catch (error) {
    logger.error('GET /api/profile/skills error', error);
    return NextResponse.json({ error: 'Failed to retrieve skills and fluency' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimitResponse = await checkUserRateLimit(request, decoded.userId);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json().catch(() => ({}));
    const parsed = skillsProfileSchema.safeParse(body);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues[0]?.message || 'Invalid skills information.';
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { skills, languages, softSkills } = parsed.data;

    const updated = await prisma.studentProfile.update({
      where: { userId: decoded.userId },
      data: {
        skills: tagArray(skills),
        languages: tagArray(languages),
        softSkills: tagArray(softSkills),
      },
      select: {
        skills: true,
        languages: true,
        softSkills: true,
      },
    });

    revalidateTag('students', { expire: 0 });

    return NextResponse.json({ success: true, skills: updated });
  } catch (error) {
    logger.error('PATCH /api/profile/skills error', error);
    return NextResponse.json({ error: 'Failed to update skills and fluency' }, { status: 500 });
  }
}
