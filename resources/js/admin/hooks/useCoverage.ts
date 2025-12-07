/**
 * Coverage Hooks
 * Content coverage analysis and gap management
 */

import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useApiQuery, useApiMutation } from './useApi';
import { useToast } from '@/hooks/useToast';
import api from '@/utils/api';
import type {
  CoverageGlobalResponse,
  CoverageGapsResponse,
  CoverageObjectivesResponse,
  CoverageMatrixData,
  CoverageMatrixConfig,
  CountryCoverage,
  LanguageCoverage,
  ThemeCoverage,
  CoverageObjective,
  CreateObjectiveInput,
  UpdateObjectiveInput,
  CoverageFilters,
  GapFilters,
} from '@/types/coverage';
import type { ApiResponse } from '@/types/common';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const coverageKeys = {
  all: ['coverage'] as const,
  global: () => [...coverageKeys.all, 'global'] as const,
  byCountry: (countryId: string) => [...coverageKeys.all, 'country', countryId] as const,
  byLanguage: (languageId: string) => [...coverageKeys.all, 'language', languageId] as const,
  byTheme: (themeId: string) => [...coverageKeys.all, 'theme', themeId] as const,
  matrix: (config: CoverageMatrixConfig) => [...coverageKeys.all, 'matrix', config] as const,
  gaps: () => [...coverageKeys.all, 'gaps'] as const,
  gapsFiltered: (filters: GapFilters) => [...coverageKeys.gaps(), filters] as const,
  objectives: () => [...coverageKeys.all, 'objectives'] as const,
  objective: (id: string) => [...coverageKeys.objectives(), id] as const,
};

// ============================================================================
// COVERAGE QUERIES
// ============================================================================

/**
 * Get global coverage summary
 */
export function useCoverageGlobal(filters: CoverageFilters = {}) {
  // Stabilize filters to prevent re-renders
  const stableFilters = useMemo(
    () => ({ ...filters }),
    [filters.platform, filters.language, filters.theme]
  );

  return useApiQuery<ApiResponse<CoverageGlobalResponse>>(
    coverageKeys.global(),
    '/admin/coverage',
    { params: stableFilters },
    {
      staleTime: 60000,
      gcTime: 10 * 60 * 1000, // 10 minutes
      enabled: true,
    }
  );
}

/**
 * Get coverage for a specific country
 */
export function useCoverageByCountry(countryId: string) {
  return useApiQuery<ApiResponse<CountryCoverage>>(
    coverageKeys.byCountry(countryId),
    `/admin/coverage/countries/${countryId}`,
    undefined,
    {
      enabled: !!countryId,
      staleTime: 60000,
      gcTime: 10 * 60 * 1000,
    }
  );
}

/**
 * Get coverage for a specific language
 */
export function useCoverageByLanguage(languageId: string) {
  return useApiQuery<ApiResponse<LanguageCoverage>>(
    coverageKeys.byLanguage(languageId),
    `/admin/coverage/languages/${languageId}`,
    undefined,
    {
      enabled: !!languageId,
      staleTime: 60000,
      gcTime: 10 * 60 * 1000,
    }
  );
}

/**
 * Get coverage for a specific theme
 */
export function useCoverageByTheme(themeId: string) {
  return useApiQuery<ApiResponse<ThemeCoverage>>(
    coverageKeys.byTheme(themeId),
    `/admin/coverage/themes/${themeId}`,
    undefined,
    {
      enabled: !!themeId,
      staleTime: 60000,
      gcTime: 10 * 60 * 1000,
    }
  );
}

/**
 * Get coverage matrix data
 */
export function useCoverageMatrix(config: CoverageMatrixConfig) {
  // Stabilize config object
  const stableConfig = useMemo(
    () => ({ ...config }),
    [config.colAxis, config.rowAxis, config.valueType]
  );

  return useApiQuery<ApiResponse<CoverageMatrixData>>(
    coverageKeys.matrix(stableConfig),
    '/admin/coverage/matrix',
    { params: stableConfig },
    {
      staleTime: 60000,
      gcTime: 10 * 60 * 1000,
    }
  );
}

