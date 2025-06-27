import axios from 'axios';
import { getSubdomain } from '../utils/subdomain';

// Create axios instance for public menu API
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Public Menu API - matches frontend expectations exactly
export const publicMenuAPI = {
  // Get menu items in frontend format
  getMenuItems: async () => {
    const subdomain = getSubdomain();
    const response = await api.get(`/api/public/${subdomain}/menu-items`);
    return response.data;
  },

  // Get categories in frontend format
  getCategories: async () => {
    const subdomain = getSubdomain();
    const response = await api.get(`/api/public/${subdomain}/categories`);
    return response.data;
  },

  // Get settings in frontend format
  getSettings: async () => {
    const subdomain = getSubdomain();
    const response = await api.get(`/api/public/${subdomain}/settings`);
    return response.data;
  }
};

export default publicMenuAPI;