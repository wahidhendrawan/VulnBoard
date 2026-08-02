import express from 'express';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { mockDb } from '../../test/setup';
import { app as productionApp } from '../server';
import authRouter from './auth';
import scannerRouter from './scanner';

process.env.JWT_SECRET = 'test-secret-key-for-jwt-testing';

const fixture = (name: string) =>
  fs.readFileSync(path.join(__dirname, '../../test/fixtures', name));

const testUser = {
  id: 'user-a',
  email: 'a@test.com',
  tenantId: 'tenant-1',
  roles: JSON.stringify(['editor']),
};

const token = jwt.sign(
  { sub: 'user-a', email: 'a@test.com', tenant_id: 'tenant-1', roles: ['editor'] },
  process.env.JWT_SECRET!,
  { expiresIn: '1h', algorithm: 'HS256' },
);

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/scanner', scannerRouter);
  app.use('/api/auth', authRouter);
  app.use((err: Error & { statusCode?: number }, _req: unknown, res: express.Response, _next: express.NextFunction) => {
    const status = err.statusCode || 500;
    const message = err.statusCode ? err.message : 'Internal server error';
    res.status(status).json({ message });
  });
  return app;
}

describe('scanner import and input-security baseline', () => {
  const app = buildApp();

  beforeEach(() => {
    mockDb.user.findUnique.mockResolvedValue(testUser);
  });

  it('imports Burp XML issues with details and mapped severities', async () => {
    const res = await request(app)
      .post('/api/scanner/burp')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', fixture('burp-valid.xml'), 'burp.xml');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.arrayContaining([
      expect.objectContaining({
        title: 'SQL Injection',
        severity: 'High',
        description: 'The application is vulnerable to SQL injection in the id parameter.',
        recommendation: 'Use parameterized queries to prevent SQL injection attacks.',
      }),
      expect.objectContaining({
        title: 'Cross-site scripting (reflected)',
        severity: 'Medium',
      }),
    ]));
  });

  it('rejects malformed Burp XML before parsing', async () => {
    const res = await request(app)
      .post('/api/scanner/burp')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', fixture('burp-malformed.xml'), 'broken.xml');

    expect(res).toMatchObject({ status: 400, body: { message: 'Uploaded XML is malformed.' } });
  });

  it('imports a standard wrapped Nessus v2 export with attributes and evidence', async () => {
    const res = await request(app)
      .post('/api/scanner/nessus')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', fixture('nessus-valid.nessus'), 'scan.nessus');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.arrayContaining([
      expect.objectContaining({
        title: 'SSL Certificate Expiring',
        severity: 'High',
        evidence: 'Certificate expires: 2023-12-31',
      }),
      expect.objectContaining({ title: 'SSH Weak Cipher Enabled', severity: 'Critical' }),
      expect.objectContaining({ title: 'HTTP Server Information', severity: 'Low' }),
    ]));
  });

  it('rejects malformed Nessus XML before parsing', async () => {
    const res = await request(app)
      .post('/api/scanner/nessus')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', fixture('nessus-malformed.nessus'), 'broken.nessus');

    expect(res).toMatchObject({ status: 400, body: { message: 'Uploaded XML is malformed.' } });
  });

  it('rejects XML DTD and entity declarations', async () => {
    const res = await request(app)
      .post('/api/scanner/burp')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', fixture('xxe-attack.xml'), 'attack.xml');

    expect(res).toMatchObject({
      status: 400,
      body: { message: 'XML DTD and entity declarations are not allowed.' },
    });
  });

  it('rejects an unsupported file extension', async () => {
    const res = await request(app)
      .post('/api/scanner/nmap')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('<nmaprun/>'), 'scan.zip');

    expect(res).toMatchObject({ status: 400, body: { message: 'Unsupported file extension: .zip' } });
  });

  it('rejects an unsupported multipart content type', async () => {
    const res = await request(app)
      .post('/api/scanner/nmap')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('<nmaprun/>'), {
        filename: 'scan.xml',
        contentType: 'image/png',
      });

    expect(res).toMatchObject({ status: 400, body: { message: 'Unsupported file content type: image/png' } });
  });

  it('rejects scanner content that does not match the endpoint format', async () => {
    const res = await request(app)
      .post('/api/scanner/nmap')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('{"not":"xml"}'), {
        filename: 'scan.xml',
        contentType: 'application/xml',
      });

    expect(res).toMatchObject({
      status: 400,
      body: { message: 'Uploaded file content does not match the expected scanner format.' },
    });
  });

  it('returns 413 for scanner uploads over the configured size limit', async () => {
    const res = await request(app)
      .post('/api/scanner/nmap')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.alloc(50 * 1024 * 1024 + 1), 'large.xml');

    expect(res).toMatchObject({ status: 413, body: { message: 'File too large' } });
  });
});

describe('HTTP security baseline', () => {
  it('sets security headers and suppresses the Express signature', async () => {
    const res = await request(productionApp).get('/');

    expect(res.status).toBe(200);
    expect(res.headers).toMatchObject({
      'strict-transport-security': 'max-age=31536000; includeSubDomains',
      'x-frame-options': 'SAMEORIGIN',
      'x-content-type-options': 'nosniff',
      'permissions-policy': 'camera=(), microphone=(), geolocation=()',
    });
    expect(res.headers['content-security-policy']).toContain("default-src 'self'");
    expect(res.headers).not.toHaveProperty('x-powered-by');
  });

  it('rate-limits login attempts after ten requests from one client', async () => {
    const app = buildApp();
    mockDb.user.findUnique.mockResolvedValue(null);

    const responses = [];
    for (let attempt = 0; attempt < 11; attempt += 1) {
      responses.push(await request(app)
        .post('/api/auth/login')
        .send({ email: 'baseline-rate-limit@example.test', password: 'wrong-password' }));
    }

    expect(responses.slice(0, 10).every((res) => res.status === 401)).toBe(true);
    expect(responses[10]).toMatchObject({
      status: 429,
      body: { message: 'Too many login attempts. Try again later.' },
    });
  });
});
