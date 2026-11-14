import { Request, Response, NextFunction } from 'express';
import { workspaceService } from './workspace.service';

export class WorkspaceController {
  async getUserWorkspaces(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaces = await workspaceService.getUserWorkspaces(req.user!.id);
      res.status(200).json({ success: true, data: workspaces });
    } catch (error) {
      next(error);
    }
  }

  async getWorkspaceById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspace = await workspaceService.getWorkspaceById(req.params.workspaceId, req.user!.id);
      res.status(200).json({ success: true, data: workspace });
    } catch (error) {
      next(error);
    }
  }

  async createWorkspace(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspace = await workspaceService.createWorkspace(req.user!.id, req.body);
      res.status(201).json({
        success: true,
        message: 'Workspace created successfully',
        data: workspace
      });
    } catch (error) {
      next(error);
    }
  }

  async updateWorkspace(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await workspaceService.updateWorkspace(req.params.workspaceId, req.user!.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Workspace updated successfully',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteWorkspace(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await workspaceService.deleteWorkspace(req.params.workspaceId, req.user!.id);
      res.status(200).json({ success: true, message: 'Workspace deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  // Members & Invitations
  async getMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const members = await workspaceService.getMembers(req.params.workspaceId);
      res.status(200).json({ success: true, data: members });
    } catch (error) {
      next(error);
    }
  }

  async inviteMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const invitation = await workspaceService.inviteMember(
        req.params.workspaceId,
        req.user!.id,
        req.body.email,
        req.body.role
      );
      res.status(201).json({
        success: true,
        message: 'Invitation sent successfully',
        data: invitation
      });
    } catch (error) {
      next(error);
    }
  }

  async getInvitations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const invitations = await workspaceService.getInvitations(req.params.workspaceId);
      res.status(200).json({ success: true, data: invitations });
    } catch (error) {
      next(error);
    }
  }

  async getUserInvitations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const invitations = await workspaceService.getUserInvitations(req.user!.email);
      res.status(200).json({ success: true, data: invitations });
    } catch (error) {
      next(error);
    }
  }

  async acceptInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspace = await workspaceService.acceptInvitation(req.body.token, req.user!.id);
      res.status(200).json({
        success: true,
        message: 'Invitation accepted! You are now a member.',
        data: workspace
      });
    } catch (error) {
      next(error);
    }
  }

  async rejectInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await workspaceService.rejectInvitation(req.body.token, req.user!.id);
      res.status(200).json({ success: true, message: 'Invitation declined' });
    } catch (error) {
      next(error);
    }
  }

  async updateMemberRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await workspaceService.updateMemberRole(
        req.params.workspaceId,
        req.params.userId,
        req.body.role,
        req.user!.id
      );
      res.status(200).json({
        success: true,
        message: 'Member role updated successfully',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  async removeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await workspaceService.removeMember(req.params.workspaceId, req.params.userId, req.user!.id);
      res.status(200).json({ success: true, message: 'Member removed successfully' });
    } catch (error) {
      next(error);
    }
  }

  async transferOwnership(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await workspaceService.transferOwnership(req.params.workspaceId, req.user!.id, req.body.newOwnerId);
      res.status(200).json({
        success: true,
        message: 'Workspace ownership transferred successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

export const workspaceController = new WorkspaceController();
