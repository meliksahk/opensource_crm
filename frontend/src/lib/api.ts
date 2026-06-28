// src/lib/api.ts — Axios instance + token interceptor. /api proxy üzerinden backend'e.
import axios from 'axios';

const TOKEN_KEY = 'crm_access_token';

export const api = axios.create({ baseURL: '/api/v1' });

export function setToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

// Her isteğe access token ekle.
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 401'de token temizle (oturum düştü) — basit demo akışı.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401 && typeof window !== 'undefined') {
      setToken(null);
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  },
);

// Standart zarf { success, data, meta } → data döndür.
export function unwrap<T>(payload: { data: T }): T {
  return payload.data;
}
