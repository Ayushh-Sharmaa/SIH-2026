import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { checkUserRateLimit } from '@/lib/rateLimit';
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
    if (!decoded || decoded.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimitResponse = await checkUserRateLimit(request, decoded.userId);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json().catch(() => ({}));
    const { teamId, role, gender, abilities, requirements } = body;

    if (!teamId || !role || !gender || !abilities) {
      return NextResponse.json({ error: 'Missing required parameters.' }, { status: 400 });
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { members: true },
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found.' }, { status: 404 });
    }

    if (team.leaderId !== decoded.userId) {
      return NextResponse.json({ error: 'Only the team leader can post recruitment notices.' }, { status: 403 });
    }

    const noticeCount = await prisma.recruitmentNotice.count({
      where: { teamId },
    });

    const openSeats = 6 - team.members.length;
    if (noticeCount >= openSeats) {
      return NextResponse.json(
        { error: 'Cannot post more recruitment notices than open roster seats.' },
        { status: 400 }
      );
    }

    const notice = await prisma.recruitmentNotice.create({
      data: {
        teamId,
        role: role.trim(),
        gender: gender.toUpperCase(),
        abilities: Array.isArray(abilities) ? abilities.map((a: string) => a.trim()).filter(Boolean) : [],
        requirements: requirements?.trim() || null,
      },
    });

    revalidateTag('teams', { expire: 0 });

    return NextResponse.json({
      success: true,
      message: 'Recruitment notice posted successfully.',
      notice,
    });
  } catch (error) {
    logger.error('Post recruitment notice error', error);
    return NextResponse.json({ error: 'Failed to post recruitment notice.' }, { status: 500 });
  }
}

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

    const rateLimitResponse = await checkUserRateLimit(request, decoded.userId);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json().catch(() => ({}));
    const { noticeId, role, gender, abilities, requirements } = body;

    if (!noticeId || !role || !gender || !abilities) {
      return NextResponse.json({ error: 'Missing required parameters.' }, { status: 400 });
    }

    const notice = await prisma.recruitmentNotice.findUnique({
      where: { id: noticeId },
      include: { team: true },
    });

    if (!notice) {
      return NextResponse.json({ error: 'Recruitment notice not found.' }, { status: 404 });
    }

    if (notice.team.leaderId !== decoded.userId) {
      return NextResponse.json({ error: 'Only the team leader can modify recruitment notices.' }, { status: 403 });
    }

    const updated = await prisma.recruitmentNotice.update({
      where: { id: noticeId },
      data: {
        role: role.trim(),
        gender: gender.toUpperCase(),
        abilities: Array.isArray(abilities) ? abilities.map((a: string) => a.trim()).filter(Boolean) : [],
        requirements: requirements?.trim() || null,
      },
    });

    revalidateTag('teams', { expire: 0 });

    return NextResponse.json({
      success: true,
      message: 'Recruitment notice updated successfully.',
      notice: updated,
    });
  } catch (error) {
    logger.error('Update recruitment notice error', error);
    return NextResponse.json({ error: 'Failed to update recruitment notice.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
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

    const rateLimitResponse = await checkUserRateLimit(request, decoded.userId);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json().catch(() => ({}));
    const { noticeId } = body;

    if (!noticeId) {
      return NextResponse.json({ error: 'Notice ID is required.' }, { status: 400 });
    }

    const notice = await prisma.recruitmentNotice.findUnique({
      where: { id: noticeId },
      include: { team: true },
    });

    if (!notice) {
      return NextResponse.json({ error: 'Recruitment notice not found.' }, { status: 404 });
    }

    if (notice.team.leaderId !== decoded.userId) {
      return NextResponse.json({ error: 'Only the team leader can delete recruitment notices.' }, { status: 403 });
    }

    await prisma.recruitmentNotice.delete({
      where: { id: noticeId },
    });

    revalidateTag('teams', { expire: 0 });

    return NextResponse.json({
      success: true,
      message: 'Recruitment notice deleted successfully.',
    });
  } catch (error) {
    logger.error('Delete recruitment notice error', error);
    return NextResponse.json({ error: 'Failed to delete recruitment notice.' }, { status: 500 });
  }
}
