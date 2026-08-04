import { PrismaClient } from '@prisma/client';

/**
 * A single Prisma client against Supabase Postgres.
 */
if (!process.env.DATABASE_URL) {
  console.warn(
    '[SIH@GLBGOI] DATABASE_URL is not set — ensure connection strings are configured in your environment.'
  );
} else if (
  process.env.DATABASE_URL.includes('[PASSWORD]') ||
  process.env.DATABASE_URL.includes('[PROJECT-ID]') ||
  process.env.DATABASE_URL.includes('<project-ref>')
) {
  console.warn(
    '[SIH@GLBGOI] DATABASE_URL still contains template placeholders. Replace with your real Supabase connection string.'
  );
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
