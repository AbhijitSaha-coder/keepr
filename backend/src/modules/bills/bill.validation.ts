import { z } from 'zod';
import { BillCategory, BillRecurrence, BillStatus } from '@prisma/client';

export const createBillSchema = z.object({
  name: z.string().min(1, 'Bill name is required').max(100),
  description: z.string().max(500).optional(),
  amount: z.number().positive('Amount must be greater than zero'),
  currency: z.string().min(3).max(3).default('USD'),
  category: z.nativeEnum(BillCategory).default(BillCategory.OTHER),
  recurrence: z.nativeEnum(BillRecurrence).default(BillRecurrence.ONE_TIME),
  customIntervalDays: z.number().int().positive().optional(),
  customIntervalMonths: z.number().int().positive().optional(),
  dueDate: z.string().transform((val) => new Date(val)),
  assignedMemberId: z.string().uuid().optional().nullable(),
  reminderDaysBefore: z.number().int().min(0).max(30).default(3),
  notes: z.string().max(1000).optional()
});

export const updateBillSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  amount: z.number().positive().optional(),
  currency: z.string().min(3).max(3).optional(),
  category: z.nativeEnum(BillCategory).optional(),
  recurrence: z.nativeEnum(BillRecurrence).optional(),
  customIntervalDays: z.number().int().positive().optional().nullable(),
  customIntervalMonths: z.number().int().positive().optional().nullable(),
  dueDate: z.string().transform((val) => new Date(val)).optional(),
  status: z.nativeEnum(BillStatus).optional(),
  assignedMemberId: z.string().uuid().optional().nullable(),
  reminderDaysBefore: z.number().int().min(0).max(30).optional(),
  notes: z.string().max(1000).optional().nullable()
});

export const markBillPaidSchema = z.object({
  amount: z.number().positive().optional(),
  paymentMethod: z.string().default('MANUAL'),
  paidAt: z.string().transform((val) => new Date(val)).default(() => new Date().toISOString()),
  notes: z.string().max(500).optional(),
  receiptUrl: z.string().optional().nullable()
});
