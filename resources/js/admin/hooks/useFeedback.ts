/**
 * Feedback Hooks
 * File 267 - TanStack Query hooks for feedback analytics
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/useToast';
import api from '@/utils/api';
import {
  FeedbackData,
  FeedbackPattern,
  FeedbackRecommendation,
} from '@/types/quality';

const API_BASE = '/admin/quality/feedback';

// Query keys factory
export const feedbackKeys = {
  all: ['feedback'] as const,
  dashboard: (platformId: number) => [...feedbackKeys.all, 'dashboard', platformId] as const,
  patterns: (platformId: number) => [...feedbackKeys.all, 'patterns', platformId] as const,
  recommendations: (platformId: number) => [...feedbackKeys.all, 'recommendations', platformId] as const,
  weeklyReport: (platformId: number, week?: string) => [...feedbackKeys.all, 'weekly', platformId, week] as const,
};

// API functions
async function fetchFeedbackDashboard(platformId: number): Promise<FeedbackData> {
  const { data } = await api.get<FeedbackData>(`${API_BASE}/dashboard`, { params: { platform_id: platformId } });
  return data;
}

async function fetchFeedbackPatterns(platformId: number): Promise<FeedbackPattern[]> {
  const { data } = await api.get<FeedbackPattern[]>(`${API_BASE}/patterns`, { params: { platform_id: platformId } });
  return data;
}

async function fetchRecommendations(platformId: number): Promise<FeedbackRecommendation[]> {
  const { data } = await api.get<FeedbackRecommendation[]>(`${API_BASE}/recommendations`, { params: { platform_id: platformId } });
  return data;
}

async function applyRecommendation(id: string): Promise<FeedbackRecommendation> {
  const { data } = await api.post<FeedbackRecommendation>(`${API_BASE}/recommendations/${id}/apply`);
  return data;
}

async function dismissRecommendation(id: string): Promise<FeedbackRecommendation> {
  const { data } = await api.post<FeedbackRecommendation>(`${API_BASE}/recommendations/${id}/dismiss`);
  return data;
}

async function clearFeedbackCache(platformId: number): Promise<void> {
  await api.delete(`${API_BASE}/cache`, { params: { platform_id: platformId } });
}

async function refreshFeedbackAnalysis(platformId: number): Promise<FeedbackData> {
  const { data } = await api.post<FeedbackData>(`${API_BASE}/refresh`, null, { params: { platform_id: platformId } });
  return data;
}

async function fetchWeeklyReport(
  platformId: number,
  week?: string
): Promise<FeedbackData['weekly_report']> {
  const params: Record<string, string | number> = { platform_id: platformId };
  if (week) params.week = week;

  const { data } = await api.get<FeedbackData['weekly_report']>(`${API_BASE}/weekly`, { params });
  return data;
}

// ============================================
// Query Hooks
// ============================================

export function useFeedbackDashboard(platformId: number) {
  return useQuery({
    queryKey: feedbackKeys.dashboard(platformId),
    queryFn: () => fetchFeedbackDashboard(platformId),
    enabled: platformId > 0,
    staleTime: 300000, // 5 minutes
  });
}

export function useFeedbackPatterns(platformId: number) {
  return useQuery({
    queryKey: feedbackKeys.patterns(platformId),
    queryFn: () => fetchFeedbackPatterns(platformId),
    enabled: platformId > 0,
    staleTime: 300000,
  });
}

export function useRecommendations(platformId: number) {
  return useQuery({
    queryKey: feedbackKeys.recommendations(platformId),
    queryFn: () => fetchRecommendations(platformId),
    enabled: platformId > 0,
    staleTime: 60000,
  });
}

export function useWeeklyReport(platformId: number, week?: string) {
  return useQuery({
    queryKey: feedbackKeys.weeklyReport(platformId, week),
    queryFn: () => fetchWeeklyReport(platformId, week),
    enabled: platformId > 0,
  });
}

// ============================================
// Mutation Hooks
// ============================================

export function useApplyRecommendation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: applyRecommendation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedbackKeys.all });
      toast({ title: t('feedback.messages.recommendationApplied') });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('feedback.messages.applyError'),
        variant: 'destructive',
      });
    },
  });
}

export function useDismissRecommendation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: dismissRecommendation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedbackKeys.all });
      toast({ title: t('feedback.messages.recommendationDismissed') });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('feedback.messages.dismissError'),
        variant: 'destructive',
      });
    },
  });
}

export function useClearFeedbackCache() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: clearFeedbackCache,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedbackKeys.all });
      toast({ title: t('feedback.messages.cacheCleared') });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('feedback.messages.clearCacheError'),
        variant: 'destructive',
      });
    },
  });
}

export function useRefreshFeedbackAnalysis() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: refreshFeedbackAnalysis,
    onSuccess: (data) => {
      queryClient.setQueryData(feedbackKeys.dashboard(data.weekly_report ? 0 : 0), data);
      queryClient.invalidateQueries({ queryKey: feedbackKeys.all });
      toast({ title: t('feedback.messages.analysisRefreshed') });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('feedback.messages.refreshError'),
        variant: 'destructive',
      });
    },
  });
}
