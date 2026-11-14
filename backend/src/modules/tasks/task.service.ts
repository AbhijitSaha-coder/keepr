import { prisma } from '../../config/db';
import { TaskPriority, TaskStatus } from '@prisma/client';
import { NotFoundError, ForbiddenError } from '../../utils/errors';
import { logActivity } from '../../services/activityLogger';

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedMemberId?: string;
  search?: string;
}

export class TaskService {
  async getTasks(workspaceId: string, filters: TaskFilters) {
    const where: any = { workspaceId };

    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.assignedMemberId) where.assignedMemberId = filters.assignedMemberId;
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    return prisma.task.findMany({
      where,
      include: {
        assignedMember: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true }
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true }
        },
        _count: {
          select: { comments: true }
        }
      },
      orderBy: [{ status: 'asc' }, { deadline: 'asc' }, { createdAt: 'desc' }]
    });
  }

  async getTaskById(workspaceId: string, id: string) {
    const task = await prisma.task.findFirst({
      where: { id, workspaceId },
      include: {
        assignedMember: {
          select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true }
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        comments: {
          include: {
            author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!task) {
      throw new NotFoundError('Task not found in this workspace');
    }

    return task;
  }

  async createTask(workspaceId: string, actorId: string, data: any) {
    const task = await prisma.task.create({
      data: {
        workspaceId,
        title: data.title,
        description: data.description || null,
        priority: data.priority || TaskPriority.MEDIUM,
        status: data.status || TaskStatus.TODO,
        deadline: data.deadline || null,
        assignedMemberId: data.assignedMemberId || null,
        createdById: actorId,
        isRecurring: data.isRecurring || false,
        recurrenceInterval: data.recurrenceInterval || null
      },
      include: {
        assignedMember: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true }
        }
      }
    });

    await logActivity({
      workspaceId,
      actorId,
      action: 'CREATE',
      entity: 'TASK',
      entityId: task.id,
      entityName: task.title,
      metadata: { priority: task.priority, assignedTo: task.assignedMemberId }
    });

    return task;
  }

  async updateTask(workspaceId: string, id: string, actorId: string, data: any) {
    const existing = await prisma.task.findFirst({
      where: { id, workspaceId }
    });

    if (!existing) {
      throw new NotFoundError('Task not found in this workspace');
    }

    const updateData: any = { ...data };

    if (data.status === TaskStatus.COMPLETED && existing.status !== TaskStatus.COMPLETED) {
      updateData.completedAt = new Date();
    } else if (data.status && data.status !== TaskStatus.COMPLETED) {
      updateData.completedAt = null;
    }

    const updated = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        assignedMember: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true }
        }
      }
    });

    await logActivity({
      workspaceId,
      actorId,
      action: data.status === TaskStatus.COMPLETED ? 'COMPLETE' : 'UPDATE',
      entity: 'TASK',
      entityId: id,
      entityName: updated.title,
      metadata: { status: updated.status }
    });

    return updated;
  }

  async deleteTask(workspaceId: string, id: string, actorId: string) {
    const existing = await prisma.task.findFirst({
      where: { id, workspaceId }
    });

    if (!existing) {
      throw new NotFoundError('Task not found in this workspace');
    }

    await prisma.task.delete({
      where: { id }
    });

    await logActivity({
      workspaceId,
      actorId,
      action: 'DELETE',
      entity: 'TASK',
      entityId: id,
      entityName: existing.title
    });

    return true;
  }

  async addComment(workspaceId: string, taskId: string, authorId: string, content: string) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, workspaceId }
    });

    if (!task) {
      throw new NotFoundError('Task not found in this workspace');
    }

    const comment = await prisma.taskComment.create({
      data: {
        taskId,
        authorId,
        content
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } }
      }
    });

    await logActivity({
      workspaceId,
      actorId: authorId,
      action: 'COMMENT',
      entity: 'TASK',
      entityId: taskId,
      entityName: task.title
    });

    return comment;
  }

  async deleteComment(workspaceId: string, commentId: string, authorId: string) {
    const comment = await prisma.taskComment.findUnique({
      where: { id: commentId },
      include: { task: true }
    });

    if (!comment || comment.task.workspaceId !== workspaceId) {
      throw new NotFoundError('Comment not found');
    }

    if (comment.authorId !== authorId) {
      throw new ForbiddenError('You can only delete your own comments');
    }

    await prisma.taskComment.delete({
      where: { id: commentId }
    });

    return true;
  }
}

export const taskService = new TaskService();
