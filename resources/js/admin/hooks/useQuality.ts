/**
 * Quality Hooks
 * File 265 - TanStack Query hooks for quality checks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/useToast';
import api from '@/utils/api';
import {
  QualityCheck,
  QualityDashboardStats,
  QualityTrend,
  QualityCheckFilters,
} from '@/types/quality';

const API_BASE = '/admin/quality';

// Query keys factory
export const qualityKeys = {
  all: ['quality'] as const,
  dashboard: (platformId: number) => [...qualityKeys.all, 'dashboard', platformId] as const,
  checks: () => [...qualityKeys.all, 'checks'] as const,
  checksList: (filters: QualityCheckFilters) => [...qualityKeys.checks(), 'list', filters] as const,
  checkDetail: (id: number) => [...qualityKeys.checks(), 'detail', id] as const,
  checksByArticle: (articleId: number) => [...qualityKeys.checks(), 'byArticle', articleId] as const,
  trends: (platformId: number, period: string) => [...qualityKeys.all, 'trends', platformId, period] as const,
  stats: (platformId: number) => [...qualityKeys.all, 'stats', platformId] as const,
};

// API functions
async function fetchQualityDashboard(platformId: number): Promise<QualityDashboardStats> {
  const { data } = await api.get<QualityDashboardStats>(`${API_BASE}/dashboard`, {
    params: { platform_id: platformId }
  });
  return data;
}

async function fetchQualityChecks(filters: QualityCheckFilters): Promise<{
  data: QualityCheck[];
  total: number;
  page: number;
  per_page: number;
}> {
  const { data } = await api.get<{
    data: QualityCheck[];
    total: number;
    page: number;
    per_page: number;
  }>(`${API_BASE}/checks`, { params: filters });
  return data;
}

async function fetchQualityCheck(id: number): Promise<QualityCheck> {
  const { data } = await api.get<QualityCheck>(`${API_BASE}/checks/${id}`);
  return data;
}

async function fetchQualityChecksByArticle(articleId: number): Promise<QualityCheck[]> {
  const { data } = await api.get<QualityCheck[]>(`${API_BASE}/checks/by-article/${articleId}`);
  return data;
}

async function fetchQualityTrends(
  platformId: number,
  period: string
): Promise<QualityTrend[]> {
  const { data } = await api.get<QualityTrend[]>(`${API_BASE}/trends`, {
    params: { platform_id: platformId, period }
  });
  return data;
}

async function revalidateArticle(articleId: number): Promise<QualityCheck> {
  const { data } = await api.post<QualityCheck>(`${API_BASE}/revalidate/${articleId}`);
  return data;
}

async function bulkRevalidate(articleIds: number[]): Promise<{ queued: number }> {
  const { data } = await api.post<{ queued: number }>(`${API_BASE}/revalidate/bulk`, {
    article_ids: articleIds
  });
  return data;
}

async function exportQualityChecks(filters: QualityCheckFilters): Promise<Blob> {
  const { data } = await api.get<Blob>(`${API_BASE}/checks/export`, {
    params: filters,
    responseType: 'blob'
  });
  return data;
}

// ============================================
// Query Hooks
// ============================================

export function useQualityDashboard(platformId: number) {
  return useQuery({
    queryKey: qualityKeys.dashboard(platformId),
    queryFn: () => fetchQualityDashboard(platformId),
    enabled: platformId > 0,
    staleTime: 60000,
  });
}

export function useQualityChecks(filters: QualityCheckFilters) {
  return useQuery({
    queryKey: qualityKeys.checksList(filters),
    queryFn: () => fetchQualityChecks(filters),
    staleTime: 30000,
  });
}

export function useQualityCheck(id: number) {
  return useQuery({
    queryKey: qualityKeys.checkDetail(id),
    queryFn: () => fetchQualityCheck(id),
    enabled: id > 0,
  });
}

export function useQualityChecksByArticle(articleId: number) {
  return useQuery({
    queryKey: qualityKeys.checksByArticle(articleId),
    queryFn: () => fetchQualityChecksByArticle(articleId),
    enabled: articleId > 0,
  });
}

export function useQualityTrends(platformId: number, period: string = '30d') {
  return useQuery({
    queryKey: qualityKeys.trends(platformId, period),
    queryFn: () => fetchQualityTrends(platformId, period),
    enabled: platformId > 0,
    staleTime: 300000, // 5 minutes
  });
}

// ============================================
// Mutation Hooks
// ============================================

export function useRevalidate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: revalidateArticle,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: qualityKeys.checks() });
      queryClient.invalidateQueries({ queryKey: qualityKeys.checksByArticle(data.article_id) });
      toast({
        title: t('quality.messages.revalidated'),
        description: `Score: ${data.overall_score}/100`,
      });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('quality.messages.revalidateError'),
        variant: 'destructive',
      });
    },
  });
}

export function useBulkRevalidate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: bulkRevalidate,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: qualityKeys.checks() });
      toast({
        title: t('quality.messages.bulkRevalidated', { count: data.queued }),
      });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('quality.messages.bulkRevalidateError'),
        variant: 'destructive',
      });
    },
  });
}

export function useExportQualityChecks() {
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: exportQualityChecks,
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quality-checks-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: t('quality.messages.exported') });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('quality.messages.exportError'),
        variant: 'destructive',
      });
    },
  });
}
