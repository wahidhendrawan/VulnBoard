import { Router } from 'express';
import multer from 'multer';
import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { requireAuth } from '../middleware/auth';

// Parser resource limits to prevent denial-of-service attacks.
const MAX_FINDINGS_PER_REQUEST = 5000;
const MAX_FILE_BYTES = 50 * 1024 * 1024;
const ALLOWED_SCAN_EXTENSIONS = new Set(['.xml', '.json', '.csv', '.nessus', '.txt']);
const ALLOWED_SCAN_MIME_TYPES = new Set([
  'application/json',
  'text/json',
  'application/xml',
  'text/xml',
  'text/csv',
  'application/csv',
  'text/plain',
  'application/octet-stream',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES },
  fileFilter: (_req, file, cb) => {
    const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));
    if (!ALLOWED_SCAN_EXTENSIONS.has(ext)) {
      cb(scannerError(`Unsupported file extension: ${ext || '(none)'}`, 400));
      return;
    }
    if (!ALLOWED_SCAN_MIME_TYPES.has(file.mimetype.toLowerCase())) {
      cb(scannerError(`Unsupported file content type: ${file.mimetype || '(none)'}`, 400));
      return;
    }
    cb(null, true);
  },
});

const router = Router();

router.use(requireAuth);

function scannerError(message: string, statusCode: number): Error & { statusCode: number } {
  const error = new Error(message) as Error & { statusCode: number };
  error.statusCode = statusCode;
  return error;
}

function validateUploadedFile(file: Express.Multer.File, formats: Array<'xml' | 'json' | 'text'>): string {
  if (file.size > MAX_FILE_BYTES) {
    throw scannerError('Uploaded file exceeds the configured size limit.', 413);
  }
  const text = file.buffer.toString('utf8').replace(/^\uFEFF/, '');
  const trimmed = text.trimStart();
  if (text.includes('\u0000')) {
    throw scannerError('Uploaded file contains invalid binary content.', 400);
  }

  const isXml = trimmed.startsWith('<');
  const isJson = trimmed.startsWith('{') || trimmed.startsWith('[');
  const isText = !isXml && !isJson;
  if (!(isXml && formats.includes('xml')) && !(isJson && formats.includes('json')) && !(isText && formats.includes('text'))) {
    throw scannerError('Uploaded file content does not match the expected scanner format.', 400);
  }
  if (isXml) {
    if (/<!DOCTYPE|<!ENTITY/i.test(text)) {
      throw scannerError('XML DTD and entity declarations are not allowed.', 400);
    }
    if (XMLValidator.validate(text) !== true) {
      throw scannerError('Uploaded XML is malformed.', 400);
    }
  }
  return text;
}

function enforceFindingLimit(findings: FindingInput[]): FindingInput[] {
  if (findings.length > MAX_FINDINGS_PER_REQUEST) {
    throw scannerError(`Finding count exceeds limit (${MAX_FINDINGS_PER_REQUEST}).`, 413);
  }
  return findings;
}

const XML_PARSER_OPTIONS = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  allowBooleanAttributes: true,
  parseTagValue: false,
  processEntities: false, // Disable XXE: reject <!ENTITY and external entity references
};

const xmlParser = new XMLParser(XML_PARSER_OPTIONS);

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
  const validation = XMLValidator.validate(xml);
  if (validation !== true) {
    throw new Error('Invalid Nmap XML file');
  }
  try {
    const data = xmlParser.parse(xml);
    if (!data?.nmaprun) {
      throw new Error('Invalid Nmap XML file: missing nmaprun root');
    }
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
  } catch {
    throw new Error('Invalid Nmap XML file');
  }
  return findings;
}

router.post('/burp', upload.single('file'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ message: 'No file uploaded' });
    return;
  }
  const xml = validateUploadedFile(req.file, ['xml']);
  res.json(enforceFindingLimit(parseBurpXml(xml)));
});

router.post('/zap', upload.single('file'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ message: 'No file uploaded' });
    return;
  }
  let data: unknown;
  try {
    data = JSON.parse(validateUploadedFile(req.file, ['json']));
  } catch (error) {
    if ((error as { statusCode?: number }).statusCode) throw error;
    res.status(400).json({ message: 'Invalid JSON file' });
    return;
  }
  res.json(enforceFindingLimit(parseZapJson(data)));
});

