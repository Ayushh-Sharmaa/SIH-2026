import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { isAuthorizedAdminEmail } from '@/lib/admin';
import { DEFAULT_ARENA_EVENTS } from '@/lib/eventsData';

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

    const defaultEvent = DEFAULT_ARENA_EVENTS.find(
      (e) => e.slug === slug || (slug === 'hustle-carnival' && e.slug === 'hustle-carnival-2026')
    );

    let dbEvent = null;
    try {
      dbEvent = await prisma.event.findUnique({
        where: { slug },
      });
    } catch {
      // Fall through to defaultEvent
    }

    const event = defaultEvent
      ? {
          ...defaultEvent,
          ...(dbEvent
            ? Object.fromEntries(
                Object.entries(dbEvent).filter(([_, v]) => v !== null && v !== undefined)
              )
            : {}),
        }
      : dbEvent;

    if (!event || (!event.isActive && !isAdmin)) {
      return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, event });
  } catch (err) {
    console.error('[GET /api/events/[slug]]', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch event.' }, { status: 500 });
  }
}