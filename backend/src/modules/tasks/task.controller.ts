import { Request, Response, NextFunction } from 'express';
import { taskService } from './task.service';

export class TaskController {
  async getTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tasks = await taskService.getTasks(req.workspaceId!, {
        status: req.query.status as any,
        priority: req.query.priority as any,
        assignedMemberId: req.query.assignedMemberId as string,
        search: req.query.search as string
      });
      res.status(200).json({ success: true, data: tasks });
    } catch (error) {
      next(error);
    }
  }

  async getTaskById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const task = await taskService.getTaskById(req.workspaceId!, req.params.taskId);
      res.status(200).json({ success: true, data: task });
    } catch (error) {
      next(error);
    }
  }

  async createTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const task = await taskService.createTask(req.workspaceId!, req.user!.id, req.body);
      res.status(201).json({
        success: true,
        message: 'Task created successfully',
        data: task
      });
    } catch (error) {
      next(error);
    }
  }

  async updateTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await taskService.updateTask(req.workspaceId!, req.params.taskId, req.user!.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Task updated successfully',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await taskService.deleteTask(req.workspaceId!, req.params.taskId, req.user!.id);
      res.status(200).json({ success: true, message: 'Task deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async addComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const comment = await taskService.addComment(
        req.workspaceId!,
        req.params.taskId,
        req.user!.id,
        req.body.content
      );
      res.status(201).json({
        success: true,
        message: 'Comment posted',
        data: comment
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await taskService.deleteComment(req.workspaceId!, req.params.commentId, req.user!.id);
      res.status(200).json({ success: true, message: 'Comment deleted' });
    } catch (error) {
      next(error);
    }
  }
}

export const taskController = new TaskController();
