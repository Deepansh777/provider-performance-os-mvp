import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

export default api;
