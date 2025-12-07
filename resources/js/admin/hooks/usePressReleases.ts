/**
 * Press Releases Hooks
 * Comprehensive press release management with media and export
 */

import { useApiQuery, useApiMutation } from './useApi';
import { useToast } from '@/hooks/useToast';
import { useQueryClient } from '@tanstack/react-query';
import api from '@/utils/api';
import type {
  PressRelease,
  PressReleaseWithRelations,
  PressReleaseFilters,
  PressReleaseMedia,
  PressTemplate,
  PressStats,
  CreatePressReleaseInput,
  UpdatePressReleaseInput,
  AddPressMediaInput,
  GenerateChartInput,
  ChartData,
  ExportOptions,
  ExportResult,
  PressReleaseListResponse,
} from '@/types/press';
import type { ApiResponse } from '@/types/common';
import type { LanguageCode } from '@/types/program';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const pressReleaseKeys = {
  all: ['press-releases'] as const,
  list: () => [...pressReleaseKeys.all, 'list'] as const,
  listFiltered: (filters: PressReleaseFilters) => [...pressReleaseKeys.list(), filters] as const,
  detail: (id: string) => [...pressReleaseKeys.all, 'detail', id] as const,
  media: (id: string) => [...pressReleaseKeys.all, 'media', id] as const,
  templates: () => [...pressReleaseKeys.all, 'templates'] as const,
  stats: () => [...pressReleaseKeys.all, 'stats'] as const,
};

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get paginated list of press releases
 */
export function usePressReleases(filters: PressReleaseFilters = {}) {
  return useApiQuery<PressReleaseListResponse>(
    pressReleaseKeys.listFiltered(filters),
    '/admin/press-releases',
    { params: filters },
    { staleTime: 30000 }
  );
}

/**
 * Get single press release with all relations
 */
export function usePressRelease(id: string) {
  return useApiQuery<ApiResponse<PressReleaseWithRelations>>(
    pressReleaseKeys.detail(id),
    `/admin/press-releases/${id}`,
    undefined,
    {
      enabled: !!id && id !== 'new',
      staleTime: 30000,
    }
  );
}

/**
 * Get press release media
 */
export function usePressReleaseMedia(id: string) {
  return useApiQuery<ApiResponse<PressReleaseMedia[]>>(
    pressReleaseKeys.media(id),
    `/admin/press-releases/${id}/media`,
    undefined,
    {
      enabled: !!id && id !== 'new',
      staleTime: 30000,
    }
  );
}

/**
 * Get press release templates
 */
export function usePressTemplates() {
  return useApiQuery<ApiResponse<PressTemplate[]>>(
    pressReleaseKeys.templates(),
    '/admin/press-releases/templates',
    undefined,
    { staleTime: 300000 } // 5 minutes
  );
}

/**
 * Get press stats
 */
export function usePressStats() {
  return useApiQuery<ApiResponse<PressStats>>(
    pressReleaseKeys.stats(),
    '/admin/press-releases/stats',
    undefined,
    { staleTime: 60000 }
  );
}

// ============================================================================
// MUTATIONS - CRUD
// ============================================================================

/**
 * Create a new press release
 */
