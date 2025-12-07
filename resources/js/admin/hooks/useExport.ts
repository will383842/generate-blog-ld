import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { useToast } from '@/hooks/useToast';
import { useTranslation } from 'react-i18next';
import {
  ExportRequest,
  ExportQueueItem,
  ExportStats,
  RequestExportInput,
  ExportStatus,
  ExportFormat,
  ExportEntityType,
} from '@/types/media';
import { ApiResponse, PaginatedResponse } from '@/types/api';
import { api } from '@/utils/api';

// ============================================================================
// Query Keys
// ============================================================================

export const exportKeys = {
  all: ['exports'] as const,
  queue: () => [...exportKeys.all, 'queue'] as const,
  history: (filters?: ExportHistoryFilters) => [...exportKeys.all, 'history', filters] as const,
  detail: (id: number) => [...exportKeys.all, 'detail', id] as const,
  stats: () => [...exportKeys.all, 'stats'] as const,
};

// ============================================================================
// Types
// ============================================================================

export interface ExportHistoryFilters {
  status?: ExportStatus;
  entityType?: ExportEntityType;
  format?: ExportFormat;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  perPage?: number;
  sortBy?: 'requested_at' | 'completed_at' | 'file_size';
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// API Functions
// ============================================================================

const fetchExportQueue = async (): Promise<ExportQueueItem[]> => {
  const response = await api.get<ApiResponse<ExportQueueItem[]>>('/admin/exports/queue');
  return response.data.data;
};

const fetchExportHistory = async (
  filters: ExportHistoryFilters = {}
): Promise<PaginatedResponse<ExportRequest>> => {
  const params = new URLSearchParams();

  if (filters.status) params.append('status', filters.status);
  if (filters.entityType) params.append('entity_type', filters.entityType);
  if (filters.format) params.append('format', filters.format);
  if (filters.dateFrom) params.append('date_from', filters.dateFrom);
  if (filters.dateTo) params.append('date_to', filters.dateTo);
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.perPage) params.append('per_page', filters.perPage.toString());
  if (filters.sortBy) params.append('sort_by', filters.sortBy);
  if (filters.sortOrder) params.append('sort_order', filters.sortOrder);

  const response = await api.get<PaginatedResponse<ExportRequest>>(
    `/admin/exports/history?${params.toString()}`
  );
  return response.data;
};

const fetchExportDetail = async (id: number): Promise<ExportRequest> => {
  const response = await api.get<ApiResponse<ExportRequest>>(`/admin/exports/${id}`);
  return response.data.data;
};

const fetchExportStats = async (): Promise<ExportStats> => {
  const response = await api.get<ApiResponse<ExportStats>>('/admin/exports/stats');
  return response.data.data;
};

const requestExport = async (data: RequestExportInput): Promise<ExportRequest> => {
  const response = await api.post<ApiResponse<ExportRequest>>('/admin/exports', {
    entity_type: data.entityType,
    entity_id: data.entityId,
    format: data.format,
    options: data.options,
  });
  return response.data.data;
};

const downloadExport = async (id: number): Promise<{ url: string; filename: string }> => {
  const response = await api.get<ApiResponse<{ url: string; filename: string }>>(
    `/admin/exports/${id}/download`
  );
  return response.data.data;
};

const retryExport = async (id: number): Promise<ExportRequest> => {
  const response = await api.post<ApiResponse<ExportRequest>>(`/admin/exports/${id}/retry`);
  return response.data.data;
};

const cancelExport = async (id: number): Promise<void> => {
  await api.post(`/admin/exports/${id}/cancel`);
};

const deleteExport = async (id: number): Promise<void> => {
  await api.delete(`/admin/exports/${id}`);
};

const bulkDeleteExports = async (ids: number[]): Promise<void> => {
  await api.post('/admin/exports/bulk-delete', { ids });
};

// ============================================================================
// Query Hooks
// ============================================================================

export const useExportQueue = () => {
  return useQuery({
    queryKey: exportKeys.queue(),
    queryFn: fetchExportQueue,
    staleTime: 10 * 1000, // Refresh frequently for queue
    refetchInterval: 15 * 1000, // Auto-refresh every 15s
  });
};

