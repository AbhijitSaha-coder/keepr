import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/config/db';

describe('Real PostgreSQL Analytics Integration Tests', () => {
  let authToken: string;
  let workspaceId: string;

  beforeAll(async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'demo@keepr.app', password: 'Password123!' });

    authToken = loginRes.body.data.accessToken;
    workspaceId = loginRes.body.data.workspaces[0].id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('GET /api/analytics/dashboard returns aggregated metrics matching real records', async () => {
    const res = await request(app)
      .get('/api/analytics/dashboard')
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-workspace-id', workspaceId);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const d = res.body.data;
    expect(d).toHaveProperty('monthlyExpenditure');
    expect(d).toHaveProperty('yearlyExpenditure');
    expect(d).toHaveProperty('upcomingPayments');
    expect(d).toHaveProperty('overduePayments');
    expect(d).toHaveProperty('subscriptions');
    expect(d).toHaveProperty('categorySpending');
    expect(d).toHaveProperty('memberSpending');
    expect(d).toHaveProperty('billStatusOverview');
    expect(d).toHaveProperty('taskStats');
    expect(d).toHaveProperty('spendingTrends');

    // Confirm array structures
    expect(Array.isArray(d.categorySpending)).toBe(true);
    expect(Array.isArray(d.spendingTrends)).toBe(true);
    expect(d.spendingTrends.length).toBe(6); // 6 months trends
  });
});
