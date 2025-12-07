/**
 * Manual Titles Hooks
 * Manage manually created titles for generation
 */

import { useApiQuery, useApiMutation } from './useApi';
import { useToast } from '@/hooks/useToast';
import api from '@/utils/api';
import type {
  ManualTitle,
  ManualTitleFilters,
  CreateManualTitleInput,
  GenerationJob,
} from '@/types/generation';
import type { ApiResponse, PaginatedResponse } from '@/types/common';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const manualTitleKeys = {
  all: ['manual-titles'] as const,
  list: () => [...manualTitleKeys.all, 'list'] as const,
  listFiltered: (filters: ManualTitleFilters) => [...manualTitleKeys.list(), filters] as const,
  detail: (id: string) => [...manualTitleKeys.all, 'detail', id] as const,
};

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get list of manual titles
 */
export function useManualTitles(filters: ManualTitleFilters = {}) {
  return useApiQuery<PaginatedResponse<ManualTitle>>(
    manualTitleKeys.listFiltered(filters),
    '/admin/manual-titles',
    { params: filters },
    { staleTime: 30000 }
  );
}

/**
 * Get single manual title
 */
export function useManualTitle(id: string) {
  return useApiQuery<ApiResponse<ManualTitle>>(
    manualTitleKeys.detail(id),
    `/admin/manual-titles/${id}`,
    undefined,
    {
      enabled: !!id,
      staleTime: 30000,
    }
  );
}

/**
 * Get recent manual titles
 */
export function useRecentManualTitles(limit = 10) {
  return useManualTitles({
    perPage: limit,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  } as ManualTitleFilters & { sortBy: string; sortOrder: string });
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a manual title
 */
export function useCreateManualTitle() {
  const toast = useToast();

  return useApiMutation<ApiResponse<ManualTitle>, CreateManualTitleInput>(
    async (input) => {
      const { data } = await api.post<ApiResponse<ManualTitle>>('/admin/manual-titles', input);
      return data;
    },
    {
      onSuccess: (data) => {
        if (data.data?.status === 'queued') {
          toast.success('Titre ajouté à la queue de génération');
        } else {
          toast.success('Titre créé');
        }
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
      invalidateKeys: [manualTitleKeys.all],
    }
  );
}

/**
 * Update a manual title
 */
export function useUpdateManualTitle() {
  const toast = useToast();

  return useApiMutation<
    ApiResponse<ManualTitle>,
    { id: string; data: Partial<CreateManualTitleInput> }
  >(
    async ({ id, data }) => {
      const { data: responseData } = await api.put<ApiResponse<ManualTitle>>(`/admin/manual-titles/${id}`, data);
      return responseData;
    },
    {
      onSuccess: () => {
        toast.success('Titre mis à jour');
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
      invalidateKeys: [manualTitleKeys.all],
    }
  );
}

/**
 * Delete a manual title
 */
export function useDeleteManualTitle() {
  const toast = useToast();

  return useApiMutation<ApiResponse<void>, string>(
    async (id) => {
      const { data } = await api.delete<ApiResponse<void>>(`/admin/manual-titles/${id}`);
      return data;
    },
    {
      onSuccess: () => {
        toast.success('Titre supprimé');
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
      invalidateKeys: [manualTitleKeys.all],
    }
  );
}

/**
 * Generate from a manual title
 */
export function useGenerateFromTitle() {
  const toast = useToast();

  return useApiMutation<
    ApiResponse<GenerationJob>,
    { id: string; immediate?: boolean }
  >(
    async ({ id, immediate = true }) => {
      const { data } = await api.post<ApiResponse<GenerationJob>>(`/admin/manual-titles/${id}/generate`, { immediate });
      return data;
    },
    {
      onSuccess: () => {
        toast.success('Génération lancée');
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
      invalidateKeys: [manualTitleKeys.all],
    }
  );
}

/**
 * Bulk delete manual titles
 */
export function useBulkDeleteManualTitles() {
  const toast = useToast();

  return useApiMutation<ApiResponse<{ count: number }>, string[]>(
    async (ids) => {
      const { data } = await api.delete<ApiResponse<{ count: number }>>('/admin/manual-titles/bulk-delete', { data: { ids } });
      return data;
    },
    {
      onSuccess: (data) => {
        toast.success(`${data.data?.count || 0} titres supprimés`);
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
      invalidateKeys: [manualTitleKeys.all],
    }
  );
}

/**
 * Bulk generate from manual titles
 */
export function useBulkGenerateFromTitles() {
  const toast = useToast();

  return useApiMutation<ApiResponse<{ count: number; jobIds: string[] }>, string[]>(
    async (ids) => {
      const { data } = await api.post<ApiResponse<{ count: number; jobIds: string[] }>>('/admin/manual-titles/bulk-generate', { ids });
      return data;
    },
    {
      onSuccess: (data) => {
        toast.success(`${data.data?.count || 0} générations lancées`);
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
      invalidateKeys: [manualTitleKeys.all],
    }
  );
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Get count by status
 */
export function useManualTitlesCountByStatus() {
  const { data: draft } = useManualTitles({ status: ['draft'], perPage: 0 });
  const { data: queued } = useManualTitles({ status: ['queued'], perPage: 0 });
  const { data: completed } = useManualTitles({ status: ['completed'], perPage: 0 });
  const { data: failed } = useManualTitles({ status: ['failed'], perPage: 0 });

  return {
    draft: draft?.meta?.total || 0,
    queued: queued?.meta?.total || 0,
    completed: completed?.meta?.total || 0,
    failed: failed?.meta?.total || 0,
  };
}
