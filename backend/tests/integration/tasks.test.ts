import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/config/db';

describe('Task Management Integration Tests', () => {
  let authToken: string;
  let workspaceId: string;
  let taskId: string;

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

  test('POST /api/tasks creates task with priority and deadline', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-workspace-id', workspaceId)
      .send({
        title: 'Mow front lawn and trim hedges',
        description: 'Yard work for weekend',
        priority: 'MEDIUM',
        status: 'TODO',
        deadline: '2026-06-20T12:00:00Z'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Mow front lawn and trim hedges');
    taskId = res.body.data.id;
  });

  test('POST /api/tasks/:taskId/comments adds a comment to the task', async () => {
    const res = await request(app)
      .post(`/api/tasks/${taskId}/comments`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-workspace-id', workspaceId)
      .send({
        content: 'I filled up the lawnmower gas canister this morning.'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.content).toContain('lawnmower gas');
  });

  test('PATCH /api/tasks/:taskId updates task status to COMPLETED', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-workspace-id', workspaceId)
      .send({
        status: 'COMPLETED'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('COMPLETED');
    expect(res.body.data.completedAt).toBeDefined();
  });
});