export function useCreatePressRelease() {
  const toast = useToast();
  const queryClient = useQueryClient();

  return useApiMutation<ApiResponse<PressRelease>, CreatePressReleaseInput>(
    async (input) => {
      const { data } = await api.post<ApiResponse<PressRelease>>('/admin/press-releases', input);
      return data;
    },
    {
      onSuccess: () => {
        toast.success('Communiqué créé');
        queryClient.invalidateQueries({ queryKey: pressReleaseKeys.all });
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
    }
  );
}

/**
 * Update a press release
 */
export function useUpdatePressRelease() {
  const toast = useToast();
  const queryClient = useQueryClient();

  return useApiMutation<
    ApiResponse<PressRelease>,
    { id: string; data: UpdatePressReleaseInput }
  >(
    async ({ id, data }) => {
      const { data: responseData } = await api.put<ApiResponse<PressRelease>>(`/admin/press-releases/${id}`, data);
      return responseData;
    },
    {
      onMutate: async ({ id, data }) => {
        await queryClient.cancelQueries({ queryKey: pressReleaseKeys.detail(id) });
        const previous = queryClient.getQueryData<ApiResponse<PressReleaseWithRelations>>(
          pressReleaseKeys.detail(id)
        );

        queryClient.setQueryData(
          pressReleaseKeys.detail(id),
          (old: ApiResponse<PressReleaseWithRelations> | undefined) => ({
            ...old,
            data: { ...old?.data, ...data },
          })
        );

        return { previous };
      },
      onError: (error, variables, context) => {
        const ctx = context as { previous?: ApiResponse<PressReleaseWithRelations> } | undefined;
        if (ctx?.previous) {
          queryClient.setQueryData(pressReleaseKeys.detail(variables.id), ctx.previous);
        }
        toast.error(`Erreur: ${error.message}`);
      },
      onSuccess: () => {
        toast.success('Communiqué mis à jour');
      },
      onSettled: (_, __, { id }) => {
        queryClient.invalidateQueries({ queryKey: pressReleaseKeys.detail(id) });
        queryClient.invalidateQueries({ queryKey: pressReleaseKeys.list() });
      },
    }
  );
}

/**
 * Delete a press release
 */
export function useDeletePressRelease() {
  const toast = useToast();
  const queryClient = useQueryClient();

  return useApiMutation<ApiResponse<void>, string>(
    async (id) => {
      const { data } = await api.delete<ApiResponse<void>>(`/admin/press-releases/${id}`);
      return data;
    },
    {
      onSuccess: () => {
        toast.success('Communiqué supprimé');
        queryClient.invalidateQueries({ queryKey: pressReleaseKeys.all });
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
    }
  );
}

/**
 * Duplicate a press release
 */
export function useDuplicatePressRelease() {
  const toast = useToast();
  const queryClient = useQueryClient();

  return useApiMutation<ApiResponse<PressRelease>, string>(
    async (id) => {
      const { data } = await api.post<ApiResponse<PressRelease>>(`/admin/press-releases/${id}/duplicate`);
      return data;
    },
    {
      onSuccess: () => {
        toast.success('Communiqué dupliqué');
        queryClient.invalidateQueries({ queryKey: pressReleaseKeys.all });
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
    }
  );
}

// ============================================================================
// MUTATIONS - PUBLISHING
// ============================================================================

/**
 * Publish a press release
 */
export function usePublishPressRelease() {
  const toast = useToast();
  const queryClient = useQueryClient();

  return useApiMutation<ApiResponse<PressRelease>, { id: string; scheduledAt?: string }>(
    async ({ id, scheduledAt }) => {
      const { data } = await api.post<ApiResponse<PressRelease>>(`/admin/press-releases/${id}/publish`, { scheduledAt });
      return data;
    },
    {
      onSuccess: (_, { scheduledAt }) => {
        toast.success(scheduledAt ? 'Communiqué programmé' : 'Communiqué publié');
        queryClient.invalidateQueries({ queryKey: pressReleaseKeys.all });
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
    }
  );
}

/**
 * Unpublish a press release
 */
export function useUnpublishPressRelease() {
  const toast = useToast();
  const queryClient = useQueryClient();

  return useApiMutation<ApiResponse<PressRelease>, string>(
    async (id) => {
      const { data } = await api.post<ApiResponse<PressRelease>>(`/admin/press-releases/${id}/unpublish`);
      return data;
    },
    {
      onSuccess: () => {
        toast.success('Communiqué dépublié');
        queryClient.invalidateQueries({ queryKey: pressReleaseKeys.all });
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
    }
  );
}

// ============================================================================
// MUTATIONS - MEDIA
// ============================================================================

/**
 * Add media to press release
 */
export function useAddPressMedia() {
  const toast = useToast();
  const queryClient = useQueryClient();

  return useApiMutation<ApiResponse<PressReleaseMedia>, AddPressMediaInput>(
    async (input) => {
      const { data } = await api.post<ApiResponse<PressReleaseMedia>>(
        `/admin/press-releases/${input.pressReleaseId}/media`,
        input
      );
      return data;
    },
    {
      onSuccess: (_, { pressReleaseId }) => {
        toast.success('Média ajouté');
        queryClient.invalidateQueries({ queryKey: pressReleaseKeys.media(pressReleaseId) });
        queryClient.invalidateQueries({ queryKey: pressReleaseKeys.detail(pressReleaseId) });
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
    }
  );
}

/**
 * Remove media from press release
 */
export function useRemovePressMedia() {
  const toast = useToast();
  const queryClient = useQueryClient();

  return useApiMutation<
    ApiResponse<void>,
    { pressReleaseId: string; mediaId: string }
  >(
    async ({ pressReleaseId, mediaId }) => {
      const { data } = await api.delete<ApiResponse<void>>(
        `/admin/press-releases/${pressReleaseId}/media/${mediaId}`
      );
      return data;
    },
    {
      onSuccess: (_, { pressReleaseId }) => {
        toast.success('Média supprimé');
        queryClient.invalidateQueries({ queryKey: pressReleaseKeys.media(pressReleaseId) });
        queryClient.invalidateQueries({ queryKey: pressReleaseKeys.detail(pressReleaseId) });
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
    }
  );
}

/**
 * Reorder media
 */
export function useReorderPressMedia() {
  const toast = useToast();
  const queryClient = useQueryClient();

  return useApiMutation<
    ApiResponse<void>,
    { pressReleaseId: string; mediaIds: string[] }
  >(
    async ({ pressReleaseId, mediaIds }) => {
      const { data } = await api.post<ApiResponse<void>>(
        `/admin/press-releases/${pressReleaseId}/media/reorder`,
        { mediaIds }
      );
      return data;
    },
    {
      onSuccess: (_, { pressReleaseId }) => {
        queryClient.invalidateQueries({ queryKey: pressReleaseKeys.media(pressReleaseId) });
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
    }
  );
}

// ============================================================================
// MUTATIONS - CHARTS
// ============================================================================

/**
 * Generate a chart
 */
export function useGenerateChart() {
  return useApiMutation<ApiResponse<{ url: string; chartData: ChartData }>, GenerateChartInput>(
    async (input) => {
      const { data } = await api.post<ApiResponse<{ url: string; chartData: ChartData }>>('/admin/press-releases/generate-chart', input);
      return data;
    }
  );
}

// ============================================================================
// MUTATIONS - EXPORT
// ============================================================================

/**
 * Export as PDF
 */
export function useExportPdf() {
  const toast = useToast();

  return useApiMutation<ApiResponse<ExportResult>, { id: string; options: ExportOptions }>(
    async ({ id, options }) => {
      const { data } = await api.post<ApiResponse<ExportResult>>(`/admin/press-releases/${id}/export/pdf`, options);
      return data;
    },
    {
      onSuccess: (data) => {
        toast.success('PDF généré');
        // Auto download
        if (data.data?.url) {
          window.open(data.data.url, '_blank');
        }
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
    }
  );
}

/**
 * Export as Word
 */
export function useExportWord() {
  const toast = useToast();

  return useApiMutation<ApiResponse<ExportResult>, { id: string; options: ExportOptions }>(
    async ({ id, options }) => {
      const { data } = await api.post<ApiResponse<ExportResult>>(`/admin/press-releases/${id}/export/word`, options);
      return data;
    },
    {
      onSuccess: (data) => {
        toast.success('Document Word généré');
        if (data.data?.url) {
          window.open(data.data.url, '_blank');
        }
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
    }
  );
}

// ============================================================================
// MUTATIONS - TRANSLATION
// ============================================================================

/**
 * Translate press release
 */
export function useTranslatePressRelease() {
  const toast = useToast();
  const queryClient = useQueryClient();

  return useApiMutation<
    ApiResponse<PressRelease>,
    { id: string; targetLanguage: LanguageCode; useAI?: boolean }
  >(
    async ({ id, targetLanguage, useAI = true }) => {
      const { data } = await api.post<ApiResponse<PressRelease>>(`/admin/press-releases/${id}/translate`, { targetLanguage, useAI });
      return data;
    },
    {
      onSuccess: () => {
        toast.success('Traduction lancée');
        queryClient.invalidateQueries({ queryKey: pressReleaseKeys.all });
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
    }
  );
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * Bulk delete press releases
 */
export function useBulkDeletePressReleases() {
  const toast = useToast();
  const queryClient = useQueryClient();

  return useApiMutation<ApiResponse<{ count: number }>, string[]>(
    async (ids) => {
      const { data } = await api.delete<ApiResponse<{ count: number }>>('/admin/press-releases/bulk-delete', { data: { ids } });
      return data;
    },
    {
      onSuccess: (data) => {
        toast.success(`${data.data?.count || 0} communiqués supprimés`);
        queryClient.invalidateQueries({ queryKey: pressReleaseKeys.all });
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
    }
  );
}

/**
 * Bulk publish press releases
 */
export function useBulkPublishPressReleases() {
  const toast = useToast();
  const queryClient = useQueryClient();

  return useApiMutation<ApiResponse<{ count: number }>, string[]>(
    async (ids) => {
      const { data } = await api.post<ApiResponse<{ count: number }>>('/admin/press-releases/bulk-publish', { ids });
      return data;
    },
    {
      onSuccess: (data) => {
        toast.success(`${data.data?.count || 0} communiqués publiés`);
        queryClient.invalidateQueries({ queryKey: pressReleaseKeys.all });
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
    }
  );
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Get recent press releases
 */
export function useRecentPressReleases(limit = 10) {
  return usePressReleases({
    perPage: limit,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
}

/**
 * Get published press releases
 */
export function usePublishedPressReleases() {
  return usePressReleases({
    status: ['published'],
    sortBy: 'publishedAt',
    sortOrder: 'desc',
  });
}

// ============================================================================
// TEMPLATE MUTATIONS
// ============================================================================

/**
 * Create a press template
 */
export function useCreatePressTemplate() {
  const toast = useToast();
  const queryClient = useQueryClient();

  return useApiMutation<ApiResponse<PressTemplate>, Partial<PressTemplate>>(
    async (input) => {
      const { data } = await api.post<ApiResponse<PressTemplate>>('/admin/press-releases/templates', input);
      return data;
    },
    {
      onSuccess: () => {
        toast.success('Template créé');
        queryClient.invalidateQueries({ queryKey: pressReleaseKeys.templates() });
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
    }
  );
}

/**
 * Update a press template
 */
export function useUpdatePressTemplate() {
  const toast = useToast();
  const queryClient = useQueryClient();

  return useApiMutation<ApiResponse<PressTemplate>, { id: string; data: Partial<PressTemplate> }>(
    async ({ id, data: templateData }) => {
      const { data } = await api.put<ApiResponse<PressTemplate>>(`/admin/press-releases/templates/${id}`, templateData);
      return data;
    },
    {
      onSuccess: () => {
        toast.success('Template mis à jour');
        queryClient.invalidateQueries({ queryKey: pressReleaseKeys.templates() });
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
    }
  );
}

/**
 * Delete a press template
 */
export function useDeletePressTemplate() {
  const toast = useToast();
  const queryClient = useQueryClient();

  return useApiMutation<ApiResponse<void>, string>(
    async (id) => {
      const { data } = await api.delete<ApiResponse<void>>(`/admin/press-releases/templates/${id}`);
      return data;
    },
    {
      onSuccess: () => {
        toast.success('Template supprimé');
        queryClient.invalidateQueries({ queryKey: pressReleaseKeys.templates() });
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
    }
  );
}
