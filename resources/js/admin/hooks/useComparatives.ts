/**
 * Comparatives Hooks
 * Comparison article management with criteria and scoring
 */

import { useQueryClient } from '@tanstack/react-query';
import { useApiQuery, useApiMutation } from './useApi';
import { useToast } from '@/hooks/useToast';
import api from '@/utils/api';
import type {
  Comparative,
  ComparativeWithRelations,
  ComparativeFilters,
  ComparisonCriteria,
  ComparisonItem,
  CriteriaTemplate,
  CreateComparativeInput,
  UpdateCriteriaInput,
  UpdateItemsInput,
  ComparativeListResponse,
} from '@/types/comparative';
import type { ApiResponse } from '@/types/common';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const comparativeKeys = {
  all: ['comparatives'] as const,
  list: () => [...comparativeKeys.all, 'list'] as const,
  listFiltered: (filters: ComparativeFilters) => [...comparativeKeys.list(), filters] as const,
  detail: (id: string) => [...comparativeKeys.all, 'detail', id] as const,
  templates: () => [...comparativeKeys.all, 'templates'] as const,
  stats: () => [...comparativeKeys.all, 'stats'] as const,
};

// ============================================================================
// COMPARATIVE QUERIES
// ============================================================================

/**
 * Get paginated list of comparatives
 */
export function useComparatives(filters: ComparativeFilters = {}) {
  return useApiQuery<ComparativeListResponse>(
    comparativeKeys.listFiltered(filters),
    '/admin/comparatives',
    {
      params: filters,
    },
    { staleTime: 30000 }
  );
}

/**
 * Get single comparative with all relations
 */
export function useComparative(id: string) {
  return useApiQuery<ApiResponse<ComparativeWithRelations>>(
    comparativeKeys.detail(id),
    `/admin/comparatives/${id}`,
    undefined,
    {
      enabled: !!id,
      staleTime: 30000,
    }
  );
}

/**
 * Get criteria templates
 */
export function useCriteriaTemplates() {
  return useApiQuery<ApiResponse<CriteriaTemplate[]>>(
    comparativeKeys.templates(),
    '/admin/comparatives/templates',
    undefined,
    { staleTime: 300000 } // 5 minutes - templates don't change often
  );
}

/**
 * Get comparative stats
 */
export function useComparativeStats() {
  return useApiQuery<ApiResponse<{
    totalCount: number;
    publishedCount: number;
    avgItemsCount: number;
    avgCriteriaCount: number;
    byType: Record<string, number>;
  }>>(
    comparativeKeys.stats(),
    '/admin/comparatives/stats',
    undefined,
    { staleTime: 60000 }
  );
}

// ============================================================================
// COMPARATIVE MUTATIONS
// ============================================================================

/**
 * Create new comparative
 */
