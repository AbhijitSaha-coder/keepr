import { prisma } from '../config/db';
import { logger } from '../utils/logger';

export interface LogActivityParams {
  workspaceId: string;
  actorId?: string | null;
  action: string;
  entity: string;
  entityId: string;
  entityName?: string;
  metadata?: Record<string, unknown>;
}

export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        workspaceId: params.workspaceId,
        actorId: params.actorId || null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        entityName: params.entityName,
        metadata: (params.metadata || {}) as any
      }
    });
  } catch (err) {
    logger.error('Failed to write activity log:', err);
  }
}
