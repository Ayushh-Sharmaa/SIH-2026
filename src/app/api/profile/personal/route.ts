import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { checkUserRateLimit } from '@/lib/rateLimit';
import { personalProfileSchema } from '@/lib/validation';
import { avatarDataUri } from '@/lib/validate';
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
        name: true,
        gender: true,
        rollNo: true,
        year: true,
        branch: true,
        section: true,
        category: true,
        contact: true,
        avatarUrl: true,
      },
    });

    if (!student) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    return NextResponse.json({ success: true, personal: student });
  } catch (error) {
    logger.error('GET /api/profile/personal error', error);
    return NextResponse.json({ error: 'Failed to retrieve personal information' }, { status: 500 });
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
    const parsed = personalProfileSchema.safeParse(body);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues[0]?.message || 'Invalid personal information.';
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { name, gender, rollNo, year, branch, section, category, contact, avatarUrl } = parsed.data;

    const updated = await prisma.studentProfile.update({
      where: { userId: decoded.userId },
      data: {
        name,
        gender: gender || null,
        rollNo: rollNo || null,
        year,
        branch,
        section: section || null,
        category: category || null,
        contact: contact || null,
        avatarUrl: avatarUrl ? avatarDataUri(avatarUrl) : null,
      },
      select: {
        name: true,
        gender: true,
        rollNo: true,
        year: true,
        branch: true,
        section: true,
        category: true,
        contact: true,
        avatarUrl: true,
      },
    });

    revalidateTag('students', { expire: 0 });

    return NextResponse.json({ success: true, personal: updated });
  } catch (error) {
    logger.error('PATCH /api/profile/personal error', error);
    return NextResponse.json({ error: 'Failed to update personal information' }, { status: 500 });
  }
}
