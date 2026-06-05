import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import { marked } from 'marked';
import { db } from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
const PDF_DIR = process.env.PDF_DIR || '/app/data/reports';

router.get('/:id/pdf', requireAuth, async (req: AuthRequest, res) => {
  // Validate ID is alphanumeric/cuid to prevent path traversal
  if (!/^[a-z0-9_-]+$/i.test(req.params.id)) {
    res.status(400).json({ message: 'Invalid report ID' });
    return;
  }

  const report = await db.report.findUnique({
    where: { id: req.params.id },
    include: { engagement: { select: { userId: true } } },
  });
  if (!report) {
    res.status(404).json({ message: 'Report not found' });
    return;
  }
  // Ownership check
  if (report.engagement.userId !== req.user!.id) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  fs.mkdirSync(PDF_DIR, { recursive: true });
  // Build path from safe components only (no user input in filename)
  const safeFilename = `${report.id}.pdf`;
  const pdfPath = path.join(PDF_DIR, safeFilename);

  if (report.pdfPath && fs.existsSync(pdfPath)) {
    res.sendFile(pdfPath, { root: '/' });
    return;
  }

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>body{font-family:sans-serif;padding:40px;max-width:900px;margin:auto}</style>
</head><body>${await marked(report.markdown)}</body></html>`;

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.pdf({ path: pdfPath, format: 'A4', printBackground: true });
  } finally {
    await browser.close();
  }

  await db.report.update({ where: { id: report.id }, data: { pdfPath } });
  res.sendFile(pdfPath, { root: '/' });
});

export default router;
