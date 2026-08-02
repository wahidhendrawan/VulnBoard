import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { mockDb } from '../../test/setup';

process.env.JWT_SECRET = 'test-secret-key-for-jwt-testing';

import engagementsRouter from '../routes/engagements';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/engagements', engagementsRouter);
  return app;
}

function makeToken(userId: string) {
  return jwt.sign({ id: userId, email: `${userId}@example.com` }, process.env.JWT_SECRET!, {
    expiresIn: '1h', algorithm: 'HS256',
  });
}

const validEngagement = {
  clientName: 'Acme',
  projectName: 'Web Assessment',
  scope: 'https://acme.example.com',
  testingType: 'Black Box',
  methodology: 'OWASP WSTG',
  frameworkId: 'owasp_top10_2021',
  templateId: 'owasp_technical_en',
};

describe('engagement authorization and user isolation', () => {
  const app = buildApp();

  it('lists engagements using an authenticated-user scope', async () => {
    mockDb.engagement.findMany.mockResolvedValueOnce([{ id: 'e1', userId: 'user-a' }]);

    const res = await request(app)
      .get('/api/engagements')
      .set('Authorization', `Bearer ${makeToken('user-a')}`);

    expect(res.status).toBe(200);
    expect(mockDb.engagement.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-a' }, orderBy: { createdAt: 'desc' },
    });
  });

  it('denies cross-user engagement reads by querying with id and userId', async () => {
    mockDb.engagement.findFirst.mockResolvedValueOnce(null);

    const res = await request(app)
      .get('/api/engagements/user-b-engagement')
      .set('Authorization', `Bearer ${makeToken('user-a')}`);

    expect(res).toMatchObject({ status: 404, body: { message: 'Not found' } });
    expect(mockDb.engagement.findFirst).toHaveBeenCalledWith({
      where: { id: 'user-b-engagement', userId: 'user-a' }, include: { findings: true },
    });
  });

  it('denies cross-user engagement deletion without issuing a delete', async () => {
    mockDb.engagement.findFirst.mockResolvedValueOnce(null);

    const res = await request(app)
      .delete('/api/engagements/user-b-engagement')
      .set('Authorization', `Bearer ${makeToken('user-a')}`);

    expect(res.status).toBe(404);
    expect(mockDb.engagement.delete).not.toHaveBeenCalled();
  });

  it('assigns new engagements to the authenticated user', async () => {
    mockDb.engagement.create.mockResolvedValueOnce({ id: 'new-engagement', userId: 'user-a', ...validEngagement });

    const res = await request(app)
      .post('/api/engagements')
      .set('Authorization', `Bearer ${makeToken('user-a')}`)
      .send(validEngagement);

    expect(res.status).toBe(201);
    expect(mockDb.engagement.create).toHaveBeenCalledWith({
      data: { ...validEngagement, language: 'en', userId: 'user-a' },
    });
  });

  it('rejects invalid payloads before creating an engagement', async () => {
    const res = await request(app)
      .post('/api/engagements')
      .set('Authorization', `Bearer ${makeToken('user-a')}`)
      .send({ ...validEngagement, logoUrl: 'http://internal.example/logo.png' });

    expect(res.status).toBe(400);
    expect(mockDb.engagement.create).not.toHaveBeenCalled();
  });
});
