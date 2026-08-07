import { prisma } from './prisma';

export async function createNotification(userId: string, type: string, payload: Record<string, unknown>) {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        type,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        payload: payload as any,
      },
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
}