router.post('/nmap', upload.single('file'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ message: 'No file uploaded' });
    return;
  }
  const xml = validateUploadedFile(req.file, ['xml']);
  res.json(enforceFindingLimit(parseNmapXml(xml)));
});

function parseNessusV2(data: Record<string, unknown>): FindingInput[] {
  const findings: FindingInput[] = [];
  const report = data?.Report as Record<string, unknown> | undefined;
  if (!report) return findings;
  const hosts = Array.isArray(report.ReportHost) ? report.ReportHost : report.ReportHost ? [report.ReportHost] : [];
  for (const host of hosts) {
    const h = host as Record<string, unknown>;
    const items = Array.isArray(h.ReportItem) ? h.ReportItem : h.ReportItem ? [h.ReportItem] : [];
    for (const item of items) {
      const i = item as Record<string, unknown>;
      const risk = String(i?.risk_factor ?? 'None');
      let severity: FindingInput['severity'] = 'Low';
      if (risk.toLowerCase() === 'critical') severity = 'Critical';
      else if (risk.toLowerCase() === 'high') severity = 'High';
      else if (risk.toLowerCase() === 'medium') severity = 'Medium';
      findings.push({
        title: String(i?.plugin_name ?? 'Untitled'),
        severity,
        description: String(i?.description ?? '').trim() || undefined,
        recommendation: String(i?.solution ?? '').trim() || undefined,
        evidence: i?.plugin_output ? String(i.plugin_output).trim() : undefined,
      });
    }
  }
  return findings;
}

router.post('/nessus', upload.single('file'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ message: 'No file uploaded' });
    return;
  }
  let data: unknown;
  try {
    const text = validateUploadedFile(req.file, ['xml', 'json']);
    data = text.trimStart().startsWith('<') ? xmlParser.parse(text) : JSON.parse(text);
  } catch (error) {
    if ((error as { statusCode?: number }).statusCode) throw error;
    res.status(400).json({ message: 'Invalid Nessus file (expected .nessus XML or .json)' });
    return;
  }
  res.json(enforceFindingLimit(parseNessusV2(data as Record<string, unknown>)));
});

function parseNucleiJson(raw: unknown): FindingInput[] {
  const findings: FindingInput[] = [];
  const lines = Array.isArray(raw) ? raw : typeof raw === 'string' ? raw.trim().split('\n') : [];
  if (lines.length === 0) throw new Error('Invalid Nuclei JSON');
  for (const line of lines) {
    if (typeof line !== 'string') {
      const entry = line as Record<string, unknown>;
      if (entry?.info) {
        const info = entry.info as Record<string, unknown>;
        const sev = String(info?.severity ?? 'info').toLowerCase();
        let severity: FindingInput['severity'] = 'Low';
        if (sev === 'critical') severity = 'Critical';
        else if (sev === 'high') severity = 'High';
        else if (sev === 'medium') severity = 'Medium';
        findings.push({
          title: String(info?.name ?? entry?.template ?? entry?.['template-id'] ?? 'Untitled'),
          severity,
          description: String(info?.description ?? '').trim() || undefined,
          evidence: String(entry?.['matched-at'] ?? entry?.matched_at ?? entry?.host ?? '').trim() || undefined,
        });
      }
      continue;
    }
    try {
      const entry = JSON.parse(line as string) as Record<string, unknown>;
      const info = entry.info as Record<string, unknown> | undefined;
      if (!info) continue;
      const sev = String(info?.severity ?? 'info').toLowerCase();
      let severity: FindingInput['severity'] = 'Low';
      if (sev === 'critical') severity = 'Critical';
      else if (sev === 'high') severity = 'High';
      else if (sev === 'medium') severity = 'Medium';
      findings.push({
        title: String(info?.name ?? entry?.template_id ?? entry?.['template-id'] ?? 'Untitled'),
        severity,
        description: String(info?.description ?? '').trim() || undefined,
        evidence: String(entry?.['matched-at'] ?? entry?.matched_at ?? entry?.host ?? '').trim() || undefined,
      });
    } catch { /* skip unparseable lines */ }
  }
  if (findings.length === 0) throw new Error('Invalid Nuclei JSON: no valid entries');
  return findings;
}

