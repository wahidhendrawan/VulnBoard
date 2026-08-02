import { marked } from 'marked';
import { generateReport } from '../services/reportGenerator';

const basePayload = {
  clientName: 'Acme Corp',
  projectName: 'Widget App',
  scope: 'https://acme.example.com',
  testingType: 'Black Box',
  methodology: 'OWASP WSTG',
  frameworkId: 'owasp_top10_2021',
  templateId: 'owasp_technical_en',
  findings: [],
};

describe('report generation', () => {
  it('renders severity counts and derives the overall risk', () => {
    const { markdown } = generateReport({
      ...basePayload,
      findings: [
        { title: 'Critical finding', severity: 'Critical' },
        { title: 'Low finding', severity: 'Low' },
      ],
    });

    expect(markdown).toContain('| Critical | 1 |');
    expect(markdown).toContain('| Low      | 1 |');
    expect(markdown).toMatch(/Overall Risk Rating:\*\* High/);
  });

  it('rejects an unknown framework or template', () => {
    expect(() => generateReport({ ...basePayload, frameworkId: 'unknown-framework' })).toThrow('Framework not found');
    expect(() => generateReport({ ...basePayload, templateId: 'unknown-template' })).toThrow('Template not found');
  });

  it('escapes user-controlled content before report Markdown becomes HTML', async () => {
    const payload = '<img src=x onerror="alert(1)">';
    const { markdown } = generateReport({
      ...basePayload,
      clientName: payload,
      findings: [{ title: payload, severity: 'High', description: payload }],
    });
    const html = await marked.parse(markdown, { async: true });

    expect(markdown).toContain('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
    expect(html).not.toContain('<img src=x onerror=');
    expect(html).toContain('&lt;img src=x onerror=');
  });
});
