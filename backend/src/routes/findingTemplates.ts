import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { db } from '../db';
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

router.get('/', async (req, res) => {
  const where: Record<string, string> = {};
  if (req.query.language) where.language = req.query.language as string;
  if (req.query.category) where.category = req.query.category as string;
  const templates = await db.findingTemplate.findMany({ where, orderBy: { createdAt: 'desc' } });
  res.json(templates);
});

router.post('/', requireAuth, async (req, res) => {
  const parsed = CreateTemplateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.errors[0].message });
    return;
  }
  const template = await db.findingTemplate.create({ data: parsed.data });
  res.status(201).json(template);
});

export default router;
