import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/config/db';

describe('Subscription Manager Integration Tests', () => {
  let authToken: string;
  let workspaceId: string;
  let subscriptionId: string;

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

  test('POST /api/subscriptions creates a subscription', async () => {
    const res = await request(app)
      .post('/api/subscriptions')
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-workspace-id', workspaceId)
      .send({
        name: 'GitHub Copilot',
        provider: 'GitHub',
        amount: 10.0,
        currency: 'USD',
        billingCycle: 'MONTHLY',
        nextRenewalDate: '2026-06-15T12:00:00Z',
        category: 'Development'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('GitHub Copilot');
    subscriptionId = res.body.data.id;
  });

  test('GET /api/subscriptions/summary calculates run-rate accurately', async () => {
    const res = await request(app)
      .get('/api/subscriptions/summary')
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-workspace-id', workspaceId);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.monthlyExpenditure).toBeGreaterThan(0);
    expect(res.body.data.annualExpenditure).toBeGreaterThan(0);
    expect(res.body.data.activeCount).toBeGreaterThanOrEqual(1);
  });
});
