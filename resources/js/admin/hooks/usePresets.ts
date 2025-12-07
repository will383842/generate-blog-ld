// ═══════════════════════════════════════════════════════════════════════════
// PRESETS HOOKS - Configuration Presets Management
// ═══════════════════════════════════════════════════════════════════════════

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useApiQuery, useApiMutation } from './useApi';
import { useToast } from '@/hooks/useToast';
import api from '@/utils/api';
import type {
  Preset,
  PresetConfig,
  CreatePresetInput,
  UpdatePresetInput,
} from '@/types/program';
import type { ApiResponse, ApiErrorResponse } from '@/types/common';

// ═══════════════════════════════════════════════════════════════════════════
// QUERY KEYS
// ═══════════════════════════════════════════════════════════════════════════

export const presetKeys = {
  all: ['presets'] as const,
  lists: () => [...presetKeys.all, 'list'] as const,
  list: (filters?: { platformId?: string }) => [...presetKeys.lists(), filters] as const,
  detail: (id: string) => [...presetKeys.all, 'detail', id] as const,
  default: () => [...presetKeys.all, 'default'] as const,
};

// ═══════════════════════════════════════════════════════════════════════════
// API ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

const API = {
  presets: '/admin/program-presets',
  preset: (id: string) => `/admin/program-presets/${id}`,
  presetDefault: '/admin/program-presets/default',
  presetSetDefault: (id: string) => `/admin/program-presets/${id}/set-default`,
  presetApply: (id: string) => `/admin/program-presets/${id}/apply`,
  presetFromProgram: '/admin/program-presets/from-program',
};

// ═══════════════════════════════════════════════════════════════════════════
// QUERY HOOKS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch all presets
 */
export function usePresets(filters?: { platformId?: string; search?: string }) {
  return useApiQuery<ApiResponse<Preset[]>>(
    presetKeys.list(filters),
    API.presets,
    {
      params: filters,
    },
    {
      staleTime: 60000, // 1 minute - presets don't change often
    }
  );
}

/**
 * Fetch single preset details
 */
export function usePreset(id: string | undefined) {
  return useApiQuery<ApiResponse<Preset>>(
    presetKeys.detail(id || ''),
    API.preset(id || ''),
    undefined,
    {
      enabled: !!id,
      staleTime: 60000,
    }
  );
}

/**
 * Fetch default preset
 */
export function useDefaultPreset() {
  return useApiQuery<ApiResponse<Preset | null>>(
    presetKeys.default(),
    API.presetDefault,
    undefined,
    {
      staleTime: 60000,
    }
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MUTATION HOOKS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a new preset
 */
export function useCreatePreset() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useApiMutation<ApiResponse<Preset>, CreatePresetInput>(
    async (variables: CreatePresetInput) => (
      await api.post<ApiResponse<Preset>>(API.presets, variables)
    ).data,
    {
      onSuccess: (data: ApiResponse<Preset>) => {
        success('Preset créé', `Le preset "${data.data.name}" a été créé.`);
        queryClient.invalidateQueries({ queryKey: presetKeys.lists() });
        if (data.data.isDefault) {
          queryClient.invalidateQueries({ queryKey: presetKeys.default() });
        }
      },
      onError: (error: ApiErrorResponse) => {
        showError('Erreur', error.response?.data?.message || 'Impossible de créer le preset');
      },
    }
  );
}

/**
 * Update an existing preset
 */
export function useUpdatePreset() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useApiMutation<ApiResponse<Preset>, UpdatePresetInput>(
    async (variables: UpdatePresetInput) => (
      await api.put<ApiResponse<Preset>>(API.preset(variables.id), variables)
    ).data,
    {
      onSuccess: (data: ApiResponse<Preset>) => {
        success('Preset mis à jour', 'Les modifications ont été enregistrées.');
        queryClient.invalidateQueries({ queryKey: presetKeys.detail(data.data.id) });
        queryClient.invalidateQueries({ queryKey: presetKeys.lists() });
      },
      onError: (error: ApiErrorResponse) => {
        showError('Erreur', error.response?.data?.message || 'Impossible de mettre à jour');
      },
    }
  );
}

/**
 * Delete a preset
 */
export function useDeletePreset() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useApiMutation<ApiResponse<void>, string>(
    async (id: string) => (await api.delete<ApiResponse<void>>(API.preset(id))).data,
    {
      onSuccess: () => {
        success('Preset supprimé', 'Le preset a été supprimé.');
        queryClient.invalidateQueries({ queryKey: presetKeys.lists() });
      },
      onError: (error: ApiErrorResponse) => {
        showError('Erreur', error.response?.data?.message || 'Impossible de supprimer');
      },
    }
  );
}

/**
 * Set a preset as default
 */
