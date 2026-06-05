import 'express-async-errors';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import frameworksRouter from './routes/frameworks';
import templatesRouter from './routes/templates';
import reportsRouter from './routes/reports';
import authRouter from './routes/auth';
import engagementsRouter from './routes/engagements';
import pdfRouter from './routes/pdf';
import scannerRouter from './routes/scanner';
import findingTemplatesRouter from './routes/findingTemplates';

const app = express();

app.use(helmet());
app.disable('x-powered-by');
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }));
app.use(express.json({ limit: '10mb' }));

app.get('/', (_req, res) => {
  res.json({ message: 'VulnBoard API' });
});

app.use('/api/auth', authRouter);
app.use('/api/frameworks', frameworksRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/engagements', engagementsRouter);
app.use('/api/reports', pdfRouter);
app.use('/api/scanner', scannerRouter);
app.use('/api/finding-templates', findingTemplatesRouter);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`VulnBoard backend running on port ${PORT}`);
});
