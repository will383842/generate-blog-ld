/**
 * Queue Management Hooks
 * Real-time queue monitoring and job management
 */

import { useMemo } from 'react';
import { useApiQuery, useApiMutation } from './useApi';
import { useToast } from '@/hooks/useToast';
import api from '@/utils/api';
import type {
  QueueItem,
  QueueStats,
  QueueConfig,
  GenerationJob,
  GenerationJobFilters,
  JobPriority,
} from '@/types/generation';
import type { ApiResponse, PaginatedResponse } from '@/types/common';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const queueKeys = {
  all: ['queue'] as const,
  list: () => [...queueKeys.all, 'list'] as const,
  listFiltered: (filters: GenerationJobFilters) => [...queueKeys.list(), filters] as const,
  stats: () => [...queueKeys.all, 'stats'] as const,
  config: () => [...queueKeys.all, 'config'] as const,
  job: (id: string) => [...queueKeys.all, 'job', id] as const,
};

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get queue items with intelligent polling
 * Only polls when there are active jobs
 */
export function useQueue(filters: GenerationJobFilters = {}) {
  // Memoize filters to prevent unnecessary re-renders
  const stableFilters = useMemo(
    () => JSON.stringify(filters),
    [filters.status, filters.priority, filters.perPage, filters.page]
  );
  const parsedFilters = useMemo(() => JSON.parse(stableFilters), [stableFilters]);

  return useApiQuery<PaginatedResponse<QueueItem>>(
    queueKeys.listFiltered(parsedFilters),
    '/admin/queue',
    { params: parsedFilters },
    {
      // Intelligent polling: only when jobs are active
      refetchInterval: (query) => {
        const hasActiveJobs = query.state.data?.data?.some(
          (job) => job.status === 'processing' || job.status === 'pending'
        );
        return hasActiveJobs ? 10000 : false; // 10s if active, disabled otherwise
      },
      refetchIntervalInBackground: false,
      staleTime: 30000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes
    }
  );
}

/**
 * Get queue statistics with intelligent polling
 */
export function useQueueStats() {
  return useApiQuery<ApiResponse<QueueStats>>(
    queueKeys.stats(),
    '/admin/queue/stats',
    undefined,
    {
      // Adaptive polling based on queue activity
      refetchInterval: (query) => {
        const stats = query.state.data?.data;
        if (stats?.processing && stats.processing > 0) return 5000; // 5s if processing
        if (stats?.pending && stats.pending > 0) return 15000; // 15s if pending
        return 60000; // 1 min if queue empty
      },
      refetchIntervalInBackground: false,
      staleTime: 10000, // 10 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes
    }
  );
}

/**
 * Get queue configuration
 */
export function useQueueConfig() {
  return useApiQuery<ApiResponse<QueueConfig>>(
    queueKeys.config(),
    '/admin/queue/config',
    undefined,
    {
      staleTime: 60000, // 1 minute
    }
  );
}

/**
 * Get single job details
 */