export function useSetDefaultPreset() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useApiMutation<ApiResponse<Preset>, string>(
    async (id: string) => (await api.post<ApiResponse<Preset>>(API.presetSetDefault(id))).data,
    {
      onSuccess: (data: ApiResponse<Preset>) => {
        success('Preset par défaut', `"${data.data.name}" est maintenant le preset par défaut.`);
        queryClient.invalidateQueries({ queryKey: presetKeys.lists() });
        queryClient.invalidateQueries({ queryKey: presetKeys.default() });
      },
      onError: (error: ApiErrorResponse) => {
        showError('Erreur', error.response?.data?.message || 'Impossible de définir comme défaut');
      },
    }
  );
}

/**
 * Apply a preset to get its configuration
 * Returns the config to be used in a form or program creation
 */
export function useApplyPreset() {
  const { error: showError } = useToast();

  return useApiMutation<ApiResponse<PresetConfig>, string>(
    async (id: string) => (await api.post<ApiResponse<PresetConfig>>(API.presetApply(id))).data,
    {
      onError: (error: ApiErrorResponse) => {
        showError('Erreur', error.response?.data?.message || 'Impossible d\'appliquer le preset');
      },
    }
  );
}

/**
 * Create a preset from an existing program
 */
export function useCreatePresetFromProgram() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useApiMutation<
    ApiResponse<Preset>,
    { programId: string; name: string; description?: string }
  >(
    async (variables) => (
      await api.post<ApiResponse<Preset>>(API.presetFromProgram, variables)
    ).data,
    {
      onSuccess: (data: ApiResponse<Preset>) => {
        success('Preset créé', `Preset "${data.data.name}" créé à partir du programme.`);
        queryClient.invalidateQueries({ queryKey: presetKeys.lists() });
      },
      onError: (error: ApiErrorResponse) => {
        showError('Erreur', error.response?.data?.message || 'Impossible de créer le preset');
      },
    }
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY HOOKS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get cached presets list
 */
export function useCachedPresets(): Preset[] {
  const queryClient = useQueryClient();
  const data = queryClient.getQueryData<ApiResponse<Preset[]>>(presetKeys.lists());
  return data?.data || [];
}

/**
 * Check if a preset name already exists
 */
export function usePresetNameExists(name: string, excludeId?: string): boolean {
  const presets = useCachedPresets();
  return presets.some(
    (p) => p.name.toLowerCase() === name.toLowerCase() && p.id !== excludeId
  );
}

/**
 * Get preset options for select dropdowns
 */
export function usePresetOptions() {
  const { data, isLoading } = usePresets();

  const options = (data?.data || []).map((preset) => ({
    value: preset.id,
    label: preset.name,
    description: preset.description,
    isDefault: preset.isDefault,
    isSystem: preset.isSystem,
  }));

  return { options, isLoading };
}

/**
 * Invalidate preset cache
 */
export function useInvalidatePresets() {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: presetKeys.all });
  }, [queryClient]);
}

// ═══════════════════════════════════════════════════════════════════════════
// PRESET HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Merge preset config with existing values
 */
export function mergePresetConfig(
  current: Partial<PresetConfig>,
  preset: PresetConfig
): PresetConfig {
  return {
    platformId: preset.platformId ?? current.platformId,
    contentTypes: preset.contentTypes ?? current.contentTypes ?? [],
    countries: preset.countries ?? current.countries ?? [],
    languages: preset.languages ?? current.languages ?? [],
    themes: preset.themes ?? current.themes ?? [],
    quantityMode: preset.quantityMode ?? current.quantityMode,
    quantityValue: preset.quantityValue ?? current.quantityValue,
    recurrenceType: preset.recurrenceType ?? current.recurrenceType,
    recurrenceConfig: preset.recurrenceConfig ?? current.recurrenceConfig,
    generationOptions: {
      ...current.generationOptions,
      ...preset.generationOptions,
    },
    maxConcurrent: preset.maxConcurrent ?? current.maxConcurrent,
    budgetLimit: preset.budgetLimit ?? current.budgetLimit,
  };
}

/**
 * Extract preset config from a full program
 */
export function extractPresetConfig(program: {
  platformId?: string;
  contentTypes?: string[];
  countries?: string[];
  languages?: string[];
  themes?: string[];
  quantityMode?: string;
  quantityValue?: number;
  recurrenceType?: string;
  recurrenceConfig?: unknown;
  generationOptions?: unknown;
  maxConcurrent?: number;
  budgetLimit?: number;
}): PresetConfig {
  return {
    platformId: program.platformId as PresetConfig['platformId'],
    contentTypes: program.contentTypes as PresetConfig['contentTypes'],
    countries: program.countries,
    languages: program.languages as PresetConfig['languages'],
    themes: program.themes,
    quantityMode: program.quantityMode as PresetConfig['quantityMode'],
    quantityValue: program.quantityValue,
    recurrenceType: program.recurrenceType as PresetConfig['recurrenceType'],
    recurrenceConfig: program.recurrenceConfig as PresetConfig['recurrenceConfig'],
    generationOptions: program.generationOptions as PresetConfig['generationOptions'],
    maxConcurrent: program.maxConcurrent,
    budgetLimit: program.budgetLimit,
  };
}