import axios from 'axios';
import { getSubdomain } from '../utils/subdomain';

// Create axios instance with auth interceptor for tenant endpoints
const createFlowIQAPI = () => {
  const instance = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Request interceptor to add auth token for tenant endpoints
  instance.interceptors.request.use(
    (config) => {
      // Only add auth token for tenant endpoints
      if (config.url.includes('/api/tenant/')) {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  return instance;
};

const api = createFlowIQAPI();

// FlowIQ API - for both tenant management and public access
export const flowiqAPI = {
  // Tenant endpoints (requires authentication)
  tenant: {
    // Get all flows for the tenant
    getFlows: () => api.get('/api/tenant/flowiq/flows'),
    
    // Get a single flow with all steps
    getFlow: (flowId) => api.get(`/api/tenant/flowiq/flows/${flowId}`),
    
    // Create a new flow
    createFlow: (data) => api.post('/api/tenant/flowiq/flows', data),
    
    // Update a flow
    updateFlow: (flowId, data) => api.put(`/api/tenant/flowiq/flows/${flowId}`, data),
    
    // Delete a flow
    deleteFlow: (flowId) => api.delete(`/api/tenant/flowiq/flows/${flowId}`),
    
    // Get flow analytics
    getFlowAnalytics: (flowId) => api.get(`/api/tenant/flowiq/flows/${flowId}/analytics`),
    
    // Bulk update flow steps
    updateFlowSteps: (flowId, steps) => api.put(`/api/tenant/flowiq/flows/${flowId}/steps`, { steps }),
    
    // Set default flow
    setDefaultFlow: (flowId) => api.post(`/api/tenant/flowiq/flows/${flowId}/set-default`)
  },
  
  // Public endpoints (no authentication required)
  public: {
    // Get active flows for a tenant
    getActiveFlows: async () => {
      const subdomain = getSubdomain();
      const response = await api.get(`/api/public/${subdomain}/flowiq/flows`);
      return response.data;
    },
    
    // Get a specific flow for display
    getFlow: async (flowId) => {
      const subdomain = getSubdomain();
      const response = await api.get(`/api/public/${subdomain}/flowiq/flows/${flowId}`);
      return response.data;
    },
    
    // Track flow interaction
    trackInteraction: async (flowId, interactionData) => {
      const subdomain = getSubdomain();
      const response = await api.post(`/api/public/${subdomain}/flowiq/flows/${flowId}/interact`, interactionData);
      return response.data;
    },
    
    // Update interaction step
    updateInteractionStep: async (interactionId, stepData) => {
      const subdomain = getSubdomain();
      const response = await api.put(`/api/public/${subdomain}/flowiq/interactions/${interactionId}/step`, stepData);
      return response.data;
    },
    
    // Complete interaction
    completeInteraction: async (interactionId) => {
      const subdomain = getSubdomain();
      const response = await api.post(`/api/public/${subdomain}/flowiq/interactions/${interactionId}/complete`);
      return response.data;
    }
  }
};

export default flowiqAPI;