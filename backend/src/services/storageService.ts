import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';
import { generateSignedDownloadToken } from '../utils/crypto';
import { BadRequestError, NotFoundError } from '../utils/errors';

export interface StoredFile {
  fileKey: string;
  fileName: string;
  fileOriginalName: string;
  mimeType: string;
  fileSize: number;
}

export interface IStorageService {
  saveFile(buffer: Buffer, originalName: string, mimeType: string): Promise<StoredFile>;
  getFilePath(fileKey: string): Promise<string>;
  deleteFile(fileKey: string): Promise<void>;
  generateSignedDownloadUrl(documentId: string, userId: string, expiresInSeconds?: number): string;
}

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv'
]);

export class LocalStorageService implements IStorageService {
  private baseDir: string;

  constructor() {
    this.baseDir = env.STORAGE_LOCAL_DIR;
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  async saveFile(buffer: Buffer, originalName: string, mimeType: string): Promise<StoredFile> {
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      throw new BadRequestError(`File type ${mimeType} is not supported. Allowed formats: PDF, Images (JPEG, PNG, WEBP), Word, Excel, Plain Text, CSV.`);
    }

    const maxSizeBytes = env.MAX_FILE_SIZE_MB * 1024 * 1024;
    if (buffer.length > maxSizeBytes) {
      throw new BadRequestError(`File size exceeds maximum limit of ${env.MAX_FILE_SIZE_MB}MB.`);
    }

    const ext = path.extname(originalName) || '.bin';
    const safeBaseName = `${uuidv4()}${ext}`;
    const targetPath = path.join(this.baseDir, safeBaseName);

    // Ensure target path is safely within baseDir (prevent path traversal)
    if (!targetPath.startsWith(path.resolve(this.baseDir))) {
      throw new BadRequestError('Invalid file destination path');
    }

    await fs.promises.writeFile(targetPath, buffer);

    return {
      fileKey: safeBaseName,
      fileName: safeBaseName,
      fileOriginalName: path.basename(originalName),
      mimeType,
      fileSize: buffer.length
    };
  }

  async getFilePath(fileKey: string): Promise<string> {
    // Sanitize fileKey to avoid directory traversal
    const safeKey = path.basename(fileKey);
    const resolvedPath = path.join(this.baseDir, safeKey);

    if (!resolvedPath.startsWith(path.resolve(this.baseDir)) || !fs.existsSync(resolvedPath)) {
      throw new NotFoundError('Requested file not found in storage');
    }

    return resolvedPath;
  }

  async deleteFile(fileKey: string): Promise<void> {
    try {
      const filePath = await this.getFilePath(fileKey);
      await fs.promises.unlink(filePath);
    } catch (err) {
      // If file already deleted or not found, silently succeed
    }
  }

  generateSignedDownloadUrl(documentId: string, userId: string, expiresInSeconds = 300): string {
    const expiresAt = Date.now() + expiresInSeconds * 1000;
    const token = generateSignedDownloadToken(documentId, userId, expiresAt);
    return `/api/documents/${documentId}/download?expires=${expiresAt}&signature=${token}&user=${userId}`;
  }
}

/**
 * Storage Service Factory based on STORAGE_DRIVER env variable
 */
export const storageService: IStorageService = new LocalStorageService();
