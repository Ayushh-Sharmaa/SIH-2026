import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { checkUserRateLimit } from '@/lib/rateLimit';
import { adminStudentActionSchema } from '@/lib/validation';
import { banUserEmail, isAuthorizedAdminEmail, unbanUserEmail, SUPER_ADMIN_EMAIL } from '@/lib/admin';
import { logger } from '@/lib/logger';
import { revalidatePath, revalidateTag } from 'next/cache';

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
    const parsed = adminStudentActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid parameters format.' }, { status: 400 });
    }

    const { email, action } = parsed.data;
    const cleanEmail = email.trim().toLowerCase();

    if (action === 'ban' || action === 'remove') {
      if (cleanEmail === SUPER_ADMIN_EMAIL) {
        return NextResponse.json({ error: 'Cannot ban Super Admin account.' }, { status: 400 });
      }
      await banUserEmail(cleanEmail, decoded.email);
      return NextResponse.json({
        success: true,
        message: `Suspended access for ${cleanEmail}. The user will be blocked from signing in.`,
      });
    }

    if (action === 'restore' || action === 'unban') {
      await unbanUserEmail(cleanEmail, decoded.email);
      return NextResponse.json({
        success: true,
        message: `Restored access for ${cleanEmail}. The user can sign in again.`,
      });
    }

    if (action === 'delete') {
      if (cleanEmail === SUPER_ADMIN_EMAIL) {
        return NextResponse.json({ error: 'Cannot delete Super Admin account.' }, { status: 400 });
      }

      const user = await prisma.user.findUnique({
        where: { email: cleanEmail },
        include: {
          studentProfile: {
            include: {
              team: {
                include: { members: true },
              },
            },
          },
        },
      });

      if (!user) {
        return NextResponse.json({ error: 'User account not found.' }, { status: 404 });
      }

      const team = user.studentProfile?.team;
      if (team) {
        if (team.leaderId === user.id) {
          // If student is leader and only 1 member, disband team
          if (team.members.length <= 1) {
            await prisma.team.delete({ where: { id: team.id } });
          } else {
            // Reassign leadership to another member
            const nextLeader = team.members.find((m: { userId: string }) => m.userId !== user.id);
            if (nextLeader) {
              await prisma.team.update({
                where: { id: team.id },
                data: {
                  leaderId: nextLeader.userId,
                  memberCount: { decrement: 1 },
                },
              });
              await prisma.studentProfile.update({
                where: { userId: nextLeader.userId },
                data: { roleInTeam: 'Leader' },
              });
            }
          }
        } else {
          // Regular member leaving team
          await prisma.team.update({
            where: { id: team.id },
            data: { memberCount: { decrement: 1 } },
          });
        }
      }

      // Delete user (cascades to StudentProfile, JoinRequests, TeamInvites)
      await prisma.user.delete({
        where: { id: user.id },
      });

      // Also unban if previously banned
      await unbanUserEmail(cleanEmail, decoded.email).catch(() => {});

      revalidateTag('students', { expire: 0 });
      revalidateTag('teams', { expire: 0 });
      revalidatePath('/team-formation/browse-teammates');
      revalidatePath('/team-formation/browse-teams');
      revalidatePath('/admin');
      revalidatePath('/dashboard');

      logger.debug(`Admin ${decoded.email} deleted student profile: ${cleanEmail}`);

      return NextResponse.json({
        success: true,
        message: `Student account for ${cleanEmail} was permanently deleted. They can re-register from scratch upon signing in.`,
      });
    }

    return NextResponse.json({ error: 'Unknown admin student action' }, { status: 400 });
  } catch (error) {
    logger.error('Admin student action error', error);
    return NextResponse.json({ error: 'Failed to process admin action.' }, { status: 500 });
  }
}
