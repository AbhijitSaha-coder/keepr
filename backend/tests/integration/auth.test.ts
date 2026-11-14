import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/config/db';

describe('Auth Integration Tests', () => {
  const testUser = {
    email: `test-${Date.now()}@keepr.app`,
    password: 'Password123!',
    firstName: 'Jordan',
    lastName: 'Lee'
  };

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { contains: 'test-' } } });
    await prisma.$disconnect();
  });

  test('POST /api/auth/register registers new user and creates default workspace', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
    expect(res.body.data.user.firstName).toBe(testUser.firstName);
  });

  test('POST /api/auth/register rejects duplicate email with 409 Conflict', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/auth/login succeeds with valid credentials and returns JWT and workspaces', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
    expect(res.body.data.workspaces.length).toBeGreaterThanOrEqual(1);
  });

  test('POST /api/auth/login fails with invalid password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'WrongPassword123!'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
