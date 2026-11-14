import { z } from 'zod';
import { DocumentCategory } from '@prisma/client';

export const createDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(150),
  description: z.string().max(500).optional().nullable(),
  category: z.nativeEnum(DocumentCategory).default(DocumentCategory.OTHER),
  expirationDate: z.string().optional().nullable().transform(val => (val ? new Date(val) : null)),
  linkedBillId: z.string().uuid().optional().nullable(),
  linkedInventoryId: z.string().uuid().optional().nullable(),
  linkedSubscriptionId: z.string().uuid().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  tags: z.array(z.string().min(1).max(30)).optional().default([])
});

export const updateDocumentSchema = z.object({
  title: z.string().min(1).max(150).optional(),
  description: z.string().max(500).optional().nullable(),
  category: z.nativeEnum(DocumentCategory).optional(),
  expirationDate: z.string().optional().nullable().transform(val => (val ? new Date(val) : null)),
  linkedBillId: z.string().uuid().optional().nullable(),
  linkedInventoryId: z.string().uuid().optional().nullable(),
  linkedSubscriptionId: z.string().uuid().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  tags: z.array(z.string().min(1).max(30)).optional()
});
