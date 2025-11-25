import React, { useEffect, useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { Framework, Template, FindingInput } from "./types";

const API_BASE = "http://localhost:4000/api";

const App: React.FC = () => {
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedFramework, setSelectedFramework] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  const [clientName, setClientName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [scope, setScope] = useState("");
  const [testingType, setTestingType] = useState("Blackbox");
  const [methodology, setMethodology] = useState("OWASP Testing Guide");
  const [findingsText, setFindingsText] = useState("");

  const [generatedMarkdown, setGeneratedMarkdown] = useState("");

  useEffect(() => {
    axios.get<Framework[]>(`${API_BASE}/frameworks`).then(res => {
      setFrameworks(res.data);
    });
  }, []);

  useEffect(() => {
    if (!selectedFramework) {
      setTemplates([]);
      setSelectedTemplate("");
      return;
    }
    axios
      .get<Template[]>(`${API_BASE}/templates`, {
        params: { frameworkId: selectedFramework }
      })
      .then(res => setTemplates(res.data));
  }, [selectedFramework]);

  const parseFindings = (): FindingInput[] => {
    return findingsText
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        const [title, severity, controlId, description] = line.split("|").map(p => p.trim());
        const sev = (severity as any) || "Medium";
        return {
          title: title || "Finding",
          severity: ["Critical", "High", "Medium", "Low"].includes(sev)
            ? (sev as any)
            : "Medium",
          controlId: controlId || undefined,
          description: description || ""
        } as FindingInput;
      });
  };

  const handleGenerate = async () => {
    if (!selectedFramework || !selectedTemplate) {
      alert("Please select framework and template");
      return;
    }

    const findings = parseFindings();

    const payload = {
      clientName,
      projectName,
      frameworkId: selectedFramework,
      templateId: selectedTemplate,
      scope,
      testingType,
      methodology,
      findings
    };

    const res = await axios.post(`${API_BASE}/reports`, payload);
    setGeneratedMarkdown(res.data.markdown);
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
      }}
    >
      <div
        style={{
          width: "45%",
          padding: "16px",
          borderRight: "1px solid #ddd",
          overflowY: "auto"
        }}
      >
        <h2>VulnBoard – VAPT Report Dashboard</h2>
        <p style={{ marginTop: 0, color: "#555" }}>
          Automate reporting for OWASP, PCI DSS, and more. Focus on remediation, not formatting.
        </p>

        <h3>1. Engagement Info</h3>
        <div>
          <label>Client Name</label>
          <input
            value={clientName}
            onChange={e => setClientName(e.target.value)}
            style={{ width: "100%", marginBottom: 8 }}
          />
          <label>Project Name</label>
          <input
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
            style={{ width: "100%", marginBottom: 8 }}
          />
          <label>Scope</label>
          <textarea
            value={scope}
            onChange={e => setScope(e.target.value)}
            style={{ width: "100%", marginBottom: 8 }}
            rows={3}
          />
          <label>Testing Type</label>
          <input
            value={testingType}
            onChange={e => setTestingType(e.target.value)}
            style={{ width: "100%", marginBottom: 8 }}
          />
          <label>Methodology</label>
          <input
            value={methodology}
            onChange={e => setMethodology(e.target.value)}
            style={{ width: "100%", marginBottom: 8 }}
          />
        </div>

        <h3>2. Framework & Template</h3>
        <div>
          <label>Framework</label>
          <select
            value={selectedFramework}
            onChange={e => {
              setSelectedFramework(e.target.value);
              setSelectedTemplate("");
            }}
            style={{ width: "100%", marginBottom: 8 }}
          >
            <option value="">-- Select Framework --</option>
            {frameworks.map(f => (
              <option key={f.id} value={f.id}>
                {f.name} {f.version ? `(${f.version})` : ""}
              </option>
            ))}
          </select>

          <label>Template</label>
          <select
            value={selectedTemplate}
            onChange={e => setSelectedTemplate(e.target.value)}
            style={{ width: "100%", marginBottom: 8 }}
          >
            <option value="">-- Select Template --</option>
            {templates.map(t => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <h3>3. Findings (Quick Input)</h3>
        <p style={{ fontSize: 12, color: "#555" }}>
          Format: <code>title|severity|controlId|description</code> per line.
          <br />
          Example:
          <br />
          <code>SQL Injection on login|High|A03|SQL injection via ' OR 1=1--</code>
        </p>
        <textarea
          value={findingsText}
          onChange={e => setFindingsText(e.target.value)}
          style={{ width: "100%", height: 150, marginBottom: 8 }}
        />

        <button onClick={handleGenerate}>Generate Report</button>
      </div>

      <div style={{ width: "55%", padding: "16px", overflowY: "auto" }}>
        <h3>Report Preview (Markdown)</h3>
        {generatedMarkdown ? (
          <div
            style={{
              border: "1px solid #ddd",
              borderRadius: 4,
              padding: 12,
              backgroundColor: "#fafafa"
            }}
          >
            <ReactMarkdown>{generatedMarkdown}</ReactMarkdown>
          </div>
        ) : (
          <p>No report generated yet.</p>
        )}
      </div>
    </div>
  );
};

export default App;
