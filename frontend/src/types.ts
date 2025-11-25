export type Framework = {
  id: string;
  name: string;
  version?: string;
  description: string;
  controlsCount: number;
};

export type Template = {
  id: string;
  frameworkId: string;
  name: string;
  description: string;
};

export type FindingInput = {
  title: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  controlId?: string;
  description?: string;
  impact?: string;
  evidence?: string;
  recommendation?: string;
};
