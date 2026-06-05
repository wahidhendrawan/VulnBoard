import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  company: z.string().optional(),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const FindingSchema = z.object({
  title: z.string().min(1),
  severity: z.enum(['Critical', 'High', 'Medium', 'Low']),
  controlId: z.string().optional(),
  description: z.string().optional(),
  impact: z.string().optional(),
  evidence: z.string().optional(),
  recommendation: z.string().optional(),
});

export const ReportRequestSchema = z.object({
  clientName: z.string().min(1),
  projectName: z.string().min(1),
  scope: z.string().min(1),
  testingType: z.string().min(1),
  methodology: z.string().min(1),
  frameworkId: z.string().min(1),
  templateId: z.string().min(1),
  language: z.string().optional().default('en'),
  findings: z.array(FindingSchema),
});

export const EngagementSchema = z.object({
  clientName: z.string().min(1),
  projectName: z.string().min(1),
  scope: z.string().min(1),
  testingType: z.string().min(1),
  methodology: z.string().min(1),
  frameworkId: z.string().min(1),
  templateId: z.string().min(1),
  language: z.string().optional().default('en'),
  // Restrict logoUrl to https:// only, no internal IPs (SSRF prevention)
  logoUrl: z.string().url().startsWith('https://').optional(),
  brandColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});
