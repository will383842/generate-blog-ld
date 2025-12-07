/**
 * Pillars Hooks
 * Comprehensive pillar content management with scheduling and sources
 */

import { useQueryClient } from '@tanstack/react-query';
import { useApiQuery, useApiMutation } from './useApi';
import { useToast } from '@/hooks/useToast';
import api from '@/utils/api';
import type {
  Pillar,
  PillarWithRelations,
  PillarFilters,
  PillarSchedule,
  PillarSource,
  CreateScheduleInput,
  PillarListResponse,
  PillarScheduleListResponse,
} from '@/types/pillar';
import type { ApiResponse } from '@/types/common';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const pillarKeys = {
  all: ['pillars'] as const,
  list: () => [...pillarKeys.all, 'list'] as const,
  listFiltered: (filters: PillarFilters) => [...pillarKeys.list(), filters] as const,
  detail: (id: string) => [...pillarKeys.all, 'detail', id] as const,
  schedules: () => [...pillarKeys.all, 'schedules'] as const,
  schedulesFiltered: (filters: PillarFilters) => [...pillarKeys.schedules(), filters] as const,
  sources: (pillarId: string) => [...pillarKeys.all, 'sources', pillarId] as const,
  stats: () => [...pillarKeys.all, 'stats'] as const,
};

// ============================================================================
// PILLAR QUERIES
// ============================================================================

/**
 * Get paginated list of pillars
 */
export function usePillars(filters: PillarFilters = {}) {
  return useApiQuery<PillarListResponse>(
    pillarKeys.listFiltered(filters),
    '/admin/pillars',
    {
      params: filters,
    },
    { staleTime: 30000 }
  );
}

/**
 * Get single pillar with all relations
 */
export function usePillar(id: string) {
  return useApiQuery<ApiResponse<PillarWithRelations>>(
    pillarKeys.detail(id),
    `/admin/pillars/${id}`,
    undefined,
    {
      enabled: !!id,
      staleTime: 30000,
    }
  );
}

/**
 * Get pillar stats
 */
export function usePillarStats() {
  return useApiQuery<ApiResponse<{
    totalCount: number;
    publishedCount: number;
    draftCount: number;
    avgWordCount: number;
    avgSourcesCount: number;
    byType: Record<string, number>;
  }>>(
    pillarKeys.stats(),
    '/admin/pillars/stats',
    undefined,
    { staleTime: 60000 }
  );
}

// ============================================================================
// PILLAR MUTATIONS
// ============================================================================

/**
 * Update pillar content
 */
export function useUpdatePillar() {
  const toast = useToast();
  const queryClient = useQueryClient();

  return useApiMutation<
    ApiResponse<Pillar>,
    { id: string; data: Partial<Pillar> },
    { previous?: ApiResponse<PillarWithRelations> }
  >(
    async ({ id, data }) => {
      const { data: responseData } = await api.put<ApiResponse<Pillar>>(`/admin/pillars/${id}`, data);
      return responseData;
    },
    {
      onMutate: async ({ id, data }) => {
        await queryClient.cancelQueries({ queryKey: pillarKeys.detail(id) });
        const previous = queryClient.getQueryData<ApiResponse<PillarWithRelations>>(
          pillarKeys.detail(id)
        );

        queryClient.setQueryData(pillarKeys.detail(id), (old: ApiResponse<PillarWithRelations> | undefined) => ({
          ...old,
          data: { ...old?.data, ...data },
        }));

        return { previous };
      },
      onError: (error, variables, context) => {
        if (context?.previous) {
          queryClient.setQueryData(pillarKeys.detail(variables.id), context.previous);
        }
        toast.error(`Erreur: ${error.message}`);
      },
      onSuccess: () => {
        toast.success('Pilier mis à jour');
      },
      onSettled: (_, __, { id }) => {
        queryClient.invalidateQueries({ queryKey: pillarKeys.detail(id) });
        queryClient.invalidateQueries({ queryKey: pillarKeys.list() });
      },
    }
  );
}

/**
 * Add statistic to pillar
 */
