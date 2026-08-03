import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Seed Tracks (SIH Problem Statements)
  const tracks = [
    {
      name: 'Smart Health Monitoring System',
      problemStatementCode: 'SIH1299',
      description: 'Develop an AI-powered system that tracks patients vitals in real-time, predicts health anomalies, and alerts medical professionals automatically.',
      category: 'Software',
    },
    {
      name: 'Automated Crop Disease Detection',
      problemStatementCode: 'SIH1300',
      description: 'A mobile/web platform utilizing computer vision models to identify crop diseases from leaf images, providing remediation methods and weather risk assessments.',
      category: 'Software',
    },
    {
      name: 'AI-based Traffic Management System',
      problemStatementCode: 'SIH1301',
      description: 'An intelligent system that leverages CCTV feeds to analyze traffic density at intersections and dynamically adjust signal timings to minimize congestion.',
      category: 'Software',
    },
    {
      name: 'IoT Smart Electric Metering Grid',
      problemStatementCode: 'SIH1302',
      description: 'A hardware-software hybrid framework for real-time monitoring of electricity consumption, detection of line faults, and prevention of power theft.',
      category: 'Hardware',
    },
    {
      name: 'Security Threat Assessment Portal',
      problemStatementCode: 'SIH1303',
      description: 'A cyber threat hunting tool that monitors log files, calculates risk factor metrics, and provides defensive playbook recommendations.',
      category: 'Software',
    },
  ];

  for (const track of tracks) {
    await prisma.track.upsert({
      where: { problemStatementCode: track.problemStatementCode },
      update: {},
      create: track,
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
