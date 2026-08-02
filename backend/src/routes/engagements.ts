import { Router } from 'express';
import { requireAuth, requireRole, AuthRequest, tenantWhere } from '../middleware/auth';
import { EngagementSchema } from '../schemas';
import { db } from '../db';
import { auditLog } from '../services/audit';

const router = Router();
router.use(requireAuth);

function allTenantsRequested(req: AuthRequest): boolean {
  return req.query.all_tenants === 'true';
}

router.get('/', async (req: AuthRequest, res) => {
  const allTenants = allTenantsRequested(req);
  const engagements = await db.engagement.findMany({
    where: tenantWhere(req.user!, allTenants),
    orderBy: { createdAt: 'desc' },
  });
  if (allTenants) {
    await auditLog(req, {
      action: 'engagement.list_all_tenants',
      status: 'succeeded',
      actor: req.user,
      metadata: { result_count: engagements.length },
    });
  }
  res.json(engagements);
});

router.post('/', requireRole('editor'), async (req: AuthRequest, res) => {
  const parsed = EngagementSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.errors[0].message });
    return;
  }

  const engagement = await db.engagement.create({
    data: { ...parsed.data, userId: req.user!.id, tenantId: req.user!.tenantId },
  });
  await auditLog(req, {
    action: 'engagement.create',
    status: 'succeeded',
    actor: req.user,
    resourceType: 'engagement',
    resourceId: engagement.id,
    metadata: { project_name: engagement.projectName },
  });
  res.status(201).json(engagement);
});

router.get('/:id', async (req: AuthRequest, res) => {
  const allTenants = allTenantsRequested(req);
  const engagement = await db.engagement.findFirst({
    where: { id: req.params.id, ...tenantWhere(req.user!, allTenants) },
    include: { findings: true },
  });
  if (!engagement) {
    res.status(404).json({ message: 'Not found' });
    return;
  }
  if (allTenants) {
    await auditLog(req, {
      action: 'engagement.read_all_tenants',
      status: 'succeeded',
      actor: req.user,
      resourceType: 'engagement',
      resourceId: engagement.id,
    });
  }
  res.json(engagement);
});

router.delete('/:id', requireRole('editor'), async (req: AuthRequest, res) => {
  const allTenants = allTenantsRequested(req);
  const engagement = await db.engagement.findFirst({
    where: { id: req.params.id, ...tenantWhere(req.user!, allTenants) },
  });
  if (!engagement) {
    res.status(404).json({ message: 'Not found' });
    return;
  }

  await db.engagement.delete({ where: { id: engagement.id } });
  await auditLog(req, {
    action: 'engagement.delete',
    status: 'succeeded',
    actor: req.user,
    resourceType: 'engagement',
    resourceId: engagement.id,
    metadata: { project_name: engagement.projectName, cross_tenant: allTenants },
  });
  res.status(204).send();
});

export default router;
