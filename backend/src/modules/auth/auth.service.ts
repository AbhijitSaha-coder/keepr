import { prisma } from '../../config/db';
import { hashPassword, comparePassword, generateRandomToken, hashToken } from '../../utils/crypto';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { BadRequestError, ConflictError, UnauthorizedError, NotFoundError } from '../../utils/errors';
import { emailService } from '../../services/emailService';
import { MemberRole, WorkspaceType } from '@prisma/client';
import { addHours, addDays } from 'date-fns';

export interface RegisterDTO {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginDTO {
  email: string;
  password: string;
  userAgent?: string;
  ipAddress?: string;
}

export class AuthService {
  async register(data: RegisterDTO) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() }
    });

    if (existing) {
      throw new ConflictError('An account with this email already exists');
    }

    const passwordHash = await hashPassword(data.password);
    const verificationToken = generateRandomToken();
    const verificationExpires = addHours(new Date(), 24);

    const user = await prisma.$transaction(async (tx) => {
      // 1. Create User
      const newUser = await tx.user.create({
        data: {
          email: data.email.toLowerCase(),
          passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          emailVerificationToken: hashToken(verificationToken),
          emailVerificationExpires: verificationExpires
        }
      });

      // 2. Create Default Personal Workspace
      const workspaceSlug = `${data.firstName.toLowerCase().replace(/[^a-z0-9]/g, '')}-${newUser.id.substring(0, 8)}`;
      const workspace = await tx.workspace.create({
        data: {
          name: `${data.firstName}'s Household`,
          slug: workspaceSlug,
          type: WorkspaceType.PERSONAL,
          ownerId: newUser.id
        }
      });

      // 3. Create Workspace Membership as OWNER
      await tx.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId: newUser.id,
          role: MemberRole.OWNER
        }
      });

      // 4. Create Notification Preferences
      await tx.notificationPreference.create({
        data: {
          userId: newUser.id
        }
      });

      return newUser;
    });

    // Send verification email
    await emailService.sendEmail({
      to: user.email,
      subject: 'Verify your Keepr account',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Welcome to Keepr, ${user.firstName}!</h2>
          <p>Please use this token to verify your email address:</p>
          <p style="font-size: 18px; font-weight: bold; background: #f1f5f9; padding: 10px; border-radius: 6px; letter-spacing: 2px;">
            ${verificationToken}
          </p>
        </div>
      `,
      text: `Welcome to Keepr! Your verification token is: ${verificationToken}`
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      emailVerified: user.emailVerified
    };
  }

  async login(data: LoginDTO) {
    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
      include: {
        memberships: {
          include: {
            workspace: true
          }
        }
      }
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isValidPassword = await comparePassword(data.password, user.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Create session in database
    const sessionToken = generateRandomToken();
    const sessionExpires = addDays(new Date(), 7);

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token: sessionToken,
        userAgent: data.userAgent || null,
        ipAddress: data.ipAddress || null,
        expiresAt: sessionExpires
      }
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    const accessToken = generateAccessToken({ userId: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ userId: user.id, sessionId: session.id });

    const defaultWorkspace = user.memberships[0]?.workspace;

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        emailVerified: user.emailVerified
      },
      workspaces: user.memberships.map((m) => ({
        id: m.workspace.id,
        name: m.workspace.name,
        slug: m.workspace.slug,
        type: m.workspace.type,
        role: m.role
      })),
      currentWorkspace: defaultWorkspace
        ? {
            id: defaultWorkspace.id,
            name: defaultWorkspace.name,
            slug: defaultWorkspace.slug,
            type: defaultWorkspace.type,
            role: user.memberships[0].role
          }
        : null
    };
  }

  async logout(sessionId?: string) {
    if (sessionId) {
      await prisma.session.delete({
        where: { id: sessionId }
      }).catch(() => {});
    }
  }

  async refreshToken(token: string) {
    const payload = verifyRefreshToken(token);

    const session = await prisma.session.findUnique({
      where: { id: payload.sessionId },
      include: { user: true }
    });

    if (!session || new Date() > session.expiresAt) {
      throw new UnauthorizedError('Session expired or invalidated');
    }

    const newAccessToken = generateAccessToken({
      userId: session.user.id,
      email: session.user.email
    });

    return {
      accessToken: newAccessToken
    };
  }

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    // Return true even if user does not exist to avoid email enumeration
    if (!user) {
      return true;
    }

    const resetToken = generateRandomToken();
    const expires = addHours(new Date(), 1);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashToken(resetToken),
        passwordResetExpires: expires
      }
    });

    await emailService.sendEmail({
      to: user.email,
      subject: 'Reset your Keepr password',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Password Reset Request</h2>
          <p>You requested to reset your password. Use the following code:</p>
          <p style="font-size: 20px; font-weight: bold; background: #e0f2fe; padding: 12px; border-radius: 6px; letter-spacing: 2px;">
            ${resetToken}
          </p>
          <p>This code will expire in 1 hour.</p>
        </div>
      `,
      text: `Reset your password with code: ${resetToken}`
    });

    return true;
  }

  async resetPassword(token: string, newPassword: string) {
    const hashed = hashToken(token);

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: hashed,
        passwordResetExpires: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      throw new BadRequestError('Invalid or expired password reset token');
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          passwordResetToken: null,
          passwordResetExpires: null
        }
      }),
      // Revoke all existing sessions for security
      prisma.session.deleteMany({
        where: { userId: user.id }
      })
    ]);

    return true;
  }

  async verifyEmail(token: string) {
    const hashed = hashToken(token);

    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: hashed,
        emailVerificationExpires: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      throw new BadRequestError('Invalid or expired email verification token');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null
      }
    });

    return true;
  }
}

export const authService = new AuthService();
