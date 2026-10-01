import axios from 'axios';

// In production on Vercel, VITE_API_URL points to the Render backend (e.g., https://unihealth-api.onrender.com)
// In local development, defaults to /api/v1 (proxied via vite.config.ts)
const rawBaseUrl = import.meta.env.VITE_API_URL || '';
const cleanBaseUrl = rawBaseUrl.replace(/\/+$/, '');
const baseURL = cleanBaseUrl ? `${cleanBaseUrl}/api/v1` : '/api/v1';

export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token for cross-origin deployments (Vercel <-> Render)
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('unihealth_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response error handler
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message || error.message || 'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);
