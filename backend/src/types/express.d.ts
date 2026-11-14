import { MemberRole } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface WorkspaceMemberContext {
  id: string;
  role: MemberRole;
  workspaceId: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      sessionId?: string;
      workspaceId?: string;
      workspaceMember?: WorkspaceMemberContext;
    }
  }
}
