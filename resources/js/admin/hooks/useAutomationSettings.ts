import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/utils/api';

// Types
export interface AutomationSettings {
  content: {
    auto_translate: boolean;
    auto_generate_image: boolean;
    auto_publish: boolean;
    quality_min_score: number;
  };
  seo: {
    auto_submission_enabled: boolean;
    on_publish: boolean;
    on_update: boolean;
    use_google: boolean;
    use_bing: boolean;
    use_indexnow: boolean;
  };
  publishing: {
    google_indexing_enabled: boolean;
    bing_submission_enabled: boolean;
    indexnow_enabled: boolean;
  };
}

export interface AutomationStatus {
  pipeline: {
    generation: boolean;
    translation: boolean;
    image: boolean;
    publication: boolean;
    indexation: boolean;
  };
  quality_gate: {
    enabled: boolean;
    min_score: number;
  };
  services: {
    google_indexing: { enabled: boolean; configured: boolean };
    bing: { enabled: boolean; configured: boolean };
    indexnow: { enabled: boolean; configured: boolean };
  };
  full_automation: boolean;
}

export interface EnvInfo {
  required_env_vars: Record<string, {
    description: string;
    default: string;
    current: string;
  }>;
  pipeline: {
    description: string;
    activation: string;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Query keys
const KEYS = {
  settings: ['automation', 'settings'],
  status: ['automation', 'status'],
  envInfo: ['automation', 'env-info'],
};

/**
 * Hook pour gérer les paramètres d'automatisation
 */
export function useAutomationSettings() {
  const queryClient = useQueryClient();

  // Récupérer les paramètres
  const settingsQuery = useQuery({
    queryKey: KEYS.settings,
    queryFn: async () => {
      const response = await api.get<ApiResponse<AutomationSettings>>('/automation/settings');
      return response.data.data;
    },
  });

  // Récupérer le statut
  const statusQuery = useQuery({
    queryKey: KEYS.status,
    queryFn: async () => {
      const response = await api.get<ApiResponse<AutomationStatus>>('/automation/status');
      return response.data.data;
    },
  });

  // Récupérer les infos .env
  const envInfoQuery = useQuery({
    queryKey: KEYS.envInfo,
    queryFn: async () => {
      const response = await api.get<ApiResponse<EnvInfo>>('/automation/env-info');
      return response.data.data;
    },
  });

  // Mettre à jour les paramètres
  const updateMutation = useMutation({
    mutationFn: async (data: Partial<{
      auto_translate: boolean;
      auto_generate_image: boolean;
      auto_publish: boolean;
      quality_min_score: number;
      auto_submission_enabled: boolean;
      on_publish: boolean;
      use_google: boolean;
      use_bing: boolean;
      use_indexnow: boolean;
    }>) => {
      const response = await api.put<ApiResponse<unknown>>('/automation/settings', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.settings });
      queryClient.invalidateQueries({ queryKey: KEYS.status });
    },
  });

  // Activer l'automatisation complète
  const enableFullMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post<ApiResponse<unknown> & { warning?: string }>('/automation/enable-full');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.settings });
      queryClient.invalidateQueries({ queryKey: KEYS.status });
    },
  });

  // Désactiver l'automatisation
  const disableMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post<ApiResponse<unknown>>('/automation/disable');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.settings });
      queryClient.invalidateQueries({ queryKey: KEYS.status });
    },
  });

  // Réinitialiser aux valeurs par défaut
  const resetMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post<ApiResponse<unknown>>('/automation/reset');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.settings });
      queryClient.invalidateQueries({ queryKey: KEYS.status });
    },
  });

  return {
    // Données
    settings: settingsQuery.data,
    status: statusQuery.data,
    envInfo: envInfoQuery.data,

    // États de chargement
    isLoading: settingsQuery.isLoading || statusQuery.isLoading,
    isLoadingSettings: settingsQuery.isLoading,
    isLoadingStatus: statusQuery.isLoading,
    isLoadingEnvInfo: envInfoQuery.isLoading,

    // Erreurs
    error: settingsQuery.error || statusQuery.error,

    // Actions
    updateSettings: updateMutation.mutateAsync,
    enableFull: enableFullMutation.mutateAsync,
    disable: disableMutation.mutateAsync,
    reset: resetMutation.mutateAsync,

    // États des mutations
    isUpdating: updateMutation.isPending,
    isEnabling: enableFullMutation.isPending,
    isDisabling: disableMutation.isPending,
    isResetting: resetMutation.isPending,

    // Refetch
    refetch: () => {
      settingsQuery.refetch();
      statusQuery.refetch();
    },
  };
}

export default useAutomationSettings;
