// Axios instance — single configured instance for all API calls
import axios from 'axios';

// Auto-detect: localhost = use proxy (/api), production = use VITE_API_URL
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const baseURL = isLocal ? '/api' : (import.meta.env.VITE_API_URL || '/api');

const api = axios.create({
  baseURL,
  withCredentials: false,
  timeout: 30000,
});

// ─── Request interceptor — attach access token ────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Response interceptor — token refresh on 401 ─────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    const isAuthRequest = original.url?.includes('/auth/login') ||
                          original.url?.includes('/auth/register') ||
                          original.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && !original._retry && !isAuthRequest) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const { data } = await api.post('/auth/refresh');
        const newToken = data.data.accessToken;
        localStorage.setItem('accessToken', newToken);
        processQueue(null, newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (err) {
        processQueue(err, null);
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
