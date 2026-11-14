import { Request, Response, NextFunction } from 'express';
import { MemberRole } from '@prisma/client';
import { prisma } from '../config/db';
import { BadRequestError, ForbiddenError, UnauthorizedError } from '../utils/errors';

export function authorizeWorkspace(allowedRoles?: MemberRole[]) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      // Check params, header, or query
      const workspaceId =
        req.params.workspaceId ||
        (req.headers['x-workspace-id'] as string) ||
        (req.query.workspaceId as string) ||
        req.body?.workspaceId;

      if (!workspaceId) {
        throw new BadRequestError('Workspace ID is required');
      }

      const member = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId: req.user.id
          }
        }
      });

      if (!member) {
        throw new ForbiddenError('You are not a member of this workspace');
      }

      if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(member.role)) {
        throw new ForbiddenError(`Action requires one of the following roles: ${allowedRoles.join(', ')}`);
      }

      req.workspaceId = workspaceId;
      req.workspaceMember = {
        id: member.id,
        role: member.role,
        workspaceId: member.workspaceId
      };

      next();
    } catch (error) {
      next(error);
    }
  };
}
