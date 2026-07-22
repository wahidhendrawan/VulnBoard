import 'express-async-errors';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import frameworksRouter from './routes/frameworks';
import templatesRouter from './routes/templates';
import reportsRouter from './routes/reports';
import authRouter from './routes/auth';
import engagementsRouter from './routes/engagements';
import pdfRouter from './routes/pdf';
import scannerRouter from './routes/scanner';
import findingTemplatesRouter from './routes/findingTemplates';

const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  strictTransportSecurity: {
    maxAge: 31536000,
    includeSubDomains: true,
  },
}));
app.use((_req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});
app.disable('x-powered-by');

const allowlist = (process.env.ALLOWED_ORIGIN || 'http://localhost:3000').split(',');
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    if (!origin || allowlist.indexOf(origin) !== -1 || allowlist.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
};
app.use(cors(corsOptions));

// Global rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per `window`
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

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
