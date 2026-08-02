import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { db } from '../db';
import { RegisterSchema, LoginSchema } from '../schemas';
import { auditLog } from '../services/audit';
import { issueAccessToken, type AuthUser } from '../middleware/auth';
import { normalizeRoles } from '../services/identity';

const router = Router();

// Simple in-memory rate limiter for login (max 10 attempts per IP per 15 min)
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

function toAuthUser(user: { id: string; email: string; tenantId: string; roles: unknown }): AuthUser {
  return {
    id: user.id,
    sub: user.id,
    email: user.email,
    tenantId: user.tenantId,
    roles: normalizeRoles(user.roles),
  };
}

function publicUser(user: { id: string; email: string; name: string; company: string | null; tenantId: string; roles: unknown }) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    company: user.company ?? undefined,
    tenantId: user.tenantId,
    roles: normalizeRoles(user.roles),
  };
}

function tenantSlug(): string {
  return `tenant-${randomUUID().replace(/-/g, '')}`;
}

router.post('/register', async (req: Request, res: Response) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.errors[0].message });
    return;
  }

  const { email, password, name, company } = parsed.data;
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    await auditLog(req, {
      action: 'auth.register',
      status: 'failed',
      actorSub: email,
      metadata: { reason: 'email_already_registered' },
    });
    res.status(409).json({ message: 'Email already registered' });
    return;
  }

  const hashed = await bcrypt.hash(password, 12);
  const user = await db.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: {
        slug: tenantSlug(),
        name: company?.trim() || `${name.trim()}'s workspace`,
      },
    });
    return tx.user.create({
      data: {
        email,
        password: hashed,
        name,
        company,
        tenantId: tenant.id,
        roles: JSON.stringify(['admin']),
      },
    });
  });

  const authUser = toAuthUser(user);
  await auditLog(req, {
    action: 'auth.register',
    status: 'succeeded',
    actor: authUser,
    resourceType: 'user',
    resourceId: user.id,
    metadata: { auth_provider: user.authProvider },
  });

  res.status(201).json({ token: issueAccessToken(user), user: publicUser(user) });
});

router.post('/login', async (req: Request, res: Response) => {
  const ip = req.ip ?? 'unknown';
  if (!checkRateLimit(ip)) {
    await auditLog(req, {
      action: 'auth.login',
      status: 'failed',
      actorSub: String(req.body?.email ?? 'anonymous'),
      metadata: { reason: 'rate_limited' },
    });
    res.status(429).json({ message: 'Too many login attempts. Try again later.' });
    return;
  }

  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.errors[0].message });
    return;
  }

  const { email, password } = parsed.data;
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    await auditLog(req, {
      action: 'auth.login',
      status: 'failed',
      actorSub: email,
      metadata: { reason: 'invalid_credentials' },
    });
    res.status(401).json({ message: 'Invalid credentials' });
    return;
  }

  const authUser = toAuthUser(user);
  await auditLog(req, { action: 'auth.login', status: 'succeeded', actor: authUser });
  res.json({ token: issueAccessToken(user), user: publicUser(user) });
});

export default router;
