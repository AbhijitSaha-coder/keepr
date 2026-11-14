import { Request, Response, NextFunction } from 'express';
import { documentService } from './document.service';

export class DocumentController {
  async getDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const docs = await documentService.getDocuments(req.workspaceId!, req.user!.id, {
        category: req.query.category as any,
        tag: req.query.tag as string,
        search: req.query.search as string,
        linkedBillId: req.query.linkedBillId as string,
        linkedInventoryId: req.query.linkedInventoryId as string
      });
      res.status(200).json({ success: true, data: docs });
    } catch (error) {
      next(error);
    }
  }

  async getDocumentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doc = await documentService.getDocumentById(req.workspaceId!, req.params.documentId, req.user!.id);
      res.status(200).json({ success: true, data: doc });
    } catch (error) {
      next(error);
    }
  }

  async uploadDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Tags can come as JSON string or comma-separated string from multipart/form-data
      let tags: string[] = [];
      if (typeof req.body.tags === 'string') {
        try {
          tags = JSON.parse(req.body.tags);
        } catch {
          tags = req.body.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
        }
      } else if (Array.isArray(req.body.tags)) {
        tags = req.body.tags;
      }

      const doc = await documentService.uploadDocument(
        req.workspaceId!,
        req.user!.id,
        req.file!,
        {
          ...req.body,
          tags,
          expirationDate: req.body.expirationDate ? new Date(req.body.expirationDate) : null
        }
      );

      res.status(201).json({
        success: true,
        message: 'Document securely uploaded to vault',
        data: doc
      });
    } catch (error) {
      next(error);
    }
  }

  async updateDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await documentService.updateDocument(
        req.workspaceId!,
        req.params.documentId,
        req.user!.id,
        req.body
      );
      res.status(200).json({
        success: true,
        message: 'Document updated successfully',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await documentService.deleteDocument(req.workspaceId!, req.params.documentId, req.user!.id);
      res.status(200).json({ success: true, message: 'Document deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async downloadDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { documentId } = req.params;
      const expires = parseInt(req.query.expires as string, 10);
      const signature = req.query.signature as string;
      const userId = req.query.user as string;

      const fileInfo = await documentService.verifyAndGetFile(documentId, userId, expires, signature);

      res.setHeader('Content-Type', fileInfo.mimeType);
      res.setHeader('Content-Length', fileInfo.fileSize);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileInfo.fileName)}"`);

      res.sendFile(fileInfo.filePath);
    } catch (error) {
      next(error);
    }
  }
}

export const documentController = new DocumentController();
