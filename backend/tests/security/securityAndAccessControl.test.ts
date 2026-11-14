import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/config/db';

describe('Security & Access Control Tests', () => {
  let userAToken: string;
  let userBToken: string;
  let userAWorkspaceId: string;
  let userBWorkspaceId: string;

  beforeAll(async () => {
    // Register User A
    const emailA = `sec-user-a-${Date.now()}@keepr.app`;
    const regA = await request(app)
      .post('/api/auth/register')
      .send({ email: emailA, password: 'Password123!', firstName: 'Alice', lastName: 'Sec' });

    const loginA = await request(app)
      .post('/api/auth/login')
      .send({ email: emailA, password: 'Password123!' });

    userAToken = loginA.body.data.accessToken;
    userAWorkspaceId = loginA.body.data.workspaces[0].id;

    // Register User B
    const emailB = `sec-user-b-${Date.now()}@keepr.app`;
    const regB = await request(app)
      .post('/api/auth/register')
      .send({ email: emailB, password: 'Password123!', firstName: 'Bob', lastName: 'Sec' });

    const loginB = await request(app)
      .post('/api/auth/login')
      .send({ email: emailB, password: 'Password123!' });

    userBToken = loginB.body.data.accessToken;
    userBWorkspaceId = loginB.body.data.workspaces[0].id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { contains: 'sec-user-' } } });
    await prisma.$disconnect();
  });

  test('Protected endpoint rejects unauthenticated request with 401 Unauthorized', async () => {
    const res = await request(app).get('/api/workspaces');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('Cross-workspace data leakage prevention: User B cannot access User A workspace resources (403 Forbidden)', async () => {
    // User B tries to query bills using User A's workspace ID
    const res = await request(app)
      .get('/api/bills')
      .set('Authorization', `Bearer ${userBToken}`)
      .set('x-workspace-id', userAWorkspaceId);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('not a member');
  });

  test('Cross-workspace write prevention: User B cannot create bill in User A workspace (403 Forbidden)', async () => {
    const res = await request(app)
      .post('/api/bills')
      .set('Authorization', `Bearer ${userBToken}`)
      .set('x-workspace-id', userAWorkspaceId)
      .send({
        name: 'Injected Malicious Bill',
        amount: 9999,
        dueDate: '2026-06-01T12:00:00Z'
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('Input validation: invalid email or weak password returns 422 ValidationError', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'not-an-email',
        password: '123', // Too short, no uppercase
        firstName: '',
        lastName: ''
      });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('ValidationError');
  });

  test('Private document download rejects invalid HMAC signature (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/documents/fake-doc-id/download?expires=9999999999999&signature=invalidsignature&user=fake-user');

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
