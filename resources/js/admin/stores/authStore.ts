/**
 * Auth Store with Bearer Token Authentication
 * Tokens are stored in localStorage via Zustand persist
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/utils/api';
import { API_ENDPOINTS } from '@/utils/constants';
import type { User } from '@/types/common';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  initialize: () => void;
  updateUser: (data: Partial<User>) => void;
  clearError: () => void;
  setAuthenticated: (authenticated: boolean) => void;
}

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      initialize: () => {
        const { token, isInitialized } = get();
        if (isInitialized) return;

        // Always mark as initialized first to prevent blocking UI
        set({ isInitialized: true });

        // Si on a un token persisté, vérifier qu'il est valide (async, non-blocking)
        if (token) {
          get().checkAuth().catch(() => {
            // Token validation failed, clear auth state
            set({ user: null, token: null, isAuthenticated: false });
          });
        } else {
          set({ isAuthenticated: false });
        }
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post<{ user: User; access_token: string; token?: string }>(
            API_ENDPOINTS.auth.login,
            { email, password }
          );

          const { user, access_token, token: backwardToken } = response.data;
          const finalToken = access_token || backwardToken;

          set({
            user,
            token: finalToken || null,
            isAuthenticated: true,
            isLoading: false,
            isInitialized: true,
            error: null,
          });
        } catch (error: unknown) {
          let message = 'Erreur de connexion';
          if (error && typeof error === 'object' && 'response' in error) {
            const axiosError = error as { response?: { data?: { message?: string } } };
            message = axiosError.response?.data?.message || message;
          } else if (error instanceof Error) {
            message = error.message;
          }
          set({ isLoading: false, error: message, isAuthenticated: false });
          throw error;
        }
      },

      logout: async () => {
        const { token } = get();
        set({ isLoading: true });
        try {
          if (token) {
            await api.post(API_ENDPOINTS.auth.logout);
          }
        } catch {
          // Continue logout même si l'API échoue
        } finally {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            isInitialized: true,
            error: null,
          });
        }
      },

      checkAuth: async () => {
        const { token } = get();
        if (!token) {
          set({ isAuthenticated: false, isInitialized: true });
          return;
        }

        // Don't set isLoading here to avoid blocking UI during background check
        try {
          const response = await api.get<{ user: User }>(API_ENDPOINTS.auth.me);
          set({
            user: response.data.user,
            isAuthenticated: true,
            isInitialized: true,
          });
        } catch {
          // Token invalide ou expiré
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isInitialized: true,
          });
        }
      },

      updateUser: (data: Partial<User>) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...data } });
        }
      },

      clearError: () => set({ error: null }),

      setAuthenticated: (authenticated: boolean) => set({ isAuthenticated: authenticated }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
