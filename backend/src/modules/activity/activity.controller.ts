import { Request, Response, NextFunction } from 'express';
import { activityService } from './activity.service';

export class ActivityController {
  async getActivityLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const logs = await activityService.getActivityLogs(req.workspaceId!, {
        entity: req.query.entity as string,
        action: req.query.action as string,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string, 10) : 0
      });
      res.status(200).json({ success: true, data: logs });
    } catch (error) {
      next(error);
    }
  }
}

export const activityController = new ActivityController();
