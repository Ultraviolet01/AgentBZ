import axios from 'axios';
import { useAuthStore } from './store/auth.store';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const isAuthEndpoint = (url?: string) => {
  if (!url) return false;
  return /\/auth\/(login|register|google|refresh|logout|me)(?:$|\?)/.test(url);
};

const clearAuthState = () => {
  useAuthStore.getState().logout();
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};

// Response interceptor for handling token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const isRetry = Boolean(originalRequest._retry);
    const isProtectedRequest = !isAuthEndpoint(originalRequest.url);

    // If error is 401 on a protected (non-auth) endpoint and we haven't retried yet,
    // try refreshing the access token once.
    if (error.response?.status === 401 && !isRetry && isProtectedRequest) {
      if (isRefreshing) {
        // Queue this request to retry once the in-progress refresh completes
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      return new Promise(function(resolve, reject) {
        axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || '/api'}/auth/refresh`,
          {},
          { withCredentials: true }
        )
          .then(() => {
            // Refresh succeeded — replay the original request
            processQueue(null);
            resolve(api(originalRequest));
          })
          .catch((refreshError) => {
            // Refresh failed — session is truly expired, sign out
            processQueue(refreshError, null);
            clearAuthState();
            reject(refreshError);
          })
          .finally(() => {
            isRefreshing = false;
          });
      });
    }

    // For all other errors just propagate — don't auto sign-out on 4xx data errors
    return Promise.reject(error);
  }
);

export default api;
