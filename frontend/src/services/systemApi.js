import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('systemToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const systemAPI = {
  // Auth
  login: async (email, password) => {
    const response = await api.post('/api/system/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('systemToken', response.data.token);
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('systemToken');
  },

  // System Stats
  getSystemStats: async () => {
    const response = await api.get('/api/system/stats');
    return response.data;
  },

  // Tenants
  getTenants: async () => {
    const response = await api.get('/api/system/tenants');
    return response.data;
  },

  getTenant: async (id) => {
    const response = await api.get(`/api/system/tenants/${id}`);
    return response.data;
  },

  createTenant: async (data) => {
    const response = await api.post('/api/system/tenants', data);
    return response.data;
  },

  updateTenant: async (id, data) => {
    const response = await api.put(`/api/system/tenants/${id}`, data);
    return response.data;
  },

  deleteTenant: async (id) => {
    const response = await api.delete(`/api/system/tenants/${id}`);
    return response.data;
  },

  // Plans
  getPlans: async () => {
    const response = await api.get('/api/system/plans');
    return response.data;
  },

  // Activity Logs
  getActivityLogs: async (params) => {
    const response = await api.get('/api/system/activity-logs', { params });
    return response.data;
  },

  // Analytics
  getAnalytics: async (params) => {
    const response = await api.get('/api/system/analytics', { params });
    return response.data;
  }
};

export default api;