import { z } from 'zod';

export const updateNotificationPreferencesSchema = z.object({
  emailEnabled: z.boolean().optional(),
  inAppEnabled: z.boolean().optional(),
  billDueDays: z.number().int().min(0).max(30).optional(),
  subscriptionRenewalDays: z.number().int().min(0).max(30).optional(),
  warrantyExpiringDays: z.number().int().min(0).max(60).optional(),
  documentExpiringDays: z.number().int().min(0).max(60).optional(),
  taskDeadlineDays: z.number().int().min(0).max(14).optional(),
  maintenanceDueDays: z.number().int().min(0).max(30).optional()
});
