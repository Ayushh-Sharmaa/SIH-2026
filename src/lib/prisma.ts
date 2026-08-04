import { PrismaClient } from '@prisma/client';

/**
 * A single Prisma client against Supabase Postgres.
 *
 * This file previously fell back to a JSON-file "mock" database whenever
 * DATABASE_URL was missing or still held placeholders. That fallback was the
 * root cause of signups silently vanishing in production: a serverless host
 * has a read-only filesystem, so every write was discarded without an error.
 * The fallback is gone - a missing DATABASE_URL now fails immediately.
 */
if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is not set. Copy .env.example to .env and fill in your Supabase ' +
      'connection strings, and set DATABASE_URL / DIRECT_URL in your hosting provider.'
  );
}

if (
  process.env.DATABASE_URL.includes('[PASSWORD]') ||
  process.env.DATABASE_URL.includes('[PROJECT-ID]') ||
  process.env.DATABASE_URL.includes('<project-ref>')
) {
  throw new Error(
    'DATABASE_URL still contains template placeholders. Replace it with the real ' +
      'Supabase connection string (Project Settings -> Database -> Connection string -> ORMs/Prisma).'
  );
}

export const prisma: PrismaClient =
  (global as any).prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  (global as any).prisma = prisma;
}
