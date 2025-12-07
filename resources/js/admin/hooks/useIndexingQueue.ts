import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/utils/api';

// Types
export interface IndexingQueueItem {
  id: number;
  article_id: number;
  url: string;
  type: string;
  action: 'URL_UPDATED' | 'URL_DELETED';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  response: string | null;
  error_message: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
  article?: {
    id: number;
    title: string;
    slug: string;
    status: string;
  };
}

export interface IndexingQueueStats {
  by_status: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    total: number;
  };
  last_24h: number;
  success_rate: number;
  by_type: Record<string, number>;
  recent_errors: Array<{
    id: number;
    article_id: number;
    error_message: string;
    updated_at: string;
    article?: { id: number; title: string };
  }>;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
}

interface ListParams {
  status?: string;
  type?: string;
  per_page?: number;
  page?: number;
}

// Query keys
export const indexingQueueKeys = {
  all: ['indexing-queue'] as const,
  list: (params?: ListParams) => [...indexingQueueKeys.all, 'list', params] as const,
  stats: () => [...indexingQueueKeys.all, 'stats'] as const,
};

/**
 * Hook pour gérer la queue d'indexation SEO
 */
export function useIndexingQueue(params?: ListParams) {
  const queryClient = useQueryClient();

  // Liste des indexations
  const listQuery = useQuery({
    queryKey: indexingQueueKeys.list(params),
    queryFn: async () => {
      const response = await api.get<ApiResponse<IndexingQueueItem[]>>('/admin/indexing-queue', {
        params,
      });
      return {
        data: response.data.data,
        meta: response.data.meta,
      };
    },
  });

  // Statistiques
  const statsQuery = useQuery({
    queryKey: indexingQueueKeys.stats(),
    queryFn: async () => {
      const response = await api.get<ApiResponse<IndexingQueueStats>>('/admin/indexing-queue/stats');
      return response.data.data;
    },
  });

  // Soumettre un article
  const submitMutation = useMutation({
    mutationFn: async (data: { article_id: number; action?: 'URL_UPDATED' | 'URL_DELETED' }) => {
      const response = await api.post<ApiResponse<{ article_id: number; action: string }>>('/admin/indexing-queue/submit', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: indexingQueueKeys.all });
    },
  });

  // Soumission en masse
  const bulkSubmitMutation = useMutation({
    mutationFn: async (data: { article_ids: number[]; action?: 'URL_UPDATED' | 'URL_DELETED' }) => {
      const response = await api.post<ApiResponse<{ submitted: number; skipped: number }>>('/admin/indexing-queue/bulk-submit', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: indexingQueueKeys.all });
    },
  });

  // Relancer
  const retryMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<ApiResponse<{ id: number; status: string }>>(`/admin/indexing-queue/${id}/retry`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: indexingQueueKeys.all });
    },
  });

  // Supprimer
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete<ApiResponse<null>>(`/admin/indexing-queue/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: indexingQueueKeys.all });
    },
  });

  // Nettoyer les éléments traités
  const clearCompletedMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post<ApiResponse<{ deleted: number }>>('/admin/indexing-queue/clear-completed');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: indexingQueueKeys.all });
    },
  });

  return {
    // Données
    items: listQuery.data?.data ?? [],
    meta: listQuery.data?.meta,
    stats: statsQuery.data,

    // États
    isLoading: listQuery.isLoading,
    isLoadingStats: statsQuery.isLoading,
    error: listQuery.error,

    // Actions
    submit: submitMutation.mutateAsync,
    bulkSubmit: bulkSubmitMutation.mutateAsync,
    retry: retryMutation.mutateAsync,
    remove: deleteMutation.mutateAsync,
    clearCompleted: clearCompletedMutation.mutateAsync,

    // États des mutations
    isSubmitting: submitMutation.isPending,
    isBulkSubmitting: bulkSubmitMutation.isPending,
    isRetrying: retryMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isClearing: clearCompletedMutation.isPending,

    // Refetch
    refetch: () => {
      listQuery.refetch();
      statsQuery.refetch();
    },
  };
}

export default useIndexingQueue;
