/**
 * Indexing Hooks
 * File 313 - TanStack Query hooks for search engine indexing
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/useToast';
import api from '@/utils/api';
import {
  IndexingQueueItem,
  IndexingStats,
  NotIndexedArticle,
  IndexingQueueFilters,
  NotIndexedFilters,
} from '@/types/seo';

const API_BASE = '/admin/seo/indexing';

// ============================================
// Query Keys
// ============================================

export const indexingKeys = {
  all: ['indexing'] as const,
  queue: () => [...indexingKeys.all, 'queue'] as const,
  queueList: (filters?: IndexingQueueFilters) => [...indexingKeys.queue(), 'list', filters] as const,
  stats: () => [...indexingKeys.all, 'stats'] as const,
  notIndexed: () => [...indexingKeys.all, 'not-indexed'] as const,
  notIndexedList: (filters?: NotIndexedFilters) => [...indexingKeys.notIndexed(), 'list', filters] as const,
  history: (filters?: IndexingQueueFilters) => [...indexingKeys.all, 'history', filters] as const,
};

// ============================================
// API Functions
// ============================================

async function fetchIndexingQueue(filters?: IndexingQueueFilters): Promise<{
  data: IndexingQueueItem[];
  total: number;
  page: number;
  per_page: number;
}> {
  const { data } = await api.get<{
    data: IndexingQueueItem[];
    total: number;
    page: number;
    per_page: number;
  }>(`${API_BASE}/queue`, { params: filters });
  return data;
}

async function fetchIndexingStats(): Promise<IndexingStats> {
  const { data } = await api.get<IndexingStats>(`${API_BASE}/stats`);
  return data;
}

async function fetchNotIndexedArticles(filters?: NotIndexedFilters): Promise<{
  data: NotIndexedArticle[];
  total: number;
  page: number;
  per_page: number;
}> {
  const { data } = await api.get<{
    data: NotIndexedArticle[];
    total: number;
    page: number;
    per_page: number;
  }>(`${API_BASE}/not-indexed`, { params: filters });
  return data;
}

async function fetchIndexingHistory(filters?: IndexingQueueFilters): Promise<{
  data: IndexingQueueItem[];
  total: number;
}> {
  const { data } = await api.get<{
    data: IndexingQueueItem[];
    total: number;
  }>(`${API_BASE}/history`, { params: filters });
  return data;
}

async function submitIndexing(
  articleId: number,
  engines: { google?: boolean; indexnow?: boolean; bing?: boolean } = { google: true, indexnow: true }
): Promise<IndexingQueueItem> {
  const { data } = await api.post<IndexingQueueItem>(
    `${API_BASE}/submit`,
    { article_id: articleId, engines }
  );
  return data;
}

async function submitBatchIndexing(
  articleIds: number[],
  engines: { google?: boolean; indexnow?: boolean; bing?: boolean } = { google: true, indexnow: true }
): Promise<{ submitted: number; failed: number; quota_exceeded: boolean }> {
  const { data } = await api.post<{ submitted: number; failed: number; quota_exceeded: boolean }>(
    `${API_BASE}/submit-batch`,
    { article_ids: articleIds, engines, delay_ms: 2000 }
  );
  return data;
}

async function retryIndexing(id: number): Promise<IndexingQueueItem> {
  const { data } = await api.post<IndexingQueueItem>(`${API_BASE}/queue/${id}/retry`);
  return data;
}

async function cancelIndexing(id: number): Promise<void> {
  await api.post(`${API_BASE}/queue/${id}/cancel`);
}

async function submitAllNotIndexed(
  engines: { google?: boolean; indexnow?: boolean; bing?: boolean } = { google: true, indexnow: true }
): Promise<{ submitted: number; quota_exceeded: boolean }> {
  const { data } = await api.post<{ submitted: number; quota_exceeded: boolean }>(
    `${API_BASE}/submit-all`,
    { engines }
  );
  return data;
}

// ============================================
// Query Hooks
// ============================================

export function useIndexingQueue(filters?: IndexingQueueFilters) {
  return useQuery({
    queryKey: indexingKeys.queueList(filters),
    queryFn: () => fetchIndexingQueue(filters),
    staleTime: 30000,
    refetchInterval: 30000,
  });
}

export function useIndexingStats() {
  return useQuery({
    queryKey: indexingKeys.stats(),
    queryFn: fetchIndexingStats,
    staleTime: 30000,
    refetchInterval: 30000,
  });
}

export function useNotIndexedArticles(filters?: NotIndexedFilters) {
  return useQuery({
    queryKey: indexingKeys.notIndexedList(filters),
    queryFn: () => fetchNotIndexedArticles(filters),
    staleTime: 60000,
  });
}

export function useIndexingHistory(filters?: IndexingQueueFilters) {
  return useQuery({
    queryKey: indexingKeys.history(filters),
    queryFn: () => fetchIndexingHistory(filters),
  });
}

// ============================================
// Mutation Hooks
// ============================================

export function useSubmitIndexing() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      articleId,
      engines,
    }: {
      articleId: number;
      engines?: { google?: boolean; indexnow?: boolean; bing?: boolean };
    }) => submitIndexing(articleId, engines),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: indexingKeys.all });
      toast({ title: 'Article soumis pour indexation' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de soumettre pour indexation',
        variant: 'destructive',
      });
    },
  });
}

export function useSubmitBatchIndexing() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      articleIds,
      engines,
    }: {
      articleIds: number[];
      engines?: { google?: boolean; indexnow?: boolean; bing?: boolean };
    }) => submitBatchIndexing(articleIds, engines),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: indexingKeys.all });
      toast({
        title: 'Soumission batch terminée',
        description: `${result.submitted} article(s) soumis${result.quota_exceeded ? ' (quota dépassé)' : ''}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de soumettre le batch',
        variant: 'destructive',
      });
    },
  });
}

export function useRetryIndexing() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: retryIndexing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: indexingKeys.queue() });
      toast({ title: 'Nouvelle tentative lancée' });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Impossible de relancer l\'indexation',
        variant: 'destructive',
      });
    },
  });
}

export function useCancelIndexing() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: cancelIndexing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: indexingKeys.queue() });
      toast({ title: 'Indexation annulée' });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'annuler l\'indexation',
        variant: 'destructive',
      });
    },
  });
}

export function useSubmitAllNotIndexed() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: submitAllNotIndexed,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: indexingKeys.all });
      toast({
        title: 'Soumission terminée',
        description: `${result.submitted} article(s) soumis${result.quota_exceeded ? ' (quota atteint)' : ''}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de soumettre tous les articles',
        variant: 'destructive',
      });
    },
  });
}
