/**
 * API Client with Sanctum SPA Authentication
 * Uses httpOnly cookies for secure token storage (XSS-resistant)
 */
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import type { ApiError } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin;

// ============================================================================
// Axios Instance with Cookie-based Auth (Sanctum SPA)
// ============================================================================

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  withCredentials: true, // Required for cookies
});

// ============================================================================
// CSRF Token Management
// ============================================================================

let csrfInitialized = false;

/**
 * Initialize CSRF token by calling Sanctum's CSRF cookie endpoint
 * Must be called before any authenticated request
 */
async function initCsrf(): Promise<void> {
  if (csrfInitialized) return;

  try {
    await axios.get(`${APP_URL}/sanctum/csrf-cookie`, {
      withCredentials: true,
    });
    csrfInitialized = true;
  } catch (error) {
    console.error('[API] Failed to initialize CSRF token:', error);
    throw error;
  }
}

/**
 * Get CSRF token from cookie
 */
function getCsrfToken(): string | null {
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  if (match) {
    return decodeURIComponent(match[1]);
  }
  return null;
}

// ============================================================================
// Request Interceptor
// ============================================================================

api.interceptors.request.use(
  async (config) => {
    // Get Bearer token from auth store (localStorage)
    try {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        const { state } = JSON.parse(authStorage);
        if (state?.token) {
          config.headers['Authorization'] = `Bearer ${state.token}`;
        }
      }
    } catch {
      // Ignore parsing errors
    }

    // Add CSRF token to headers for state-changing requests (fallback)
    const csrfToken = getCsrfToken();
    if (csrfToken && ['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
      config.headers['X-XSRF-TOKEN'] = csrfToken;
    }

    // Add platform context
    const platformId = localStorage.getItem('current_platform');
    if (platformId) {
      config.headers['X-Platform-Id'] = platformId;
    }

    // Add language preference
    const language = localStorage.getItem('app_language') || 'fr';
    config.headers['Accept-Language'] = language;

    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================================================
// Response Interceptor
// ============================================================================

let isRefreshing = false;
let failedQueue: Array<{
  resolve: () => void;
  reject: (error: AxiosError) => void;
}> = [];

function processQueue(error: AxiosError | null): void {
  failedQueue.forEach(promise => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve();
    }
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Normalisation des réponses API
    // Si la réponse contient {success: true, data: ...}, extraire les données
    // Cela permet aux hooks d'utiliser directement response.data sans se soucier du wrapper
    if (response.data && typeof response.data === 'object') {
      const data = response.data as Record<string, unknown>;

      // Format Laravel standard: {success: true, data: ...}
      if ('success' in data && 'data' in data) {
        // Remplacer response.data par le contenu de data
        response.data = data.data;
      }
      // Format Laravel Resource: {data: [...], meta: {...}, links: {...}}
      // Ne pas transformer - c'est un format paginé valide
      else if ('data' in data && ('meta' in data || 'links' in data)) {
        // Garder tel quel pour la pagination
      }
      // Format simple: {data: ...} sans success
      else if ('data' in data && Object.keys(data).length === 1) {
        response.data = data.data;
      }
    }

    return response;
  },
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized - session expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Skip retry for login/logout/me endpoints - these should fail silently
      if (
        originalRequest.url?.includes('/login') ||
        originalRequest.url?.includes('/logout') ||
        originalRequest.url?.includes('/me')
      ) {
        return Promise.reject(error);
      }

      // For other endpoints, clear auth and let the app handle redirect
      try {
        localStorage.removeItem('auth-storage');
      } catch {
        // Ignore
      }

      return Promise.reject(error);
    }

    // Handle 419 CSRF token mismatch - reinitialize and retry
    if (error.response?.status === 419 && !originalRequest._retry) {
      originalRequest._retry = true;
      csrfInitialized = false;

      try {
        await initCsrf();
        return api(originalRequest);
      } catch (csrfError) {
        return Promise.reject(csrfError);
      }
    }

    return Promise.reject(error);
  }
);

// ============================================================================
// API Client Exports
// ============================================================================

export const apiClient = {
  get: <T>(url: string, config?: AxiosRequestConfig) => api.get<T>(url, config),
  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) => api.post<T>(url, data, config),
  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) => api.put<T>(url, data, config),
  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) => api.patch<T>(url, data, config),
  delete: <T>(url: string, config?: AxiosRequestConfig) => api.delete<T>(url, config),
};

export { api };

// ============================================================================
// Auth API (Cookie-based)
// ============================================================================

export const authApi = {
  /**
   * Initialize authentication (call before login)
   */
  initCsrf,

  /**
   * Check if user appears to be authenticated
   * Note: This is just a hint - actual auth state is determined by the server
   */
  isAuthenticated: (): boolean => {
    // Check for Laravel session cookie existence as a hint
    // The actual authentication is handled server-side via httpOnly cookies
    return document.cookie.includes('laravel_session') ||
           document.cookie.includes('XSRF-TOKEN');
  },

  /**
   * Clear client-side auth state
   * Note: Actual session invalidation happens server-side
   */
  clearSession: (): void => {
    csrfInitialized = false;
    // Clear any client-side storage
    localStorage.removeItem('current_platform');
  },

  // Legacy compatibility (deprecated - tokens now in httpOnly cookies)
  setTokens: (_accessToken: string, _refreshToken?: string, _expiresIn?: number): void => {
    console.warn('[authApi] setTokens is deprecated. Tokens are now stored in httpOnly cookies.');
  },
  clearTokens: (): void => {
    console.warn('[authApi] clearTokens is deprecated. Use clearSession instead.');
    authApi.clearSession();
  },
  getToken: (): string | null => {
    console.warn('[authApi] getToken is deprecated. Tokens are now stored in httpOnly cookies.');
    return null;
  },
};

export default api;