import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests (except for login)
api.interceptors.request.use((config) => {
  // Don't add auth header to login endpoint
  if (config.url === '/api/admin/login') {
    return config;
  }
  
  const token = localStorage.getItem('systemToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const systemAPI = {
  // Auth
  login: async (email, password) => {
    const response = await api.post('/api/admin/login', { email, password });
    if (response.data.access_token) {
      localStorage.setItem('systemToken', response.data.access_token);
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('systemToken');
  },

  // System Stats
  getSystemStats: async () => {
    const response = await api.get('/api/admin/stats');
    return response.data;
  },

  // Tenants
  getTenants: async () => {
    const response = await api.get('/api/admin/tenants');
    return response.data;
  },

  getTenant: async (id) => {
    const response = await api.get(`/api/admin/tenants/${id}`);
    return response.data;
  },

  createTenant: async (data) => {
    const response = await api.post('/api/admin/tenants', data);
    return response.data;
  },

  updateTenant: async (id, data) => {
    const response = await api.put(`/api/admin/tenants/${id}`, data);
    return response.data;
  },

  deleteTenant: async (id) => {
    const response = await api.delete(`/api/admin/tenants/${id}`);
    return response.data;
  },

  // Plans
  getPlans: async () => {
    const response = await api.get('/api/admin/plans');
    return response.data;
  },

  // Activity Logs
  getActivityLogs: async (params) => {
    const response = await api.get('/api/admin/activity-logs', { params });
    return response.data;
  },

  // Analytics
  getAnalytics: async (params) => {
    const response = await api.get('/api/admin/analytics', { params });
    return response.data;
  }
};

export default api;