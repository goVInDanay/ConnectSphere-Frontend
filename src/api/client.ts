import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// The gateway listens on 8080 and extracts JWT from either:
//   1. Authorization: Bearer <token>  header
//   2. cs_access_token cookie (set as HttpOnly by AuthService)
// We use withCredentials so cookies are sent automatically.
// We also store the access token in memory and attach it as Bearer
// (cookie is the fallback the gateway supports).

let _accessToken: string | null = null;
let _isRefreshing = false;
let _refreshQueue: Array<(token: string | null) => void> = [];

export const tokenStore = {
  get: () => _accessToken,
  set: (t: string | null) => { _accessToken = t; },
  clear: () => { _accessToken = null; },
};

export const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true,       // sends cs_access_token + cs_refresh_token cookies
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

// ── Request interceptor: attach Bearer token ──────────────────────────────────
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: handle 401 + refresh ───────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      if (_isRefreshing) {
        // Queue requests while refresh is in-flight
        return new Promise((resolve, reject) => {
          _refreshQueue.push((token) => {
            if (token) {
              original.headers.Authorization = `Bearer ${token}`;
              resolve(apiClient(original));
            } else {
              reject(error);
            }
          });
        });
      }

      _isRefreshing = true;
      try {
        // cs_refresh_token cookie is sent automatically
        const { data } = await apiClient.post<{ accessToken: string }>('/auth/refresh');
        tokenStore.set(data.accessToken);
        _refreshQueue.forEach((cb) => cb(data.accessToken));
        _refreshQueue = [];
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(original);
      } catch {
        tokenStore.clear();
        _refreshQueue.forEach((cb) => cb(null));
        _refreshQueue = [];
        // Redirect to login
        window.location.href = '/login';
        return Promise.reject(error);
      } finally {
        _isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
