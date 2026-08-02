export const VALID_ROLES = ['viewer', 'editor', 'admin', 'super_admin'] as const;

export type Role = (typeof VALID_ROLES)[number];

const ROLE_ALIASES: Record<string, Role> = {
  analyst: 'editor',
  tenant_admin: 'admin',
};

const ROLE_RANK: Record<Role, number> = {
  viewer: 0,
  editor: 1,
  admin: 2,
  super_admin: 3,
};

/**
 * Normalize persisted or legacy role values to the shared role vocabulary.
 * SQLite stores Prisma JSON as an unknown runtime value, so this accepts both
 * JSON arrays and legacy strings without trusting unsupported values.
 */
export function normalizeRoles(value: unknown, fallback: Role = 'viewer'): Role[] {
  let values: unknown[] = [];
  if (Array.isArray(value)) {
    values = value;
  } else if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      values = Array.isArray(parsed) ? parsed : value.replace(/,/g, ' ').split(/\s+/);
    } catch {
      values = value.replace(/,/g, ' ').split(/\s+/);
    }
  }

  const roles: Role[] = [];
  for (const raw of values) {
    const normalized = String(raw ?? '').trim().toLowerCase();
    const role = ROLE_ALIASES[normalized] ?? normalized;
    if ((VALID_ROLES as readonly string[]).includes(role) && !roles.includes(role as Role)) {
      roles.push(role as Role);
    }
  }

  return roles.length > 0 ? roles : [fallback];
}

export function hasRole(roles: readonly Role[], required: Role): boolean {
  return roles.some((role) => role === 'super_admin' || ROLE_RANK[role] >= ROLE_RANK[required]);
}

export function isSuperAdmin(roles: readonly Role[]): boolean {
  return roles.includes('super_admin');
}
