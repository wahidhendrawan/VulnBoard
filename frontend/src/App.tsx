import React, { useEffect, useState, useRef } from 'react';
import { Routes, Route, useNavigate, useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useAuth } from './AuthContext';
import ProtectedRoute from './ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import SeverityBadge from './components/SeverityBadge';
import { engagementsApi, frameworksApi, templatesApi, reportsApi, findingTemplatesApi, scannerApi } from './api';
import type { Engagement, Framework, Template, FindingInput, FindingTemplate } from './types';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  return (
    <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', borderBottom: '1px solid #e5e7eb', background: '#1e293b', color: '#fff' }}>
      <Link to="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 18 }}>VulnBoard</Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 13 }}>{user?.name}</span>
        <button onClick={() => { logout(); nav('/login'); }} style={{ background: '#475569', color: '#fff', border: 'none', borderRadius: 4, padding: '5px 10px', cursor: 'pointer', fontSize: 12 }}>Logout</button>
      </div>
    </header>
  );
};

/* ─── Dashboard ─── */
const Dashboard: React.FC = () => {
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const nav = useNavigate();

  useEffect(() => { engagementsApi.list().then(setEngagements).catch(() => {}); }, []);

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 49px)' }}>
      <aside style={{ width: 300, borderRight: '1px solid #e5e7eb', padding: 16, overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>Engagements</h3>
          <button onClick={() => nav('/engagements/new')} style={primaryBtn}>+ New</button>
        </div>
        {engagements.map(e => (
          <div key={e.id} onClick={() => nav(`/engagements/${e.id}`)} style={{ padding: '10px 8px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}>
            <strong style={{ fontSize: 14 }}>{e.projectName}</strong>
            <div style={{ fontSize: 12, color: '#6b7280' }}>{e.clientName} · {new Date(e.createdAt).toLocaleDateString()}</div>
          </div>
        ))}
        {!engagements.length && <p style={{ fontSize: 13, color: '#9ca3af' }}>No engagements yet.</p>}
      </aside>
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
        Select or create an engagement.
      </main>
    </div>
  );
};

/* ─── New Engagement ─── */
const NewEngagement: React.FC = () => {
  const nav = useNavigate();
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [form, setForm] = useState({ clientName: '', projectName: '', scope: '', testingType: 'Blackbox', methodology: 'OWASP Testing Guide', frameworkId: '', templateId: '' });

  useEffect(() => { frameworksApi.list().then(setFrameworks).catch(() => {}); }, []);
  useEffect(() => { if (form.frameworkId) templatesApi.list(form.frameworkId).then(setTemplates); else setTemplates([]); }, [form.frameworkId]);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const eng = await engagementsApi.create(form as any);
    nav(`/engagements/${eng.id}`);
  };

  return (
    <div style={{ maxWidth: 560, margin: '32px auto', padding: 24 }}>
      <h2>New Engagement</h2>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input placeholder="Client Name" value={form.clientName} onChange={e => set('clientName', e.target.value)} required style={inp} />
        <input placeholder="Project Name" value={form.projectName} onChange={e => set('projectName', e.target.value)} required style={inp} />
        <textarea placeholder="Scope" value={form.scope} onChange={e => set('scope', e.target.value)} rows={3} style={inp} />
        <input placeholder="Testing Type" value={form.testingType} onChange={e => set('testingType', e.target.value)} style={inp} />
        <input placeholder="Methodology" value={form.methodology} onChange={e => set('methodology', e.target.value)} style={inp} />
        <select value={form.frameworkId} onChange={e => { set('frameworkId', e.target.value); set('templateId', ''); }} required style={inp}>
          <option value="">-- Framework --</option>
          {frameworks.map(f => <option key={f.id} value={f.id}>{f.name}{f.version ? ` (${f.version})` : ''}</option>)}
        </select>
        <select value={form.templateId} onChange={e => set('templateId', e.target.value)} required style={inp}>
          <option value="">-- Template --</option>
          {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <button type="submit" style={primaryBtn}>Create Engagement</button>
      </form>
    </div>
  );
};

/* ─── Engagement Detail ─── */
const EngagementDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [engagement, setEngagement] = useState<(Engagement & { findings: FindingInput[] }) | null>(null);
  const [findings, setFindings] = useState<FindingInput[]>([]);
  const [language, setLanguage] = useState('EN');
  const [logoUrl, setLogoUrl] = useState('');
  const [brandColor, setBrandColor] = useState('#2563eb');
  const [reportMarkdown, setReportMarkdown] = useState('');
  const [reportId, setReportId] = useState('');
  const [loading, setLoading] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [library, setLibrary] = useState<FindingTemplate[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [importType, setImportType] = useState<'burp' | 'zap' | 'nmap'>('burp');

  useEffect(() => {
    if (!id) return;
    engagementsApi.get(id).then(data => { setEngagement(data); setFindings(data.findings || []); setLanguage(data.language || 'EN'); setLogoUrl(data.logoUrl || ''); setBrandColor(data.brandColor || '#2563eb'); });
  }, [id]);

  const addFinding = () => setFindings(p => [...p, { title: '', severity: 'Medium' }]);
  const removeFinding = (i: number) => setFindings(p => p.filter((_, idx) => idx !== i));
  const updateFinding = (i: number, k: keyof FindingInput, v: string) => setFindings(p => p.map((f, idx) => idx === i ? { ...f, [k]: v } : f));

  const handleImportFile = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    const upload = importType === 'burp' ? scannerApi.uploadBurp : importType === 'zap' ? scannerApi.uploadZap : scannerApi.uploadNmap;
    const imported = await upload(file);
    setFindings(p => [...p, ...imported]);
    setShowImport(false);
  };

  const openLibrary = async () => {
    const data = await findingTemplatesApi.list({ language });
    setLibrary(data); setShowLibrary(true);
  };

  const pickFromLibrary = (ft: FindingTemplate) => {
    setFindings(p => [...p, { title: ft.title, severity: ft.severity as FindingInput['severity'], controlId: ft.controlId, description: ft.description, impact: ft.impact, recommendation: ft.recommendation }]);
    setShowLibrary(false);
  };

  const generate = async () => {
    if (!engagement) return;
    setLoading(true);
    try {
      const res = await reportsApi.generate({ clientName: engagement.clientName, projectName: engagement.projectName, frameworkId: engagement.frameworkId, templateId: engagement.templateId, scope: engagement.scope, testingType: engagement.testingType, methodology: engagement.methodology, findings, language, logoUrl, brandColor });
      setReportMarkdown(res.markdown); setReportId(res.id);
    } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!id) return;
    await engagementsApi.delete(id);
    nav('/');
  };

  if (!engagement) return <div style={{ padding: 32 }}>Loading...</div>;

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 49px)' }}>
      {/* Left: engagement config */}
      <div style={{ width: '45%', padding: 20, overflowY: 'auto', borderRight: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>{engagement.projectName}</h2>
          <button onClick={handleDelete} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 4, padding: '5px 10px', cursor: 'pointer', fontSize: 12 }}>Delete</button>
        </div>
        <p style={{ color: '#6b7280', fontSize: 13 }}>{engagement.clientName} · {engagement.testingType} · {engagement.methodology}</p>
        <p style={{ fontSize: 13 }}><strong>Scope:</strong> {engagement.scope}</p>

        {/* Findings */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '16px 0 8px' }}>
          <h3 style={{ margin: 0 }}>Findings ({findings.length})</h3>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={addFinding} style={smallBtn}>+ Add</button>
            <button onClick={() => setShowImport(true)} style={smallBtn}>Import</button>
            <button onClick={openLibrary} style={smallBtn}>Library</button>
          </div>
        </div>
        {findings.map((f, i) => (
          <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: 10, marginBottom: 8 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
              <input placeholder="Title" value={f.title} onChange={e => updateFinding(i, 'title', e.target.value)} style={{ ...inp, flex: 1 }} />
              <select value={f.severity} onChange={e => updateFinding(i, 'severity', e.target.value)} style={{ ...inp, width: 100 }}>
                {(['Critical', 'High', 'Medium', 'Low'] as const).map(s => <option key={s}>{s}</option>)}
              </select>
              <SeverityBadge severity={f.severity} />
              <button onClick={() => removeFinding(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: 16 }}>✕</button>
            </div>
            <input placeholder="Control ID" value={f.controlId || ''} onChange={e => updateFinding(i, 'controlId', e.target.value)} style={{ ...inp, width: '100%', marginBottom: 4 }} />
            <textarea placeholder="Description" value={f.description || ''} onChange={e => updateFinding(i, 'description', e.target.value)} rows={2} style={{ ...inp, width: '100%' }} />
          </div>
        ))}

        {/* Import modal */}
        {showImport && (
          <div style={modalOverlay}>
            <div style={modalBox}>
              <h3>Import Findings</h3>
              <select value={importType} onChange={e => setImportType(e.target.value as any)} style={inp}>
                <option value="burp">Burp Suite</option>
                <option value="zap">OWASP ZAP</option>
                <option value="nmap">Nmap</option>
              </select>
              <input ref={fileRef} type="file" style={{ marginTop: 10 }} />
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <button onClick={handleImportFile} style={primaryBtn}>Upload</button>
                <button onClick={() => setShowImport(false)} style={smallBtn}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Library modal */}
        {showLibrary && (
          <div style={modalOverlay}>
            <div style={{ ...modalBox, maxHeight: 400, overflowY: 'auto' }}>
              <h3>Finding Library</h3>
              {library.map(ft => (
                <div key={ft.id} onClick={() => pickFromLibrary(ft)} style={{ padding: '8px 0', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}>
                  <SeverityBadge severity={ft.severity} /> <strong style={{ fontSize: 13, marginLeft: 6 }}>{ft.title}</strong>
                </div>
              ))}
              {!library.length && <p style={{ fontSize: 13, color: '#9ca3af' }}>No templates found.</p>}
              <button onClick={() => setShowLibrary(false)} style={{ ...smallBtn, marginTop: 10 }}>Close</button>
            </div>
          </div>
        )}

        {/* Settings */}
        <h3 style={{ marginTop: 20 }}>Report Settings</h3>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
          <label style={{ fontSize: 13 }}>Language</label>
          <select value={language} onChange={e => setLanguage(e.target.value)} style={inp}>
            <option value="EN">English</option>
            <option value="ID">Bahasa Indonesia</option>
          </select>
        </div>
        <div style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 13 }}>Logo URL</label>
          <input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://..." style={{ ...inp, width: '100%' }} />
        </div>
        <div style={{ marginBottom: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
          <label style={{ fontSize: 13 }}>Brand Color</label>
          <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)} style={{ width: 36, height: 28, border: 'none', cursor: 'pointer' }} />
          <span style={{ fontSize: 12, color: '#6b7280' }}>{brandColor}</span>
        </div>

        <button onClick={generate} disabled={loading} style={{ ...primaryBtn, width: '100%', padding: '10px', fontSize: 15 }}>
          {loading ? '⏳ Generating...' : 'Generate Report'}
        </button>
      </div>

      {/* Right: report preview */}
      <div style={{ width: '55%', padding: 20, overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Report Preview</h3>
          {reportId && <button onClick={() => reportsApi.downloadPdf(reportId)} style={primaryBtn}>Download PDF</button>}
        </div>
        {reportMarkdown ? (
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: 16, background: '#fafafa' }}>
            <ReactMarkdown>{reportMarkdown}</ReactMarkdown>
          </div>
        ) : <p style={{ color: '#9ca3af' }}>No report generated yet.</p>}
      </div>
    </div>
  );
};

/* ─── Root App ─── */
const App: React.FC = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/" element={<ProtectedRoute><><Header /><Dashboard /></></ProtectedRoute>} />
    <Route path="/engagements/new" element={<ProtectedRoute><><Header /><NewEngagement /></></ProtectedRoute>} />
    <Route path="/engagements/:id" element={<ProtectedRoute><><Header /><EngagementDetail /></></ProtectedRoute>} />
  </Routes>
);

export default App;

/* ─── Shared styles ─── */
const inp: React.CSSProperties = { padding: '7px 10px', fontSize: 13, borderRadius: 4, border: '1px solid #d1d5db' };
const primaryBtn: React.CSSProperties = { background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 12px', cursor: 'pointer', fontWeight: 600, fontSize: 13 };
const smallBtn: React.CSSProperties = { background: '#f1f5f9', border: '1px solid #d1d5db', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 12 };
const modalOverlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 };
const modalBox: React.CSSProperties = { background: '#fff', borderRadius: 8, padding: 24, minWidth: 340 };
