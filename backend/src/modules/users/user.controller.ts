import { Request, Response, NextFunction } from 'express';
import { userService } from './user.service';

export class UserController {
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await userService.getProfile(req.user!.id);
      res.status(200).json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await userService.updateProfile(req.user!.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await userService.changePassword(req.user!.id, req.body.currentPassword, req.body.newPassword);
      res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async getSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessions = await userService.getSessions(req.user!.id);
      res.status(200).json({ success: true, data: sessions });
    } catch (error) {
      next(error);
    }
  }

  async revokeSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await userService.revokeSession(req.user!.id, req.params.sessionId);
      res.status(200).json({ success: true, message: 'Session revoked successfully' });
    } catch (error) {
      next(error);
    }
  }

  async revokeAllOtherSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await userService.revokeAllOtherSessions(req.user!.id, req.sessionId);
      res.status(200).json({ success: true, message: 'All other sessions revoked' });
    } catch (error) {
      next(error);
    }
  }

  async exportData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const exportData = await userService.exportUserData(req.user!.id);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="keepr-export-${req.user!.id}-${Date.now()}.json"`);
      res.status(200).json({ success: true, data: exportData });
    } catch (error) {
      next(error);
    }
  }

  async deleteAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await userService.deleteAccount(req.user!.id, req.body.password);
      res.clearCookie('access_token');
      res.status(200).json({ success: true, message: 'Account permanently deleted' });
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
