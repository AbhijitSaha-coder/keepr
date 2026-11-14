import {
  hashPassword,
  comparePassword,
  generateRandomToken,
  hashToken,
  generateSignedDownloadToken,
  verifySignedDownloadToken
} from '../../src/utils/crypto';

describe('Crypto & Security Utilities Unit Tests', () => {
  test('hashes password and verifies correctly', async () => {
    const raw = 'SuperSecret123!';
    const hash = await hashPassword(raw);

    expect(hash).not.toBe(raw);
    expect(hash.startsWith('$2')).toBe(true);

    const matches = await comparePassword(raw, hash);
    expect(matches).toBe(true);

    const wrong = await comparePassword('WrongPassword!', hash);
    expect(wrong).toBe(false);
  });

  test('generateRandomToken produces unique hexadecimal strings', () => {
    const t1 = generateRandomToken();
    const t2 = generateRandomToken();
    expect(t1).toHaveLength(64); // 32 bytes = 64 hex chars
    expect(t2).toHaveLength(64);
    expect(t1).not.toBe(t2);
  });

  test('hashToken creates deterministic sha256 output', () => {
    const token = 'sample-verification-token';
    const h1 = hashToken(token);
    const h2 = hashToken(token);
    expect(h1).toBe(h2);
    expect(h1).toHaveLength(64);
  });

  test('signed download URL token generates valid signature and validates', () => {
    const docId = 'doc-uuid-1234';
    const userId = 'user-uuid-5678';
    const expiresAt = Date.now() + 60000; // 1 min in future

    const sig = generateSignedDownloadToken(docId, userId, expiresAt);
    expect(sig).toBeDefined();

    const valid = verifySignedDownloadToken(docId, userId, expiresAt, sig);
    expect(valid).toBe(true);

    // Tampered docId fails
    const invalidDoc = verifySignedDownloadToken('tampered-doc-id', userId, expiresAt, sig);
    expect(invalidDoc).toBe(false);

    // Tampered userId fails
    const invalidUser = verifySignedDownloadToken(docId, 'another-user', expiresAt, sig);
    expect(invalidUser).toBe(false);

    // Expired timestamp fails
    const pastExpires = Date.now() - 1000;
    const pastSig = generateSignedDownloadToken(docId, userId, pastExpires);
    const expiredValid = verifySignedDownloadToken(docId, userId, pastExpires, pastSig);
    expect(expiredValid).toBe(false);
  });
});
