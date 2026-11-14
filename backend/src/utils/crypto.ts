import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { env } from '../config/env';

const BCRYPT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateRandomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generate HMAC-SHA256 signature for short-lived private document download
 */
export function generateSignedDownloadToken(documentId: string, userId: string, expiresAt: number): string {
  const payload = `${documentId}:${userId}:${expiresAt}`;
  const hmac = crypto.createHmac('sha256', env.SIGNED_URL_SECRET);
  hmac.update(payload);
  return hmac.digest('hex');
}

export function verifySignedDownloadToken(documentId: string, userId: string, expiresAt: number, signature: string): boolean {
  if (Date.now() > expiresAt) {
    return false;
  }
  const expected = generateSignedDownloadToken(documentId, userId, expiresAt);
  // Constant time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
  } catch {
    return false;
  }
}
