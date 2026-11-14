import { Request, Response, NextFunction } from 'express';
import { billService } from './bill.service';

export class BillController {
  async getBills(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bills = await billService.getBills(req.workspaceId!, {
        category: req.query.category as any,
        status: req.query.status as any,
        assignedMemberId: req.query.assignedMemberId as string,
        search: req.query.search as string,
        from: req.query.from ? new Date(req.query.from as string) : undefined,
        to: req.query.to ? new Date(req.query.to as string) : undefined
      });
      res.status(200).json({ success: true, data: bills });
    } catch (error) {
      next(error);
    }
  }

  async getBillById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bill = await billService.getBillById(req.workspaceId!, req.params.billId);
      res.status(200).json({ success: true, data: bill });
    } catch (error) {
      next(error);
    }
  }

  async createBill(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bill = await billService.createBill(req.workspaceId!, req.user!.id, req.body);
      res.status(201).json({
        success: true,
        message: 'Bill created successfully',
        data: bill
      });
    } catch (error) {
      next(error);
    }
  }

  async updateBill(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await billService.updateBill(req.workspaceId!, req.params.billId, req.user!.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Bill updated successfully',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteBill(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await billService.deleteBill(req.workspaceId!, req.params.billId, req.user!.id);
      res.status(200).json({ success: true, message: 'Bill deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async markPaid(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payment = await billService.markPaid(req.workspaceId!, req.params.billId, req.user!.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Bill payment recorded successfully',
        data: payment
      });
    } catch (error) {
      next(error);
    }
  }

  async getPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payments = await billService.getPayments(req.workspaceId!, req.query.billId as string);
      res.status(200).json({ success: true, data: payments });
    } catch (error) {
      next(error);
    }
  }
}

export const billController = new BillController();
