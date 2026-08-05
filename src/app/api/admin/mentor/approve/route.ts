import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { isAuthorizedAdminEmail } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !(await isAuthorizedAdminEmail(decoded.email))) {
      return NextResponse.json({ error: 'Forbidden: Admin permissions required.' }, { status: 403 });
    }

    const body = await request.json();
    const { mentorId } = body;

    if (!mentorId) {
      return NextResponse.json({ error: 'Mentor ID is required.' }, { status: 400 });
    }

    await prisma.mentorProfile.update({
      where: { userId: mentorId },
      data: { verified: true },
    });

    return NextResponse.json({
      success: true,
      message: 'Mentor approved successfully.',
    });
  } catch (error) {
    logger.error('Admin approve mentor error', error);
    return NextResponse.json({ error: 'Failed to approve mentor.' }, { status: 500 });
  }
}
