import { FindingInput } from "../services/reportGenerator";

const RCE_KEYWORDS = /remote code execution|rce|command injection|os command/i;

function extract(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return m ? m[1].replace(/<!\[CDATA\[([\s\S]*?)]]>/g, "$1").trim() : "";
}

function mapSeverity(s: string, title: string): FindingInput["severity"] {
  const norm = s.toLowerCase();
  if (norm === "high") return "High";
  if (norm === "medium") return "Medium";
  if (norm === "low") return "Low";
  if (norm === "information" || norm === "informational") {
    return RCE_KEYWORDS.test(title) ? "Critical" : "Low";
  }
  return "Low";
}

export function parseBurp(xml: string): FindingInput[] {
  const issues: FindingInput[] = [];
  const issueBlocks = xml.match(/<issue>([\s\S]*?)<\/issue>/gi) ?? [];

  for (const block of issueBlocks) {
    const title = extract(block, "name") || "Unnamed Issue";
    const severity = mapSeverity(extract(block, "severity"), title);
    issues.push({
      title,
      severity,
      description: extract(block, "issueDetail") || undefined,
      recommendation: extract(block, "remediationDetail") || undefined,
    });
  }

  return issues;
}
