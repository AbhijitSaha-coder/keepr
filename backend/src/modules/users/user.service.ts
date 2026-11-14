import { prisma } from '../../config/db';
import { hashPassword, comparePassword } from '../../utils/crypto';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../../utils/errors';

export class UserService {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        emailVerified: true,
        createdAt: true,
        notificationPreference: true
      }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, data: { firstName?: string; lastName?: string; avatarUrl?: string | null }) {
    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        emailVerified: true,
        createdAt: true
      }
    });

    return updated;
  }

  async changePassword(userId: string, currentPass: string, newPass: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const valid = await comparePassword(currentPass, user.passwordHash);
    if (!valid) {
      throw new BadRequestError('Incorrect current password');
    }

    const passwordHash = await hashPassword(newPass);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash }
    });

    return true;
  }

  async getSessions(userId: string) {
    return prisma.session.findMany({
      where: { userId },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        expiresAt: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await prisma.session.findFirst({
      where: { id: sessionId, userId }
    });

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    await prisma.session.delete({
      where: { id: sessionId }
    });

    return true;
  }

  async revokeAllOtherSessions(userId: string, currentSessionId?: string) {
    await prisma.session.deleteMany({
      where: {
        userId,
        ...(currentSessionId ? { id: { not: currentSessionId } } : {})
      }
    });

    return true;
  }

  async exportUserData(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        ownedWorkspaces: {
          include: {
            bills: true,
            subscriptions: true,
            documents: { include: { tags: true } },
            inventoryItems: { include: { maintenanceRecords: true } },
            tasks: true,
            activityLogs: true
          }
        },
        memberships: {
          include: {
            workspace: {
              select: {
                id: true,
                name: true,
                type: true,
                slug: true
              }
            }
          }
        },
        notificationPreference: true
      }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Exclude security hashes
    const { passwordHash, emailVerificationToken, passwordResetToken, ...safeData } = user;
    return safeData;
  }

  async deleteAccount(userId: string, passwordConfirm: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const valid = await comparePassword(passwordConfirm, user.passwordHash);
    if (!valid) {
      throw new BadRequestError('Password confirmation does not match');
    }

    // Delete user (cascade handles owned workspaces, sessions, preferences)
    await prisma.user.delete({
      where: { id: userId }
    });

    return true;
  }
}

export const userService = new UserService();
