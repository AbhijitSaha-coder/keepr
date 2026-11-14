import { prisma } from '../../config/db';
import { InventoryCategory, MaintenanceStatus } from '@prisma/client';
import { NotFoundError } from '../../utils/errors';
import { logActivity } from '../../services/activityLogger';
import { addDays } from 'date-fns';

export interface InventoryFilters {
  category?: InventoryCategory;
  location?: string;
  search?: string;
  expiringWarrantyWithinDays?: number;
}

export class InventoryService {
  async getItems(workspaceId: string, filters: InventoryFilters) {
    const where: any = { workspaceId };

    if (filters.category) where.category = filters.category;
    if (filters.location) {
      where.location = { contains: filters.location, mode: 'insensitive' };
    }
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { serialNumber: { contains: filters.search, mode: 'insensitive' } },
        { location: { contains: filters.search, mode: 'insensitive' } }
      ];
    }
    if (filters.expiringWarrantyWithinDays) {
      const now = new Date();
      const future = addDays(now, filters.expiringWarrantyWithinDays);
      where.warrantyExpiration = {
        gte: now,
        lte: future
      };
    }

    return prisma.inventoryItem.findMany({
      where,
      include: {
        owner: { select: { id: true, firstName: true, lastName: true } },
        maintenanceRecords: {
          where: { status: MaintenanceStatus.SCHEDULED },
          orderBy: { scheduledDate: 'asc' },
          take: 1
        },
        _count: { select: { documents: true, maintenanceRecords: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getItemById(workspaceId: string, id: string) {
    const item = await prisma.inventoryItem.findFirst({
      where: { id, workspaceId },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, email: true } },
        maintenanceRecords: { orderBy: { scheduledDate: 'desc' } },
        documents: true
      }
    });

    if (!item) {
      throw new NotFoundError('Inventory item not found in this workspace');
    }

    return item;
  }

  async createItem(workspaceId: string, actorId: string, data: any) {
    const item = await prisma.inventoryItem.create({
      data: {
        workspaceId,
        name: data.name,
        description: data.description || null,
        category: data.category || InventoryCategory.OTHER,
        purchaseDate: data.purchaseDate || null,
        purchasePrice: data.purchasePrice || null,
        currency: data.currency || 'USD',
        warrantyExpiration: data.warrantyExpiration || null,
        serialNumber: data.serialNumber || null,
        location: data.location || null,
        ownerId: data.ownerId || null,
        notes: data.notes || null
      }
    });

    await logActivity({
      workspaceId,
      actorId,
      action: 'CREATE',
      entity: 'INVENTORY',
      entityId: item.id,
      entityName: item.name,
      metadata: { category: item.category, price: item.purchasePrice }
    });

    return item;
  }

  async updateItem(workspaceId: string, id: string, actorId: string, data: any) {
    const existing = await prisma.inventoryItem.findFirst({
      where: { id, workspaceId }
    });

    if (!existing) {
      throw new NotFoundError('Inventory item not found in this workspace');
    }

    const updated = await prisma.inventoryItem.update({
      where: { id },
      data
    });

    await logActivity({
      workspaceId,
      actorId,
      action: 'UPDATE',
      entity: 'INVENTORY',
      entityId: id,
      entityName: updated.name,
      metadata: data
    });

    return updated;
  }

  async deleteItem(workspaceId: string, id: string, actorId: string) {
    const existing = await prisma.inventoryItem.findFirst({
      where: { id, workspaceId }
    });

    if (!existing) {
      throw new NotFoundError('Inventory item not found in this workspace');
    }

    await prisma.inventoryItem.delete({
      where: { id }
    });

    await logActivity({
      workspaceId,
      actorId,
      action: 'DELETE',
      entity: 'INVENTORY',
      entityId: id,
      entityName: existing.name
    });

    return true;
  }

  async addMaintenance(workspaceId: string, itemId: string, actorId: string, data: any) {
    const item = await prisma.inventoryItem.findFirst({
      where: { id: itemId, workspaceId }
    });

    if (!item) {
      throw new NotFoundError('Inventory item not found in this workspace');
    }

    const record = await prisma.maintenanceRecord.create({
      data: {
        inventoryItemId: itemId,
        workspaceId,
        title: data.title,
        description: data.description || null,
        scheduledDate: data.scheduledDate,
        cost: data.cost || null,
        performer: data.performer || null,
        status: MaintenanceStatus.SCHEDULED
      }
    });

    await logActivity({
      workspaceId,
      actorId,
      action: 'CREATE_MAINTENANCE',
      entity: 'INVENTORY',
      entityId: itemId,
      entityName: item.name,
      metadata: { maintenanceId: record.id, title: record.title }
    });

    return record;
  }

  async updateMaintenance(workspaceId: string, maintenanceId: string, actorId: string, data: any) {
    const existing = await prisma.maintenanceRecord.findFirst({
      where: { id: maintenanceId, workspaceId }
    });

    if (!existing) {
      throw new NotFoundError('Maintenance record not found');
    }

    const updated = await prisma.maintenanceRecord.update({
      where: { id: maintenanceId },
      data
    });

    await logActivity({
      workspaceId,
      actorId,
      action: 'UPDATE_MAINTENANCE',
      entity: 'INVENTORY',
      entityId: existing.inventoryItemId,
      metadata: { maintenanceId, status: updated.status }
    });

    return updated;
  }

  async deleteMaintenance(workspaceId: string, maintenanceId: string, actorId: string) {
    const existing = await prisma.maintenanceRecord.findFirst({
      where: { id: maintenanceId, workspaceId }
    });

    if (!existing) {
      throw new NotFoundError('Maintenance record not found');
    }

    await prisma.maintenanceRecord.delete({
      where: { id: maintenanceId }
    });

    return true;
  }
}

export const inventoryService = new InventoryService();