export function useJob(id: string) {
  return useApiQuery<ApiResponse<GenerationJob>>(
    queueKeys.job(id),
    `/admin/queue/jobs/${id}`,
    undefined,
    {
      enabled: !!id,
      refetchInterval: (query) => {
        // Auto-refresh if job is processing
        const job = query.state.data?.data;
        return job?.status === 'processing' ? 2000 : false;
      },
    }
  );
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Cancel a job
 */
export function useCancelJob() {
  const toast = useToast();

  return useApiMutation<ApiResponse<GenerationJob>, string>(
    async (jobId) => {
      const { data } = await api.post<ApiResponse<GenerationJob>>(`/admin/queue/jobs/${jobId}/cancel`);
      return data;
    },
    {
      onSuccess: () => {
        toast.success('Job annulé');
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
      invalidateKeys: [queueKeys.all],
    }
  );
}

/**
 * Retry a failed job
 */
export function useRetryJob() {
  const toast = useToast();

  return useApiMutation<ApiResponse<GenerationJob>, string>(
    async (jobId) => {
      const { data } = await api.post<ApiResponse<GenerationJob>>(`/admin/queue/jobs/${jobId}/retry`);
      return data;
    },
    {
      onSuccess: () => {
        toast.success('Job relancé');
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
      invalidateKeys: [queueKeys.all],
    }
  );
}

/**
 * Set job priority
 */
export function usePriorityJob() {
  const toast = useToast();

  return useApiMutation<
    ApiResponse<GenerationJob>,
    { jobId: string; priority: JobPriority }
  >(
    async ({ jobId, priority }) => {
      const { data } = await api.put<ApiResponse<GenerationJob>>(`/admin/queue/jobs/${jobId}/priority`, { priority });
      return data;
    },
    {
      onSuccess: (_, { priority }) => {
        toast.success(`Priorité définie: ${priority}`);
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
      invalidateKeys: [queueKeys.all],
    }
  );
}

/**
 * Pause entire queue
 */
export function usePauseQueue() {
  const toast = useToast();

  return useApiMutation<ApiResponse<QueueConfig>, void>(
    async () => {
      const { data } = await api.post<ApiResponse<QueueConfig>>('/admin/queue/pause');
      return data;
    },
    {
      onSuccess: () => {
        toast.success('Queue mise en pause');
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
      invalidateKeys: [queueKeys.all],
    }
  );
}

/**
 * Resume queue
 */
export function useResumeQueue() {
  const toast = useToast();

  return useApiMutation<ApiResponse<QueueConfig>, void>(
    async () => {
      const { data } = await api.post<ApiResponse<QueueConfig>>('/admin/queue/resume');
      return data;
    },
    {
      onSuccess: () => {
        toast.success('Queue reprise');
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
      invalidateKeys: [queueKeys.all],
    }
  );
}

/**
 * Clear completed jobs
 */
export function useClearCompleted() {
  const toast = useToast();

  return useApiMutation<ApiResponse<{ count: number }>, void>(
    async () => {
      const { data } = await api.delete<ApiResponse<{ count: number }>>('/admin/queue/clear-completed');
      return data;
    },
    {
      onSuccess: (data) => {
        toast.success(`${data.data?.count || 0} jobs supprimés`);
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
      invalidateKeys: [queueKeys.all],
    }
  );
}

/**
 * Bulk cancel jobs
 */
export function useBulkCancelJobs() {
  const toast = useToast();

  return useApiMutation<ApiResponse<{ count: number }>, string[]>(
    async (jobIds) => {
      const { data } = await api.post<ApiResponse<{ count: number }>>('/admin/queue/bulk-cancel', { jobIds });
      return data;
    },
    {
      onSuccess: (data) => {
        toast.success(`${data.data?.count || 0} jobs annulés`);
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
      invalidateKeys: [queueKeys.all],
    }
  );
}

/**
 * Bulk retry failed jobs
 */
export function useBulkRetryJobs() {
  const toast = useToast();

  return useApiMutation<ApiResponse<{ count: number }>, string[]>(
    async (jobIds) => {
      const { data } = await api.post<ApiResponse<{ count: number }>>('/admin/queue/bulk-retry', { jobIds });
      return data;
    },
    {
      onSuccess: (data) => {
        toast.success(`${data.data?.count || 0} jobs relancés`);
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
      invalidateKeys: [queueKeys.all],
    }
  );
}

/**
 * Update queue configuration
 */
export function useUpdateQueueConfig() {
  const toast = useToast();

  return useApiMutation<ApiResponse<QueueConfig>, Partial<QueueConfig>>(
    async (config) => {
      const { data } = await api.put<ApiResponse<QueueConfig>>('/admin/queue/config', config);
      return data;
    },
    {
      onSuccess: () => {
        toast.success('Configuration mise à jour');
      },
      onError: (error) => {
        toast.error(`Erreur: ${error.message}`);
      },
      invalidateKeys: [queueKeys.config()],
    }
  );
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Get pending jobs count
 */
export function usePendingJobsCount() {
  const { data } = useQueueStats();
  return data?.data?.pending || 0;
}

/**
 * Check if queue is paused
 */
export function useIsQueuePaused() {
  const { data } = useQueueConfig();
  return data?.data?.isPaused || false;
}

/**
 * Calculate ETA for queue completion
 */
export function useQueueETA() {
  const { data: stats } = useQueueStats();

  if (!stats?.data) return null;

  const { pending, processing, jobsPerMinute, avgDuration } = stats.data;

  if (jobsPerMinute <= 0) return null;

  const remainingJobs = pending + processing;
  const minutesToComplete = remainingJobs / jobsPerMinute;

  const eta = new Date();
  eta.setMinutes(eta.getMinutes() + minutesToComplete);

  return {
    eta,
    remainingJobs,
    minutesToComplete: Math.round(minutesToComplete),
    avgDuration,
  };
}
