import axios from 'axios';

export const PRODUCTION_API_URL = 'https://kcas-backend.onrender.com/api';
export const LOCAL_API_URL = 'http://localhost:5001/api';

export function getEffectiveApiUrl() {
  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem('kcas_backend_url');
    if (customUrl && customUrl.trim()) {
      return customUrl.trim().replace(/\/+$/, '');
    }

    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === '0.0.0.0';

    if (isLocalhost) {
      const localEnvUrl = process.env.NEXT_PUBLIC_LOCAL_API_URL || process.env.NEXT_PUBLIC_API_URL;
      return (localEnvUrl || LOCAL_API_URL).replace(/\/+$/, '');
    }

    const prodEnvUrl = process.env.NEXT_PUBLIC_API_URL;
    if (prodEnvUrl && !prodEnvUrl.includes('localhost') && !prodEnvUrl.includes('127.0.0.1')) {
      return prodEnvUrl.replace(/\/+$/, '');
    }
    return PRODUCTION_API_URL;
  }

  if (process.env.NODE_ENV === 'production') {
    const prodEnvUrl = process.env.NEXT_PUBLIC_API_URL;
    if (prodEnvUrl && !prodEnvUrl.includes('localhost') && !prodEnvUrl.includes('127.0.0.1')) {
      return prodEnvUrl.replace(/\/+$/, '');
    }
    return PRODUCTION_API_URL;
  }

  return (process.env.NEXT_PUBLIC_LOCAL_API_URL || process.env.NEXT_PUBLIC_API_URL || LOCAL_API_URL).replace(/\/+$/, '');
}

let API_BASE_URL = getEffectiveApiUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      config.baseURL = getEffectiveApiUrl();
      const token = localStorage.getItem('kcas_auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (
        typeof window !== 'undefined' &&
        !window.location.pathname.startsWith('/login') &&
        window.location.pathname !== '/'
      ) {
        localStorage.removeItem('kcas_auth_token');
        localStorage.removeItem('kcas_user_data');
        window.location.href = '/login?sessionExpired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
export { API_BASE_URL };
