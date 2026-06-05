import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

router.use(requireAuth);

type FindingInput = {
  title: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  controlId?: string;
  description?: string;
  impact?: string;
  evidence?: string;
  recommendation?: string;
};

function mapBurpSeverity(s: string): FindingInput['severity'] {
  const lower = s.toLowerCase();
  if (lower === 'high') return 'High';
  if (lower === 'medium') return 'Medium';
  if (lower === 'low') return 'Low';
  if (lower === 'critical') return 'Critical';
  return 'Medium';
}

function parseBurpXml(xml: string): FindingInput[] {
  const findings: FindingInput[] = [];
  const issueRegex = /<issue>([\s\S]*?)<\/issue>/gi;
  let match: RegExpExecArray | null;
  while ((match = issueRegex.exec(xml)) !== null) {
    const block = match[1];
    const name = block.match(/<name>([\s\S]*?)<\/name>/i)?.[1]?.trim() ?? 'Untitled';
    const severity = block.match(/<severity>([\s\S]*?)<\/severity>/i)?.[1]?.trim() ?? 'Medium';
    const detail = block.match(/<issueDetail>([\s\S]*?)<\/issueDetail>/i)?.[1]?.trim();
    const remediation = block.match(/<remediationDetail>([\s\S]*?)<\/remediationDetail>/i)?.[1]?.trim();
    findings.push({
      title: name,
      severity: mapBurpSeverity(severity),
      description: detail,
      recommendation: remediation,
    });
  }
  return findings;
}

function mapZapRisk(risk: number): FindingInput['severity'] {
  if (risk >= 3) return 'High';
  if (risk === 2) return 'Medium';
  if (risk === 1) return 'Low';
  return 'Low';
}

function parseZapJson(data: unknown): FindingInput[] {
  const findings: FindingInput[] = [];
  const root = data as Record<string, unknown>;
  const siteRaw = root.site;
  const sites = Array.isArray(siteRaw) ? siteRaw : siteRaw ? [siteRaw] : [];
  for (const site of sites) {
    const s = site as Record<string, unknown>;
    const alertsRaw = s.alerts ?? s.alert ?? [];
    const alertArr = Array.isArray(alertsRaw) ? alertsRaw : [alertsRaw];
    for (const alert of alertArr) {
      const a = alert as Record<string, unknown>;
      findings.push({
        title: String(a.name ?? a.alert ?? 'Untitled'),
        severity: mapZapRisk(Number(a.riskcode ?? a.risk ?? 1)),
        description: a.desc != null ? String(a.desc) : undefined,
        recommendation: a.solution != null ? String(a.solution) : undefined,
        evidence: a.evidence != null ? String(a.evidence) : undefined,
      });
    }
  }
  return findings;
}

function parseNmapXml(xml: string): FindingInput[] {
  const findings: FindingInput[] = [];
  const hostRegex = /<host[\s\S]*?<\/host>/gi;
  let hostMatch: RegExpExecArray | null;
  while ((hostMatch = hostRegex.exec(xml)) !== null) {
    const hostBlock = hostMatch[0];
    const addr = hostBlock.match(/<address addr="([^"]+)"/)?.[1] ?? 'unknown';
    const portRegex = /<port protocol="([^"]+)" portid="(\d+)"[\s\S]*?<state state="([^"]+)"[\s\S]*?<service name="([^"]*)"/gi;
    let portMatch: RegExpExecArray | null;
    while ((portMatch = portRegex.exec(hostBlock)) !== null) {
      const [, protocol, port, state, service] = portMatch;
      if (state === 'open') {
        findings.push({
          title: `Open port ${port}/${protocol} (${service}) on ${addr}`,
          severity: 'Low',
          description: `Port ${port}/${protocol} is open running ${service} on host ${addr}.`,
        });
      }
    }
  }
  return findings;
}

router.post('/burp', upload.single('file'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ message: 'No file uploaded' });
    return;
  }
  const xml = req.file.buffer.toString('utf-8');
  const findings = parseBurpXml(xml);
  res.json(findings);
});

router.post('/zap', upload.single('file'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ message: 'No file uploaded' });
    return;
  }
  let data: unknown;
  try {
    data = JSON.parse(req.file.buffer.toString('utf-8'));
  } catch {
    res.status(400).json({ message: 'Invalid JSON file' });
    return;
  }
  const findings = parseZapJson(data);
  res.json(findings);
});

router.post('/nmap', upload.single('file'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ message: 'No file uploaded' });
    return;
  }
  const xml = req.file.buffer.toString('utf-8');
  const findings = parseNmapXml(xml);
  res.json(findings);
});

export default router;
