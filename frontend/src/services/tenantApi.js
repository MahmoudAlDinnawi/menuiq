import api from './api';
import { getSubdomain } from '../utils/subdomain';

// Tenant-specific API calls
export const tenantAPI = {
  // Categories
  getCategories: async () => {
    const subdomain = getSubdomain();
    const response = await api.get(`/api/${subdomain}/categories`);
    return response.data;
  },

  createCategory: async (data) => {
    const subdomain = getSubdomain();
    const response = await api.post(`/api/${subdomain}/categories`, data);
    return response.data;
  },

  updateCategory: async (id, data) => {
    const subdomain = getSubdomain();
    const response = await api.put(`/api/${subdomain}/categories/${id}`, data);
    return response.data;
  },

  deleteCategory: async (id) => {
    const subdomain = getSubdomain();
    const response = await api.delete(`/api/${subdomain}/categories/${id}`);
    return response.data;
  },

  // Menu Items
  getMenuItems: async (params = {}) => {
    const subdomain = getSubdomain();
    const response = await api.get(`/api/${subdomain}/menu-items`, { params });
    return response.data;
  },

  createMenuItem: async (data) => {
    const subdomain = getSubdomain();
    const response = await api.post(`/api/${subdomain}/menu-items`, data);
    return response.data;
  },

  updateMenuItem: async (id, data) => {
    const subdomain = getSubdomain();
    const response = await api.put(`/api/${subdomain}/menu-items/${id}`, data);
    return response.data;
  },

  deleteMenuItem: async (id) => {
    const subdomain = getSubdomain();
    const response = await api.delete(`/api/${subdomain}/menu-items/${id}`);
    return response.data;
  },

  // Settings
  getSettings: async () => {
    const subdomain = getSubdomain();
    const response = await api.get(`/api/${subdomain}/settings`);
    return response.data;
  },

  updateSettings: async (data) => {
    const subdomain = getSubdomain();
    const response = await api.put(`/api/${subdomain}/settings`, data);
    return response.data;
  },

  // Image upload
  uploadImage: async (file, itemId = null) => {
    const subdomain = getSubdomain();
    const formData = new FormData();
    formData.append('file', file);
    if (itemId) {
      formData.append('item_id', itemId);
    }
    
    const response = await api.post(`/api/${subdomain}/upload-image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Allergen Icons
  getAllergenIcons: async () => {
    const subdomain = getSubdomain();
    const response = await api.get(`/api/${subdomain}/allergen-icons`);
    return response.data;
  },

  createAllergenIcon: async (data) => {
    const subdomain = getSubdomain();
    const response = await api.post(`/api/${subdomain}/allergen-icons`, data);
    return response.data;
  },

  updateAllergenIcon: async (id, data) => {
    const subdomain = getSubdomain();
    const response = await api.put(`/api/${subdomain}/allergen-icons/${id}`, data);
    return response.data;
  },

  deleteAllergenIcon: async (id) => {
    const subdomain = getSubdomain();
    const response = await api.delete(`/api/${subdomain}/allergen-icons/${id}`);
    return response.data;
  },

  // Import/Export
  importMenuItems: async (items) => {
    const subdomain = getSubdomain();
    const response = await api.post(`/api/${subdomain}/menu-items/bulk`, items);
    return response.data;
  },
};

export default tenantAPI;