export const useExportHistory = (filters: ExportHistoryFilters = {}) => {
  return useQuery({
    queryKey: exportKeys.history(filters),
    queryFn: () => fetchExportHistory(filters),
    staleTime: 30 * 1000,
  });
};

export const useExportDetail = (
  id: number,
  options?: Omit<UseQueryOptions<ExportRequest, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: exportKeys.detail(id),
    queryFn: () => fetchExportDetail(id),
    staleTime: 30 * 1000,
    // Refetch while processing
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && (data.status === 'pending' || data.status === 'processing')) {
        return 5000; // Refetch every 5s while in progress
      }
      return false;
    },
    ...options,
  });
};

export const useExportStats = () => {
  return useQuery({
    queryKey: exportKeys.stats(),
    queryFn: fetchExportStats,
    staleTime: 60 * 1000,
  });
};

// ============================================================================
// Mutation Hooks
// ============================================================================

export const useRequestExport = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useTranslation(['media', 'common']);

  return useMutation({
    mutationFn: requestExport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exportKeys.queue() });
      queryClient.invalidateQueries({ queryKey: exportKeys.history() });
      queryClient.invalidateQueries({ queryKey: exportKeys.stats() });
      showToast(t('media:export.messages.requested'), 'success');
    },
    onError: () => {
      showToast(t('media:export.messages.requestFailed'), 'error');
    },
  });
};

export const useDownloadExport = () => {
  const { showToast } = useToast();
  const { t } = useTranslation(['media', 'common']);

  return useMutation({
    mutationFn: downloadExport,
    onSuccess: (data) => {
      // Trigger download
      const link = document.createElement('a');
      link.href = data.url;
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast(t('media:export.messages.downloading'), 'success');
    },
    onError: () => {
      showToast(t('media:export.messages.downloadFailed'), 'error');
    },
  });
};

export const useRetryExport = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useTranslation(['media', 'common']);

  return useMutation({
    mutationFn: retryExport,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: exportKeys.queue() });
      queryClient.invalidateQueries({ queryKey: exportKeys.history() });
      queryClient.setQueryData(exportKeys.detail(data.id), data);
      showToast(t('media:export.messages.retrying'), 'success');
    },
    onError: () => {
      showToast(t('common:error.generic'), 'error');
    },
  });
};

export const useCancelExport = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useTranslation(['media', 'common']);

  return useMutation({
    mutationFn: cancelExport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exportKeys.queue() });
      queryClient.invalidateQueries({ queryKey: exportKeys.history() });
      queryClient.invalidateQueries({ queryKey: exportKeys.stats() });
      showToast(t('media:export.messages.cancelled'), 'success');
    },
    onError: () => {
      showToast(t('common:error.generic'), 'error');
    },
  });
};

export const useDeleteExport = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useTranslation(['media', 'common']);

  return useMutation({
    mutationFn: deleteExport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exportKeys.history() });
      queryClient.invalidateQueries({ queryKey: exportKeys.stats() });
      showToast(t('media:export.messages.deleted'), 'success');
    },
    onError: () => {
      showToast(t('common:error.generic'), 'error');
    },
  });
};

export const useBulkDeleteExports = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useTranslation(['media', 'common']);

  return useMutation({
    mutationFn: bulkDeleteExports,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: exportKeys.history() });
      queryClient.invalidateQueries({ queryKey: exportKeys.stats() });
      showToast(t('media:export.messages.bulkDeleted', { count: variables.length }), 'success');
    },
    onError: () => {
      showToast(t('common:error.generic'), 'error');
    },
  });
};

// ============================================================================
// Utility Hook for Export Status Polling
// ============================================================================

export const useExportProgress = (exportId: number | null) => {
  return useQuery({
    queryKey: exportKeys.detail(exportId || 0),
    queryFn: () => fetchExportDetail(exportId!),
    enabled: !!exportId,
    staleTime: 0,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 3000;
      if (data.status === 'pending' || data.status === 'processing') {
        return 3000; // Poll every 3s
      }
      return false; // Stop polling when done
    },
  });
};
