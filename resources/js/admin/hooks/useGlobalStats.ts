/**
 * useGlobalStats Hook - FIXED VERSION
 * Provides real-time global statistics for the entire application
 * Used by Sidebar, Dashboard, and monitoring components
 * 
 * ✅ FIXED: Added safety checks for undefined data
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
    retry: 3,
    retryDelay: 1000,
  });

  // ============================================================================
  // Real-time updates via WebSocket (if available)
  // ============================================================================

  useEffect(() => {
    if (!enabled) return;

    // Skip WebSocket in development mode - use polling only
    // WebSocket requires a separate server which is not available in dev
    if (import.meta.env.DEV) {
      return;
    }

    // Try to connect to WebSocket for real-time updates (production only)
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
  // Alert Management
  // ============================================================================

  const handleMarkAsRead = async (alertId: string) => {
    await markAlertAsRead(alertId);
    
    // Optimistically update UI
    queryClient.setQueryData<GlobalStats>(globalStatsKeys.stats(), (old) => {
      if (!old) return old;
      
      return {
        ...old,
        alerts: old.alerts.map((alert) =>
          alert.id === alertId ? { ...alert, read: true } : alert
        ),
      };
    });
    
    // Refetch to ensure consistency
    query.refetch();
  };

  const handleMarkAllAsRead = async () => {
    await markAllAlertsAsRead();
    
    // Optimistically update UI
    queryClient.setQueryData<GlobalStats>(globalStatsKeys.stats(), (old) => {
      if (!old) return old;
      
      return {
        ...old,
        alerts: old.alerts.map((alert) => ({ ...alert, read: true })),
      };
    });
    
    // Refetch to ensure consistency
    query.refetch();
  };

  // ============================================================================
  // Derived Data - ✅ FIXED: Added safety checks
  // ============================================================================

  const stats = query.data;

  // ✅ FIXED: Safe access with fallbacks
  const isLive = stats && stats.generation && stats.translation && stats.publishing
    ? (stats.generation.processing || 0) > 0 ||
      (stats.translation.processing || 0) > 0 ||
      (stats.publishing.pending || 0) > 0
    : false;

  // ✅ FIXED: Safe access with fallbacks
  const totalActive = stats && stats.generation && stats.translation && stats.publishing
    ? (stats.generation.processing || 0) +
      (stats.translation.processing || 0) +
      (stats.publishing.pending || 0)
    : 0;

  // ✅ FIXED: Safe access with fallbacks
  const unreadAlerts = stats && stats.alerts
    ? stats.alerts.filter((alert) => !alert.read).length
    : 0;

  // ✅ FIXED: Safe access with fallbacks
  const criticalAlerts = stats && stats.alerts
    ? stats.alerts.filter((alert) => alert.type === 'critical' && !alert.read).length
    : 0;

  // ============================================================================
  // Return API
  // ============================================================================

  return {
    // Query state
    stats,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isFetching: query.isFetching,

    // Derived state
    isLive,
    totalActive,
    unreadAlerts,
    criticalAlerts,
    hasCriticalAlerts: criticalAlerts > 0, // Boolean for convenience

    // Alert management
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,

    // Query control
    refetch: query.refetch,
  };
}

// ============================================================================
// Type Guards - ✅ NEW: Helper functions for safe access
// ============================================================================

export function hasGenerationStats(stats: GlobalStats | undefined): stats is GlobalStats & { generation: NonNullable<GlobalStats['generation']> } {
  return !!stats?.generation;
}

export function hasTranslationStats(stats: GlobalStats | undefined): stats is GlobalStats & { translation: NonNullable<GlobalStats['translation']> } {
  return !!stats?.translation;
}

export function hasPublishingStats(stats: GlobalStats | undefined): stats is GlobalStats & { publishing: NonNullable<GlobalStats['publishing']> } {
  return !!stats?.publishing;
}
