/**
 * useGlobalStats Hook
 * Provides real-time global statistics for the entire application
 * Used by Sidebar, Dashboard, and monitoring components
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import api from '@/utils/api';
import type { GlobalStats, AlertItem } from '@/types/stats';

// ============================================================================
// Query Keys Factory
// ============================================================================

export const globalStatsKeys = {
  all: ['global-stats'] as const,
  stats: () => [...globalStatsKeys.all] as const,
};

// ============================================================================
// API Functions
// ============================================================================

async function fetchGlobalStats(): Promise<GlobalStats> {
  const { data } = await api.get<GlobalStats>('/admin/stats/global');
  return data;
}

async function markAlertAsRead(alertId: string): Promise<void> {
  await api.post(`/admin/alerts/${alertId}/read`);
}

async function markAllAlertsAsRead(): Promise<void> {
  await api.post('/admin/alerts/read-all');
}

// ============================================================================
// Main Hook
// ============================================================================

interface UseGlobalStatsOptions {
  refetchInterval?: number; // milliseconds
  enabled?: boolean;
}

export function useGlobalStats(options: UseGlobalStatsOptions = {}) {
  const { refetchInterval = 30000, enabled = true } = options; // Default: refresh every 30 seconds
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: globalStatsKeys.stats(),
    queryFn: fetchGlobalStats,
    refetchInterval,
    enabled,
    staleTime: 10000, // Consider data fresh for 10 seconds
    gcTime: 60000, // Keep in cache for 1 minute
  });

  // ============================================================================
  // Real-time updates via WebSocket (if available)
  // ============================================================================

  useEffect(() => {
    if (!enabled) return;

    // Try to connect to WebSocket for real-time updates
    let ws: WebSocket | null = null;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      ws = new WebSocket(`${protocol}//${window.location.host}/ws/stats`);

      ws.onmessage = (event) => {
        try {
          const update = JSON.parse(event.data);
          
          // Merge partial updates with existing data
          queryClient.setQueryData<GlobalStats>(globalStatsKeys.stats(), (old) => {
            if (!old) return old;
            return { ...old, ...update, lastUpdated: new Date().toISOString() };
          });
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      ws.onerror = () => {
        // WebSocket not available, fall back to polling (already set up)
        console.debug('WebSocket not available, using polling');
      };
    } catch (e) {
      // WebSocket not supported
    }

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [enabled, queryClient]);

  // ============================================================================
  // Alert Actions
  // ============================================================================

  const markAsRead = async (alertId: string) => {
    await markAlertAsRead(alertId);
    queryClient.setQueryData<GlobalStats>(globalStatsKeys.stats(), (old) => {
      if (!old) return old;
      return {
        ...old,
        alerts: old.alerts.map((a) => (a.id === alertId ? { ...a, read: true } : a)),
        unreadAlerts: Math.max(0, old.unreadAlerts - 1),
      };
    });
  };

  const markAllRead = async () => {
    await markAllAlertsAsRead();
    queryClient.setQueryData<GlobalStats>(globalStatsKeys.stats(), (old) => {
      if (!old) return old;
      return {
        ...old,
        alerts: old.alerts.map((a) => ({ ...a, read: true })),
        unreadAlerts: 0,
      };
    });
  };

  // ============================================================================
  // Derived Data
  // ============================================================================

  const stats = query.data;

  // Is anything actively processing?
  const isLive = stats
    ? stats.generation.processing > 0 ||
      stats.translation.processing > 0 ||
      stats.publishing.pending > 0
    : false;

  // Total active items
  const totalActive = stats
    ? stats.generation.processing +
      stats.translation.processing +
      stats.publishing.pending
    : 0;

  // Has critical alerts?
  const hasCriticalAlerts = stats
    ? stats.alerts.some((a) => a.type === 'critical' && !a.read)
    : false;

  // Today's progress percentage
  const todayProgress = stats
    ? {
        generation: stats.today.targets.generated > 0
          ? Math.round((stats.today.generated / stats.today.targets.generated) * 100)
          : 0,
        publishing: stats.today.targets.published > 0
          ? Math.round((stats.today.published / stats.today.targets.published) * 100)
          : 0,
      }
    : { generation: 0, publishing: 0 };

  return {
    // Query state
    data: stats,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,

    // Derived data
    isLive,
    totalActive,
    hasCriticalAlerts,
    todayProgress,

    // Actions
    markAlertAsRead: markAsRead,
    markAllAlertsAsRead: markAllRead,
  };
}

// ============================================================================
// Selector Hooks (for specific parts of stats)
// ============================================================================

export function useGenerationStats() {
  const { data } = useGlobalStats();
  return data?.generation;
}

export function useTranslationStats() {
  const { data } = useGlobalStats();
  return data?.translation;
}

export function usePublishingStats() {
  const { data } = useGlobalStats();
  return data?.publishing;
}

export function useIndexingStats() {
  const { data } = useGlobalStats();
  return data?.indexing;
}

export function useProgramStats() {
  const { data } = useGlobalStats();
  return data?.programs;
}

export function useAlerts() {
  const { data, markAlertAsRead, markAllAlertsAsRead } = useGlobalStats();
  return {
    alerts: data?.alerts || [],
    unreadCount: data?.unreadAlerts || 0,
    markAsRead: markAlertAsRead,
    markAllAsRead: markAllAlertsAsRead,
  };
}

export function useProgressStats() {
  const { data } = useGlobalStats();
  return data?.progress;
}

export function useTodayStats() {
  const { data } = useGlobalStats();
  return data?.today;
}

export function useWeeklyTrend() {
  const { data } = useGlobalStats();
  return data?.weeklyTrend;
}

export default useGlobalStats;
