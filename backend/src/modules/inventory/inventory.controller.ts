import { Request, Response, NextFunction } from 'express';
import { inventoryService } from './inventory.service';

export class InventoryController {
  async getItems(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const items = await inventoryService.getItems(req.workspaceId!, {
        category: req.query.category as any,
        location: req.query.location as string,
        search: req.query.search as string,
        expiringWarrantyWithinDays: req.query.expiringWarrantyWithinDays
          ? parseInt(req.query.expiringWarrantyWithinDays as string, 10)
          : undefined
      });
      res.status(200).json({ success: true, data: items });
    } catch (error) {
      next(error);
    }
  }

  async getItemById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await inventoryService.getItemById(req.workspaceId!, req.params.itemId);
      res.status(200).json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  }

  async createItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await inventoryService.createItem(req.workspaceId!, req.user!.id, req.body);
      res.status(201).json({
        success: true,
        message: 'Inventory item added successfully',
        data: item
      });
    } catch (error) {
      next(error);
    }
  }

  async updateItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await inventoryService.updateItem(
        req.workspaceId!,
        req.params.itemId,
        req.user!.id,
        req.body
      );
      res.status(200).json({
        success: true,
        message: 'Item updated successfully',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await inventoryService.deleteItem(req.workspaceId!, req.params.itemId, req.user!.id);
      res.status(200).json({ success: true, message: 'Item deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async addMaintenance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const record = await inventoryService.addMaintenance(
        req.workspaceId!,
        req.params.itemId,
        req.user!.id,
        req.body
      );
      res.status(201).json({
        success: true,
        message: 'Maintenance schedule added',
        data: record
      });
    } catch (error) {
      next(error);
    }
  }

  async updateMaintenance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await inventoryService.updateMaintenance(
        req.workspaceId!,
        req.params.maintenanceId,
        req.user!.id,
        req.body
      );
      res.status(200).json({
        success: true,
        message: 'Maintenance record updated',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteMaintenance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await inventoryService.deleteMaintenance(req.workspaceId!, req.params.maintenanceId, req.user!.id);
      res.status(200).json({ success: true, message: 'Maintenance record deleted' });
    } catch (error) {
      next(error);
    }
  }
}

export const inventoryController = new InventoryController();
