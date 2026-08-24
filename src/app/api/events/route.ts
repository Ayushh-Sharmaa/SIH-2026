import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { isAuthorizedAdminEmail } from '@/lib/admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  const decoded = verifyToken(token);
  if (!decoded) return null;
  const isAdmin = await isAuthorizedAdminEmail(decoded.email);
  return isAdmin ? decoded : null;
}

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET() {
  try {
    const session = await getSession();
    const isAdmin = session ? await isAuthorizedAdminEmail(session.email) : false;

    const events = await prisma.event.findMany({
      where: isAdmin ? undefined : { isActive: true },
      orderBy: [{ startDate: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ success: true, events });
  } catch (err) {
    console.error('[GET /api/events]', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch events.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const body = await req.json();
    const { name, slug, tagline, description, bannerUrl, startDate, endDate, isActive } = body;

    if (!name || !slug || !description) {
      return NextResponse.json(
        { error: 'name, slug, and description are required.' },
        { status: 400 }
      );
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: 'Slug must be lowercase letters, numbers, and hyphens only.' },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: {
        name: String(name).trim(),
        slug: String(slug).trim().toLowerCase(),
        tagline: tagline ? String(tagline).trim() : null,
        description: String(description).trim(),
        bannerUrl: bannerUrl ? String(bannerUrl).trim() : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        createdBy: admin.email,
      },
    });

    return NextResponse.json({ success: true, event });
  } catch (err: unknown) {
    console.error('[POST /api/events]', err);
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code: string }).code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'An event with this slug already exists.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ success: false, error: 'Failed to create event.' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, tagline, description, bannerUrl, startDate, endDate, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'Event id is required.' }, { status: 400 });
    }

    const event = await prisma.event.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: String(name).trim() }),
        ...(tagline !== undefined && { tagline: tagline ? String(tagline).trim() : null }),
        ...(description !== undefined && { description: String(description).trim() }),
        ...(bannerUrl !== undefined && { bannerUrl: bannerUrl ? String(bannerUrl).trim() : null }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
    });

    return NextResponse.json({ success: true, event });
  } catch (err) {
    console.error('[PUT /api/events]', err);
    return NextResponse.json({ success: false, error: 'Failed to update event.' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Event id is required.' }, { status: 400 });
    }

    await prisma.event.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/events]', err);
    return NextResponse.json({ success: false, error: 'Failed to delete event.' }, { status: 500 });
  }
}