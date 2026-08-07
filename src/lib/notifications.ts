import { prisma } from './prisma';

export async function createNotification(userId: string, type: string, payload: Record<string, unknown>) {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        type,
        payload: payload ?? {},
      },
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
}
