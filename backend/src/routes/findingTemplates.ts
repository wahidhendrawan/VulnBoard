import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { requireAuth, requireRole, AuthRequest, tenantWhere } from '../middleware/auth';
import { db } from '../db';
import { auditLog } from '../services/audit';
import { z } from 'zod';

const router = Router();

const CreateTemplateSchema = z.object({
  title: z.string().min(1),
  severity: z.enum(['Critical', 'High', 'Medium', 'Low']),
  controlId: z.string().optional(),
  description: z.string().min(1),
  impact: z.string().min(1),
  recommendation: z.string().min(1),
  category: z.string().optional(),
  language: z.string().optional().default('en'),
});

router.get('/', requireAuth, async (req: AuthRequest, res) => {
  const filters: Prisma.FindingTemplateWhereInput = {};
  if (req.query.language) filters.language = req.query.language as string;
  if (req.query.category) filters.category = req.query.category as string;

  const allTenants = req.query.all_tenants === 'true';
  const scopedTenant = tenantWhere(req.user!, allTenants);
  const templates = await db.findingTemplate.findMany({
    where: {
      ...filters,
      OR: Object.keys(scopedTenant).length === 0
        ? undefined
        : [{ tenantId: null }, { tenantId: req.user!.tenantId }],
    },
    orderBy: { createdAt: 'desc' },
  });

  if (allTenants) {
    await auditLog(req, {
      action: 'finding_template.list_all_tenants',
      status: 'succeeded',
      actor: req.user,
      metadata: { result_count: templates.length },
    });
  }
  res.json(templates);
});

router.post('/', requireAuth, requireRole('editor'), async (req: AuthRequest, res) => {
  const parsed = CreateTemplateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.errors[0].message });
    return;
  }

  const template = await db.findingTemplate.create({
    data: { ...parsed.data, tenantId: req.user!.tenantId },
  });
  await auditLog(req, {
    action: 'finding_template.create',
    status: 'succeeded',
    actor: req.user,
    resourceType: 'finding_template',
    resourceId: template.id,
    metadata: { title: template.title },
  });
  res.status(201).json(template);
});

export default router;
