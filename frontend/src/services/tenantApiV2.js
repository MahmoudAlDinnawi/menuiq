import axios from 'axios';

// Create axios instance with auth interceptor
const createTenantAPI = () => {
  const instance = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Request interceptor to add auth token
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Remove Content-Type header for FormData
      // Let browser set it automatically with boundary
      if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
      }
      
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor for error handling
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

const api = createTenantAPI();

// Tenant API V2 - Simplified and clean
const tenantAPI = {
  // Dashboard
  get: (endpoint) => api.get(`/api/tenant${endpoint}`),
  post: (endpoint, data) => api.post(`/api/tenant${endpoint}`, data),
  put: (endpoint, data) => api.put(`/api/tenant${endpoint}`, data),
  delete: (endpoint) => api.delete(`/api/tenant${endpoint}`),

  // Specific methods for convenience
  getDashboardStats: () => api.get('/api/tenant/dashboard/stats'),
  
  // Categories
  getCategories: () => api.get('/api/tenant/categories'),
  createCategory: (data) => api.post('/api/tenant/categories', data),
  updateCategory: (id, data) => api.put(`/api/tenant/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/api/tenant/categories/${id}`),
  
  // Menu Items
  getMenuItems: (params) => api.get('/api/tenant/menu-items', { params }),
  getMenuItem: (id) => api.get(`/api/tenant/menu-items/${id}`),
  createMenuItem: (data) => api.post('/api/tenant/menu-items', data),
  updateMenuItem: (id, data) => api.put(`/api/tenant/menu-items/${id}`, data),
  deleteMenuItem: (id) => api.delete(`/api/tenant/menu-items/${id}`),
  
  // Settings
  getSettings: () => api.get('/api/tenant/settings'),
  updateSettings: (data) => api.put('/api/tenant/settings', data),
  
  // Allergen Icons
  getAllergenIcons: () => api.get('/api/tenant/allergen-icons'),
  
  // Image Upload
  uploadImage: (file, type = 'item') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    
    return api.post('/api/tenant/upload-image', formData);
  }
};

export default tenantAPI;