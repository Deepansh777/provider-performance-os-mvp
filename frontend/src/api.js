import axios from 'axios';
import { getAuthToken } from './authUtils';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to attach authentication token
api.interceptors.request.use(
  async (config) => {
    // Skip token for health check endpoints
    if (config.url === '/api/health' || config.url === '/') {
      return config;
    }

    // Get token from Amplify/Cognito
    const token = await getAuthToken();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - could redirect to login
      console.error('Authentication error:', error.response.data);
    }
    return Promise.reject(error);
  }
);

// Health Check API
export const healthAPI = {
  getHealth: () => api.get('/api/health'),
  getRoot: () => api.get('/'),
};

// Organizations API
export const organizationsAPI = {
  getAll: () => api.get('/api/organizations'),
  getById: (id) => api.get(`/api/organizations/${id}`),
};

// Providers API
export const providersAPI = {
  getAll: (organizationId = null) => {
    const params = organizationId ? `?organization_id=${organizationId}` : '';
    return api.get(`/api/providers${params}`);
  },
  getSnapshot: (providerId, reportingPeriod = '2025-12-31') =>
    api.get(`/api/providers/${providerId}/snapshot?reporting_period=${reportingPeriod}`),
  getDomains: (providerId, reportingPeriod = '2025-12-31') =>
    api.get(`/api/providers/${providerId}/domains?reporting_period=${reportingPeriod}`),
};

export default api;
