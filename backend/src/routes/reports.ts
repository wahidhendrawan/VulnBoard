import { Router } from 'express';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';
import { ReportRequestSchema } from '../schemas';
import { generateReport } from '../services/reportGenerator';
import { db } from '../db';
import { auditLog } from '../services/audit';

const router = Router();

router.post('/', requireAuth, requireRole('editor'), async (req: AuthRequest, res) => {
  const parsed = ReportRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.errors[0].message });
    return;
  }

  const { findings, ...engagementData } = parsed.data;
  const tenantId = req.user!.tenantId;
  const engagement = await db.engagement.create({
    data: {
      ...engagementData,
      userId: req.user!.id,
      tenantId,
      findings: {
        create: findings.map((finding) => ({ ...finding, tenantId })),
      },
    },
    include: { findings: true },
  });

  const reportPayload = {
    ...engagementData,
    findings: engagement.findings.map((f: typeof engagement.findings[0]) => ({
      title: f.title,
      severity: f.severity as 'Critical' | 'High' | 'Medium' | 'Low',
      controlId: f.controlId ?? undefined,
      description: f.description ?? undefined,
      impact: f.impact ?? undefined,
      evidence: f.evidence ?? undefined,
      recommendation: f.recommendation ?? undefined,
    })),
  };

  const { markdown } = generateReport(reportPayload);
  const report = await db.report.create({
    data: { engagementId: engagement.id, tenantId, markdown },
  });

  await auditLog(req, {
    action: 'report.create',
    status: 'succeeded',
    actor: req.user,
    resourceType: 'report',
    resourceId: report.id,
    metadata: { engagement_id: engagement.id, finding_count: findings.length },
  });
  res.json({ id: report.id, markdown });
});

export default router;
