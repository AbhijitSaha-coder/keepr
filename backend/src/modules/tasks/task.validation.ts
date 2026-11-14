import { z } from 'zod';
import { TaskPriority, TaskStatus } from '@prisma/client';

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(150),
  description: z.string().max(2000).optional().nullable(),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO),
  deadline: z.string().optional().nullable().transform((val) => (val ? new Date(val) : null)),
  assignedMemberId: z.string().uuid().optional().nullable(),
  isRecurring: z.boolean().default(false),
  recurrenceInterval: z.string().optional().nullable()
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(150).optional(),
  description: z.string().max(2000).optional().nullable(),
  priority: z.nativeEnum(TaskPriority).optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  deadline: z.string().optional().nullable().transform((val) => (val ? new Date(val) : null)),
  assignedMemberId: z.string().uuid().optional().nullable(),
  isRecurring: z.boolean().optional(),
  recurrenceInterval: z.string().optional().nullable()
});

export const addCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(1000)
});
