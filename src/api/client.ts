import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

// ── Token storage — sessionStorage ────────────────────────────────────────────
// sessionStorage survives page refreshes within the same tab but is cleared
// when the tab closes. This means:
//   • Refresh (F5) → token still available → followers-only posts load correctly
//   • Tab close / new tab → token gone → user must re-authenticate (secure)
//   • Unlike a cookie we control exactly when it is sent
const TOKEN_KEY = "cs_token_v1";

let _isRefreshing = false;
let _refreshQueue: Array<(token: string | null) => void> = [];

export const tokenStore = {
  get: () => sessionStorage.getItem(TOKEN_KEY),
  set: (t: string) => sessionStorage.setItem(TOKEN_KEY, t),
  clear: () => sessionStorage.removeItem(TOKEN_KEY),
};

export const apiClient = axios.create({
  baseURL: "/api",
  withCredentials: true, // sends cs_refresh_token cookie automatically
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
});

// ── Request interceptor: attach Bearer token ──────────────────────────────────
// ── Notification client ──────────────────────────────────────────────────────
// No explicit gateway route for /api/notifications/** — reached via Eureka
// discovery locator at /notification-service/api/notifications/**
export const notificationClient = axios.create({
  baseURL: "/notification-service/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
});

// Add Bearer token to the notification client too
notificationClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStore.get();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
);

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: 401 → silent refresh → retry ───────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      if (_isRefreshing) {
        // Queue concurrent requests while a refresh is already in-flight
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
        const { data } = await apiClient.post<{ accessToken: string }>(
          "/auth/refresh",
        );
        tokenStore.set(data.accessToken);
        _refreshQueue.forEach((cb) => cb(data.accessToken));
        _refreshQueue = [];
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(original);
      } catch {
        tokenStore.clear();
        _refreshQueue.forEach((cb) => cb(null));
        _refreshQueue = [];
        window.location.href = "/login";
        return Promise.reject(error);
      } finally {
        _isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);
