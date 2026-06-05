import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { ReportRequestSchema } from '../schemas';
import { generateReport } from '../services/reportGenerator';
import { db } from '../db';

const router = Router();

router.post('/', requireAuth, async (req: AuthRequest, res) => {
  const parsed = ReportRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.errors[0].message });
    return;
  }
  const { findings, ...engagementData } = parsed.data;

  const engagement = await db.engagement.create({
    data: {
      ...engagementData,
      userId: req.user!.id,
      findings: {
        create: findings,
      },
    },
    include: { findings: true },
  });

  const reportPayload = {
    ...engagementData,
    findings: engagement.findings.map(f => ({
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
    data: { engagementId: engagement.id, markdown },
  });

  res.json({ id: report.id, markdown });
});

export default router;
