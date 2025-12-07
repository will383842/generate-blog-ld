/**
 * useActivity Hook
 * Track and manage user activity within the admin panel
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import api from '@/utils/api';

// ============================================================================
// Types
// ============================================================================

export interface Activity {
  id: string;
  type: ActivityType;
  action: string;
  description: string;
  userId: number;
  userName: string;
  userAvatar?: string;
  entityType?: string;
  entityId?: number;
  entityTitle?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export type ActivityType =
  | 'article'
  | 'translation'
  | 'publication'
  | 'generation'
  | 'system'
  | 'user'
  | 'settings';

export interface ActivityFilters {
  type?: ActivityType;
  userId?: number;
  entityType?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export interface ActivityStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
  byType: Record<ActivityType, number>;
  byUser: { userId: number; userName: string; count: number }[];
}

// ============================================================================
// Query Keys
// ============================================================================

export const activityKeys = {
  all: ['activity'] as const,
  list: (filters?: ActivityFilters) => [...activityKeys.all, 'list', filters] as const,
  stats: () => [...activityKeys.all, 'stats'] as const,
  recent: (limit?: number) => [...activityKeys.all, 'recent', limit] as const,
};

// ============================================================================
// API Functions
// ============================================================================

async function fetchActivities(filters?: ActivityFilters): Promise<Activity[]> {
  const params: Record<string, string> = {};
  if (filters?.type) params.type = filters.type;
  if (filters?.userId) params.user_id = String(filters.userId);
  if (filters?.entityType) params.entity_type = filters.entityType;
  if (filters?.startDate) params.start_date = filters.startDate;
  if (filters?.endDate) params.end_date = filters.endDate;
  if (filters?.limit) params.limit = String(filters.limit);

  const { data } = await api.get<Activity[]>('/admin/activity', { params });
  return data;
}

async function fetchActivityStats(): Promise<ActivityStats> {
  const { data } = await api.get<ActivityStats>('/admin/activity/stats');
  return data;
}

async function logActivity(activityData: {
  type: ActivityType;
  action: string;
  description: string;
  entityType?: string;
  entityId?: number;
  entityTitle?: string;
  metadata?: Record<string, unknown>;
}): Promise<Activity> {
  const { data } = await api.post<Activity>('/admin/activity', activityData);
  return data;
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Fetch activities with optional filters
 */
export function useActivities(filters?: ActivityFilters) {
  return useQuery({
    queryKey: activityKeys.list(filters),
    queryFn: () => fetchActivities(filters),
    staleTime: 30000,
  });
}

/**
 * Fetch recent activities
 */
export function useRecentActivities(limit: number = 10) {
  return useQuery({
    queryKey: activityKeys.recent(limit),
    queryFn: () => fetchActivities({ limit }),
    staleTime: 15000,
    refetchInterval: 30000,
  });
}

/**
 * Fetch activity statistics
 */
export function useActivityStats() {
  return useQuery({
    queryKey: activityKeys.stats(),
    queryFn: fetchActivityStats,
    staleTime: 60000,
  });
}

/**
 * Log a new activity
 */
export function useLogActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
}

/**
 * Hook to easily log activities from components
 */
export function useActivityLogger() {
  const { mutate: log, mutateAsync: logAsync } = useLogActivity();

  const logArticleActivity = useCallback(
    (action: string, articleId: number, articleTitle: string, description?: string) => {
      log({
        type: 'article',
        action,
        description: description || `${action} article: ${articleTitle}`,
        entityType: 'article',
        entityId: articleId,
        entityTitle: articleTitle,
      });
    },
    [log]
  );

  const logGenerationActivity = useCallback(
    (action: string, description: string, metadata?: Record<string, unknown>) => {
      log({
        type: 'generation',
        action,
        description,
        metadata,
      });
    },
    [log]
  );

  const logSystemActivity = useCallback(
    (action: string, description: string, metadata?: Record<string, unknown>) => {
      log({
        type: 'system',
        action,
        description,
        metadata,
      });
    },
    [log]
  );

  return {
    log,
    logAsync,
    logArticleActivity,
    logGenerationActivity,
    logSystemActivity,
  };
}

export default useActivities;
