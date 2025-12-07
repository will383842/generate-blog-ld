/**
 * Auth Hook - Simplified version using Zustand store
 * No duplicate queries, direct store access
 */
import { useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';

interface LoginCredentials {
  email: string;
  password: string;
}

// ═══════════════════════════════════════════════════════════════
// MAIN HOOK
// ═══════════════════════════════════════════════════════════════

export function useAuth() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login: storeLogin,
    logout: storeLogout,
    checkAuth,
    clearError,
  } = useAuthStore();

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      await storeLogin(credentials.email, credentials.password);
      // Only navigate after successful login
      const from = (location.state as { from?: string })?.from || '/';
      navigate(from, { replace: true });
    } catch (error) {
      // Re-throw so the caller knows login failed
      throw error;
    }
  }, [storeLogin, navigate, location.state]);

  const logout = useCallback(async () => {
    await storeLogout();
    queryClient.clear();
    navigate('/login', { replace: true });
  }, [storeLogout, queryClient, navigate]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    checkAuth,
    clearError,
  };
}

// ═══════════════════════════════════════════════════════════════
// REQUIRE AUTH HOOK (redirect si non authentifié)
// ═══════════════════════════════════════════════════════════════

export function useRequireAuth(redirectTo: string = '/login') {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading, isInitialized } = useAuthStore();

  useEffect(() => {
    if (isInitialized && !isLoading && !isAuthenticated) {
      navigate(redirectTo, {
        replace: true,
        state: { from: location.pathname },
      });
    }
  }, [isAuthenticated, isLoading, isInitialized, navigate, redirectTo, location.pathname]);

  return { isAuthenticated, isLoading };
}

// ═══════════════════════════════════════════════════════════════
// GUEST ONLY HOOK (redirect si déjà connecté)
// ═══════════════════════════════════════════════════════════════

export function useGuestOnly(redirectTo: string = '/') {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, isInitialized } = useAuthStore();

  useEffect(() => {
    if (isInitialized && !isLoading && isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, isLoading, isInitialized, navigate, redirectTo]);

  return { isAuthenticated, isLoading };
}
