import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject JWT Bearer Token and User Quality in headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('raw_jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const activePlan = localStorage.getItem('raw_active_subscription_plan');
    if (activePlan) {
      try {
        const parsed = JSON.parse(activePlan);
        if (parsed.maxQuality) {
          config.headers['X-User-Quality'] = parsed.maxQuality;
        }
      } catch (e) {}
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