export function useAddPillarStatistic() {
  const toast = useToast();
  const queryClient = useQueryClient();

  return useApiMutation<
    ApiResponse<Pillar>,
    { pillarId: string; statistic: Omit<Pillar['statistics'][0], 'id'> }
  >(
    async ({ pillarId, statistic }) => {
      const { data } = await api.post<ApiResponse<Pillar>>(`/admin/pillars/${pillarId}/statistics`, statistic);
      return data;
    },
    {
      onSuccess: (_, { pillarId }) => {
        toast.success('Statistique ajoutée');
        queryClient.invalidateQueries({ queryKey: pillarKeys.detail(pillarId) });
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
    }
  );
}

/**
 * Add citation to pillar
 */
export function useAddPillarCitation() {
  const toast = useToast();
  const queryClient = useQueryClient();

  return useApiMutation<
    ApiResponse<Pillar>,
    { pillarId: string; citation: Omit<Pillar['citations'][0], 'id'> }
  >(
    async ({ pillarId, citation }) => {
      const { data } = await api.post<ApiResponse<Pillar>>(`/admin/pillars/${pillarId}/citations`, citation);
      return data;
    },
    {
      onSuccess: (_, { pillarId }) => {
        toast.success('Citation ajoutée');
        queryClient.invalidateQueries({ queryKey: pillarKeys.detail(pillarId) });
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
    }
  );
}

// ============================================================================
// SCHEDULE QUERIES & MUTATIONS
// ============================================================================

/**
 * Get all pillar schedules
 */
export function usePillarSchedules(filters: { platformId?: string; isActive?: boolean } = {}) {
  return useApiQuery<PillarScheduleListResponse>(
    pillarKeys.schedulesFiltered(filters),
    '/admin/pillars/schedules',
    {
      params: filters,
    },
    { staleTime: 30000 }
  );
}

/**
 * Create a new schedule
 */
export function useCreateSchedule() {
  const toast = useToast();
  const queryClient = useQueryClient();

  return useApiMutation<ApiResponse<PillarSchedule>, CreateScheduleInput>(
    async (input) => {
      const { data } = await api.post<ApiResponse<PillarSchedule>>('/admin/pillars/schedules', input);
      return data;
    },
    {
      onSuccess: () => {
        toast.success('Planning créé');
        queryClient.invalidateQueries({ queryKey: pillarKeys.schedules() });
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
    }
  );
}

/**
 * Update schedule
 */
export function useUpdateSchedule() {
  const toast = useToast();
  const queryClient = useQueryClient();

  return useApiMutation<
    ApiResponse<PillarSchedule>,
    { id: string; data: Partial<PillarSchedule> }
  >(
    async ({ id, data }) => {
      const { data: responseData } = await api.put<ApiResponse<PillarSchedule>>(`/admin/pillars/schedules/${id}`, data);
      return responseData;
    },
    {
      onSuccess: () => {
        toast.success('Planning mis à jour');
        queryClient.invalidateQueries({ queryKey: pillarKeys.schedules() });
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
    }
  );
}

/**
 * Toggle schedule active state
 */
export function useToggleSchedule() {
  const queryClient = useQueryClient();

  return useApiMutation<ApiResponse<PillarSchedule>, { id: string; isActive: boolean }>(
    async ({ id, isActive }) => {
      const { data } = await api.post<ApiResponse<PillarSchedule>>(`/admin/pillars/schedules/${id}/toggle`, { isActive });
      return data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: pillarKeys.schedules() });
      },
    }
  );
}

/**
 * Delete schedule
 */
export function useDeleteSchedule() {
  const toast = useToast();
  const queryClient = useQueryClient();

  return useApiMutation<ApiResponse<void>, string>(
    async (id) => {
      const { data } = await api.delete<ApiResponse<void>>(`/admin/pillars/schedules/${id}`);
      return data;
    },
    {
      onSuccess: () => {
        toast.success('Planning supprimé');
        queryClient.invalidateQueries({ queryKey: pillarKeys.schedules() });
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
    }
  );
}

// ============================================================================
// SOURCES QUERIES & MUTATIONS
// ============================================================================

/**
 * Get sources for a pillar
 */
export function usePillarSources(pillarId: string) {
  return useApiQuery<ApiResponse<PillarSource[]>>(
    pillarKeys.sources(pillarId),
    `/admin/pillars/${pillarId}/sources`,
    undefined,
    {
      enabled: !!pillarId,
      staleTime: 60000,
    }
  );
}

/**
 * Refresh sources (query Perplexity)
 */
export function useRefreshSources() {
  const toast = useToast();
  const queryClient = useQueryClient();

  return useApiMutation<
    ApiResponse<PillarSource[]>,
    { pillarId: string; queries?: string[] }
  >(
    async ({ pillarId, queries }) => {
      const { data } = await api.post<ApiResponse<PillarSource[]>>(`/admin/pillars/${pillarId}/sources/refresh`, { queries });
      return data;
    },
    {
      onSuccess: (_, { pillarId }) => {
        toast.success('Sources actualisées');
        queryClient.invalidateQueries({ queryKey: pillarKeys.sources(pillarId) });
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
    }
  );
}

/**
 * Mark source as used
 */
export function useMarkSourceUsed() {
  const queryClient = useQueryClient();

  return useApiMutation<
    ApiResponse<void>,
    { pillarId: string; sourceId: string; resultId: string; section?: string }
  >(
    async ({ pillarId, sourceId, resultId, section }) => {
      const { data } = await api.post<ApiResponse<void>>(
        `/admin/pillars/${pillarId}/sources/${sourceId}/results/${resultId}/use`,
        { section }
      );
      return data;
    },
    {
      onSuccess: (_, { pillarId }) => {
        queryClient.invalidateQueries({ queryKey: pillarKeys.sources(pillarId) });
      },
    }
  );
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Get recently updated pillars
 */
export function useRecentPillars(limit = 5) {
  return usePillars({
    perPage: limit,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  });
}

/**
 * Get pillars by type
 */
export function usePillarsByType(pillarType: Pillar['pillarType']) {
  return usePillars({ pillarType });
}

/**
 * Get next scheduled runs
 */
export function useNextScheduledRuns(limit = 5) {
  return useApiQuery<ApiResponse<PillarSchedule[]>>(
    [...pillarKeys.schedules(), 'next', limit],
    '/admin/pillars/schedules/next',
    {
      params: { limit },
    },
    { staleTime: 30000 }
  );
}
