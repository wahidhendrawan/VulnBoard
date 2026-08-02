import type { Prisma } from '@prisma/client';
import type { Request } from 'express';
import { db } from '../db';
import type { AuthUser } from '../middleware/auth';

const SENSITIVE_KEY = /(password|passwd|secret|token|authorization|cookie|otp|api[_-]?key)/i;
const MAX_STRING_LENGTH = 2_000;
const MAX_DEPTH = 5;

function sanitize(value: unknown, depth = 0): unknown {
  if (depth >= MAX_DEPTH) return '[TRUNCATED]';
  if (value === null || typeof value === 'boolean') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : String(value);
  if (typeof value === 'string') return value.slice(0, MAX_STRING_LENGTH);
  if (Array.isArray(value)) return value.slice(0, 100).map((item) => sanitize(item, depth + 1));
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).slice(0, 100).map(([key, item]) => [
        key.slice(0, 128),
        SENSITIVE_KEY.test(key) ? '[REDACTED]' : sanitize(item, depth + 1),
      ]),
    );
  }
  return String(value).slice(0, MAX_STRING_LENGTH);
}

export type AuditEvent = {
  action: string;
  status: 'succeeded' | 'failed';
  actor?: AuthUser;
  actorSub?: string;
  actorEmail?: string;
  tenantId?: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: unknown;
};

/** Persist a sanitized event; audit failures are isolated from the caller. */
export async function auditLog(req: Request | undefined, event: AuditEvent): Promise<void> {
  try {
    const actor = event.actor;
    await db.auditLog.create({
      data: {
        actorId: actor?.id,
        actorSub: (event.actorSub ?? actor?.sub ?? 'anonymous').slice(0, 255),
        actorEmail: (event.actorEmail ?? actor?.email)?.slice(0, 255),
        tenantId: event.tenantId ?? actor?.tenantId ?? 'default',
        action: event.action.slice(0, 100),
        resourceType: event.resourceType?.slice(0, 100),
        resourceId: event.resourceId?.slice(0, 255),
        status: event.status,
        ipAddress: req?.ip?.slice(0, 64),
        userAgent: req?.get('user-agent')?.slice(0, 2_000),
        metadata: event.metadata === undefined ? undefined : JSON.stringify(sanitize(event.metadata)), 
      },
    });
  } catch (error) {
    console.error('Failed to persist audit event', { action: event.action, error });
  }
}
