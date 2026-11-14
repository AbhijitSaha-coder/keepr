import { Queue, Worker, Job } from 'bullmq';
import { redis } from '../config/redis';
import { prisma } from '../config/db';
import { logger } from '../utils/logger';
import { emailService } from '../services/emailService';
import { NotificationType } from '@prisma/client';
import { format, addDays, isBefore, startOfDay, endOfDay } from 'date-fns';

export interface NotificationJobData {
  userId: string;
  workspaceId?: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  deduplicationKey: string;
}

export const NOTIFICATION_QUEUE_NAME = 'keepr-notifications';

export const notificationQueue = new Queue<NotificationJobData>(NOTIFICATION_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    removeOnComplete: 1000,
    removeOnFail: 5000
  }
});

notificationQueue.on('error', (err) => {
  logger.warn(`BullMQ Queue warning: ${err.message}`);
});

/**
 * Worker processor that creates the in-app notification idempotently
 * and dispatches email if user preferences allow.
 */
export async function processNotificationJob(job: Job<NotificationJobData>): Promise<void> {
  const data = job.data;
  logger.info(`Processing notification job: [${data.type}] ${data.title} for user ${data.userId}`);

  // Fetch user and notification preferences
  const user = await prisma.user.findUnique({
    where: { id: data.userId },
    include: { notificationPreference: true }
  });

  if (!user) {
    logger.warn(`User ${data.userId} not found for notification job`);
    return;
  }

  const prefs = user.notificationPreference || {
    emailEnabled: true,
    inAppEnabled: true
  };

  // 1. In-App Notification (Idempotent via deduplicationKey)
  if (prefs.inAppEnabled) {
    try {
      await prisma.notification.upsert({
        where: { deduplicationKey: data.deduplicationKey },
        create: {
          userId: data.userId,
          workspaceId: data.workspaceId,
          type: data.type,
          title: data.title,
          message: data.message,
          entityType: data.entityType,
          entityId: data.entityId,
          deduplicationKey: data.deduplicationKey
        },
        update: {} // No-op if already created
      });
    } catch (err: any) {
      // If concurrent create hit unique constraint, safe to ignore
      logger.debug('Notification already exists for deduplication key:', data.deduplicationKey);
    }
  }

  // 2. Email Notification (if enabled)
  if (prefs.emailEnabled) {
    await emailService.sendEmail({
      to: user.email,
      subject: `[Keepr] ${data.title}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #4f46e5; margin-top: 0;">Keepr Reminder</h2>
          <p style="font-size: 16px; font-weight: 600; color: #1e293b;">${data.title}</p>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;">${data.message}</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #94a3b8;">You received this notification according to your Keepr notification settings.</p>
        </div>
      `,
      text: `${data.title}\n\n${data.message}`
    });
  }
}

let notificationWorker: Worker<NotificationJobData> | null = null;

export function startNotificationWorker(): Worker<NotificationJobData> {
  if (!notificationWorker) {
    notificationWorker = new Worker<NotificationJobData>(
      NOTIFICATION_QUEUE_NAME,
      async (job) => {
        await processNotificationJob(job);
      },
      {
        connection: redis,
        concurrency: 5
      }
    );

    notificationWorker.on('completed', (job) => {
      logger.info(`Job ${job.id} completed successfully`);
    });

    notificationWorker.on('failed', (job, err) => {
      logger.error(`Job ${job?.id} failed with error:`, err);
    });

    notificationWorker.on('error', (err) => {
      logger.warn(`BullMQ Worker warning: ${err.message}`);
    });
  }

  return notificationWorker;
}

/**
 * Dispatches notification through BullMQ if Redis is ready,
 * or directly processes it in PostgreSQL/Email as an offline fallback.
 */
export async function dispatchNotification(data: NotificationJobData): Promise<void> {
  try {
    if (redis.status === 'ready' || redis.status === 'connect') {
      await notificationQueue.add(`notify-${data.type}-${Date.now()}`, data);
      return;
    }
  } catch (err: any) {
    logger.debug(`Queue dispatch fallback: ${err.message}`);
  }

  // Graceful fallback: Process directly via database if Redis queue is offline
  await processNotificationJob({ data } as any);
}

export async function stopNotificationWorker(): Promise<void> {
  if (notificationWorker) {
    await notificationWorker.close();
    notificationWorker = null;
  }
}
