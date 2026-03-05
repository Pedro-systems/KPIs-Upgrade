/**
 * API Service - Backend Communication
 */

import axios from 'axios';

// Configuração base do Axios
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Unknown error';
    console.error('API Error:', message);
    return Promise.reject(error);
  }
);

// ============================================
// DEALS
// ============================================

export const dealsApi = {
  getAll: (params = {}) => api.get('/deals', { params }),
  getById: (id) => api.get(`/deals/${id}`),
  create: (data) => api.post('/deals', data),
  update: (id, data) => api.put(`/deals/${id}`, data),
  delete: (id) => api.delete(`/deals/${id}`),
  getStats: () => api.get('/deals/stats/summary'),
};

// ============================================
// CAMPAIGNS (SMS/Text)
// ============================================

export const campaignsApi = {
  getAll: (params = {}) => api.get('/campaigns', { params }),
  getById: (id) => api.get(`/campaigns/${id}`),
  create: (data) => api.post('/campaigns', data),
  update: (id, data) => api.put(`/campaigns/${id}`, data),
  delete: (id) => api.delete(`/campaigns/${id}`),
  getFilterOptions: () => api.get('/campaigns/filters/options'),
  getAnalytics: (params = {}) => api.get('/campaigns/analytics/kpis', { params }),
};

// ============================================
// CALL CAMPAIGNS (Cold Calling)
// ============================================

export const callCampaignsApi = {
  getAll: (params = {}) => api.get('/call-campaigns', { params }),
  getById: (id) => api.get(`/call-campaigns/${id}`),
  create: (data) => api.post('/call-campaigns', data),
  update: (id, data) => api.put(`/call-campaigns/${id}`, data),
  delete: (id) => api.delete(`/call-campaigns/${id}`),
  getFilterOptions: () => api.get('/call-campaigns/filters/options'),
  getAnalytics: (params = {}) => api.get('/call-campaigns/analytics/kpis', { params }),
};

// ============================================
// MAIL CAMPAIGNS (Direct Mail)
// ============================================

export const mailCampaignsApi = {
  getAll: (params = {}) => api.get('/mail-campaigns', { params }),
  getById: (id) => api.get(`/mail-campaigns/${id}`),
  create: (data) => api.post('/mail-campaigns', data),
  update: (id, data) => api.put(`/mail-campaigns/${id}`, data),
  delete: (id) => api.delete(`/mail-campaigns/${id}`),
  getFilterOptions: () => api.get('/mail-campaigns/filters/options'),
  getAnalytics: (params = {}) => api.get('/mail-campaigns/analytics/kpis', { params }),
};

// ============================================
// EXPENSES
// ============================================

export const expensesApi = {
  getAll: (params = {}) => api.get('/expenses', { params }),
  getById: (id) => api.get(`/expenses/${id}`),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`),
  getFilterOptions: () => api.get('/expenses/filters/options'),
  getStats: (params = {}) => api.get('/expenses/stats/summary', { params }),
};

// ============================================
// SUMMARY DASHBOARD
// ============================================

export const summaryApi = {
  getDashboard: (params = {}) => api.get('/summary/dashboard', { params }),
  getFilterOptions: () => api.get('/summary/filters/options'),
};

// ============================================
// DATA KPI - Agent Performance
// ============================================

export const datakpiApi = {
  getDaily: (params = {}) => api.get('/datakpi/daily', { params }),
  getWeekly: (params = {}) => api.get('/datakpi/weekly', { params }),
  getMonthly: (params = {}) => api.get('/datakpi/monthly', { params }),
  getAgents: () => api.get('/datakpi/agents'),
  getById: (id) => api.get(`/datakpi/${id}`),
};

// ============================================
// CROSS-VIEW - Combined Analysis
// ============================================

export const crossviewApi = {
  getOverview: (params = {}) => api.get('/crossview/overview', { params }),
  getAgentPipeline: (params = {}) => api.get('/crossview/agent-pipeline', { params }),
  getFinancial: (params = {}) => api.get('/crossview/financial', { params }),
  getChannelComparison: (params = {}) => api.get('/crossview/channel-comparison', { params }),
};

// ============================================
// HEALTH CHECK
// ============================================

export const healthCheck = () => api.get('/health');

export default api;
