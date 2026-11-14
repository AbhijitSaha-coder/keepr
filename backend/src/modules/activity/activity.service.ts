import { prisma } from '../../config/db';

export interface ActivityFilterOptions {
  entity?: string;
  action?: string;
  limit?: number;
  offset?: number;
}

export class ActivityService {
  async getActivityLogs(workspaceId: string, filters: ActivityFilterOptions) {
    const limit = filters.limit ? Math.min(filters.limit, 100) : 50;
    const offset = filters.offset || 0;

    const where: any = { workspaceId };
    if (filters.entity) where.entity = filters.entity;
    if (filters.action) where.action = filters.action;

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        include: {
          actor: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.activityLog.count({ where })
    ]);

    return {
      items: logs,
      total,
      limit,
      offset
    };
  }
}

export const activityService = new ActivityService();
