import axios from 'axios';
import type { Framework, Template, Engagement, FindingInput, FindingTemplate, User } from './types';

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:4000/api' });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(r => r, err => {
  if (err.response?.status === 401) {
    localStorage.clear();
    window.location.href = '/login';
  }
  return Promise.reject(err);
});

export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ token: string; user: User }>('/auth/login', { email, password }).then(r => r.data),
  register: (email: string, password: string, name: string, company?: string) =>
    api.post<{ token: string; user: User }>('/auth/register', { email, password, name, company }).then(r => r.data),
};

export const frameworksApi = {
  list: () => api.get<Framework[]>('/frameworks').then(r => r.data),
};

export const templatesApi = {
  list: (frameworkId: string) => api.get<Template[]>('/templates', { params: { frameworkId } }).then(r => r.data),
};

export const engagementsApi = {
  list: () => api.get<Engagement[]>('/engagements').then(r => r.data),
  create: (data: Omit<Engagement, 'id' | 'createdAt'>) => api.post<Engagement>('/engagements', data).then(r => r.data),
  get: (id: string) => api.get<Engagement & { findings: FindingInput[] }>(`/engagements/${id}`).then(r => r.data),
  delete: (id: string) => api.delete(`/engagements/${id}`).then(() => {}),
};

export const reportsApi = {
  generate: (data: object) => api.post<{ id: string; markdown: string }>('/reports', data).then(r => r.data),
  downloadPdf: async (reportId: string) => {
    const res = await api.get(`/reports/${reportId}/pdf`, { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url; a.download = `report-${reportId}.pdf`; a.click();
    URL.revokeObjectURL(url);
  },
};

export const findingTemplatesApi = {
  list: (params?: object) => api.get<FindingTemplate[]>('/finding-templates', { params }).then(r => r.data),
};

const uploadScan = (endpoint: string, file: File) => {
  const fd = new FormData(); fd.append('file', file);
  return api.post<FindingInput[]>(endpoint, fd).then(r => r.data);
};

export const scannerApi = {
  uploadBurp: (file: File) => uploadScan('/scanner/burp', file),
  uploadZap: (file: File) => uploadScan('/scanner/zap', file),
  uploadNmap: (file: File) => uploadScan('/scanner/nmap', file),
};
