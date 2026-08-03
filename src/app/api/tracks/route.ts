import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const tracks = await prisma.track.findMany({
      include: {
        _count: {
          select: { teams: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      tracks: tracks.map((track: any) => ({
        id: track.id,
        name: track.name,
        problemStatementCode: track.problemStatementCode,
        description: track.description,
        category: track.category,
        teamCount: track._count.teams,
      })),
    });
  } catch (error) {
    console.error('Fetch tracks error:', error);
    return NextResponse.json({ error: 'Failed to retrieve tracks.' }, { status: 500 });
  }
}
