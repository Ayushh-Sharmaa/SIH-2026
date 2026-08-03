import { PrismaClient } from '@prisma/client';
import { mockPrisma } from './mockDb';

const isMock =
  !process.env.DATABASE_URL ||
  process.env.DATABASE_URL.includes('[PASSWORD]') ||
  process.env.DATABASE_URL.includes('[PROJECT-ID]');

if (isMock) {
  console.log('⚠️ DATABASE_URL is not configured. Running SIH@GLBGOI in local mock prototype mode.');
}

export const prisma = isMock
  ? (mockPrisma as any)
  : (global as any).prisma ||
    new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

if (process.env.NODE_ENV !== 'production' && !isMock) {
  (global as any).prisma = prisma;
}
