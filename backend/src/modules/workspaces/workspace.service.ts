import { prisma } from '../../config/db';
import { MemberRole, WorkspaceType, InvitationStatus, NotificationType } from '@prisma/client';
import { BadRequestError, ForbiddenError, NotFoundError, ConflictError } from '../../utils/errors';
import { generateRandomToken, hashToken } from '../../utils/crypto';
import { emailService } from '../../services/emailService';
import { logActivity } from '../../services/activityLogger';
import { addDays } from 'date-fns';

export class WorkspaceService {
  async getUserWorkspaces(userId: string) {
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId },
      include: {
        workspace: {
          include: {
            _count: {
              select: {
                members: true,
                bills: true,
                documents: true,
                inventoryItems: true,
                tasks: true
              }
            }
          }
        }
      },
      orderBy: { joinedAt: 'asc' }
    });

    return memberships.map((m) => ({
      id: m.workspace.id,
      name: m.workspace.name,
      slug: m.workspace.slug,
      type: m.workspace.type,
      currency: m.workspace.currency,
      ownerId: m.workspace.ownerId,
      role: m.role,
      joinedAt: m.joinedAt,
      counts: m.workspace._count
    }));
  }

  async getWorkspaceById(workspaceId: string, userId: string) {
    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId }
      },
      include: {
        workspace: {
          include: {
            owner: {
              select: { id: true, firstName: true, lastName: true, email: true }
            },
            members: {
              include: {
                user: {
                  select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true }
                }
              }
            }
          }
        }
      }
    });

    if (!member) {
      throw new ForbiddenError('You do not have access to this workspace');
    }

    return {
      ...member.workspace,
      currentUserRole: member.role
    };
  }

  async createWorkspace(userId: string, data: { name: string; type?: WorkspaceType; currency?: string }) {
    const slugBase = data.name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30);
    const uniqueSuffix = generateRandomToken(4);
    const slug = `${slugBase}-${uniqueSuffix}`;

    const workspace = await prisma.$transaction(async (tx) => {
      const created = await tx.workspace.create({
        data: {
          name: data.name,
          slug,
          type: data.type || WorkspaceType.HOUSEHOLD,
          currency: data.currency || 'USD',
          ownerId: userId
        }
      });

      await tx.workspaceMember.create({
        data: {
          workspaceId: created.id,
          userId,
          role: MemberRole.OWNER
        }
      });

      return created;
    });

    await logActivity({
      workspaceId: workspace.id,
      actorId: userId,
      action: 'CREATE',
      entity: 'WORKSPACE',
      entityId: workspace.id,
      entityName: workspace.name
    });

    return workspace;
  }

  async updateWorkspace(workspaceId: string, userId: string, data: { name?: string; currency?: string }) {
    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } }
    });

    if (!member || (member.role !== MemberRole.OWNER && member.role !== MemberRole.ADMIN)) {
      throw new ForbiddenError('Only workspace Owners and Admins can update settings');
    }

    const updated = await prisma.workspace.update({
      where: { id: workspaceId },
      data
    });

    await logActivity({
      workspaceId,
      actorId: userId,
      action: 'UPDATE',
      entity: 'WORKSPACE',
      entityId: workspaceId,
      entityName: updated.name,
      metadata: data
    });

    return updated;
  }

  async deleteWorkspace(workspaceId: string, userId: string) {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId }
    });

    if (!workspace) {
      throw new NotFoundError('Workspace not found');
    }

    if (workspace.ownerId !== userId) {
      throw new ForbiddenError('Only the workspace Owner can delete this workspace');
    }

    // Do not allow deleting the user's only personal workspace
    const userPersonalWorkspaces = await prisma.workspace.count({
      where: { ownerId: userId, type: WorkspaceType.PERSONAL }
    });

    if (workspace.type === WorkspaceType.PERSONAL && userPersonalWorkspaces <= 1) {
      throw new BadRequestError('Cannot delete your primary personal workspace');
    }

    await prisma.workspace.delete({
      where: { id: workspaceId }
    });

    return true;
  }

  // --- MEMBERSHIP & INVITATIONS ---

  async getMembers(workspaceId: string) {
    return prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true }
        }
      },
      orderBy: { joinedAt: 'asc' }
    });
  }

  async inviteMember(workspaceId: string, inviterId: string, email: string, role: MemberRole = MemberRole.MEMBER) {
    const inviterMember = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: inviterId } },
      include: { workspace: true, user: true }
    });

    if (!inviterMember || (inviterMember.role !== MemberRole.OWNER && inviterMember.role !== MemberRole.ADMIN)) {
      throw new ForbiddenError('Only workspace Owners and Admins can invite new members');
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user is already a member
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      const existingMembership = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId: existingUser.id
          }
        }
      });

      if (existingMembership) {
        throw new ConflictError('This user is already a member of this workspace');
      }
    }

    // Check existing pending invitation
    const pendingInvitation = await prisma.workspaceInvitation.findFirst({
      where: {
        workspaceId,
        email: normalizedEmail,
        status: InvitationStatus.PENDING,
        expiresAt: { gt: new Date() }
      }
    });

    if (pendingInvitation) {
      throw new ConflictError('A pending invitation has already been sent to this email');
    }

    const rawToken = generateRandomToken();
    const token = hashToken(rawToken);
    const expiresAt = addDays(new Date(), 7);

    const invitation = await prisma.workspaceInvitation.create({
      data: {
        workspaceId,
        email: normalizedEmail,
        role,
        token: rawToken, // Store raw token for simple validation and link dispatch
        status: InvitationStatus.PENDING,
        inviterId,
        expiresAt
      }
    });

    // Send email notification
    await emailService.sendEmail({
      to: normalizedEmail,
      subject: `Invitation to join ${inviterMember.workspace.name} on Keepr`,
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>You've been invited!</h2>
          <p>${inviterMember.user.firstName} ${inviterMember.user.lastName} has invited you to join the household workspace <strong>${inviterMember.workspace.name}</strong> on Keepr.</p>
          <p>Role: <strong>${role}</strong></p>
          <p>Accept this invitation using token: <code>${rawToken}</code></p>
          <p>This invitation expires in 7 days.</p>
        </div>
      `,
      text: `You've been invited to join ${inviterMember.workspace.name} on Keepr. Invitation token: ${rawToken}`
    });

    // In-app notification if invited user is already registered
    if (existingUser) {
      await prisma.notification.create({
        data: {
          userId: existingUser.id,
          workspaceId,
          type: NotificationType.WORKSPACE_INVITATION,
          title: `Household Invitation: ${inviterMember.workspace.name}`,
          message: `${inviterMember.user.firstName} invited you to join ${inviterMember.workspace.name} as a ${role}.`,
          entityType: 'WORKSPACE',
          entityId: workspaceId
        }
      });
    }

    await logActivity({
      workspaceId,
      actorId: inviterId,
      action: 'INVITE',
      entity: 'MEMBER',
      entityId: invitation.id,
      entityName: normalizedEmail,
      metadata: { role }
    });

    return invitation;
  }

  async getInvitations(workspaceId: string) {
    return prisma.workspaceInvitation.findMany({
      where: { workspaceId },
      include: {
        inviter: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getUserInvitations(userEmail: string) {
    return prisma.workspaceInvitation.findMany({
      where: {
        email: userEmail.toLowerCase(),
        status: InvitationStatus.PENDING,
        expiresAt: { gt: new Date() }
      },
      include: {
        workspace: {
          select: { id: true, name: true, type: true }
        },
        inviter: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });
  }

  async acceptInvitation(token: string, userId: string) {
    const invitation = await prisma.workspaceInvitation.findUnique({
      where: { token },
      include: { workspace: true }
    });

    if (!invitation) {
      throw new NotFoundError('Invalid invitation token');
    }

    if (invitation.status !== InvitationStatus.PENDING || invitation.expiresAt < new Date()) {
      throw new BadRequestError('This invitation is no longer valid or has expired');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new ForbiddenError('This invitation was sent to a different email address');
    }

    await prisma.$transaction([
      prisma.workspaceMember.create({
        data: {
          workspaceId: invitation.workspaceId,
          userId,
          role: invitation.role
        }
      }),
      prisma.workspaceInvitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.ACCEPTED }
      })
    ]);

    await logActivity({
      workspaceId: invitation.workspaceId,
      actorId: userId,
      action: 'JOIN',
      entity: 'MEMBER',
      entityId: userId,
      entityName: `${user.firstName} ${user.lastName}`
    });

    return invitation.workspace;
  }

  async rejectInvitation(token: string, userId: string) {
    const invitation = await prisma.workspaceInvitation.findUnique({
      where: { token }
    });

    if (!invitation) {
      throw new NotFoundError('Invalid invitation token');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new ForbiddenError('This invitation was sent to a different email address');
    }

    await prisma.workspaceInvitation.update({
      where: { id: invitation.id },
      data: { status: InvitationStatus.REJECTED }
    });

    return true;
  }

  async updateMemberRole(workspaceId: string, targetUserId: string, newRole: MemberRole, actorId: string) {
    const actorMember = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: actorId } }
    });

    if (!actorMember || actorMember.role !== MemberRole.OWNER) {
      throw new ForbiddenError('Only the workspace Owner can change member roles');
    }

    const targetMember = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: targetUserId } }
    });

    if (!targetMember) {
      throw new NotFoundError('Member not found in workspace');
    }

    if (targetMember.role === MemberRole.OWNER) {
      throw new BadRequestError('Cannot change the role of the workspace Owner. Use transfer ownership instead.');
    }

    const updated = await prisma.workspaceMember.update({
      where: { id: targetMember.id },
      data: { role: newRole }
    });

    await logActivity({
      workspaceId,
      actorId,
      action: 'UPDATE_ROLE',
      entity: 'MEMBER',
      entityId: targetUserId,
      metadata: { newRole }
    });

    return updated;
  }

  async removeMember(workspaceId: string, targetUserId: string, actorId: string) {
    const actorMember = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: actorId } }
    });

    if (!actorMember) {
      throw new ForbiddenError('You are not a member of this workspace');
    }

    // A member can leave voluntarily, OR an Owner/Admin can remove members
    const isSelfLeaving = actorId === targetUserId;
    const isAuthorized = actorMember.role === MemberRole.OWNER || actorMember.role === MemberRole.ADMIN;

    if (!isSelfLeaving && !isAuthorized) {
      throw new ForbiddenError('Only workspace Owners and Admins can remove other members');
    }

    const targetMember = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: targetUserId } }
    });

    if (!targetMember) {
      throw new NotFoundError('Target user is not a member of this workspace');
    }

    if (targetMember.role === MemberRole.OWNER) {
      throw new BadRequestError('Workspace Owner cannot be removed. Transfer ownership first.');
    }

    await prisma.workspaceMember.delete({
      where: { id: targetMember.id }
    });

    await logActivity({
      workspaceId,
      actorId,
      action: isSelfLeaving ? 'LEAVE' : 'REMOVE',
      entity: 'MEMBER',
      entityId: targetUserId
    });

    return true;
  }

  async transferOwnership(workspaceId: string, currentOwnerId: string, newOwnerId: string) {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId }
    });

    if (!workspace || workspace.ownerId !== currentOwnerId) {
      throw new ForbiddenError('Only the current Owner can transfer workspace ownership');
    }

    const newOwnerMember = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: newOwnerId } }
    });

    if (!newOwnerMember) {
      throw new BadRequestError('New owner must be an existing workspace member');
    }

    await prisma.$transaction([
      prisma.workspace.update({
        where: { id: workspaceId },
        data: { ownerId: newOwnerId }
      }),
      prisma.workspaceMember.update({
        where: { workspaceId_userId: { workspaceId, userId: newOwnerId } },
        data: { role: MemberRole.OWNER }
      }),
      prisma.workspaceMember.update({
        where: { workspaceId_userId: { workspaceId, userId: currentOwnerId } },
        data: { role: MemberRole.ADMIN }
      })
    ]);

    await logActivity({
      workspaceId,
      actorId: currentOwnerId,
      action: 'TRANSFER_OWNERSHIP',
      entity: 'WORKSPACE',
      entityId: workspaceId,
      metadata: { previousOwner: currentOwnerId, newOwner: newOwnerId }
    });

    return true;
  }
}

export const workspaceService = new WorkspaceService();
