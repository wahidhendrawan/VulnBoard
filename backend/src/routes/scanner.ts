import { Router } from 'express';
import multer from 'multer';
import { XMLParser } from 'fast-xml-parser';
import { requireAuth } from '../middleware/auth';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

router.use(requireAuth);

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  allowBooleanAttributes: true,
  parseTagValue: false,
});

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
  try {
    const data = xmlParser.parse(xml);
    const issues = data?.issues?.issue ?? [];
    const issueArr = Array.isArray(issues) ? issues : [issues];
    for (const issue of issueArr) {
      if (typeof issue !== 'object' || issue === null) continue;
      findings.push({
        title: String(issue.name ?? 'Untitled').trim(),
        severity: mapBurpSeverity(String(issue.severity ?? 'Medium').trim()),
        description: issue.issueDetail ? String(issue.issueDetail).trim() : undefined,
        recommendation: issue.remediationDetail ? String(issue.remediationDetail).trim() : undefined,
      });
    }
  } catch (err) {
    console.error('Burp XML parsing error:', err);
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
  try {
    const data = xmlParser.parse(xml);
    const hosts = data?.nmaprun?.host ?? [];
    const hostArr = Array.isArray(hosts) ? hosts : [hosts];
    for (const host of hostArr) {
      if (typeof host !== 'object' || host === null) continue;
      const addrNode = host.address;
      const addr = Array.isArray(addrNode)
        ? addrNode.find((a: Record<string, string>) => a['@_addrtype'] === 'ipv4')?.['@_addr'] ?? addrNode[0]?.['@_addr'] ?? 'unknown'
        : addrNode?.['@_addr'] ?? 'unknown';
      const ports = host.ports?.port ?? [];
      const portArr = Array.isArray(ports) ? ports : [ports];
      for (const port of portArr) {
        if (typeof port !== 'object' || port === null) continue;
        const state = port.state?.['@_state'];
        if (state === 'open') {
          const protocol = port['@_protocol'] ?? 'tcp';
          const portid = port['@_portid'] ?? '0';
          const serviceName = port.service?.['@_name'] ?? 'unknown';
          findings.push({
            title: `Open port ${portid}/${protocol} (${serviceName}) on ${addr}`,
            severity: 'Low',
            description: `Port ${portid}/${protocol} is open running ${serviceName} on host ${addr}.`,
          });
        }
      }
    }
  } catch (err) {
    console.error('Nmap XML parsing error:', err);
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