/**
 * Get all countries coverage
 */
export function useCoverageCountries(filters: CoverageFilters = {}) {
  const stableFilters = useMemo(
    () => ({ ...filters }),
    [filters.platform, filters.language, filters.theme]
  );

  return useApiQuery<ApiResponse<CountryCoverage[]>>(
    [...coverageKeys.all, 'countries', stableFilters],
    '/admin/coverage/countries',
    { params: stableFilters },
    {
      staleTime: 60000,
      gcTime: 10 * 60 * 1000,
    }
  );
}

/**
 * Get all languages coverage
 */
export function useCoverageLanguages(filters: CoverageFilters = {}) {
  const stableFilters = useMemo(
    () => ({ ...filters }),
    [filters.platform, filters.language, filters.theme]
  );

  return useApiQuery<ApiResponse<LanguageCoverage[]>>(
    [...coverageKeys.all, 'languages', stableFilters],
    '/admin/coverage/languages',
    { params: stableFilters },
    {
      staleTime: 60000,
      gcTime: 10 * 60 * 1000,
    }
  );
}

/**
 * Get all themes coverage
 */
export function useCoverageThemes(filters: CoverageFilters = {}) {
  const stableFilters = useMemo(
    () => ({ ...filters }),
    [filters.platform, filters.language, filters.theme]
  );

  return useApiQuery<ApiResponse<ThemeCoverage[]>>(
    [...coverageKeys.all, 'themes', stableFilters],
    '/admin/coverage/themes',
    { params: stableFilters },
    {
      staleTime: 60000,
      gcTime: 10 * 60 * 1000,
    }
  );
}

// ============================================================================
// GAP QUERIES & MUTATIONS
// ============================================================================

/**
 * Get coverage gaps
 */
export function useCoverageGaps(filters: GapFilters = {}) {
  const stableFilters = useMemo(
    () => ({ ...filters }),
    [filters.sortBy, filters.sortOrder, filters.perPage, filters.priority]
  );

  return useApiQuery<CoverageGapsResponse>(
    coverageKeys.gapsFiltered(stableFilters),
    '/admin/coverage/gaps',
    { params: stableFilters },
    {
      staleTime: 60000,
      gcTime: 10 * 60 * 1000,
    }
  );
}

/**
 * Generate content for gaps
 */
export function useGenerateMissing() {
  const toast = useToast();
  const queryClient = useQueryClient();

  return useApiMutation<
    ApiResponse<{ jobsCreated: number; estimatedCost: number }>,
    { gapIds: string[]; options?: { templateId?: string; scheduledAt?: string } }
  >(
    async ({ gapIds, options }) => {
      const { data } = await api.post<ApiResponse<{ jobsCreated: number; estimatedCost: number }>>(
        '/admin/coverage/gaps/generate',
        { gapIds, options }
      );
      return data;
    },
    {
      onSuccess: (data) => {
        toast.success(`${data.data.jobsCreated} jobs créés`);
        queryClient.invalidateQueries({ queryKey: coverageKeys.gaps() });
        queryClient.invalidateQueries({ queryKey: coverageKeys.global() });
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
    }
  );
}

/**
 * Dismiss a gap (mark as not needed)
 */
export function useDismissGap() {
  const queryClient = useQueryClient();

  return useApiMutation<ApiResponse<void>, { gapId: string; reason: string }>(
    async ({ gapId, reason }) => {
      const { data } = await api.post<ApiResponse<void>>(
        `/admin/coverage/gaps/${gapId}/dismiss`,
        { reason }
      );
      return data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: coverageKeys.gaps() });
      },
    }
  );
}

// ============================================================================
// OBJECTIVES QUERIES & MUTATIONS
// ============================================================================

/**
 * Get all objectives
 */
export function useCoverageObjectives() {
  return useApiQuery<CoverageObjectivesResponse>(
    coverageKeys.objectives(),
    '/admin/coverage/objectives',
    undefined,
    { staleTime: 60000 }
  );
}

