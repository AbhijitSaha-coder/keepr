import { Request, Response, NextFunction } from 'express';
import { notificationService } from './notification.service';
import { runReminderCheck } from '../../jobs/reminderScheduler';

export class NotificationController {
  async getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const unreadOnly = req.query.unread === 'true';
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      const result = await notificationService.getUserNotifications(req.user!.id, unreadOnly, limit, offset);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await notificationService.markAsRead(req.user!.id, req.params.notificationId);
      res.status(200).json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await notificationService.markAllAsRead(req.user!.id);
      res.status(200).json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
      next(error);
    }
  }

  async deleteNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await notificationService.deleteNotification(req.user!.id, req.params.notificationId);
      res.status(200).json({ success: true, message: 'Notification deleted' });
    } catch (error) {
      next(error);
    }
  }

  async getPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const prefs = await notificationService.getPreferences(req.user!.id);
      res.status(200).json({ success: true, data: prefs });
    } catch (error) {
      next(error);
    }
  }

  async updatePreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await notificationService.updatePreferences(req.user!.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Notification preferences updated',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  async triggerReminderRun(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await runReminderCheck();
      res.status(200).json({
        success: true,
        message: 'Reminder check triggered successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getDevOutbox(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const outbox = notificationService.getDevOutbox();
      res.status(200).json({ success: true, data: outbox });
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
