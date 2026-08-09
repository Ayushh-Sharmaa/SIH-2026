import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { checkUserRateLimit } from '@/lib/rateLimit';
import { studentProfileSchema, profileLookupQuerySchema, parseQuery } from '@/lib/validation';
import {
  MAX_TAGS,
  avatarDataUri,
  safeUrl,
  tagArray,
} from '@/lib/validate';
import { SIH_OFFICIAL_18_THEMES } from '@/lib/tracks';
import { logger } from '@/lib/logger';

const VALID_TRACK_IDS = new Set(SIH_OFFICIAL_18_THEMES.map((t) => t.id));

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

    // Authenticated user rate limit check
    const rateLimitResponse = await checkUserRateLimit(request, decoded.userId);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json().catch(() => ({}));
    
    // Parse/Validate input using Zod Schema
    const parsed = studentProfileSchema.safeParse(body);
    if (!parsed.success) {
      logger.error('Student profile validation failed', parsed.error.format(), { body });
      const errorMsg = parsed.error.issues[0]?.message || 'Invalid profile information format.';
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const {
      name,
      year,
      branch,
      gender,
      rollNo,
      section,
      category,
      contact,
      college,
      skills,
      languages,
      softSkills,
      resumeUrl,
      githubUrl,
      linkedinUrl,
      avatarUrl,
      trackInterest,
    } = parsed.data;

    if (college) {
      await prisma.user.update({
        where: { id: decoded.userId },
        data: { college },
      });
    }

    // Only ids the platform actually publishes are accepted. Without this an
    // arbitrary string reaches the `trackInterest` relation connect and Prisma
    // raises a foreign-key error, which surfaces to the user as a generic 500.
    const cleanTrackIds = Array.isArray(trackInterest)
      ? [...new Set(trackInterest.filter((id: unknown): id is string => typeof id === 'string'))]
          .filter((id) => VALID_TRACK_IDS.has(id))
          .slice(0, MAX_TAGS)
      : [];

    // Update the StudentProfile & connect track interests
    const updatedProfile = await prisma.studentProfile.update({
      where: { userId: decoded.userId },
      data: {
        name,
        year,
        branch,
        gender: gender || null,
        rollNo: rollNo || null,
        section: section || null,
        category: category || null,
        contact: contact || null,
        skills: tagArray(skills),
        languages: tagArray(languages),
        softSkills: tagArray(softSkills),
        resumeUrl: safeUrl(resumeUrl),
        githubUrl: safeUrl(githubUrl),
        linkedinUrl: safeUrl(linkedinUrl),
        avatarUrl: avatarDataUri(avatarUrl),
        trackInterest: {
          set: cleanTrackIds.map((id: string) => ({ id })),
        },
      },
    });

    const { revalidateTag } = await import('next/cache');
    revalidateTag('students', { expire: 0 });
    revalidateTag('teams', { expire: 0 });

    // If user is a team leader, update their team's selected track
    if (updatedProfile.teamId && cleanTrackIds.length > 0) {
      const team = await prisma.team.findUnique({
        where: { id: updatedProfile.teamId },
      });
      if (team && team.leaderId === decoded.userId) {
        await prisma.team.update({
          where: { id: team.id },
          data: { trackId: cleanTrackIds[0] },
        });
      }
    }

    // Dummy comment to trigger IDE diagnostics refresh
    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (error) {
    logger.error('Update student profile error', error);
    return NextResponse.json({ error: 'Failed to update student profile.' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Authenticated user rate limit check
    const rateLimitResponse = await checkUserRateLimit(request, decoded.userId);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const parsedQuery = parseQuery(request.url, profileLookupQuerySchema);
    if (!parsedQuery.success) {
      return NextResponse.json({ error: 'Invalid profile query.' }, { status: 400 });
    }

    const targetUserId = parsedQuery.data.userId;
    // `userId` is a direct object reference: any authenticated caller can name
    // any other user. That is intentional — /profile/[id] is the teammate viewer
    // — but it means the response must depend on who is asking, not just on who
    // was asked for.
    const isSelf = !targetUserId || targetUserId === decoded.userId;
    const hasRollNoAccess = isSelf || decoded.role === 'ADMIN' || decoded.role === 'MENTOR';
    const queryId = targetUserId || decoded.userId;

    const student = await prisma.studentProfile.findUnique({
      where: { userId: queryId },
      include: {
        trackInterest: { select: { id: true, name: true, problemStatementCode: true } },
        user: { select: { email: true, college: true } },
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found.' }, { status: 404 });
    }

    const trackInterest = student.trackInterest.map((t) => t.id);
    const tracksDetailed = student.trackInterest.map((t) => ({
      id: t.id,
      name: t.name,
      code: t.problemStatementCode,
    }));

    // Fields the teammate viewer renders for everyone. Keeping this list
    // explicit — rather than spreading the row and deleting keys — means a
    // column added to StudentProfile later is private by default.
    const shared = {
      name: student.name,
      year: student.year,
      branch: student.branch,
      gender: student.gender,
      rollNo: hasRollNoAccess ? student.rollNo : null,
      section: student.section,
      category: student.category,
      college: student.user.college,
      skills: student.skills,
      languages: student.languages,
      softSkills: student.softSkills,
      resumeUrl: student.resumeUrl,
      githubUrl: student.githubUrl,
      linkedinUrl: student.linkedinUrl,
      avatarUrl: student.avatarUrl,
      email: student.user.email,
      contact: student.contact,
      trackInterest,
      tracksDetailed,
    };

    return NextResponse.json({
      success: true,
      profile: shared,
    });
  } catch (error) {
    logger.error('Get student profile error', error);
    return NextResponse.json({ error: 'Failed to retrieve student profile.' }, { status: 500 });
  }
}
