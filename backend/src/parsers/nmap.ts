import { FindingInput } from "../services/reportGenerator";

const HIGH_RISK_PORTS = new Set([21, 22, 23, 3389, 5900]);

export function parseNmap(xml: string): FindingInput[] {
  const findings: FindingInput[] = [];
  const portBlocks = xml.match(/<port\s[^>]*protocol="tcp"[^>]*>([\s\S]*?)<\/port>/gi) ?? [];

  for (const block of portBlocks) {
    const stateMatch = block.match(/<state\s+state="([^"]+)"/i);
    if (!stateMatch || stateMatch[1] !== "open") continue;

    const portMatch = block.match(/portid="(\d+)"/i);
    const port = portMatch ? parseInt(portMatch[1], 10) : 0;

    const serviceMatch = block.match(/<service\s[^>]*name="([^"]+)"/i);
    const service = serviceMatch ? serviceMatch[1] : "unknown";

    const severity: FindingInput["severity"] = HIGH_RISK_PORTS.has(port) ? "Medium" : "Low";

    findings.push({
      title: `Open port ${port}/${service}`,
      severity,
      description: `TCP port ${port} (${service}) is open and reachable.`,
      recommendation: "Review whether this port needs to be publicly accessible and apply firewall rules if not required.",
    });
  }

  return findings;
}
