import { NextResponse } from 'next/server';
import { SIH_OFFICIAL_18_THEMES } from '@/lib/tracks';

/**
 * The theme list is a build-time constant, so this response never varies.
 * Marking it static lets Next serve it from the edge cache instead of booting a
 * function per request — four client pages fetch it on mount.
 */
export const dynamic = 'force-static';

export async function GET() {
  return NextResponse.json({
    success: true,
    officialPsReleased: false,
    notice:
      'Official SIH 2026 Problem Statements are not out yet. Platform tracks are configured with all 18 official SIH Themes.',
    tracks: SIH_OFFICIAL_18_THEMES,
  });
}
