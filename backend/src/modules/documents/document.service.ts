import { prisma } from '../../config/db';
import { DocumentCategory } from '@prisma/client';
import { storageService } from '../../services/storageService';
import { BadRequestError, NotFoundError, UnauthorizedError, ForbiddenError } from '../../utils/errors';
import { verifySignedDownloadToken } from '../../utils/crypto';
import { logActivity } from '../../services/activityLogger';

export interface DocumentFilterOptions {
  category?: DocumentCategory;
  tag?: string;
  search?: string;
  linkedBillId?: string;
  linkedInventoryId?: string;
}

export class DocumentService {
  async getDocuments(workspaceId: string, currentUserId: string, filters: DocumentFilterOptions) {
    const where: any = { workspaceId };
    if (filters.category) where.category = filters.category;
    if (filters.linkedBillId) where.linkedBillId = filters.linkedBillId;
    if (filters.linkedInventoryId) where.linkedInventoryId = filters.linkedInventoryId;
    if (filters.tag) {
      where.tags = { some: { name: { equals: filters.tag, mode: 'insensitive' } } };
    }
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { notes: { contains: filters.search, mode: 'insensitive' } },
        { fileOriginalName: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const docs = await prisma.document.findMany({
      where,
      include: {
        tags: true,
        uploadedBy: {
          select: { id: true, firstName: true, lastName: true }
        },
        linkedBill: { select: { id: true, name: true } },
        linkedInventory: { select: { id: true, name: true } },
        linkedSubscription: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return docs.map((doc) => ({
      ...doc,
      signedDownloadUrl: storageService.generateSignedDownloadUrl(doc.id, currentUserId, 600)
    }));
  }

  async getDocumentById(workspaceId: string, documentId: string, currentUserId: string) {
    const doc = await prisma.document.findFirst({
      where: { id: documentId, workspaceId },
      include: {
        tags: true,
        uploadedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        linkedBill: true,
        linkedInventory: true,
        linkedSubscription: true
      }
    });

    if (!doc) {
      throw new NotFoundError('Document not found in this workspace');
    }

    return {
      ...doc,
      signedDownloadUrl: storageService.generateSignedDownloadUrl(doc.id, currentUserId, 600)
    };
  }

  async uploadDocument(
    workspaceId: string,
    userId: string,
    file: Express.Multer.File,
    data: any
  ) {
    if (!file) {
      throw new BadRequestError('No file provided for upload');
    }

    const storedFile = await storageService.saveFile(file.buffer, file.originalname, file.mimetype);

    const doc = await prisma.document.create({
      data: {
        workspaceId,
        title: data.title || file.originalname,
        description: data.description || null,
        category: data.category || DocumentCategory.OTHER,
        fileName: storedFile.fileName,
        fileOriginalName: storedFile.fileOriginalName,
        fileKey: storedFile.fileKey,
        mimeType: storedFile.mimeType,
        fileSize: storedFile.fileSize,
        expirationDate: data.expirationDate || null,
        linkedBillId: data.linkedBillId || null,
        linkedInventoryId: data.linkedInventoryId || null,
        linkedSubscriptionId: data.linkedSubscriptionId || null,
        uploadedById: userId,
        notes: data.notes || null,
        tags: {
          create: (data.tags || []).map((name: string) => ({ name: name.trim() }))
        }
      },
      include: {
        tags: true
      }
    });

    await logActivity({
      workspaceId,
      actorId: userId,
      action: 'UPLOAD',
      entity: 'DOCUMENT',
      entityId: doc.id,
      entityName: doc.title,
      metadata: { fileName: doc.fileOriginalName, category: doc.category, size: doc.fileSize }
    });

    return {
      ...doc,
      signedDownloadUrl: storageService.generateSignedDownloadUrl(doc.id, userId, 600)
    };
  }

  async updateDocument(workspaceId: string, documentId: string, actorId: string, data: any) {
    const existing = await prisma.document.findFirst({
      where: { id: documentId, workspaceId }
    });

    if (!existing) {
      throw new NotFoundError('Document not found in this workspace');
    }

    const updateData: any = {
      title: data.title,
      description: data.description,
      category: data.category,
      expirationDate: data.expirationDate,
      linkedBillId: data.linkedBillId,
      linkedInventoryId: data.linkedInventoryId,
      linkedSubscriptionId: data.linkedSubscriptionId,
      notes: data.notes
    };

    if (data.tags !== undefined) {
      // Re-create tags
      await prisma.documentTag.deleteMany({ where: { documentId } });
      updateData.tags = {
        create: data.tags.map((t: string) => ({ name: t.trim() }))
      };
    }

    const updated = await prisma.document.update({
      where: { id: documentId },
      data: updateData,
      include: { tags: true }
    });

    await logActivity({
      workspaceId,
      actorId,
      action: 'UPDATE',
      entity: 'DOCUMENT',
      entityId: documentId,
      entityName: updated.title
    });

    return updated;
  }

  async deleteDocument(workspaceId: string, documentId: string, actorId: string) {
    const existing = await prisma.document.findFirst({
      where: { id: documentId, workspaceId }
    });

    if (!existing) {
      throw new NotFoundError('Document not found in this workspace');
    }

    await storageService.deleteFile(existing.fileKey);

    await prisma.document.delete({
      where: { id: documentId }
    });

    await logActivity({
      workspaceId,
      actorId,
      action: 'DELETE',
      entity: 'DOCUMENT',
      entityId: documentId,
      entityName: existing.title
    });

    return true;
  }

  async verifyAndGetFile(documentId: string, userId: string, expires: number, signature: string) {
    const isValid = verifySignedDownloadToken(documentId, userId, expires, signature);
    if (!isValid) {
      throw new ForbiddenError('Download link is invalid or has expired');
    }

    const doc = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        workspace: {
          include: {
            members: { where: { userId } }
          }
        }
      }
    });

    if (!doc || doc.workspace.members.length === 0) {
      throw new ForbiddenError('You do not have permission to access this document');
    }

    const filePath = await storageService.getFilePath(doc.fileKey);

    return {
      filePath,
      fileName: doc.fileOriginalName,
      mimeType: doc.mimeType,
      fileSize: doc.fileSize
    };
  }
}

export const documentService = new DocumentService();
