import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { hasRole, isSuperAdmin, normalizeRoles, type Role } from '../services/identity';

export interface AuthUser {
  id: string;
  sub: string;
  email: string;
  tenantId: string;
  roles: Role[];
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

type TokenPayload = jwt.JwtPayload & {
  sub?: string;
  id?: string;
  email?: string;
  tenant_id?: string;
  roles?: unknown;
};

function getJwtSecret(): string | undefined {
  const secret = process.env.JWT_SECRET?.trim();
  return secret || undefined;
}

export function issueAccessToken(user: {
  id: string;
  email: string;
  tenantId: string;
  roles: unknown;
}): string {
  const secret = getJwtSecret();
  if (!secret) throw new Error('JWT_SECRET must be configured');

  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      tenant_id: user.tenantId,
      roles: normalizeRoles(user.roles),
    },
    secret,
    { expiresIn: '1d', algorithm: 'HS256' },
  );
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  const secret = getJwtSecret();
  if (!header?.startsWith('Bearer ') || !secret) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const payload = jwt.verify(header.slice(7), secret, { algorithms: ['HS256'] }) as TokenPayload;
    // `id` remains accepted only to let a user with an old local token log in
    // once more. The database record is authoritative for email/tenant/roles.
    const userId = payload.sub ?? payload.id;
    if (!userId || typeof userId !== 'string') throw new Error('Invalid token subject');

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, tenantId: true, roles: true },
    });
    if (!user) throw new Error('Unknown user');

    req.user = {
      id: user.id,
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      roles: normalizeRoles(user.roles),
    };
    next();
  } catch {
    res.status(401).json({ message: 'Unauthorized' });
  }
}

export function requireRole(required: Role) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !hasRole(req.user.roles, required)) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    next();
  };
}

/** Tenant clause for models with tenantId; super admins opt into global scope. */
export function tenantWhere(user: AuthUser, allTenants = false): { tenantId?: string } {
  return isSuperAdmin(user.roles) && allTenants ? {} : { tenantId: user.tenantId };
}
