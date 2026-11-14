import { Request, Response, NextFunction } from 'express';
import { subscriptionService } from './subscription.service';

export class SubscriptionController {
  async getSubscriptions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const subs = await subscriptionService.getSubscriptions(req.workspaceId!, {
        status: req.query.status as any,
        category: req.query.category as string,
        search: req.query.search as string
      });
      res.status(200).json({ success: true, data: subs });
    } catch (error) {
      next(error);
    }
  }

  async getExpenditureSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const summary = await subscriptionService.getExpenditureSummary(req.workspaceId!);
      res.status(200).json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  }

  async getSubscriptionById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sub = await subscriptionService.getSubscriptionById(req.workspaceId!, req.params.subscriptionId);
      res.status(200).json({ success: true, data: sub });
    } catch (error) {
      next(error);
    }
  }

  async createSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sub = await subscriptionService.createSubscription(req.workspaceId!, req.user!.id, req.body);
      res.status(201).json({
        success: true,
        message: 'Subscription created successfully',
        data: sub
      });
    } catch (error) {
      next(error);
    }
  }

  async updateSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await subscriptionService.updateSubscription(
        req.workspaceId!,
        req.params.subscriptionId,
        req.user!.id,
        req.body
      );
      res.status(200).json({
        success: true,
        message: 'Subscription updated successfully',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await subscriptionService.deleteSubscription(req.workspaceId!, req.params.subscriptionId, req.user!.id);
      res.status(200).json({ success: true, message: 'Subscription deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const subscriptionController = new SubscriptionController();
