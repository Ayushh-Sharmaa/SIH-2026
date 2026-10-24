import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { isAuthorizedAdminEmail } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const decoded = token ? verifyToken(token) : null;
    const isAdmin = decoded ? await isAuthorizedAdminEmail(decoded.email) : false;

    const event = await prisma.event.findUnique({
      where: { slug },
    });

    if (!event || (!event.isActive && !isAdmin)) {
      return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, event });
  } catch (err) {
    console.error('[GET /api/events/[slug]]', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch event.' }, { status: 500 });
  }
}