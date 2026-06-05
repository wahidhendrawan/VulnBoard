export type Framework = { id: string; name: string; version?: string; description: string; controlsCount: number; };
export type Template = { id: string; frameworkId: string; name: string; description: string; };
export type FindingInput = {
  title: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  controlId?: string;
  description?: string;
  impact?: string;
  evidence?: string;
  recommendation?: string;
};
export type User = { id: string; email: string; name: string; company?: string; };
export type Engagement = {
  id: string; clientName: string; projectName: string;
  scope: string; testingType: string; methodology: string;
  frameworkId: string; templateId: string;
  language?: string; logoUrl?: string; brandColor?: string;
  createdAt: string;
};
export type FindingTemplate = {
  id: string; title: string; severity: string;
  controlId?: string; description: string;
  impact: string; recommendation: string;
  category?: string; language?: string;
};
