import { FindingInput } from "../services/reportGenerator";

function mapRisk(riskdesc: string): FindingInput["severity"] {
  const r = riskdesc.split(" ")[0].toLowerCase();
  if (r === "high") return "High";
  if (r === "medium") return "Medium";
  if (r === "low") return "Low";
  return "Low"; // Informational → Low
}

interface ZapAlert {
  alert: string;
  riskdesc: string;
  desc?: string;
  solution?: string;
  cweid?: string;
}

interface ZapReport {
  site?: Array<{ alerts?: ZapAlert[] }>;
}

export function parseZap(data: ZapReport): FindingInput[] {
  const findings: FindingInput[] = [];

  for (const site of data.site ?? []) {
    for (const alert of site.alerts ?? []) {
      findings.push({
        title: alert.alert,
        severity: mapRisk(alert.riskdesc),
        description: alert.desc,
        recommendation: alert.solution,
      });
    }
  }

  return findings;
}
