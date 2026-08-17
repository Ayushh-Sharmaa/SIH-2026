import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseDataUri } from '@/lib/avatar';
import { createRateLimiter, clientIp, tooManyRequests } from '@/lib/rateLimit';

const RECORD_ID_REGEX = /^[a-zA-Z0-9_-]{1,64}$/;

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const MAX_AVATAR_BYTES = 500 * 1024; // 500 KB ceiling

const avatarRateLimiter = createRateLimiter({
  limit: 120, // 120 requests per minute per IP
  windowMs: 60_000,
  prefix: 'avatar_fetch',
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // 1. IP Rate Limiting & Abuse Protection
    const ip = clientIp(request);
    const rateLimit = await avatarRateLimiter(ip);
    if (!rateLimit.ok) {
      return tooManyRequests(rateLimit, 'Too many avatar requests.');
    }

    // 2. Strict User ID format validation (blocks path traversal & enumeration probes)
    const { userId } = await params;
    if (!userId || !RECORD_ID_REGEX.test(userId)) {
      return NextResponse.json({ error: 'Invalid identifier format' }, { status: 400 });
    }

    // 3. Query active student or mentor profile
    const student = await prisma.studentProfile.findUnique({
      where: { userId },
      select: { avatarUrl: true, isDemo: true },
    });

    let avatarUrl: string | null | undefined = null;
    if (student && !student.isDemo) {
      avatarUrl = student.avatarUrl;
    }

    if (!avatarUrl) {
      const mentor = await prisma.mentorProfile.findUnique({
        where: { userId },
        select: { avatarUrl: true, isDemo: true },
      });
      if (mentor && !mentor.isDemo) {
        avatarUrl = mentor.avatarUrl;
      }
    }

    // Generic 404 to prevent profile enumeration
    if (!avatarUrl) {
      return NextResponse.json(
        { error: 'Avatar not found' },
        {
          status: 404,
          headers: {
            'X-Content-Type-Options': 'nosniff',
            'Cache-Control': 'no-store',
          },
        }
      );
    }

    // 4. If external trusted URL, redirect
    if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
      return NextResponse.redirect(avatarUrl, { status: 302 });
    }

    // 5. If data URI, validate MIME type, size cap, and stream binary
    if (avatarUrl.startsWith('data:image/')) {
      const parsed = parseDataUri(avatarUrl);
      if (!parsed) {
        return NextResponse.json({ error: 'Invalid avatar data' }, { status: 400 });
      }

      // Strict MIME allowlist (bans SVG and active scripts)
      if (!ALLOWED_MIME_TYPES.has(parsed.mimeType.toLowerCase())) {
        return NextResponse.json({ error: 'Disallowed image format' }, { status: 415 });
      }

      // Strict byte ceiling
      if (parsed.buffer.length > MAX_AVATAR_BYTES) {
        return NextResponse.json({ error: 'Avatar exceeds maximum size' }, { status: 413 });
      }

      const uint8 = new Uint8Array(parsed.buffer);
      return new Response(uint8, {
        status: 200,
        headers: {
          'Content-Type': parsed.mimeType,
          'Content-Length': parsed.buffer.length.toString(),
          'X-Content-Type-Options': 'nosniff',
          'Content-Security-Policy': "default-src 'none'",
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800, immutable',
        },
      });
    }

    return NextResponse.json({ error: 'Unsupported avatar format' }, { status: 415 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
