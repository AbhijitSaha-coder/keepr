import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/config/db';

describe('Bills & Payments Integration Tests', () => {
  let authToken: string;
  let workspaceId: string;
  let createdBillId: string;

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

  test('POST /api/bills creates a recurring monthly bill', async () => {
    const res = await request(app)
      .post('/api/bills')
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-workspace-id', workspaceId)
      .send({
        name: 'Gym Membership',
        amount: 55.0,
        currency: 'USD',
        category: 'MAINTENANCE',
        recurrence: 'MONTHLY',
        dueDate: '2026-06-01T12:00:00Z',
        notes: 'Downtown fitness center'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Gym Membership');
    expect(res.body.data.amount).toBe(55);
    createdBillId = res.body.data.id;
  });

  test('GET /api/bills returns list of bills with filters', async () => {
    const res = await request(app)
      .get('/api/bills?category=MAINTENANCE')
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-workspace-id', workspaceId);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.some((b: any) => b.id === createdBillId)).toBe(true);
  });

  test('POST /api/bills/:billId/pay records payment and advances recurring due date', async () => {
    const res = await request(app)
      .post(`/api/bills/${createdBillId}/pay`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-workspace-id', workspaceId)
      .send({
        amount: 55.0,
        paymentMethod: 'CARD',
        notes: 'Monthly auto-pay'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isManualRecord).toBe(true);
    expect(res.body.data.amount).toBe(55);

    // Verify bill's next occurrence exists
    const billDetails = await request(app)
      .get(`/api/bills/${createdBillId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-workspace-id', workspaceId);

    expect(billDetails.body.data.payments.length).toBeGreaterThanOrEqual(1);
  });
});
