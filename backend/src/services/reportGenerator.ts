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
  findings: FindingInput[];
};

export function generateReport(payload: ReportRequest): { markdown: string } {
  const template = templates.find(t => t.id === payload.templateId);
  if (!template) {
    throw new Error("Template not found");
  }

  const framework = frameworks.find(f => f.id === payload.frameworkId);
  if (!framework) {
    throw new Error("Framework not found");
  }

  const criticalCount = payload.findings.filter(f => f.severity === "Critical").length;
  const highCount = payload.findings.filter(f => f.severity === "High").length;
  const mediumCount = payload.findings.filter(f => f.severity === "Medium").length;
  const lowCount = payload.findings.filter(f => f.severity === "Low").length;

  const findingsCount = payload.findings.length;

  let overallRisk: "Low" | "Medium" | "High" = "Low";
  if (criticalCount > 0 || highCount > 2) overallRisk = "High";
  else if (highCount > 0 || mediumCount > 2) overallRisk = "Medium";

  const date = payload.date || new Date().toISOString().split("T")[0];

  const findingsBlock = payload.findings
    .map((f, idx) => {
      const control = f.controlId
        ? framework.controls.find(c => c.id === f.controlId)
        : undefined;

      return `
### ${idx + 1}. ${f.title} (${f.severity})

- Mapped Control: **${f.controlId ?? "-"}${control ? ` – ${control.title}` : ""}**
- Description:  
  ${f.description ?? "-"}

- Impact:  
  ${f.impact ?? "-"}

- Evidence:  
  ${f.evidence ?? "-"}

- Recommendation:  
  ${f.recommendation ?? "-"}

---
`;
    })
    .join("\n");

  const remediationRoadmap = `
1. Prioritize remediation of Critical and High severity findings (fix window 7–14 days).
2. Schedule patching and configuration hardening based on risk.
3. Perform re-testing after remediation to validate the fixes.
`;

  let markdown = template.body;

  const replacements: Record<string, string> = {
    "{{projectName}}": payload.projectName,
    "{{clientName}}": payload.clientName,
    "{{date}}": date,
    "{{frameworkName}}": framework.name,
    "{{frameworkVersion}}": framework.version ?? "",
    "{{scope}}": payload.scope,
    "{{testingType}}": payload.testingType,
    "{{methodology}}": payload.methodology,
    "{{findingsCount}}": findingsCount.toString(),
    "{{criticalCount}}": criticalCount.toString(),
    "{{highCount}}": highCount.toString(),
    "{{mediumCount}}": mediumCount.toString(),
    "{{lowCount}}": lowCount.toString(),
    "{{overallRisk}}": overallRisk,
    "{{remediationRoadmap}}": remediationRoadmap,
    "{{executiveSummary}}": "Overall security posture and key risks are summarized here.",
    "{{gapSummary}}": "Summary of non-compliant controls and remediation priority."
  };

  for (const [key, value] of Object.entries(replacements)) {
    markdown = markdown.split(key).join(value);
  }

  markdown = markdown.replace("{{findingsBlock}}", findingsBlock);

  return { markdown };
}
