import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/config/db';

describe('Workspaces & Household Integration Tests', () => {
  let authToken: string;
  let userId: string;
  let workspaceId: string;

  beforeAll(async () => {
    // Login as seeded demo user
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'demo@keepr.app', password: 'Password123!' });

    authToken = loginRes.body.data.accessToken;
    userId = loginRes.body.data.user.id;
    workspaceId = loginRes.body.data.workspaces[0].id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('GET /api/workspaces returns user workspaces', async () => {
    const res = await request(app)
      .get('/api/workspaces')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  test('POST /api/workspaces creates a new household workspace', async () => {
    const res = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Summer Cabin House',
        type: 'HOUSEHOLD',
        currency: 'USD'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Summer Cabin House');
  });

  test('GET /api/workspaces/:workspaceId/members returns members list', async () => {
    const res = await request(app)
      .get(`/api/workspaces/${workspaceId}/members`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });
});
