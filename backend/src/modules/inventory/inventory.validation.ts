import { z } from 'zod';
import { InventoryCategory, MaintenanceStatus } from '@prisma/client';

export const createInventoryItemSchema = z.object({
  name: z.string().min(1, 'Item name is required').max(100),
  description: z.string().max(500).optional().nullable(),
  category: z.nativeEnum(InventoryCategory).default(InventoryCategory.OTHER),
  purchaseDate: z.string().optional().nullable().transform((val) => (val ? new Date(val) : null)),
  purchasePrice: z.number().positive().optional().nullable(),
  currency: z.string().min(3).max(3).default('USD'),
  warrantyExpiration: z.string().optional().nullable().transform((val) => (val ? new Date(val) : null)),
  serialNumber: z.string().max(100).optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  ownerId: z.string().uuid().optional().nullable(),
  notes: z.string().max(1000).optional().nullable()
});

export const updateInventoryItemSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  category: z.nativeEnum(InventoryCategory).optional(),
  purchaseDate: z.string().optional().nullable().transform((val) => (val ? new Date(val) : null)),
  purchasePrice: z.number().positive().optional().nullable(),
  currency: z.string().min(3).max(3).optional(),
  warrantyExpiration: z.string().optional().nullable().transform((val) => (val ? new Date(val) : null)),
  serialNumber: z.string().max(100).optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  ownerId: z.string().uuid().optional().nullable(),
  notes: z.string().max(1000).optional().nullable()
});

export const createMaintenanceSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().max(500).optional().nullable(),
  scheduledDate: z.string().transform((val) => new Date(val)),
  cost: z.number().positive().optional().nullable(),
  performer: z.string().max(100).optional().nullable()
});

export const updateMaintenanceSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  scheduledDate: z.string().transform((val) => new Date(val)).optional(),
  completedDate: z.string().optional().nullable().transform((val) => (val ? new Date(val) : null)),
  cost: z.number().positive().optional().nullable(),
  status: z.nativeEnum(MaintenanceStatus).optional(),
  performer: z.string().max(100).optional().nullable()
});
