import { z } from 'zod';
import { WorkspaceType, MemberRole } from '@prisma/client';

export const createWorkspaceSchema = z.object({
  name: z.string().min(1, 'Workspace name is required').max(100),
  type: z.nativeEnum(WorkspaceType).default(WorkspaceType.HOUSEHOLD),
  currency: z.string().min(3).max(3).default('USD')
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  currency: z.string().min(3).max(3).optional()
});

export const inviteMemberSchema = z.object({
  email: z.string().email('Valid email address is required'),
  role: z.enum([MemberRole.ADMIN, MemberRole.MEMBER]).default(MemberRole.MEMBER)
});

export const updateMemberRoleSchema = z.object({
  role: z.enum([MemberRole.ADMIN, MemberRole.MEMBER])
});

export const transferOwnershipSchema = z.object({
  newOwnerId: z.string().uuid('Valid user ID required')
});
