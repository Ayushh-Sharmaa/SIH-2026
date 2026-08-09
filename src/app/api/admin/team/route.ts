import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { checkUserRateLimit } from '@/lib/rateLimit';
import { adminTeamActionSchema } from '@/lib/validation';
import { isAuthorizedAdminEmail } from '@/lib/admin';
import { logger } from '@/lib/logger';
import { revalidateTag } from 'next/cache';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !(await isAuthorizedAdminEmail(decoded.email))) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Authenticated user rate limit check
    const rateLimitResponse = await checkUserRateLimit(request, decoded.userId);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json().catch(() => ({}));
    
    // Parse/Validate input using Zod Schema
    const parsed = adminTeamActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid parameters format.' }, { status: 400 });
    }

    const { teamId, action, status } = parsed.data;

    if (action === 'update_status') {
      if (!status) {
        return NextResponse.json({ error: 'Status is required for status updates.' }, { status: 400 });
      }
      const updatedTeam = await prisma.team.update({
        where: { id: teamId },
        data: { status },
      });
      return NextResponse.json({ success: true, team: updatedTeam });
    }

    if (action === 'delete') {
      await prisma.$transaction(async (tx) => {
        await tx.studentProfile.updateMany({
          where: { teamId },
          data: { teamId: null, teamStatus: 'OPEN', roleInTeam: 'Member' },
        });
        await tx.team.delete({ where: { id: teamId } });
      });
      revalidateTag('teams', { expire: 0 });
      revalidateTag('students', { expire: 0 });
      revalidateTag('mentors', { expire: 0 });
      return NextResponse.json({ success: true, message: 'Team disbanded successfully' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    logger.error('Admin team update error', error);
    return NextResponse.json({ error: 'Failed to update team.' }, { status: 500 });
  }
}
