import { templates } from "../data/templates";
import { frameworks } from "../data/frameworks";

export type FindingInput = {
  title: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  controlId?: string;
  description?: string;
  impact?: string;
  evidence?: string;
  recommendation?: string;
};

export type ReportRequest = {
  clientName: string;
  projectName: string;
  date?: string;
  frameworkId: string;
  templateId: string;
  scope: string;
  testingType: string;
  methodology: string;
  language?: string;
  logoUrl?: string;
  brandColor?: string;
  findings: FindingInput[];
};

function escapeMarkdownText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function generateReport(payload: ReportRequest): { markdown: string } {
  const template = templates.find(t => t.id === payload.templateId);
  if (!template) throw new Error("Template not found");

  const framework = frameworks.find(f => f.id === payload.frameworkId);
  if (!framework) throw new Error("Framework not found");

  const criticalCount = payload.findings.filter(f => f.severity === "Critical").length;
  const highCount = payload.findings.filter(f => f.severity === "High").length;
  const mediumCount = payload.findings.filter(f => f.severity === "Medium").length;
  const lowCount = payload.findings.filter(f => f.severity === "Low").length;
  const findingsCount = payload.findings.length;

  let overallRisk: "Low" | "Medium" | "High" = "Low";
  if (criticalCount > 0 || highCount > 2) overallRisk = "High";
  else if (highCount > 0 || mediumCount > 2) overallRisk = "Medium";

  const date = payload.date || new Date().toISOString().split("T")[0];
  const lang = payload.language || "en";

  const findingsBlock = payload.findings.map((f, idx) => {
    const control = f.controlId ? framework.controls.find(c => c.id === f.controlId) : undefined;
    return `
### ${idx + 1}. ${escapeMarkdownText(f.title)} (${f.severity})

- **${lang === "id" ? "Kontrol Terkait" : "Mapped Control"}:** ${escapeMarkdownText(f.controlId ?? "-")}${control ? ` – ${control.title}` : ""}
- **${lang === "id" ? "Deskripsi" : "Description"}:**  
  ${escapeMarkdownText(f.description ?? "-")}
- **${lang === "id" ? "Dampak" : "Impact"}:**  
  ${escapeMarkdownText(f.impact ?? "-")}
- **${lang === "id" ? "Bukti" : "Evidence"}:**  
  ${escapeMarkdownText(f.evidence ?? "-")}
- **${lang === "id" ? "Rekomendasi" : "Recommendation"}:**  
  ${escapeMarkdownText(f.recommendation ?? "-")}

---`;
  }).join("\n");

  const remediationRoadmap = lang === "id"
    ? "1. Prioritaskan remediasi temuan Critical dan High (jendela perbaikan 7–14 hari).\n2. Jadwalkan patching dan hardening konfigurasi berdasarkan risiko.\n3. Lakukan pengujian ulang setelah remediasi."
    : "1. Prioritize remediation of Critical and High severity findings (fix window 7–14 days).\n2. Schedule patching and configuration hardening based on risk.\n3. Perform re-testing after remediation to validate the fixes.";

  const logoHeader = payload.logoUrl
    ? `![Logo](${escapeMarkdownText(payload.logoUrl)})\n\n`
    : "";

  const colorNote = payload.brandColor
    ? `<!-- brand-color: ${escapeMarkdownText(payload.brandColor)} -->\n`
    : "";

  let markdown = colorNote + logoHeader + template.body;

  const replacements: Record<string, string> = {
    "{{projectName}}": escapeMarkdownText(payload.projectName),
    "{{clientName}}": escapeMarkdownText(payload.clientName),
    "{{date}}": escapeMarkdownText(date),
    "{{frameworkName}}": framework.name,
    "{{frameworkVersion}}": framework.version ?? "",
    "{{scope}}": escapeMarkdownText(payload.scope),
    "{{testingType}}": escapeMarkdownText(payload.testingType),
    "{{methodology}}": escapeMarkdownText(payload.methodology),
    "{{findingsCount}}": findingsCount.toString(),
    "{{criticalCount}}": criticalCount.toString(),
    "{{highCount}}": highCount.toString(),
    "{{mediumCount}}": mediumCount.toString(),
    "{{lowCount}}": lowCount.toString(),
    "{{overallRisk}}": overallRisk,
    "{{remediationRoadmap}}": remediationRoadmap,
    "{{executiveSummary}}": lang === "id"
      ? "Postur keamanan secara keseluruhan dan risiko utama dirangkum di sini."
      : "Overall security posture and key risks are summarized here.",
    "{{gapSummary}}": lang === "id"
      ? "Ringkasan kontrol yang tidak patuh dan prioritas remediasi."
      : "Summary of non-compliant controls and remediation priority.",
  };

  for (const [key, value] of Object.entries(replacements)) {
    markdown = markdown.split(key).join(value);
  }
  markdown = markdown.replace("{{findingsBlock}}", findingsBlock);

  return { markdown };
}
