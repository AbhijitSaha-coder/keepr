import { prisma } from '../../config/db';
import { NotFoundError } from '../../utils/errors';
import { MockEmailService } from '../../services/emailService';

export class NotificationService {
  async getUserNotifications(userId: string, unreadOnly = false, limit = 50, offset = 0) {
    const where: any = { userId };
    if (unreadOnly) {
      where.read = false;
    }

    const [items, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, read: false } })
    ]);

    return {
      items,
      total,
      unreadCount
    };
  }

  async markAsRead(userId: string, notificationId: string) {
    const existing = await prisma.notification.findFirst({
      where: { id: notificationId, userId }
    });

    if (!existing) {
      throw new NotFoundError('Notification not found');
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: { read: true, readAt: new Date() }
    });
  }

  async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true, readAt: new Date() }
    });
    return true;
  }

  async deleteNotification(userId: string, notificationId: string) {
    const existing = await prisma.notification.findFirst({
      where: { id: notificationId, userId }
    });

    if (!existing) {
      throw new NotFoundError('Notification not found');
    }

    await prisma.notification.delete({
      where: { id: notificationId }
    });

    return true;
  }

  async getPreferences(userId: string) {
    let prefs = await prisma.notificationPreference.findUnique({
      where: { userId }
    });

    if (!prefs) {
      prefs = await prisma.notificationPreference.create({
        data: { userId }
      });
    }

    return prefs;
  }

  async updatePreferences(userId: string, data: any) {
    return prisma.notificationPreference.upsert({
      where: { userId },
      create: {
        userId,
        ...data
      },
      update: data
    });
  }

  getDevOutbox() {
    return MockEmailService.getOutbox();
  }
}

export const notificationService = new NotificationService();
