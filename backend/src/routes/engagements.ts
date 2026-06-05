import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { EngagementSchema } from '../schemas';
import { db } from '../db';

const router = Router();
router.use(requireAuth);

router.get('/', async (req: AuthRequest, res) => {
  const engagements = await db.engagement.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' },
  });
  res.json(engagements);
});

router.post('/', async (req: AuthRequest, res) => {
  const parsed = EngagementSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.errors[0].message });
    return;
  }
  const engagement = await db.engagement.create({
    data: { ...parsed.data, userId: req.user!.id },
  });
  res.status(201).json(engagement);
});

router.get('/:id', async (req: AuthRequest, res) => {
  const engagement = await db.engagement.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
    include: { findings: true },
  });
  if (!engagement) {
    res.status(404).json({ message: 'Not found' });
    return;
  }
  res.json(engagement);
});

router.delete('/:id', async (req: AuthRequest, res) => {
  const engagement = await db.engagement.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  });
  if (!engagement) {
    res.status(404).json({ message: 'Not found' });
    return;
  }
  await db.engagement.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
