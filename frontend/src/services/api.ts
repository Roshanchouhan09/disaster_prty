import axios from 'axios';
import { 
  User, Incident, Report, Resource, RescueMission, 
  AnalyticsSummary, AuditLog, SimulationStatus, IncidentConflict 
} from '../types';

const API_BASE_URL = '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Inject Auth Token & Custom Gemini API Key if saved locally
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('disasterfog_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const customGeminiKey = localStorage.getItem('disasterfog_gemini_key');
  if (customGeminiKey && config.headers) {
    config.headers['X-Gemini-API-Key'] = customGeminiKey;
  }

  return config;
});

export const authApi = {
  login: async (username: string, password: string): Promise<{ access_token: string; user: User }> => {
    const res = await api.post('/auth/login', { username, password });
    return res.data;
  },
  register: async (data: Partial<User> & { password: string }): Promise<User> => {
    const res = await api.post('/auth/register', data);
    return res.data;
  },
  getMe: async (): Promise<User> => {
    const res = await api.get('/auth/me');
    return res.data;
  }
};

export const incidentsApi = {
  list: async (filters?: { status?: string; severity?: string; high_mortality_only?: boolean }): Promise<Incident[]> => {
    const res = await api.get('/incidents', { params: filters });
    return res.data;
  },
  getDetail: async (id: number): Promise<Incident> => {
    const res = await api.get(`/incidents/${id}`);
    return res.data;
  },
  verify: async (id: number, notes?: string): Promise<Incident> => {
    const res = await api.post(`/incidents/${id}/verify`, { status: 'VERIFIED', notes });
    return res.data;
  },
  reject: async (id: number, notes?: string): Promise<Incident> => {
    const res = await api.post(`/incidents/${id}/reject`, { status: 'REJECTED', notes });
    return res.data;
  },
  escalate: async (id: number, notes?: string): Promise<Incident> => {
    const res = await api.post(`/incidents/${id}/escalate`, { status: 'ESCALATED', notes });
    return res.data;
  },
  recalculateWeights: async (weights: Record<string, number>): Promise<{ status: string; recalculated_incidents: number }> => {
    const res = await api.post('/incidents/recalculate-priority', weights);
    return res.data;
  },
  generateBriefing: async (): Promise<{ briefing: string }> => {
    const res = await api.post('/incidents/generate-briefing');
    return res.data;
  }
};

export const conflictsApi = {
  resolve: async (conflictId: number, notes: string, winningReportId?: number): Promise<IncidentConflict> => {
    const res = await api.post(`/conflicts/${conflictId}/resolve`, {
      winning_report_id: winningReportId,
      resolution_notes: notes
    });
    return res.data;
  }
};

export const reportsApi = {
  list: async (): Promise<Report[]> => {
    const res = await api.get('/reports');
    return res.data;
  },
  submit: async (reportData: Partial<Report>): Promise<Report> => {
    const res = await api.post('/reports', reportData);
    return res.data;
  }
};

export const resourcesApi = {
  list: async (status?: string): Promise<Resource[]> => {
    const res = await api.get('/resources', { params: { status } });
    return res.data;
  },
  create: async (data: Partial<Resource>): Promise<Resource> => {
    const res = await api.post('/resources', data);
    return res.data;
  }
};

export const missionsApi = {
  list: async (status?: string): Promise<RescueMission[]> => {
    const res = await api.get('/missions', { params: { status } });
    return res.data;
  },
  create: async (data: { incident_id: number; title: string; priority: string; assigned_team: string; resource_ids: number[]; notes?: string }): Promise<RescueMission> => {
    const res = await api.post('/missions', data);
    return res.data;
  },
  updateStatus: async (id: number, status: string, notes?: string): Promise<RescueMission> => {
    const res = await api.patch(`/missions/${id}`, { status, notes });
    return res.data;
  }
};

export const analyticsApi = {
  getSummary: async (): Promise<AnalyticsSummary> => {
    const res = await api.get('/analytics');
    return res.data;
  }
};

export const auditApi = {
  list: async (): Promise<AuditLog[]> => {
    const res = await api.get('/audit-logs');
    return res.data;
  }
};

export const simulationApi = {
  getStatus: async (): Promise<SimulationStatus> => {
    const res = await api.get('/simulation/status');
    return res.data;
  },
  start: async (): Promise<SimulationStatus> => {
    const res = await api.post('/simulation/start');
    return res.data;
  },
  pause: async (): Promise<SimulationStatus> => {
    const res = await api.post('/simulation/pause');
    return res.data;
  },
  step: async (): Promise<SimulationStatus> => {
    const res = await api.post('/simulation/step');
    return res.data;
  },
  reset: async (): Promise<SimulationStatus> => {
    const res = await api.post('/simulation/reset');
    return res.data;
  },
  setSpeed: async (speed: number): Promise<SimulationStatus> => {
    const res = await api.post('/simulation/speed', { speed });
    return res.data;
  }
};

// Export Helpers
export function exportDataAsCsv(filename: string, rows: Record<string, any>[]) {
  if (!rows || rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map(row => 
      headers.map(header => {
        const val = row[header];
        if (typeof val === 'object' && val !== null) {
          return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
        }
        return `"${String(val ?? '').replace(/"/g, '""')}"`;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportDataAsJson(filename: string, data: any) {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
