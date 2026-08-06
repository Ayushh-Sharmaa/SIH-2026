import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { checkUserRateLimit } from '@/lib/rateLimit';
import { adminMentorApproveSchema } from '@/lib/validation';
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

    // Authenticated user rate limit check
    const rateLimitResponse = await checkUserRateLimit(request, decoded.userId);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json().catch(() => ({}));
    
    // Parse/Validate input using Zod Schema
    const parsed = adminMentorApproveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid parameters format.' }, { status: 400 });
    }

    const { mentorId } = parsed.data;

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
