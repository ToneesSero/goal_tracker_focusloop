import axios from 'axios';

// Use relative path for API requests - will be proxied by Vite in dev mode
const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect on 401 if:
    // 1. Not already on auth page
    // 2. Not a login/register request (those should show error, not redirect)
    if (error.response?.status === 401) {
      const isAuthPage = window.location.pathname === '/auth';
      const isAuthRequest = error.config?.url?.includes('/auth/login') ||
                           error.config?.url?.includes('/auth/register') ||
                           error.config?.url?.includes('/auth/telegram');

      // Remove invalid token
      localStorage.removeItem('token');

      // Only redirect if user was authenticated and token expired
      if (!isAuthPage && !isAuthRequest) {
        window.location.href = '/auth';
      }
    }
    return Promise.reject(error);
  },
);

export default api;
