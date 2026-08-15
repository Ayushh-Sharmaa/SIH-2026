import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { checkUserRateLimit } from '@/lib/rateLimit';
import { isAuthorizedAdminEmail } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';

const deleteMentorSchema = z.object({
  mentorId: z.string().min(1),
});

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

    const rateLimitResponse = await checkUserRateLimit(request, decoded.userId);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json().catch(() => ({}));
    const parsed = deleteMentorSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid mentor ID provided.' }, { status: 400 });
    }

    const { mentorId } = parsed.data;

    // 1. Check if mentor exists
    const mentor = await prisma.mentorProfile.findUnique({
      where: { userId: mentorId },
      include: { user: true },
    });

    if (!mentor) {
      return NextResponse.json({ error: 'Mentor profile not found.' }, { status: 404 });
    }

    // 2. Disassociate any assigned teams
    await prisma.team.updateMany({
      where: { mentorId },
      data: { mentorId: null },
    });

    // 3. Delete mentor requests
    await prisma.mentorRequest.deleteMany({
      where: { mentorId },
    });

    // 4. Delete the MentorProfile
    await prisma.mentorProfile.delete({
      where: { userId: mentorId },
    });

    // 5. Delete the User record completely so they can log in and re-onboard from scratch
    await prisma.user.delete({
      where: { id: mentorId },
    });

    revalidateTag('mentors', { expire: 0 });
    revalidateTag('teams', { expire: 0 });
    revalidatePath('/mentors');
    revalidatePath('/team-formation/browse-teams');
    revalidatePath('/admin');
    revalidatePath('/dashboard');

    logger.debug(`Admin ${decoded.email} deleted mentor profile: ${mentor.name} (${mentor.user.email})`);

    return NextResponse.json({
      success: true,
      message: `Mentor profile for ${mentor.name} was successfully removed. They can create a new profile if they sign in again.`,
    });
  } catch (error) {
    logger.error('Admin delete mentor error', error);
    return NextResponse.json({ error: 'Failed to delete mentor profile.' }, { status: 500 });
  }
}