router.post('/nuclei', upload.single('file'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ message: 'No file uploaded' });
    return;
  }
  let data: unknown;
  try {
    const text = validateUploadedFile(req.file, ['json']);
    data = JSON.parse(text);
  } catch (error) {
    if ((error as { statusCode?: number }).statusCode) throw error;
    res.status(400).json({ message: 'Invalid JSON file' });
    return;
  }
  res.json(enforceFindingLimit(parseNucleiJson(data)));
});

function parseQualysXml(xml: string): FindingInput[] {
  const findings: FindingInput[] = [];
  try {
    const parser = new XMLParser(XML_PARSER_OPTIONS);
    const data = parser.parse(xml);
    const hosts = data?.Report?.ReportHost ?? [];
    const hostArr = Array.isArray(hosts) ? hosts : [hosts];
    for (const host of hostArr) {
      const items = host?.ReportItem ?? [];
      const itemArr = Array.isArray(items) ? items : [items];
      for (const item of itemArr) {
        if (!item || typeof item !== 'object') continue;
        const severityVal = Number(item?.severity ?? item?.['@_severity'] ?? 0);
        let severity: FindingInput['severity'] = 'Low';
        if (severityVal >= 5) severity = 'Critical';
        else if (severityVal >= 4) severity = 'High';
        else if (severityVal >= 3) severity = 'Medium';
        findings.push({
          title: String(item?.Title ?? item?.pluginName ?? item?.['@_pluginName'] ?? 'Untitled'),
          severity,
          description: String(item?.Description ?? '').trim() || undefined,
          recommendation: String(item?.Solution ?? '').trim() || undefined,
          evidence: item?.Diagnosis ? String(item.Diagnosis).trim() : undefined,
        });
      }
    }
  } catch (err) {
    console.error('Qualys XML parsing error:', err);
  }
  return findings;
}

function parseCsvText(text: string): FindingInput[] {
  const findings: FindingInput[] = [];
  const lines = text.split('\n');
  if (lines.length < 2) return findings;

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const titleIdx = headers.findIndex(h => h === 'title' || h === 'finding' || h === 'name');
  const sevIdx = headers.findIndex(h => h === 'severity' || h === 'risk' || h === 'level');
  const descIdx = headers.findIndex(h => h === 'description' || h === 'desc');
  const recIdx = headers.findIndex(h => h === 'recommendation' || h === 'remediation' || h === 'solution');
  const evidIdx = headers.findIndex(h => h === 'evidence' || h === 'proof' || h === 'evidence');

  if (titleIdx === -1) return findings;

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
    if (cols.length <= titleIdx || !cols[titleIdx]) continue;

    let severity: FindingInput['severity'] = 'Low';
    const rawSev = (sevIdx >= 0 && cols[sevIdx] ? cols[sevIdx].toLowerCase() : '');
    if (rawSev === 'critical' || rawSev === '4') severity = 'Critical';
    else if (rawSev === 'high' || rawSev === '3') severity = 'High';
    else if (rawSev === 'medium' || rawSev === '2') severity = 'Medium';
    else if (rawSev === 'low' || rawSev === '1') severity = 'Low';

    findings.push({
      title: cols[titleIdx],
      severity,
      description: descIdx >= 0 && cols[descIdx] ? cols[descIdx] : undefined,
      recommendation: recIdx >= 0 && cols[recIdx] ? cols[recIdx] : undefined,
      evidence: evidIdx >= 0 && cols[evidIdx] ? cols[evidIdx] : undefined,
    });
  }
  return findings;
}

router.post('/csv', upload.single('file'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ message: 'No file uploaded' });
    return;
  }
  const text = req.file.buffer.toString('utf-8');
  const findings = text.includes('</Report>') || text.includes('ReportHost') ? parseQualysXml(text) : parseCsvText(text);
  res.json(findings);
});

export default router;