/**
 * Get single objective
 */
export function useCoverageObjective(id: string) {
  return useApiQuery<ApiResponse<CoverageObjective>>(
    coverageKeys.objective(id),
    `/admin/coverage/objectives/${id}`,
    undefined,
    { enabled: !!id, staleTime: 60000 }
  );
}

/**
 * Create objective
 */
export function useCreateObjective() {
  const toast = useToast();
  const queryClient = useQueryClient();

  return useApiMutation<ApiResponse<CoverageObjective>, CreateObjectiveInput>(
    async (input) => {
      const { data } = await api.post<ApiResponse<CoverageObjective>>(
        '/admin/coverage/objectives',
        input
      );
      return data;
    },
    {
      onSuccess: () => {
        toast.success('Objectif créé');
        queryClient.invalidateQueries({ queryKey: coverageKeys.objectives() });
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
    }
  );
}

/**
 * Update objective
 */
export function useUpdateObjective() {
  const toast = useToast();
  const queryClient = useQueryClient();

  return useApiMutation<
    ApiResponse<CoverageObjective>,
    { id: string; data: UpdateObjectiveInput }
  >(
    async ({ id, data: updateData }) => {
      const { data } = await api.put<ApiResponse<CoverageObjective>>(
        `/admin/coverage/objectives/${id}`,
        updateData
      );
      return data;
    },
    {
      onSuccess: (_, { id }) => {
        toast.success('Objectif mis à jour');
        queryClient.invalidateQueries({ queryKey: coverageKeys.objectives() });
        queryClient.invalidateQueries({ queryKey: coverageKeys.objective(id) });
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
    }
  );
}

/**
 * Delete objective
 */
export function useDeleteObjective() {
  const toast = useToast();
  const queryClient = useQueryClient();

  return useApiMutation<ApiResponse<void>, string>(
    async (id) => {
      const { data } = await api.delete<ApiResponse<void>>(
        `/admin/coverage/objectives/${id}`
      );
      return data;
    },
    {
      onSuccess: () => {
        toast.success('Objectif supprimé');
        queryClient.invalidateQueries({ queryKey: coverageKeys.objectives() });
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
    }
  );
}

/**
 * Record progress for objective
 */
export function useRecordProgress() {
  const queryClient = useQueryClient();

  return useApiMutation<
    ApiResponse<CoverageObjective>,
    { id: string; value: number; note?: string }
  >(
    async ({ id, value, note }) => {
      const { data } = await api.post<ApiResponse<CoverageObjective>>(
        `/admin/coverage/objectives/${id}/progress`,
        { value, note }
      );
      return data;
    },
    {
      onSuccess: (_, { id }) => {
        queryClient.invalidateQueries({ queryKey: coverageKeys.objectives() });
        queryClient.invalidateQueries({ queryKey: coverageKeys.objective(id) });
      },
    }
  );
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Get top gaps by priority
 */
export function useTopGaps(limit = 5) {
  return useCoverageGaps({
    sortBy: 'priority',
    sortOrder: 'desc',
    perPage: limit,
  });
}

/**
 * Get objectives near deadline
 */
export function useUrgentObjectives() {
  return useApiQuery<ApiResponse<CoverageObjective[]>>(
    [...coverageKeys.objectives(), 'urgent'],
    '/admin/coverage/objectives/urgent',
    undefined,
    { staleTime: 60000 }
  );
}

/**
 * Export coverage report
 */
export function useExportCoverageReport() {
  const toast = useToast();

  return useApiMutation<Blob, { format: 'csv' | 'xlsx' | 'pdf'; filters?: CoverageFilters }>(
    async ({ format, filters }) => {
      const { data } = await api.post<Blob>(
        '/admin/coverage/export',
        { format, filters },
        { responseType: 'blob' }
      );
      return data;
    },
    {
      onSuccess: (blob, { format }) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `coverage-report-${new Date().toISOString().split('T')[0]}.${format}`;
        a.click();
        toast.success('Rapport exporté');
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
    }
  );
}
