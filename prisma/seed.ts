import { PrismaClient } from '@prisma/client';
import { SIH_OFFICIAL_17_THEMES } from '../src/lib/tracks';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Seed Tracks (the 17 official SIH themes)
  //
  // `id` is written explicitly rather than left to @default(uuid()). The API
  // serves these same literal ids to the browser, and /api/teams looks the
  // submitted trackId up by primary key -- so if the seed generated UUIDs
  // instead, every team creation would 404. See src/lib/tracks.ts.
  const trackUpserts = SIH_OFFICIAL_17_THEMES.map((theme) => {
    const fields = {
      name: theme.name,
      problemStatementCode: theme.problemStatementCode,
      description: theme.description,
      category: theme.category,
    };
    return prisma.track.upsert({
      where: { id: theme.id },
      update: fields,
      create: { id: theme.id, ...fields },
    });
  });

  await prisma.$transaction(trackUpserts);
  console.log('Tracks seeded successfully.');

  // 2. Seed Mentor Registration Keys
  const mentorKeys = [
    { key: 'GLB-MENTOR-2026-NEXA' },
    { key: 'GLB-MENTOR-2026-FACULTY' },
    { key: 'GLB-MENTOR-2026-VIP' },
  ];

  const keyUpserts = mentorKeys.map((item) =>
    prisma.mentorRegistrationKey.upsert({
      where: { key: item.key },
      update: {},
      create: item,
    })
  );

  await prisma.$transaction(keyUpserts);
  console.log('Mentor keys seeded successfully.');

  // 3. Seed Campus Events (Hustle Carnival 2026 & SIH Internal 2026)
  await prisma.event.upsert({
    where: { slug: 'hustle-carnival-2026' },
    update: {
      name: 'Hustle Carnival',
      tagline: 'Hustle Beyond · Open Innovation Buildathon',
      description:
        'The flagship hybrid buildathon hosted by Club Ellusion, the official technical club of G.L. Bajaj Group of Institutions, Mathura. Open Innovation challenge for teams of 1-2 across engineering and management, featuring an online submission phase and a 6-hour on-campus finale.',
      bannerUrl: '/events/hustle-carnival.png',
      startDate: new Date('2026-10-22T08:30:00.000Z'),
      endDate: new Date('2026-10-24T11:00:00.000Z'),
      isActive: true,
    },
    create: {
      name: 'Hustle Carnival',
      slug: 'hustle-carnival-2026',
      tagline: 'Hustle Beyond · Open Innovation Buildathon',
      description:
        'The flagship hybrid buildathon hosted by Club Ellusion, the official technical club of G.L. Bajaj Group of Institutions, Mathura. Open Innovation challenge for teams of 1-2 across engineering and management, featuring an online submission phase and a 6-hour on-campus finale.',
      bannerUrl: '/events/hustle-carnival.png',
      startDate: new Date('2026-10-22T08:30:00.000Z'),
      endDate: new Date('2026-10-24T11:00:00.000Z'),
      isActive: true,
      createdBy: 'system',
    },
  });

  await prisma.event.upsert({
    where: { slug: 'sih-internal-2026' },
    update: {},
    create: {
      name: 'SIH Internal 2026',
      slug: 'sih-internal-2026',
      tagline: 'GL Bajaj Smart India Hackathon — Internal Round',
      description:
        'The official internal round of Smart India Hackathon 2026 at GL Bajaj Group of Institutions, Mathura. Form balanced teams, close skill gaps, and match with verified faculty mentors before the national finale.',
      bannerUrl: '/Logo/GL-BAJAJ-LOGO-3.png',
      startDate: new Date('2026-06-01T00:00:00.000Z'),
      endDate: new Date('2026-12-31T00:00:00.000Z'),
      isActive: true,
      createdBy: 'system',
    },
  });
  console.log('Campus events seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
