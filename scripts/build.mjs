import { execSync } from 'node:child_process';

const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL) && !process.env.DATABASE_URL.includes('placeholder');

if (hasDatabaseUrl && !isCI) {
  try {
    console.log('[Build] Deploying Prisma migrations...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  } catch (error) {
    console.warn('[Build] Prisma migration notice:', error instanceof Error ? error.message : String(error));
  }
} else {
  console.log('[Build] Skipping prisma migrate deploy in CI/pre-build environment.');
}

console.log('[Build] Executing Next.js production build...');
execSync('next build', { stdio: 'inherit' });
