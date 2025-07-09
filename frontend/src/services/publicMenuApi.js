import axios from 'axios';
import { getSubdomain } from '../utils/subdomain';

// Create axios instance for public menu API
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add response interceptor for debugging
api.interceptors.response.use(
  response => {
    console.log('[API Interceptor] Success:', response.config.url, response.status);
    return response;
  },
  error => {
    console.error('[API Interceptor] Error Details:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.config?.headers,
      baseURL: error.config?.baseURL,
      fullError: error
    });
    return Promise.reject(error);
  }
);

// Public Menu API - matches frontend expectations exactly
export const publicMenuAPI = {
  // Get menu items in frontend format
  getMenuItems: async () => {
    try {
      const subdomain = getSubdomain();
      console.log('[API] Fetching menu items for subdomain:', subdomain);
      // Fetch all items with a high limit to get everything
      const response = await api.get(`/api/public/${subdomain}/menu-items?limit=1000`);
      console.log('[API] Raw response:', response);
      console.log('[API] Response data:', response.data);
      
      // Handle different possible response formats
      let items = [];
      if (Array.isArray(response.data)) {
        // Direct array response (old format)
        items = response.data;
      } else if (response.data && Array.isArray(response.data.items)) {
        // Paginated response with items property (new format)
        items = response.data.items;
      } else if (response.data && Array.isArray(response.data.data)) {
        // Response with data property
        items = response.data.data;
      } else {
        console.error('[API] Unexpected response format:', response.data);
      }
      
      console.log('[API] Extracted items:', items);
      return items;
    } catch (error) {
      console.error('[API] Error fetching menu items:', error);
      return [];
    }
  },

  // Get categories in frontend format
  getCategories: async () => {
    try {
      const subdomain = getSubdomain();
      console.log('[API] Fetching categories for subdomain:', subdomain);
      const response = await api.get(`/api/public/${subdomain}/categories`);
      console.log('[API] Categories response:', response.data);
      
      // Handle different response formats
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && Array.isArray(response.data.items)) {
        return response.data.items;
      } else if (response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      
      console.error('[API] Unexpected categories format:', response.data);
      return [];
    } catch (error) {
      console.error('[API] Error fetching categories:', error);
      return [];
    }
  },

  // Get settings in frontend format
  getSettings: async () => {
    try {
      const subdomain = getSubdomain();
      console.log('[API] Fetching settings for subdomain:', subdomain);
      const response = await api.get(`/api/public/${subdomain}/settings`);
      console.log('[API] Settings response:', response.data);
      
      // Settings might be wrapped in a data property
      if (response.data && response.data.data) {
        return response.data.data;
      }
      
      return response.data || {};
    } catch (error) {
      console.error('[API] Error fetching settings:', error);
      return {};
    }
  }
};

export default publicMenuAPI;