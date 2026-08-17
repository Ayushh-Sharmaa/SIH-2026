import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { checkUserRateLimit } from '@/lib/rateLimit';
import { adminPortalAccessSchema } from '@/lib/validation';
import { recalculateTeamSkills } from '@/lib/derived';
import { revalidatePath, revalidateTag } from 'next/cache';
import {
  isAuthorizedAdminEmail,
  addWhitelistedEmail,
  removeWhitelistedEmail,
  updateWhitelistedRole,
  getWhitelistedEmails,
} from '@/lib/admin';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
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
    if (rateLimitResponse) return rateLimitResponse;

    const list = await getWhitelistedEmails();
    return NextResponse.json({ success: true, whitelistedEmails: list });
  } catch (error) {
    logger.error('Fetch whitelisted portal emails error', error);
    return NextResponse.json({ error: 'Failed to fetch portal access whitelist.' }, { status: 500 });
  }
}

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

    // Parse & Validate input
    const parsed = adminPortalAccessSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid parameters format.' }, { status: 400 });
    }

    const { action, email, role, note } = parsed.data;
    const targetEmail = email.trim().toLowerCase();

    if (action === 'add') {
      const assignedRole = role === 'MENTOR' ? 'MENTOR' : 'STUDENT';
      const updatedList = await addWhitelistedEmail(targetEmail, assignedRole, decoded.email, note);
      return NextResponse.json({
        success: true,
        message: `Granted ${assignedRole} portal access to ${targetEmail}`,
        whitelistedEmails: updatedList,
      });
    }

    if (action === 'remove') {
      const updatedList = await removeWhitelistedEmail(targetEmail);

      // If user exists in DB, delete their account and associations so their session is immediately invalidated
      const existingUser = await prisma.user.findUnique({
        where: { email: targetEmail },
        include: {
          studentProfile: {
            include: { team: true },
          },
        },
      });

      if (existingUser) {
        const team = existingUser.studentProfile?.team;
        if (team) {
          if (team.leaderId === existingUser.id) {
            await prisma.studentProfile.updateMany({
              where: { teamId: team.id, userId: { not: existingUser.id } },
              data: { teamId: null, teamStatus: 'OPEN', roleInTeam: 'Member' },
            });
            await prisma.team.delete({ where: { id: team.id } }).catch(() => {});
          } else {
            await prisma.team.update({
              where: { id: team.id },
              data: { memberCount: { decrement: 1 } },
            }).catch(() => {});
            await recalculateTeamSkills(team.id).catch(() => {});
          }
        }

        await prisma.user.delete({ where: { id: existingUser.id } }).catch(() => {});
      }

      revalidateTag('students', { expire: 0 });
      revalidateTag('teams', { expire: 0 });
      revalidatePath('/admin');
      revalidatePath('/team-formation/browse-teammates');
      revalidatePath('/team-formation/browse-teams');

      return NextResponse.json({
        success: true,
        message: `Revoked portal access and logged out ${targetEmail}`,
        whitelistedEmails: updatedList,
      });
    }

    if (action === 'update_role') {
      const assignedRole = role === 'MENTOR' ? 'MENTOR' : 'STUDENT';
      const updatedList = await updateWhitelistedRole(targetEmail, assignedRole);
      return NextResponse.json({
        success: true,
        message: `Updated portal role for ${targetEmail} to ${assignedRole}`,
        whitelistedEmails: updatedList,
      });
    }

    return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 });
  } catch (error) {
    logger.error('Admin portal access management error', error);
    return NextResponse.json({ error: 'Failed to update portal access permissions.' }, { status: 500 });
  }
}
