import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { prisma } from './config/db';
import { redis } from './config/redis';
import { swaggerDocument } from './config/swagger';
import { apiLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { NotFoundError } from './utils/errors';

// Route imports
import { authRoutes } from './modules/auth/auth.routes';
import { userRoutes } from './modules/users/user.routes';
import { workspaceRoutes } from './modules/workspaces/workspace.routes';
import { billRoutes } from './modules/bills/bill.routes';
import { subscriptionRoutes } from './modules/subscriptions/subscription.routes';
import { documentRoutes } from './modules/documents/document.routes';
import { inventoryRoutes } from './modules/inventory/inventory.routes';
import { taskRoutes } from './modules/tasks/task.routes';
import { notificationRoutes } from './modules/notifications/notification.routes';
import { analyticsRoutes } from './modules/analytics/analytics.routes';
import { activityRoutes } from './modules/activity/activity.routes';

const app = express();

// Security & Optimization Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(cors({
  origin: env.NODE_ENV === 'development' ? true : env.FRONTEND_URL,
  credentials: true
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Global API rate limiting
app.use('/api', apiLimiter);

// Health Check Endpoint
app.get(['/health', '/api/health'], async (_req: Request, res: Response) => {
  let dbStatus = 'healthy';
  let redisStatus = 'healthy';

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    dbStatus = 'unhealthy';
  }

  try {
    await redis.ping();
  } catch (err) {
    redisStatus = 'unhealthy';
  }

  const isHealthy = dbStatus === 'healthy' && redisStatus === 'healthy';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'pass' : 'fail',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: dbStatus,
      redis: redisStatus
    }
  });
});

// API Documentation via Swagger UI
app.use(['/api-docs', '/api/docs'], swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Mount Modules
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/activity', activityRoutes);

// Catch-all 404 for undefined routes
app.use((_req: Request, _res: Response, next) => {
  next(new NotFoundError('The requested endpoint was not found on this server'));
});

// Centralized error handler
app.use(errorHandler);

export default app;
