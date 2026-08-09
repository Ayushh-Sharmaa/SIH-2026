import { prisma } from './prisma';
import { after } from 'next/server';
import { logger } from './logger';

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
    logger.error('Failed to create notification', error, { userId, type });
    return null;
  }
}

/**
 * Persist a notification after the mutation response has been sent.
 * Notification delivery was already best-effort (failures are swallowed), so
 * making users wait for this extra database round trip added latency without
 * adding transactional integrity.
 */
export function queueNotification(
  userId: string,
  type: string,
  payload: Record<string, unknown>,
): void {
  after(() => createNotification(userId, type, payload));
}
