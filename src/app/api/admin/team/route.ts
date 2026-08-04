import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { isAuthorizedAdminEmail } from '@/lib/admin';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    // Always verify against the allowlist, not just the token's role claim
    if (!decoded || !(await isAuthorizedAdminEmail(decoded.email))) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { teamId, action, status } = await request.json();

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }

    if (action === 'update_status') {
      const updatedTeam = await prisma.team.update({
        where: { id: teamId },
        data: { status },
      });
      return NextResponse.json({ success: true, team: updatedTeam });
    }

    if (action === 'delete') {
      // Disband team and unassign students
      await prisma.studentProfile.updateMany({
        where: { teamId },
        data: { teamId: null, teamStatus: 'OPEN' },
      });
      await prisma.team.delete({
        where: { id: teamId },
      });
      return NextResponse.json({ success: true, message: 'Team disbanded successfully' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Admin team update error:', error);
    return NextResponse.json({ error: 'Failed to update team.' }, { status: 500 });
  }
}
