import express, { Response } from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { mockDb } from '../../test/setup';
import { requireAuth, AuthRequest } from '../middleware/auth';
import authRouter from '../routes/auth';

process.env.JWT_SECRET = 'test-secret-key-for-jwt-testing';

function makeResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
}

describe('JWT authentication lifecycle', () => {
  it('rejects a request without a bearer token', () => {
    const req = { headers: {} } as AuthRequest;
    const res = makeResponse();
    const next = jest.fn();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('accepts a valid HS256 token and attaches its user claims', () => {
    const token = jwt.sign({ id: 'user-123', email: 'test@example.com' }, process.env.JWT_SECRET!, {
      expiresIn: '1h', algorithm: 'HS256',
    });
    const req = { headers: { authorization: `Bearer ${token}` } } as AuthRequest;
    const res = makeResponse();
    const next = jest.fn();

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toEqual({ id: 'user-123', email: 'test@example.com' });
  });

  it('rejects an expired token', () => {
    const token = jwt.sign({ id: 'user-123', email: 'test@example.com' }, process.env.JWT_SECRET!, {
      expiresIn: '-1s', algorithm: 'HS256',
    });
    const res = makeResponse();

    requireAuth({ headers: { authorization: `Bearer ${token}` } } as AuthRequest, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('rejects a token with a wrong signature or disallowed algorithm', () => {
    const wrongSecret = jwt.sign({ id: 'user-123', email: 'test@example.com' }, 'wrong-secret', {
      expiresIn: '1h', algorithm: 'HS256',
    });
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ id: 'attacker', email: 'attacker@example.com' })).toString('base64url');

    for (const token of [wrongSecret, `${header}.${payload}.`]) {
      const res = makeResponse();
      const next = jest.fn();
      requireAuth({ headers: { authorization: `Bearer ${token}` } } as AuthRequest, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    }
  });

  it('issues a verifiable one-day JWT when a user registers', async () => {
    mockDb.user.findUnique.mockResolvedValueOnce(null);
    mockDb.user.create.mockResolvedValueOnce({
      id: 'new-user', email: 'new@example.com', name: 'New User', company: null,
    });
    const app = express();
    app.use(express.json());
    app.use('/api/auth', authRouter);

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'new@example.com', password: 'strong-password', name: 'New User' });

    expect(res.status).toBe(201);
    const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET!, { algorithms: ['HS256'] }) as jwt.JwtPayload;
    expect(decoded).toMatchObject({ id: 'new-user', email: 'new@example.com' });
    expect(decoded.exp).toBeGreaterThan(decoded.iat!);
  });
});
