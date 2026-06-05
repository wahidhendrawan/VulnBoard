import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import { marked } from 'marked';
import { db } from '../db';

const router = Router();
const PDF_DIR = '/app/data/reports';

router.get('/:id/pdf', async (req, res) => {
  const report = await db.report.findUnique({ where: { id: req.params.id } });
  if (!report) {
    res.status(404).json({ message: 'Report not found' });
    return;
  }

  if (report.pdfPath && fs.existsSync(report.pdfPath)) {
    res.sendFile(report.pdfPath);
    return;
  }

  fs.mkdirSync(PDF_DIR, { recursive: true });
  const pdfPath = path.join(PDF_DIR, `${report.id}.pdf`);

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>body{font-family:sans-serif;padding:40px;max-width:900px;margin:auto}</style>
</head><body>${await marked(report.markdown)}</body></html>`;

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.pdf({ path: pdfPath, format: 'A4', printBackground: true });
  } finally {
    await browser.close();
  }

  await db.report.update({ where: { id: report.id }, data: { pdfPath } });
  res.sendFile(pdfPath);
});

export default router;
