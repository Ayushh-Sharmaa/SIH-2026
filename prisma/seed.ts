import { PrismaClient } from '@prisma/client';
import { SIH_OFFICIAL_18_THEMES } from '../src/lib/tracks';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Seed Tracks (the 18 official SIH themes)
  //
  // `id` is written explicitly rather than left to @default(uuid()). The API
  // serves these same literal ids to the browser, and /api/teams looks the
  // submitted trackId up by primary key -- so if the seed generated UUIDs
  // instead, every team creation would 404. See src/lib/tracks.ts.
  for (const theme of SIH_OFFICIAL_18_THEMES) {
    const fields = {
      name: theme.name,
      problemStatementCode: theme.problemStatementCode,
      description: theme.description,
      category: theme.category,
    };
    await prisma.track.upsert({
      where: { id: theme.id },
      update: fields,
      create: { id: theme.id, ...fields },
    });
  }
  console.log('Tracks seeded successfully.');

  // 2. Seed Mentor Registration Keys
  const mentorKeys = [
    { key: 'GLB-MENTOR-2026-NEXA' },
    { key: 'GLB-MENTOR-2026-FACULTY' },
    { key: 'GLB-MENTOR-2026-VIP' },
  ];

  for (const item of mentorKeys) {
    await prisma.mentorRegistrationKey.upsert({
      where: { key: item.key },
      update: {},
      create: item,
    });
  }
  console.log('Mentor keys seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
