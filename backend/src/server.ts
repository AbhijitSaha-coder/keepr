import app from './app';
import { env } from './config/env';
import { connectDB, disconnectDB } from './config/db';
import { redis } from './config/redis';
import { logger } from './utils/logger';
import { startNotificationWorker, stopNotificationWorker } from './jobs/notificationQueue';
import { runReminderCheck } from './jobs/reminderScheduler';

let reminderInterval: NodeJS.Timeout | null = null;

async function bootstrap() {
  try {
    // 1. Connect to Database
    await connectDB();
    logger.info('✅ PostgreSQL Database connected successfully');

    // 2. Start Background Worker
    startNotificationWorker();
    logger.info('✅ BullMQ Notification Worker started');

    // 3. Initial check and periodic reminder schedule (every 1 hour)
    runReminderCheck().catch((err) => logger.error('Initial reminder check error:', err));
    reminderInterval = setInterval(() => {
      runReminderCheck().catch((err) => logger.error('Scheduled reminder check error:', err));
    }, 60 * 60 * 1000);

    // 4. Start HTTP Server
    const server = app.listen(env.PORT, () => {
      logger.info(`🚀 Keepr API Server running in ${env.NODE_ENV} mode on http://localhost:${env.PORT}`);
      logger.info(`📖 API Documentation available at http://localhost:${env.PORT}/api/docs`);
    });

    // Graceful Shutdown Handler
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);

      if (reminderInterval) {
        clearInterval(reminderInterval);
      }

      server.close(async () => {
        logger.info('HTTP server closed');
        await stopNotificationWorker();
        logger.info('Notification worker stopped');
        await redis.quit();
        logger.info('Redis client disconnected');
        await disconnectDB();
        logger.info('Prisma client disconnected');
        process.exit(0);
      });

      // Force shutdown after 10s if dangling connections remain
      setTimeout(() => {
        logger.error('Forced shutdown due to timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