export function useCreateComparative() {
  const toast = useToast();
  const queryClient = useQueryClient();

  return useApiMutation<ApiResponse<Comparative>, CreateComparativeInput>(
    async (input) => {
      const { data } = await api.post<ApiResponse<Comparative>>(
        '/admin/comparatives',
        input
      );
      return data;
    },
    {
      onSuccess: () => {
        toast.success('Comparatif créé');
        queryClient.invalidateQueries({ queryKey: comparativeKeys.all });
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
    }
  );
}

/**
 * Update comparative content
 */
export function useUpdateComparative() {
  const toast = useToast();
  const queryClient = useQueryClient();

  return useApiMutation<
    ApiResponse<Comparative>,
    { id: string; data: Partial<Comparative> },
    { previous?: ApiResponse<ComparativeWithRelations> }
  >(
    async ({ id, data: updateData }) => {
      const { data } = await api.put<ApiResponse<Comparative>>(
        `/admin/comparatives/${id}`,
        updateData
      );
      return data;
    },
    {
      onMutate: async ({ id, data }) => {
        await queryClient.cancelQueries({ queryKey: comparativeKeys.detail(id) });
        const previous = queryClient.getQueryData<ApiResponse<ComparativeWithRelations>>(
          comparativeKeys.detail(id)
        );
        
        queryClient.setQueryData(comparativeKeys.detail(id), (old: ApiResponse<ComparativeWithRelations> | undefined) => ({
          ...old,
          data: { ...old?.data, ...data },
        }));
        
        return { previous };
      },
      onError: (error, variables, context) => {
        if (context?.previous) {
          queryClient.setQueryData(comparativeKeys.detail(variables.id), context.previous);
        }
        toast.error(`Erreur: ${error.message}`);
      },
      onSuccess: () => {
        toast.success('Comparatif mis à jour');
      },
      onSettled: (_, __, { id }) => {
        queryClient.invalidateQueries({ queryKey: comparativeKeys.detail(id) });
        queryClient.invalidateQueries({ queryKey: comparativeKeys.list() });
      },
    }
  );
}

/**
 * Delete comparative
 */
export function useDeleteComparative() {
  const toast = useToast();
  const queryClient = useQueryClient();

  return useApiMutation<ApiResponse<void>, string>(
    async (id) => {
      const { data } = await api.delete<ApiResponse<void>>(
        `/admin/comparatives/${id}`
      );
      return data;
    },
    {
      onSuccess: () => {
        toast.success('Comparatif supprimé');
        queryClient.invalidateQueries({ queryKey: comparativeKeys.all });
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
    }
  );
}

// ============================================================================
// CRITERIA MUTATIONS
// ============================================================================

/**
 * Update criteria for a comparative
 */
export function useUpdateCriteria() {
  const toast = useToast();
  const queryClient = useQueryClient();

  return useApiMutation<ApiResponse<ComparisonCriteria[]>, UpdateCriteriaInput>(
    async ({ comparativeId, criteria }) => {
      const { data } = await api.put<ApiResponse<ComparisonCriteria[]>>(
        `/admin/comparatives/${comparativeId}/criteria`,
        { criteria }
      );
      return data;
    },
    {
      onSuccess: (_, { comparativeId }) => {
        toast.success('Critères mis à jour');
        queryClient.invalidateQueries({ queryKey: comparativeKeys.detail(comparativeId) });
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
    }
  );
}

/**
 * Add single criterion
 */
export function useAddCriterion() {
  const queryClient = useQueryClient();

  return useApiMutation<
    ApiResponse<ComparisonCriteria>,
    { comparativeId: string; criterion: Partial<ComparisonCriteria> }
  >(
    async ({ comparativeId, criterion }) => {
      const { data } = await api.post<ApiResponse<ComparisonCriteria>>(
        `/admin/comparatives/${comparativeId}/criteria`,
        criterion
      );
      return data;
    },
    {
      onSuccess: (_, { comparativeId }) => {
        queryClient.invalidateQueries({ queryKey: comparativeKeys.detail(comparativeId) });
      },
    }
  );
}

/**
 * Delete criterion
 */
export function useDeleteCriterion() {
  const queryClient = useQueryClient();

  return useApiMutation<
    ApiResponse<void>,
    { comparativeId: string; criterionId: string }
  >(
    async ({ comparativeId, criterionId }) => {
      const { data } = await api.delete<ApiResponse<void>>(
        `/admin/comparatives/${comparativeId}/criteria/${criterionId}`
      );
      return data;
    },
    {
      onSuccess: (_, { comparativeId }) => {
        queryClient.invalidateQueries({ queryKey: comparativeKeys.detail(comparativeId) });
      },
    }
  );
}

// ============================================================================
// ITEMS MUTATIONS
// ============================================================================

/**
 * Update items for a comparative
 */
export function useUpdateItems() {
  const toast = useToast();
  const queryClient = useQueryClient();

  return useApiMutation<ApiResponse<ComparisonItem[]>, UpdateItemsInput>(
    async ({ comparativeId, items }) => {
      const { data } = await api.put<ApiResponse<ComparisonItem[]>>(
        `/admin/comparatives/${comparativeId}/items`,
        { items }
      );
      return data;
    },
    {
      onSuccess: (_, { comparativeId }) => {
        toast.success('Éléments mis à jour');
        queryClient.invalidateQueries({ queryKey: comparativeKeys.detail(comparativeId) });
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
    }
  );
}

/**
 * Add single item
 */
export function useAddItem() {
  const queryClient = useQueryClient();

  return useApiMutation<
    ApiResponse<ComparisonItem>,
    { comparativeId: string; item: Partial<ComparisonItem> }
  >(
    async ({ comparativeId, item }) => {
      const { data } = await api.post<ApiResponse<ComparisonItem>>(
        `/admin/comparatives/${comparativeId}/items`,
        item
      );
      return data;
    },
    {
      onSuccess: (_, { comparativeId }) => {
        queryClient.invalidateQueries({ queryKey: comparativeKeys.detail(comparativeId) });
      },
    }
  );
}

/**
 * Delete item
 */
export function useDeleteItem() {
  const queryClient = useQueryClient();

  return useApiMutation<
    ApiResponse<void>,
    { comparativeId: string; itemId: string }
  >(
    async ({ comparativeId, itemId }) => {
      const { data } = await api.delete<ApiResponse<void>>(
        `/admin/comparatives/${comparativeId}/items/${itemId}`
      );
      return data;
    },
    {
      onSuccess: (_, { comparativeId }) => {
        queryClient.invalidateQueries({ queryKey: comparativeKeys.detail(comparativeId) });
      },
    }
  );
}

/**
 * Update item value
 */
export function useUpdateItemValue() {
  const queryClient = useQueryClient();

  return useApiMutation<
    ApiResponse<ComparisonItem>,
    {
      comparativeId: string;
      itemId: string;
      criterionId: string;
      value: string | number | boolean;
    }
  >(
    async ({ comparativeId, itemId, criterionId, value }) => {
      const { data } = await api.put<ApiResponse<ComparisonItem>>(
        `/admin/comparatives/${comparativeId}/items/${itemId}/values/${criterionId}`,
        { value }
      );
      return data;
    },
    {
      onSuccess: (_, { comparativeId }) => {
        queryClient.invalidateQueries({ queryKey: comparativeKeys.detail(comparativeId) });
      },
    }
  );
}

// ============================================================================
// SCORING
// ============================================================================

/**
 * Recalculate all scores for a comparative
 */
export function useRecalculateScores() {
  const toast = useToast();
  const queryClient = useQueryClient();

  return useApiMutation<
    ApiResponse<{ items: ComparisonItem[]; winnerId: string }>,
    string
  >(
    async (comparativeId) => {
      const { data } = await api.post<ApiResponse<{ items: ComparisonItem[]; winnerId: string }>>(
        `/admin/comparatives/${comparativeId}/recalculate`
      );
      return data;
    },
    {
      onSuccess: (_, comparativeId) => {
        toast.success('Scores recalculés');
        queryClient.invalidateQueries({ queryKey: comparativeKeys.detail(comparativeId) });
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
    }
  );
}

// ============================================================================
// TEMPLATES
// ============================================================================

/**
 * Apply template to comparative
 */
export function useApplyTemplate() {
  const toast = useToast();
  const queryClient = useQueryClient();

  return useApiMutation<
    ApiResponse<Comparative>,
    { comparativeId: string; templateId: string }
  >(
    async ({ comparativeId, templateId }) => {
      const { data } = await api.post<ApiResponse<Comparative>>(
        `/admin/comparatives/${comparativeId}/apply-template`,
        { templateId }
      );
      return data;
    },
    {
      onSuccess: (_, { comparativeId }) => {
        toast.success('Template appliqué');
        queryClient.invalidateQueries({ queryKey: comparativeKeys.detail(comparativeId) });
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
    }
  );
}

/**
 * Save current criteria as template
 */
export function useSaveAsTemplate() {
  const toast = useToast();
  const queryClient = useQueryClient();

  return useApiMutation<
    ApiResponse<CriteriaTemplate>,
    { comparativeId: string; name: string; description?: string }
  >(
    async ({ comparativeId, name, description }) => {
      const { data } = await api.post<ApiResponse<CriteriaTemplate>>(
        `/admin/comparatives/${comparativeId}/save-template`,
        { name, description }
      );
      return data;
    },
    {
      onSuccess: () => {
        toast.success('Template sauvegardé');
        queryClient.invalidateQueries({ queryKey: comparativeKeys.templates() });
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
 * Get recently updated comparatives
 */
export function useRecentComparatives(limit = 5) {
  return useComparatives({
    perPage: limit,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  });
}

/**
 * Get comparatives by type
 */
export function useComparativesByType(comparativeType: Comparative['comparativeType']) {
  return useComparatives({ comparativeType });
}
