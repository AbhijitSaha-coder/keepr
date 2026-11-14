import { z } from 'zod';
import { SubscriptionCycle, SubscriptionStatus } from '@prisma/client';

export const createSubscriptionSchema = z.object({
  name: z.string().min(1, 'Subscription name is required').max(100),
  provider: z.string().min(1, 'Provider name is required').max(100),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().min(3).max(3).default('USD'),
  billingCycle: z.nativeEnum(SubscriptionCycle).default(SubscriptionCycle.MONTHLY),
  nextRenewalDate: z.string().transform((val) => new Date(val)),
  category: z.string().default('Entertainment'),
  status: z.nativeEnum(SubscriptionStatus).default(SubscriptionStatus.ACTIVE),
  notes: z.string().max(1000).optional().nullable(),
  cancellationUrl: z.string().url().optional().nullable().or(z.literal('')),
  cancellationInstructions: z.string().max(1000).optional().nullable(),
  reminderDaysBefore: z.number().int().min(0).max(30).default(3)
});

export const updateSubscriptionSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  provider: z.string().min(1).max(100).optional(),
  amount: z.number().positive().optional(),
  currency: z.string().min(3).max(3).optional(),
  billingCycle: z.nativeEnum(SubscriptionCycle).optional(),
  nextRenewalDate: z.string().transform((val) => new Date(val)).optional(),
  category: z.string().optional(),
  status: z.nativeEnum(SubscriptionStatus).optional(),
  notes: z.string().max(1000).optional().nullable(),
  cancellationUrl: z.string().url().optional().nullable().or(z.literal('')),
  cancellationInstructions: z.string().max(1000).optional().nullable(),
  reminderDaysBefore: z.number().int().min(0).max(30).optional()
});
