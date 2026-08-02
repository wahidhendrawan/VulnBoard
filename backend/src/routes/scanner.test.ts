import fs from 'fs';
import path from 'path';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { mockDb } from '../../test/setup';

process.env.JWT_SECRET = 'test-secret-key-for-jwt-testing';

import scannerRouter from '../routes/scanner';

const fixture = (name: string) =>
  fs.readFileSync(path.join(__dirname, '../../test/fixtures', name));

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/scanner', scannerRouter);
  app.use((err: Error & { statusCode?: number }, _req: any, res: any, _next: any) => {
    const status = err.statusCode || 500;
    const message = err.statusCode ? err.message : 'Internal server error';
    res.status(status).json({ message });
  });
  return app;
}

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

describe('scanner import routes', () => {
  const app = buildApp();

  beforeEach(() => {
    mockDb.user.findUnique.mockResolvedValue(testUser);
  });

  it('rejects uploads without a JWT', async () => {
    const res = await request(app)
      .post('/api/scanner/nmap')
      .attach('file', fixture('nmap-valid.xml'), 'scan.xml');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: 'Unauthorized' });
  });

  it('imports open ports from a valid Nmap XML file', async () => {
    const res = await request(app)
      .post('/api/scanner/nmap')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', fixture('nmap-valid.xml'), 'scan.xml');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body).toEqual(expect.arrayContaining([
      expect.objectContaining({ title: 'Open port 22/tcp (ssh) on 192.168.1.1', severity: 'Low' }),
      expect.objectContaining({ title: 'Open port 80/tcp (http) on 192.168.1.1', severity: 'Low' }),
    ]));
  });

  it('rejects missing and malformed Nmap files with clear 400 responses', async () => {
    const missing = await request(app)
      .post('/api/scanner/nmap')
      .set('Authorization', `Bearer ${token}`);
    const malformed = await request(app)
      .post('/api/scanner/nmap')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', fixture('nmap-malformed.xml'), 'broken.xml');

    expect(missing).toMatchObject({ status: 400, body: { message: 'No file uploaded' } });
    expect(malformed).toMatchObject({ status: 400, body: { message: 'Uploaded XML is malformed.' } });
  });

  it('imports Nuclei JSON findings and recognizes hyphenated matched-at output', async () => {
    const res = await request(app)
      .post('/api/scanner/nuclei')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', fixture('nuclei-valid.json'), 'nuclei.json');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.arrayContaining([
      expect.objectContaining({ title: 'TCP Banner', severity: 'Low', evidence: 'localhost:3389' }),
      expect.objectContaining({ title: 'Exposed Login Panel', severity: 'High', evidence: 'http://192.168.1.100/login' }),
    ]));
  });

  it('rejects malformed Nuclei JSON without crashing', async () => {
    const res = await request(app)
      .post('/api/scanner/nuclei')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', fixture('nuclei-malformed.json'), 'nuclei.json');

    expect(res).toMatchObject({ status: 400, body: { message: 'Invalid JSON file' } });
  });

  it('imports ZAP JSON findings with mapped risk severities', async () => {
    const res = await request(app)
      .post('/api/scanner/zap')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', fixture('zap-valid.json'), 'zap.json');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.arrayContaining([
      expect.objectContaining({ title: 'Absence of Anti-CSRF Tokens', severity: 'High' }),
      expect.objectContaining({ title: 'X-Frame-Options Header Not Set', severity: 'Medium' }),
    ]));
  });

  it('rejects malformed ZAP JSON without crashing', async () => {
    const res = await request(app)
      .post('/api/scanner/zap')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', fixture('zap-malformed.json'), 'zap.json');

    expect(res).toMatchObject({ status: 400, body: { message: 'Invalid JSON file' } });
  });
});
